import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose, feature }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-xl animate-slide-up">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-warning/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-warning" />
          </div>
          
          <h3 className="text-xl font-display font-bold mb-2">Coming Soon!</h3>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{feature}</span> is currently under development. 
            We're working hard to bring this feature to you soon!
          </p>
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full mt-4"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
