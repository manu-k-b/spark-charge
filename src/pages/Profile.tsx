import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, History, Settings, LogOut, ChevronRight, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ComingSoonModal } from '@/components/ui/ComingSoonModal';
import { toast } from 'sonner';

const mockChargingHistory = [
  { id: '1', date: new Date(Date.now() - 86400000), energy: 2.45, cost: 19.60, duration: '1h 32m' },
  { id: '2', date: new Date(Date.now() - 259200000), energy: 1.82, cost: 14.56, duration: '1h 08m' },
  { id: '3', date: new Date(Date.now() - 432000000), energy: 3.10, cost: 24.80, duration: '2h 15m' },
];

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-6 safe-top">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-2xl font-display font-bold">Profile</h1>
        </div>

        {/* User Info Card */}
        <div className="card-elevated p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg">{user?.name || 'User'}</h2>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <Mail className="w-4 h-4" />
                <span>{user?.email || 'email@example.com'}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary">12</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-success">28.5</div>
              <div className="text-xs text-muted-foreground">kWh Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-warning">₹228</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="card-elevated overflow-hidden">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="flex-1 text-left font-medium">Settings</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            <span className="coming-soon-badge">Soon</span>
          </button>
          
          <div className="border-t border-border" />
          
          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-destructive"
          >
            <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left font-medium">Log Out</span>
          </button>
        </div>

        {/* Charging History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display font-semibold">Charging History</h2>
          </div>
          
          <div className="space-y-3">
            {mockChargingHistory.map((session) => (
              <div key={session.id} className="card-elevated p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{formatDate(session.date)}</span>
                  <span className="text-sm font-medium">{session.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{session.energy} kWh</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary">₹{session.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ComingSoonModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        feature="Settings"
      />
    </MobileLayout>
  );
};

export default Profile;
