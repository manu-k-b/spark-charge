import React from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { WalletCard } from '@/components/home/WalletCard';
import { ChargerCard } from '@/components/home/ChargerCard';
import { QuickActions } from '@/components/home/QuickActions';
import { ChargingControls } from '@/components/charging/ChargingControls';
import { useAuth } from '@/contexts/AuthContext';
import { useCharger } from '@/contexts/ChargerContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { isCharging } = useCharger();

  return (
    <MobileLayout>
      <div className="p-4 space-y-5 safe-top">
        {/* Header */}
        <div className="pt-2">
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <h1 className="text-2xl font-display font-bold">{user?.name || 'User'}</h1>
        </div>

        {/* Wallet */}
        <WalletCard />

        {/* Charger Status */}
        <div>
          <h2 className="text-lg font-display font-semibold mb-3">Charger Status</h2>
          <ChargerCard />
        </div>

        {/* Start/Stop Button */}
        <ChargingControls />

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-display font-semibold mb-3">Quick Actions</h2>
          <QuickActions />
        </div>
      </div>
    </MobileLayout>
  );
};

export default Home;
