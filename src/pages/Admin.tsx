import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Zap, IndianRupee, Activity, Clock, Settings, Check, Loader2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { useCharger } from '@/contexts/ChargerContext';
import AdminUsers from '@/components/admin/AdminUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  used_energy: number;
  cost: number;
  status: string;
}

interface AdminWallet {
  user_id: string;
  balance: number;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatDuration = (start: string, end: string | null) => {
  if (!end) return 'Active';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
};

const Admin: React.FC = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { chargerStatus } = useCharger();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'sessions' | 'users'>('overview');
  const [price, setPrice] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate('/home');
      return;
    }
    const fetchData = async () => {
      const [sessionsRes, walletsRes, settingsRes] = await Promise.all([
        supabase
          .from('charging_session')
          .select('*')
          .order('start_time', { ascending: false })
          .limit(50),
        supabase.from('wallet').select('user_id, balance'),
        supabase.from('settings').select('value').eq('key', 'price_per_kwh').maybeSingle(),
      ]);
      if (sessionsRes.data) setSessions(sessionsRes.data as unknown as AdminSession[]);
      if (walletsRes.data) setWallets(walletsRes.data as unknown as AdminWallet[]);
      if (settingsRes.data) {
        const val = String(settingsRes.data.value);
        setPrice(val);
        setPriceInput(val);
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin, adminLoading, navigate]);

  const handleSavePrice = async () => {
    const num = parseFloat(priceInput);
    if (isNaN(num) || num <= 0 || num > 100) {
      toast.error('Enter a valid price between ₹0.01 and ₹100');
      return;
    }
    setSavingPrice(true);
    const { error } = await supabase
      .from('settings')
      .update({ value: num })
      .eq('key', 'price_per_kwh');
    if (error) {
      toast.error('Failed to update price');
    } else {
      setPrice(String(num));
      toast.success(`Price updated to ₹${num}/kWh`);
    }
    setSavingPrice(false);
  };

  if (adminLoading || loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const activeSessions = sessions.filter((s) => s.status === 'active');
  const totalRevenue = completedSessions.reduce((s, x) => s + Number(x.cost), 0);
  const totalEnergy = completedSessions.reduce((s, x) => s + Number(x.used_energy), 0);
  const totalUsers = new Set(wallets.map((w) => w.user_id)).size;
  const totalWalletBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <MobileLayout>
      <div className="p-4 space-y-5 safe-top">
        <div className="flex items-center gap-4 pt-2">
          <button onClick={() => navigate('/profile')} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">System overview</p>
          </div>
        </div>

        {/* Charger Status */}
        <div className={`card-elevated p-4 ${chargerStatus?.relay ? 'ring-2 ring-primary shadow-glow' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Charger Live
            </span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              chargerStatus?.relay ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {chargerStatus?.relay ? 'Charging' : 'Idle'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold">{chargerStatus?.voltage?.toFixed(0) || 0}</div>
              <div className="text-[10px] text-muted-foreground">V</div>
            </div>
            <div>
              <div className="text-lg font-bold">{chargerStatus?.current?.toFixed(1) || 0}</div>
              <div className="text-[10px] text-muted-foreground">A</div>
            </div>
            <div>
              <div className="text-lg font-bold">{chargerStatus?.power_kw?.toFixed(2) || 0}</div>
              <div className="text-[10px] text-muted-foreground">kW</div>
            </div>
            <div>
              <div className="text-lg font-bold">{chargerStatus?.energy?.toFixed(2) || 0}</div>
              <div className="text-[10px] text-muted-foreground">kWh</div>
            </div>
          </div>
        </div>

        {/* Price Setting */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Price per kWh
            </span>
            <span className="text-xs text-muted-foreground">Current: ₹{price}</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="input-field pl-7 py-2 text-sm"
                min="0.01"
                max="100"
                step="0.5"
              />
            </div>
            <button
              onClick={handleSavePrice}
              disabled={savingPrice || priceInput === price}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {savingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IndianRupee className="w-4 h-4" />
              <span className="text-xs">Revenue</span>
            </div>
            <div className="text-xl font-display font-bold text-primary">₹{totalRevenue.toFixed(2)}</div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Energy Sold</span>
            </div>
            <div className="text-xl font-display font-bold">{totalEnergy.toFixed(2)} kWh</div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Users</span>
            </div>
            <div className="text-xl font-display font-bold">{totalUsers}</div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IndianRupee className="w-4 h-4" />
              <span className="text-xs">Wallet Pool</span>
            </div>
            <div className="text-xl font-display font-bold">₹{totalWalletBalance.toFixed(2)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('overview')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'overview' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
            Active ({activeSessions.length})
          </button>
          <button onClick={() => setTab('sessions')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'sessions' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
            Sessions
          </button>
          <button onClick={() => setTab('users')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'users' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
            Users
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'users' ? (
          <AdminUsers />
        ) : (
        <div className="space-y-2">
          {(tab === 'overview' ? activeSessions : completedSessions).length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              {tab === 'overview' ? 'No active sessions' : 'No completed sessions'}
            </p>
          ) : (
            (tab === 'overview' ? activeSessions : completedSessions).map((s) => (
              <div key={s.id} className="card-elevated p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  s.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                      {s.user_id.slice(0, 8)}…
                    </span>
                    <span className="font-bold text-sm text-primary">₹{Number(s.cost).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>{formatDate(s.start_time)} {formatTime(s.start_time)}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDuration(s.start_time, s.end_time)}
                    </span>
                    <span>{Number(s.used_energy).toFixed(3)} kWh</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Admin;
