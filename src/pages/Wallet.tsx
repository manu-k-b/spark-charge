import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const topUpAmounts = [50, 100, 200, 500];

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

const Wallet: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setTransactions(data as unknown as Transaction[]);
    };
    fetchTransactions();
  }, [user]);

  const handleTopUp = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount < 10) {
      toast.error('Minimum top-up amount is ₹10');
      return;
    }
    if (!user || !profile) return;

    setIsProcessing(true);
    try {
      // Update wallet balance
      const newBalance = profile.wallet_balance + amount;
      await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', user.id);

      // Record transaction
      const { data: tx } = await supabase
        .from('wallet_transactions')
        .insert({ user_id: user.id, type: 'topup', amount, description: 'Wallet Top-up' })
        .select()
        .single();

      await refreshProfile();
      if (tx) setTransactions(prev => [tx as unknown as Transaction, ...prev]);
      toast.success(`₹${amount} added to wallet successfully!`);
      setSelectedAmount(null);
      setCustomAmount('');
    } catch {
      toast.error('Top-up failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
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
            ₹{profile?.wallet_balance?.toFixed(2) || '0.00'}
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

        <div>
          <h2 className="font-display font-semibold mb-3">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No transactions yet</p>
            )}
            {transactions.map((tx) => (
              <div key={tx.id} className="card-elevated p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === 'topup' ? 'bg-success/10' : 'bg-destructive/10'
                }`}>
                  {tx.type === 'topup' ? (
                    <ArrowDownLeft className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                </div>
                <div className={`font-semibold ${tx.type === 'topup' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'topup' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Wallet;
