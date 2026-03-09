import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, CheckCircle, Clock, Zap, History } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const topUpAmounts = [50, 100, 200, 500];

interface ChargingHistory {
  id: string;
  start_time: string;
  end_time: string | null;
  used_energy: number;
  cost: number;
  status: string;
}

const formatDuration = (start: string, end: string | null) => {
  if (!end) return 'In progress';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins}m ${secs}s`;
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const Wallet: React.FC = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ChargingHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('charging_session')
        .select('id, start_time, end_time, used_energy, cost, status')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(20);
      if (data) setHistory(data as ChargingHistory[]);
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [user]);

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

        <div className="card-elevated p-5">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Charging History
          </h2>
          {loadingHistory ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No charging sessions yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    session.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{formatDate(session.start_time)}</span>
                      <span className="font-bold text-sm text-primary">₹{session.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.start_time, session.end_time)}
                      </span>
                      <span>{session.used_energy.toFixed(3)} kWh</span>
                      <span>{formatTime(session.start_time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Wallet;
