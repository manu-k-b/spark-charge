import React, { useState, useEffect } from 'react';
import { Users, IndianRupee, Zap, Loader2, Pencil, Check, X, Shield, ShieldOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  balance: number;
  session_count: number;
  active_sessions: number;
  is_admin: boolean;
}

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);

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

  useEffect(() => { fetchUsers(); }, []);

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveBalance = async (userId: string) => {
    const num = parseFloat(editValue);
    if (isNaN(num) || num <= 0 || num > 100000) {
      toast.error('Enter a valid amount to add (₹1 – ₹1,00,000)');
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const { data, error } = await supabase.functions.invoke('admin-update-wallet', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { user_id: userId, amount: num },
    });

    if (error) {
      toast.error('Failed to add funds');
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: data.balance } : u));
      toast.success(`₹${num.toFixed(2)} added. New balance: ₹${Number(data.balance).toFixed(2)}`);
    }
    setSaving(false);
    setEditingId(null);
  };

  const toggleRole = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("You can't revoke your own admin role");
      return;
    }

    setTogglingRole(userId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setTogglingRole(null); return; }

    const action = currentlyAdmin ? 'revoke' : 'grant';
    const { error } = await supabase.functions.invoke('admin-manage-role', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { user_id: userId, action },
    });

    if (error) {
      toast.error(`Failed to ${action} admin role`);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentlyAdmin } : u));
      toast.success(`Admin role ${action === 'grant' ? 'granted' : 'revoked'}`);
    }
    setTogglingRole(null);
  };

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
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate max-w-[180px]">{u.email}</span>
                {u.is_admin && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleRole(u.id, u.is_admin)}
                  disabled={togglingRole === u.id || u.id === currentUser?.id}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                    u.is_admin
                      ? 'hover:bg-destructive/10 text-destructive'
                      : 'hover:bg-primary/10 text-muted-foreground'
                  }`}
                  title={u.id === currentUser?.id ? 'Cannot modify own role' : u.is_admin ? 'Revoke admin' : 'Grant admin'}
                >
                  {togglingRole === u.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : u.is_admin ? (
                    <ShieldOff className="w-3.5 h-3.5" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {editingId === u.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">+₹</span>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="input-field w-24 py-1 px-2 text-xs"
                      min="1"
                      max="100000"
                      step="1"
                      autoFocus
                      placeholder="Amount"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveBalance(u.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button
                      onClick={() => saveBalance(u.id)}
                      disabled={saving}
                      className="p-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    ₹{u.balance.toFixed(2)}
                    <button
                      onClick={() => startEdit(u)}
                      className="p-0.5 rounded hover:bg-muted transition-colors ml-1"
                      title="Edit balance"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {u.session_count} session{u.session_count !== 1 ? 's' : ''}
                </span>
                {u.active_sessions > 0 && (
                  <span className="text-primary font-semibold">● Active</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminUsers;
