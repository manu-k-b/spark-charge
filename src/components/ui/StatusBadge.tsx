import React from 'react';
import { Zap, CheckCircle, WifiOff, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'available' | 'charging' | 'offline' | 'in-use';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    available: {
      icon: CheckCircle,
      label: 'Available',
      className: 'status-available',
    },
    charging: {
      icon: Zap,
      label: 'Charging',
      className: 'status-charging',
    },
    'in-use': {
      icon: Clock,
      label: 'In Use',
      className: 'status-charging',
    },
    offline: {
      icon: WifiOff,
      label: 'Offline',
      className: 'status-offline',
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <div className={`status-badge ${className}`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
};
