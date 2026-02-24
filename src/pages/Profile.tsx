import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, History, Settings, LogOut, ChevronRight, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ComingSoonModal } from '@/components/ui/ComingSoonModal';
import { toast } from 'sonner';

interface SessionHistory {
  id: string;
  start_time: string;
  energy_consumed: number;
  total_cost: number;
  status: string;
}

const Profile: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [stats, setStats] = useState({ count: 0, totalEnergy: 0, totalCost: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('charging_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })
        .limit(10);
      
      if (data) {
        const typed = data as unknown as SessionHistory[];
        setSessions(typed);
        setStats({
          count: typed.length,
          totalEnergy: typed.reduce((s, x) => s + Number(x.energy_consumed), 0),
          totalCost: typed.reduce((s, x) => s + Number(x.total_cost), 0),
        });
      }
    };
    fetch();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <MobileLayout>
      <div className="p-4 space-y-6 safe-top">
        <div className="pt-2">
          <h1 className="text-2xl font-display font-bold">Profile</h1>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg">{profile?.name || 'User'}</h2>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <Mail className="w-4 h-4" />
                <span>{profile?.email || user?.email || ''}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary">{stats.count}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-success">{stats.totalEnergy.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">kWh Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-warning">₹{stats.totalCost.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </div>
          </div>
        </div>

        <div className="card-elevated overflow-hidden">
          <button onClick={() => setShowSettings(true)}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="flex-1 text-left font-medium">Settings</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            <span className="coming-soon-badge">Soon</span>
          </button>
          <div className="border-t border-border" />
          <button onClick={handleLogout}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-destructive">
            <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left font-medium">Log Out</span>
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display font-semibold">Charging History</h2>
          </div>
          <div className="space-y-3">
            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No charging history yet</p>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="card-elevated p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{formatDate(s.start_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{Number(s.energy_consumed).toFixed(3)} kWh</span>
                  </div>
                  <span className="font-bold text-primary">₹{Number(s.total_cost).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ComingSoonModal isOpen={showSettings} onClose={() => setShowSettings(false)} feature="Settings" />
    </MobileLayout>
  );
};

export default Profile;
