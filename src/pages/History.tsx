import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Clock, IndianRupee, Loader2, Calendar } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  id: string;
  start_time: string;
  end_time: string | null;
  used_energy: number;
  cost: number;
  status: string;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatDuration = (start: string, end: string | null) => {
  if (!end) return 'In progress';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
};

const History: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('charging_session')
        .select('id, start_time, end_time, used_energy, cost, status')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50);
      if (data) setSessions(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalEnergy = sessions.filter(s => s.status === 'completed').reduce((a, s) => a + Number(s.used_energy), 0);
  const totalCost = sessions.filter(s => s.status === 'completed').reduce((a, s) => a + Number(s.cost), 0);

  return (
    <MobileLayout>
      <div className="p-4 space-y-5 safe-top">
        <div className="flex items-center gap-4 pt-2">
          <button onClick={() => navigate('/home')} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">Charging History</h1>
            <p className="text-muted-foreground text-sm">Your past sessions</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Total Energy</span>
            </div>
            <div className="text-xl font-display font-bold">{totalEnergy.toFixed(2)} kWh</div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <IndianRupee className="w-4 h-4" />
              <span className="text-xs">Total Spent</span>
            </div>
            <div className="text-xl font-display font-bold text-primary">₹{totalCost.toFixed(2)}</div>
          </div>
        </div>

        {/* Sessions */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No charging sessions yet</p>
            <p className="text-muted-foreground text-sm mt-1">Scan a charger to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="card-elevated p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  s.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatDate(s.start_time)}</span>
                    </div>
                    <span className="font-bold text-sm text-primary">₹{Number(s.cost).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                    <span>{formatTime(s.start_time)}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDuration(s.start_time, s.end_time)}
                    </span>
                    <span>{Number(s.used_energy).toFixed(3)} kWh</span>
                    {s.status === 'active' && (
                      <span className="text-primary font-semibold">● Active</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default History;
