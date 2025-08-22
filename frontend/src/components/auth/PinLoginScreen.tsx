import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Trash2, Lock } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal.tsx'; // Adjust path as needed

interface PinLoginScreenProps {
  onSuccess: () => void;
}

const PinLoginScreen: React.FC<PinLoginScreenProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    login, 
    clearAllData, 
    user, 
    showConfirmDialog, 
    confirmClearData, 
    cancelClearData 
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(pin);
      if (success) {
        onSuccess();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    clearAllData();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md animate-fade-in">
        <div className="card p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text ">
              Welcome Back
            </h1>
            <h3 className="text-xl font-bold mb-2 bg-clip-text "> {user && ( user.name)}</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium mb-2">
                Enter Your PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input-primary pl-12 text-center text-xl sm:text-2xl font-mono tracking-wider"
                  placeholder="••••"
                  maxLength={4}
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                4-digit PIN you created earlier
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
            
            <button
              type="submit"
              disabled={isLoading || pin.length !== 4}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2 py-3 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 sm:mt-8 space-y-3 text-center">
            <div className="text-xs text-muted-foreground">
              Forgot your PIN or need to start fresh?
            </div>
            <button
              onClick={handleClearData}
              className="inline-flex items-center gap-2 text-xs text-red-500 hover:text-red-600 underline transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all data and start over
            </button>
          </div>
          
          <div className="mt-6 sm:mt-8 text-center">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex-1 border-t"></div>
              <span>Secure & Private</span>
              <div className="flex-1 border-t"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmDialog}
        onConfirm={confirmClearData}
        onCancel={cancelClearData}
        title="Delete All Data"
        message="Are you sure you want to delete all your data? This action cannot be undone and you will need to create a new PIN."
        confirmText="Delete Data"
        cancelText="Keep Data"
        type="danger"
      />
    </div>
  );
};

export default PinLoginScreen;