import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ChargerStatus {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'charging' | 'offline';
  current_power: number;
  current_session_id: string | null;
}

interface LiveChargerData {
  power: number;
  voltage: number;
  current: number;
  energySession: number;
  costSession: number;
}

interface ChargingSession {
  id: string;
  user_id: string;
  charger_id: string;
  start_time: string;
  end_time: string | null;
  energy_consumed: number;
  total_cost: number;
  status: string;
}

interface ChargerContextType {
  chargerStatus: ChargerStatus | null;
  liveData: LiveChargerData;
  currentSession: ChargingSession | null;
  isCharging: boolean;
  startCharging: () => Promise<void>;
  stopCharging: () => Promise<void>;
  fetchChargerStatus: () => Promise<void>;
}

const ChargerContext = createContext<ChargerContextType | undefined>(undefined);

const RATE_PER_KWH = 8;

export const ChargerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [chargerStatus, setChargerStatus] = useState<ChargerStatus | null>(null);
  const [liveData, setLiveData] = useState<LiveChargerData>({
    power: 0, voltage: 220, current: 0, energySession: 0, costSession: 0,
  });
  const [currentSession, setCurrentSession] = useState<ChargingSession | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  const fetchChargerStatus = useCallback(async () => {
    const { data } = await supabase
      .from('charger_status')
      .select('*')
      .eq('id', 'charger-001')
      .single();
    
    if (data) {
      setChargerStatus(data as unknown as ChargerStatus);
    }
  }, []);

  // Fetch charger status on mount and subscribe to realtime updates
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

    const checkActiveSession = async () => {
      const { data } = await supabase
        .from('charging_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        setCurrentSession(data as unknown as ChargingSession);
        setIsCharging(true);
      }
    };
    checkActiveSession();
  }, [user]);

  // Simulate live data during charging (will be replaced by ESP32 WebSocket)
  useEffect(() => {
    if (!isCharging || !profile) return;

    const interval = setInterval(async () => {
      setLiveData(prev => {
        const power = 0.8 + Math.random() * 0.4;
        const current = power * 1000 / 220;
        const energyIncrement = power * (2 / 3600);
        const newEnergy = prev.energySession + energyIncrement;
        const newCost = newEnergy * RATE_PER_KWH;

        if (profile.wallet_balance - newCost <= 0) {
          stopCharging();
          return prev;
        }

        return {
          power: Math.round(power * 100) / 100,
          voltage: 218 + Math.random() * 6,
          current: Math.round(current * 100) / 100,
          energySession: Math.round(newEnergy * 1000) / 1000,
          costSession: Math.round(newCost * 100) / 100,
        };
      });

      // Update wallet balance in DB
      if (profile && liveData.costSession > 0) {
        const newBalance = Math.max(0, profile.wallet_balance - 0.005);
        await supabase
          .from('profiles')
          .update({ wallet_balance: Math.round(newBalance * 100) / 100 })
          .eq('user_id', user!.id);
        refreshProfile();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isCharging, profile?.wallet_balance]);

  const startCharging = useCallback(async () => {
    if (!user || !profile || profile.wallet_balance < 10) {
      throw new Error('Insufficient wallet balance. Minimum ₹10 required.');
    }

    // Create session in DB
    const { data: session, error } = await supabase
      .from('charging_sessions')
      .insert({ user_id: user.id, charger_id: 'charger-001', status: 'active' })
      .select()
      .single();

    if (error) throw error;

    // Update charger status
    await supabase
      .from('charger_status')
      .update({ status: 'charging', current_session_id: session.id })
      .eq('id', 'charger-001');

    setCurrentSession(session as unknown as ChargingSession);
    setIsCharging(true);
    setLiveData({ power: 0, voltage: 220, current: 0, energySession: 0, costSession: 0 });
    fetchChargerStatus();
  }, [user, profile, fetchChargerStatus]);

  const stopCharging = useCallback(async () => {
    if (currentSession) {
      // Update session in DB
      await supabase
        .from('charging_sessions')
        .update({
          end_time: new Date().toISOString(),
          energy_consumed: liveData.energySession,
          total_cost: liveData.costSession,
          status: 'completed',
        })
        .eq('id', currentSession.id);

      // Deduct final cost from wallet
      if (profile && liveData.costSession > 0) {
        const newBalance = Math.max(0, profile.wallet_balance - liveData.costSession);
        await supabase
          .from('profiles')
          .update({ wallet_balance: Math.round(newBalance * 100) / 100 })
          .eq('user_id', user!.id);

        // Record transaction
        await supabase.from('wallet_transactions').insert({
          user_id: user!.id,
          type: 'deduction',
          amount: liveData.costSession,
          description: `Charging session - ${liveData.energySession.toFixed(3)} kWh`,
          session_id: currentSession.id,
        });
      }
    }

    // Reset charger status
    await supabase
      .from('charger_status')
      .update({ status: 'available', current_power: 0, current_session_id: null })
      .eq('id', 'charger-001');

    setIsCharging(false);
    setCurrentSession(null);
    setLiveData({ power: 0, voltage: 220, current: 0, energySession: 0, costSession: 0 });
    fetchChargerStatus();
    refreshProfile();
  }, [currentSession, liveData, profile, user, fetchChargerStatus, refreshProfile]);

  return (
    <ChargerContext.Provider value={{
      chargerStatus,
      liveData,
      currentSession,
      isCharging,
      startCharging,
      stopCharging,
      fetchChargerStatus,
    }}>
      {children}
    </ChargerContext.Provider>
  );
};

export const useCharger = () => {
  const context = useContext(ChargerContext);
  if (context === undefined) {
    throw new Error('useCharger must be used within a ChargerProvider');
  }
  return context;
};
