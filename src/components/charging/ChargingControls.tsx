import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Loader2 } from 'lucide-react';
import { useCharger } from '@/contexts/ChargerContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const ChargingControls: React.FC = () => {
  const { isCharging, startCharging, stopCharging, chargerStatus } = useCharger();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!user || user.walletBalance < 10) {
      toast.error('Insufficient balance. Minimum ₹10 required.');
      navigate('/wallet');
      return;
    }

    if (chargerStatus.status === 'offline') {
      toast.error('Charger is currently offline.');
      return;
    }

    setIsLoading(true);
    try {
      await startCharging();
      toast.success('Charging started!');
      navigate('/charging');
    } catch (error) {
      toast.error('Failed to start charging. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopCharging();
      toast.success('Charging stopped successfully!');
    } catch (error) {
      toast.error('Failed to stop charging. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCharging) {
    return (
      <button
        onClick={handleStop}
        disabled={isLoading}
        className="w-full bg-destructive text-destructive-foreground font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Square className="w-5 h-5" />
            Stop Charging
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleStart}
      disabled={isLoading || chargerStatus.status !== 'available'}
      className="w-full gradient-primary text-primary-foreground font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Play className="w-5 h-5" />
          Start Charging
        </>
      )}
    </button>
  );
};
