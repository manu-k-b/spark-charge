import React, { useState, useEffect } from 'react';
import { Users, IndianRupee, Zap, Loader2, Pencil, Check, X } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

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
    setEditValue(user.balance.toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveBalance = async (userId: string) => {
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0 || num > 100000) {
      toast.error('Enter a valid amount (₹0 – ₹1,00,000)');
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
      toast.error('Failed to update balance');
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: data.balance } : u));
      toast.success(`Balance updated to ₹${Number(data.balance).toFixed(2)}`);
    }
    setSaving(false);
    setEditingId(null);
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
              <span className="text-sm font-medium truncate max-w-[200px]">{u.email}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {editingId === u.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-medium">₹</span>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="input-field w-24 py-1 px-2 text-xs"
                      min="0"
                      max="100000"
                      step="1"
                      autoFocus
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
