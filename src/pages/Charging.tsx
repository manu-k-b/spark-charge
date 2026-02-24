import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { LiveStats } from '@/components/charging/LiveStats';
import { ChargingControls } from '@/components/charging/ChargingControls';
import { useCharger } from '@/contexts/ChargerContext';

const Charging: React.FC = () => {
  const { isCharging, currentSession, chargerStatus } = useCharger();
  const navigate = useNavigate();

  if (!isCharging) {
    navigate('/home');
    return null;
  }

  const getElapsedTime = () => {
    if (!currentSession?.start_time) return '00:00';
    const elapsed = Math.floor((Date.now() - new Date(currentSession.start_time).getTime()) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-5 safe-top">
        <div className="flex items-center gap-4 pt-2">
          <button onClick={() => navigate('/home')} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">Charging Session</h1>
            <p className="text-muted-foreground text-sm">{chargerStatus?.name}</p>
          </div>
        </div>

        <div className="card-elevated p-8 text-center gradient-charging rounded-3xl">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-primary-foreground/20 animate-pulse-ring" />
            <div className="absolute w-24 h-24 rounded-full bg-primary-foreground/30 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
            <div className="w-20 h-20 rounded-full bg-primary-foreground flex items-center justify-center">
              <Zap className="w-10 h-10 text-primary charging-pulse" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-primary-foreground/80 text-sm font-medium">CHARGING IN PROGRESS</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-primary-foreground">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-display font-bold">{getElapsedTime()}</span>
            </div>
          </div>
        </div>

        <LiveStats />
        <ChargingControls />

        <div className="text-center text-sm text-muted-foreground">
          <p>Charging will automatically stop when wallet balance reaches ₹0</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Charging;
