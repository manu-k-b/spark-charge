import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useCharger } from '@/contexts/ChargerContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Scan: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const { chargerStatus } = useCharger();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      
      if (chargerStatus?.status === 'charging') {
        navigate('/charging');
        return;
      }

      if (!profile || profile.wallet_balance < 10) {
        toast.error('Insufficient wallet balance. Minimum ₹10 required.');
        navigate('/wallet');
        return;
      }

      if (chargerStatus?.status === 'offline') {
        toast.error('Charger is currently offline.');
        return;
      }

      toast.success('Charger detected! Ready to start charging.');
      navigate('/home');
    }, 2000);
  };

  return (
    <MobileLayout>
      <div className="p-4 safe-top h-full flex flex-col">
        <div className="pt-2 mb-6">
          <h1 className="text-2xl font-display font-bold">Scan QR Code</h1>
          <p className="text-muted-foreground text-sm mt-1">Point your camera at the charger's QR code</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-xs aspect-square">
            <div className="absolute inset-0 border-2 border-primary rounded-3xl overflow-hidden bg-muted/50">
              {isScanning ? (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/80">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-primary-foreground font-medium">Scanning...</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">Align the QR code within the frame</p>
          </div>
        </div>

        <div className="space-y-3 pb-4">
          <button onClick={handleSimulateScan} disabled={isScanning}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            {isScanning ? 'Scanning...' : 'Simulate QR Scan'}
          </button>
          <p className="text-center text-xs text-muted-foreground">Camera access required for real QR scanning</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Scan;
