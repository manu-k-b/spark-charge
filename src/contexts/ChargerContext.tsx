import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChargerStatus, ChargingSession, LiveChargerData } from '@/types/charger';
import { useAuth } from './AuthContext';

interface ChargerContextType {
  chargerStatus: ChargerStatus;
  liveData: LiveChargerData;
  currentSession: ChargingSession | null;
  isCharging: boolean;
  startCharging: () => Promise<void>;
  stopCharging: () => Promise<void>;
}

const ChargerContext = createContext<ChargerContextType | undefined>(undefined);

const RATE_PER_KWH = 8; // ₹8 per kWh

export const ChargerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateWalletBalance } = useAuth();
  
  const [chargerStatus, setChargerStatus] = useState<ChargerStatus>({
    id: 'charger-001',
    name: 'Campus EV Charger',
    location: 'Main Parking Lot',
    status: 'available',
    currentPower: 0,
  });

  const [liveData, setLiveData] = useState<LiveChargerData>({
    power: 0,
    voltage: 220,
    current: 0,
    energySession: 0,
    costSession: 0,
  });

  const [currentSession, setCurrentSession] = useState<ChargingSession | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  // Simulate live data updates during charging
  useEffect(() => {
    if (!isCharging || !user) return;

    const interval = setInterval(() => {
      setLiveData(prev => {
        // Simulate realistic charging values for two-wheelers
        const power = 0.8 + Math.random() * 0.4; // 0.8-1.2 kW
        const current = power * 1000 / 220; // Calculate current from power
        const energyIncrement = power * (2 / 3600); // Energy for 2 seconds
        const newEnergy = prev.energySession + energyIncrement;
        const newCost = newEnergy * RATE_PER_KWH;

        // Check if wallet balance is sufficient
        if (user.walletBalance - newCost <= 0) {
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

      // Update wallet balance in real-time
      if (user) {
        const newBalance = Math.max(0, user.walletBalance - (liveData.costSession));
        updateWalletBalance(Math.round((user.walletBalance - 0.005) * 100) / 100);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isCharging, user]);

  const startCharging = useCallback(async () => {
    if (!user || user.walletBalance < 10) {
      throw new Error('Insufficient wallet balance. Minimum ₹10 required.');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const session: ChargingSession = {
      id: `session-${Date.now()}`,
      userId: user.id,
      chargerId: chargerStatus.id,
      startTime: new Date(),
      energyConsumed: 0,
      totalCost: 0,
      status: 'active',
    };

    setCurrentSession(session);
    setIsCharging(true);
    setChargerStatus(prev => ({ ...prev, status: 'charging', currentSession: session }));
    setLiveData({
      power: 0,
      voltage: 220,
      current: 0,
      energySession: 0,
      costSession: 0,
    });
  }, [user, chargerStatus.id]);

  const stopCharging = useCallback(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        endTime: new Date(),
        energyConsumed: liveData.energySession,
        totalCost: liveData.costSession,
        status: 'completed',
      } : null);
    }

    setIsCharging(false);
    setChargerStatus(prev => ({ ...prev, status: 'available', currentPower: 0, currentSession: undefined }));
    setLiveData({
      power: 0,
      voltage: 220,
      current: 0,
      energySession: 0,
      costSession: 0,
    });
    setCurrentSession(null);
  }, [currentSession, liveData]);

  return (
    <ChargerContext.Provider value={{
      chargerStatus,
      liveData,
      currentSession,
      isCharging,
      startCharging,
      stopCharging,
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
