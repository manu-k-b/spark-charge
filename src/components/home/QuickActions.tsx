import React, { useState } from 'react';
import { Map, Calendar, Bell, BarChart3, Crown, Moon, Sun } from 'lucide-react';
import { ComingSoonModal } from '@/components/ui/ComingSoonModal';
import { useTheme } from '@/contexts/ThemeContext';

export const QuickActions: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const actions = [
    { id: 'nearby', icon: Map, label: 'Nearby', comingSoon: true },
    { id: 'schedule', icon: Calendar, label: 'Schedule', comingSoon: true },
    { id: 'notifications', icon: Bell, label: 'Alerts', comingSoon: true },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', comingSoon: true },
    { id: 'membership', icon: Crown, label: 'Plans', comingSoon: true },
    { id: 'darkmode', icon: theme === 'dark' ? Sun : Moon, label: theme === 'dark' ? 'Light' : 'Dark', comingSoon: false },
  ];

  const handleClick = (id: string, label: string, comingSoon: boolean) => {
    if (id === 'darkmode') {
      toggleTheme();
      return;
    }
    if (comingSoon) setSelectedFeature(label);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ id, icon: Icon, label, comingSoon }) => (
          <button
            key={id}
            onClick={() => handleClick(id, label, comingSoon)}
            className="card-elevated p-4 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors relative"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              id === 'darkmode' ? 'bg-primary/15' : 'bg-accent'
            }`}>
              <Icon className={`w-5 h-5 ${id === 'darkmode' ? 'text-primary' : 'text-accent-foreground'}`} />
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
