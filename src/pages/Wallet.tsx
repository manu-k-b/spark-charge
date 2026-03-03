import React, { useState } from 'react';
import { Wallet as WalletIcon, Plus, CheckCircle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const topUpAmounts = [50, 100, 200, 500];

const Wallet: React.FC = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopUp = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount < 10) {
      toast.error('Minimum top-up amount is ₹10');
      return;
    }
    if (!user || !wallet) return;

    setIsProcessing(true);
    try {
      const newBalance = wallet.balance + amount;
      await supabase
        .from('wallet')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      await refreshWallet();
      toast.success(`₹${amount} added to wallet successfully!`);
      setSelectedAmount(null);
      setCustomAmount('');
    } catch {
      toast.error('Top-up failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-6 safe-top">
        <div className="pt-2">
          <h1 className="text-2xl font-display font-bold">Wallet</h1>
        </div>

        <div className="gradient-primary rounded-3xl p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <WalletIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Available Balance</span>
          </div>
          <div className="wallet-balance">
            ₹{wallet?.balance?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="card-elevated p-5">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Top Up Wallet
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {topUpAmounts.map((amount) => (
              <button key={amount}
                onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                className={`py-3 rounded-xl font-semibold transition-all ${
                  selectedAmount === amount
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}>
                ₹{amount}
              </button>
            ))}
          </div>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
            <input type="number" value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              placeholder="Enter custom amount" className="input-field pl-8" min="10" />
          </div>
          <button onClick={handleTopUp}
            disabled={isProcessing || (!selectedAmount && !customAmount)}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {isProcessing ? (
              <><div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Processing...</>
            ) : (
              <><CheckCircle className="w-5 h-5" />Pay ₹{selectedAmount || customAmount || '0'}</>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Secure payment via UPI, Cards, Net Banking
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Wallet;
