import React from 'react';
import { Zap, Battery, IndianRupee, Activity } from 'lucide-react';
import { useCharger } from '@/contexts/ChargerContext';
import { useAuth } from '@/contexts/AuthContext';

export const LiveStats: React.FC = () => {
  const { liveData, isCharging } = useCharger();
  const { profile } = useAuth();

  const stats = [
    {
      icon: Zap,
      value: liveData.power.toFixed(2),
      unit: 'kW',
      label: 'Live Power',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Battery,
      value: liveData.energySession.toFixed(3),
      unit: 'kWh',
      label: 'Energy Used',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: IndianRupee,
      value: liveData.costSession.toFixed(2),
      unit: '₹',
      label: 'Session Cost',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Activity,
      value: profile?.wallet_balance?.toFixed(2) || '0.00',
      unit: '₹',
      label: 'Wallet Balance',
      color: 'text-accent-foreground',
      bgColor: 'bg-accent',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map(({ icon: Icon, value, unit, label, color, bgColor }) => (
        <div key={label} className="card-elevated p-4">
          <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center mb-3`}>
            <Icon className={`w-5 h-5 ${color} ${isCharging && label === 'Live Power' ? 'charging-pulse' : ''}`} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="stat-value text-2xl">{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <div className="stat-label mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
};
