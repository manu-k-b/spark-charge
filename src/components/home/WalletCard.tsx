import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const WalletCard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="w-5 h-5" />
          <span className="font-medium">Wallet Balance</span>
        </div>
        <Link
          to="/wallet"
          className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
        >
          <Plus className="w-4 h-4" />
          Top Up
        </Link>
      </div>
      <div className="wallet-balance text-foreground">
        ₹{user?.walletBalance.toFixed(2) || '0.00'}
      </div>
    </div>
  );
};
