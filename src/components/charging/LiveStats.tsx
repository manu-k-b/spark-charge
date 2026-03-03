import React from 'react';
import { Zap, Battery, IndianRupee, Activity, Gauge, PlugZap } from 'lucide-react';
import { useCharger } from '@/contexts/ChargerContext';
import { useAuth } from '@/contexts/AuthContext';

export const LiveStats: React.FC = () => {
  const { chargerStatus, isCharging, usedEnergy, runningCost } = useCharger();
  const { wallet } = useAuth();

  const stats = [
    {
      icon: Zap,
      value: chargerStatus?.power_kw.toFixed(2) || '0.00',
      unit: 'kW',
      label: 'Power',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: IndianRupee,
      value: runningCost.toFixed(2),
      unit: '₹',
      label: 'Running Cost',
      color: 'text-success',
      bgColor: 'bg-success/10',
      highlight: true,
    },
    {
      icon: Gauge,
      value: chargerStatus?.voltage.toFixed(1) || '0',
      unit: 'V',
      label: 'Voltage',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: PlugZap,
      value: chargerStatus?.current.toFixed(2) || '0',
      unit: 'A',
      label: 'Current',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Battery,
      value: usedEnergy.toFixed(3),
      unit: 'kWh',
      label: 'Energy Used',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Activity,
      value: wallet?.balance?.toFixed(2) || '0.00',
      unit: '₹',
      label: 'Wallet Balance',
      color: 'text-accent-foreground',
      bgColor: 'bg-accent',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map(({ icon: Icon, value, unit, label, color, bgColor, highlight }) => (
        <div key={label} className={`card-elevated p-4 ${highlight ? 'ring-2 ring-success/50' : ''}`}>
          <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center mb-3`}>
            <Icon className={`w-5 h-5 ${color} ${isCharging && label === 'Power' ? 'charging-pulse' : ''}`} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`stat-value text-2xl ${highlight ? 'text-success' : ''}`}>{value}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <div className="stat-label mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
};
