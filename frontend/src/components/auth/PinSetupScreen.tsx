import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, CheckCircle, Info, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

interface PinSetupScreenProps {
  onSuccess: () => void;
}

const PinSetupScreen: React.FC<PinSetupScreenProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const { setupPin } = useAuth();

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    setStep('confirm');
  };

  const handleConfirmPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (pin !== confirmPin) {
      setError('PINs do not match');
      setConfirmPin('');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await setupPin(pin);
      if (success) {
        onSuccess();
      } else {
        setError('Failed to setup PIN. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setStep('create');
    setConfirmPin('');
    setError('');
  };

  if (step === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md animate-slide-up">
          <div className="card p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Confirm Your PIN</h1>
              <p className="text-muted-foreground text-sm">
                Enter your PIN again to confirm
              </p>
            </div>
            
            <form onSubmit={handleConfirmPin} className="space-y-6">
              <div>
                <label htmlFor="confirmPin" className="block text-sm font-medium mb-2">
                  Confirm 4-Digit PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="confirmPin"
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="input-primary pl-12 text-center text-xl sm:text-2xl font-mono tracking-wider"
                    placeholder="••••"
                    maxLength={4}
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="btn-ghost flex-1 flex items-center justify-center gap-2 py-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || confirmPin.length !== 4}
                  className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2 py-3 text-base font-medium"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm PIN
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md animate-fade-in">
        <div className="card p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text">
              Welcome to HeadSpace
            </h1>
            <p className="text-muted-foreground text-sm mb-4 sm:mb-6">
              Your personal self-help companion
            </p>
            <p className="text-sm text-muted-foreground">
              Create a 4-digit PIN to secure your personal space
            </p>
          </div>
          
          <form onSubmit={handleCreatePin} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium mb-2">
                Create 4-Digit PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input-primary pl-12 pr-12 text-center text-xl sm:text-2xl font-mono tracking-wider"
                  placeholder="••••"
                  maxLength={4}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Use numbers only (0-9)
              </p>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300">Remember your PIN</p>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">
                    This PIN will be used to access your personal space. Choose something memorable but secure.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2 py-3 text-base font-medium"
            >
              <Shield className="w-4 h-4" />
              Continue
            </button>
          </form>
          
          <div className="mt-6 sm:mt-8 text-center">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex-1 border-t"></div>
              <span>Secure & Private</span>
              <div className="flex-1 border-t"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinSetupScreen;