import React from 'react';
import { MapPin, Zap } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useCharger } from '@/contexts/ChargerContext';

export const ChargerCard: React.FC = () => {
  const { chargerStatus, liveData, isCharging } = useCharger();

  return (
    <div className={`card-elevated p-5 ${isCharging ? 'ring-2 ring-primary shadow-glow' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg">{chargerStatus.name}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin className="w-4 h-4" />
            <span>{chargerStatus.location}</span>
          </div>
        </div>
        <StatusBadge status={chargerStatus.status} />
      </div>

      {isCharging && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Zap className="w-5 h-5 charging-pulse" />
            </div>
            <div className="stat-value text-2xl">{liveData.power.toFixed(2)}</div>
            <div className="stat-label text-xs">kW</div>
          </div>
          <div className="text-center">
            <div className="stat-value text-2xl">{liveData.energySession.toFixed(3)}</div>
            <div className="stat-label text-xs">kWh</div>
          </div>
        </div>
      )}
    </div>
  );
};
