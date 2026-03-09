import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ChargerStatus {
  id: string;
  relay: boolean;
  voltage: number;
  current: number;
  power_kw: number;
  energy: number;
}

interface ChargingSession {
  id: string;
  user_id: string;
  charger_id: string;
  start_time: string;
  end_time: string | null;
  start_energy: number;
  end_energy: number | null;
  used_energy: number;
  cost: number;
  status: string;
}

interface ChargerContextType {
  chargerStatus: ChargerStatus | null;
  currentSession: ChargingSession | null;
  isCharging: boolean;
  pricePerKwh: number;
  runningCost: number;
  usedEnergy: number;
  startCharging: () => Promise<void>;
  stopCharging: () => Promise<void>;
}

const ChargerContext = createContext<ChargerContextType | undefined>(undefined);

export const ChargerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, wallet, refreshWallet } = useAuth();
  const [chargerStatus, setChargerStatus] = useState<ChargerStatus | null>(null);
  const [currentSession, setCurrentSession] = useState<ChargingSession | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [pricePerKwh, setPricePerKwh] = useState(8);

  // Derived live values from charger_status energy delta
  const usedEnergy = chargerStatus && currentSession
    ? Math.max(0, chargerStatus.energy - currentSession.start_energy)
    : 0;
  const runningCost = Math.round(usedEnergy * pricePerKwh * 100) / 100;

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'price_per_kwh')
        .single();
      if (data) setPricePerKwh(Number(data.value));
    };
    fetchSettings();
  }, []);

  // Fetch charger status
  const fetchChargerStatus = useCallback(async () => {
    const { data } = await supabase
      .from('charger_status')
      .select('*')
      .eq('id', 'charger-001')
      .single();
    if (data) {
      setChargerStatus({
        id: data.id,
        relay: Boolean(data.relay),
        voltage: Number(data.voltage),
        current: Number(data.current),
        power_kw: Number(data.power_kw),
        energy: Number(data.energy),
      });
    }
  }, []);

  // Subscribe to realtime charger updates
  useEffect(() => {
    fetchChargerStatus();
    const channel = supabase
      .channel('charger-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charger_status' }, () => {
        fetchChargerStatus();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchChargerStatus]);

  // Check for active session on login
  useEffect(() => {
    if (!user) return;
    const checkActive = async () => {
      const { data } = await supabase
        .from('charging_session')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (data) {
        setCurrentSession(data as unknown as ChargingSession);
        setIsCharging(true);
      }
    };
    checkActive();
  }, [user]);

  // Auto-stop when running cost >= wallet balance
  useEffect(() => {
    if (!isCharging || !wallet) return;
    if (runningCost >= wallet.balance && wallet.balance > 0) {
      stopCharging();
    }
  }, [runningCost, wallet?.balance, isCharging]);

  const startCharging = useCallback(async () => {
    if (!user || !wallet || wallet.balance < 20) {
      throw new Error('Insufficient wallet balance. Minimum ₹20 required.');
    }
    if (!chargerStatus) throw new Error('Charger not available.');

    // Create session with current energy as start_energy
    const { data: session, error } = await supabase
      .from('charging_session')
      .insert({
        user_id: user.id,
        charger_id: 'charger-001',
        start_energy: chargerStatus.energy,
        status: 'active',
      })
      .select()
      .single();
    if (error) throw error;

    // Turn on relay and signal PZEM energy reset
    await supabase
      .from('charger_status')
      .update({ relay: true, reset_energy: true })
      .eq('id', 'charger-001');

    setCurrentSession(session as unknown as ChargingSession);
    setIsCharging(true);
    fetchChargerStatus();
  }, [user, wallet, chargerStatus, fetchChargerStatus]);

  const stopCharging = useCallback(async () => {
    if (!currentSession || !chargerStatus || !user) return;

    const endEnergy = chargerStatus.energy;
    const finalUsed = Math.max(0, endEnergy - currentSession.start_energy);
    const finalCost = Math.round(finalUsed * pricePerKwh * 100) / 100;

    // Update session
    await supabase
      .from('charging_session')
      .update({
        end_time: new Date().toISOString(),
        end_energy: endEnergy,
        used_energy: finalUsed,
        cost: finalCost,
        status: 'completed',
      })
      .eq('id', currentSession.id);

    // Deduct from wallet
    if (wallet && finalCost > 0) {
      const newBalance = Math.max(0, wallet.balance - finalCost);
      await supabase
        .from('wallet')
        .update({ balance: Math.round(newBalance * 100) / 100 })
        .eq('user_id', user.id);
    }

    // Turn off relay
    await supabase
      .from('charger_status')
      .update({ relay: false })
      .eq('id', 'charger-001');

    setIsCharging(false);
    setCurrentSession(null);
    fetchChargerStatus();
    refreshWallet();
  }, [currentSession, chargerStatus, pricePerKwh, wallet, user, fetchChargerStatus, refreshWallet]);

  return (
    <ChargerContext.Provider value={{
      chargerStatus, currentSession, isCharging, pricePerKwh,
      runningCost, usedEnergy, startCharging, stopCharging,
    }}>
      {children}
    </ChargerContext.Provider>
  );
};

export const useCharger = () => {
  const context = useContext(ChargerContext);
  if (!context) throw new Error('useCharger must be used within a ChargerProvider');
  return context;
};
