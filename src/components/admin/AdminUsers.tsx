import React, { useState, useEffect } from 'react';
import { Users, IndianRupee, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  balance: number;
  session_count: number;
  active_sessions: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        toast.error('Failed to load users');
        console.error(error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          All Users ({users.length})
        </span>
      </div>

      {users.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">No users found</p>
      ) : (
        users.map((u) => (
          <div key={u.id} className="card-elevated p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate max-w-[200px]">{u.email}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                ₹{u.balance.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {u.session_count} session{u.session_count !== 1 ? 's' : ''}
              </span>
              {u.active_sessions > 0 && (
                <span className="text-primary font-semibold">● Active</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminUsers;
