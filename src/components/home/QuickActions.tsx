import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Calendar, Bell, BarChart3, Crown, Moon } from 'lucide-react';
import { ComingSoonModal } from '@/components/ui/ComingSoonModal';

const actions = [
  { id: 'nearby', icon: Map, label: 'Nearby', comingSoon: true },
  { id: 'schedule', icon: Calendar, label: 'Schedule', comingSoon: true },
  { id: 'notifications', icon: Bell, label: 'Alerts', comingSoon: true },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', comingSoon: true },
  { id: 'membership', icon: Crown, label: 'Plans', comingSoon: true },
  { id: 'darkmode', icon: Moon, label: 'Dark Mode', comingSoon: true },
];

export const QuickActions: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ id, icon: Icon, label, comingSoon }) => (
          <button
            key={id}
            onClick={() => comingSoon && setSelectedFeature(label)}
            className="card-elevated p-4 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors relative"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Icon className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium">{label}</span>
            {comingSoon && (
              <span className="coming-soon-badge absolute top-2 right-2">Soon</span>
            )}
          </button>
        ))}
      </div>

      <ComingSoonModal
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        feature={selectedFeature || ''}
      />
    </>
  );
};
