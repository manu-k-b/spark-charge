export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  walletBalance: number;
  createdAt: Date;
}

export interface ChargingSession {
  id: string;
  userId: string;
  chargerId: string;
  startTime: Date;
  endTime?: Date;
  energyConsumed: number; // kWh
  totalCost: number; // ₹
  status: 'active' | 'completed' | 'stopped';
}

export interface ChargerStatus {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'charging' | 'offline';
  currentPower: number; // kW
  currentSession?: ChargingSession;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'topup' | 'deduction';
  amount: number;
  description: string;
  createdAt: Date;
  sessionId?: string;
}

export interface LiveChargerData {
  power: number; // kW
  voltage: number; // V
  current: number; // A
  energySession: number; // kWh
  costSession: number; // ₹
}
