import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Loader2 } from 'lucide-react';
import { useCharger } from '@/contexts/ChargerContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const ChargingControls: React.FC = () => {
  const { isCharging, startCharging, stopCharging, chargerStatus } = useCharger();
  const { wallet } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!wallet || wallet.balance < 20) {
      toast.error('Insufficient balance. Minimum ₹20 required.');
      navigate('/wallet');
      return;
    }

    setIsLoading(true);
    try {
      await startCharging();
      toast.success('Charging started!');
      navigate('/charging');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to start charging.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopCharging();
      toast.success('Charging stopped successfully!');
    } catch {
      toast.error('Failed to stop charging.');
    } finally {
      setIsLoading(false);
    }
  };

  const chargerAvailable = chargerStatus && !chargerStatus.relay;

  if (isCharging) {
    return (
      <button onClick={handleStop} disabled={isLoading}
        className="w-full bg-destructive text-destructive-foreground font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Square className="w-5 h-5" />Stop Charging</>}
      </button>
    );
  }

  return (
    <button onClick={handleStart}
      disabled={isLoading || !chargerAvailable}
      className="w-full gradient-primary text-primary-foreground font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale">
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5" />Start Charging</>}
    </button>
  );
};
