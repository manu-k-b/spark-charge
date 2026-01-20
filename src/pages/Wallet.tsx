import React, { useState } from 'react';
import { Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight, CheckCircle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const topUpAmounts = [50, 100, 200, 500];

const mockTransactions = [
  { id: '1', type: 'topup', amount: 200, description: 'Wallet Top-up', date: new Date(Date.now() - 86400000) },
  { id: '2', type: 'deduction', amount: 45.50, description: 'Charging Session', date: new Date(Date.now() - 172800000) },
  { id: '3', type: 'topup', amount: 100, description: 'Wallet Top-up', date: new Date(Date.now() - 259200000) },
  { id: '4', type: 'deduction', amount: 32.00, description: 'Charging Session', date: new Date(Date.now() - 345600000) },
];

const Wallet: React.FC = () => {
  const { user, updateWalletBalance } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopUp = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    
    if (!amount || amount < 10) {
      toast.error('Minimum top-up amount is ₹10');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (user) {
      updateWalletBalance(user.walletBalance + amount);
      toast.success(`₹${amount} added to wallet successfully!`);
      setSelectedAmount(null);
      setCustomAmount('');
    }
    
    setIsProcessing(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-6 safe-top">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-2xl font-display font-bold">Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="gradient-primary rounded-3xl p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <WalletIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Available Balance</span>
          </div>
          <div className="wallet-balance">
            ₹{user?.walletBalance.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Top Up Section */}
        <div className="card-elevated p-5">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Top Up Wallet
          </h2>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {topUpAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className={`py-3 rounded-xl font-semibold transition-all ${
                  selectedAmount === amount
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                ₹{amount}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Enter custom amount"
              className="input-field pl-8"
              min="10"
            />
          </div>

          {/* Pay Button */}
          <button
            onClick={handleTopUp}
            disabled={isProcessing || (!selectedAmount && !customAmount)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Pay ₹{selectedAmount || customAmount || '0'}
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Secure payment via UPI, Cards, Net Banking
          </p>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="font-display font-semibold mb-3">Recent Transactions</h2>
          <div className="space-y-3">
            {mockTransactions.map((tx) => (
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
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
                <div className={`font-semibold ${
                  tx.type === 'topup' ? 'text-success' : 'text-destructive'
                }`}>
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
