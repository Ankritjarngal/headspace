import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PinLoginProps {
  onSuccess: () => void;
}

const PinLogin: React.FC<PinLoginProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { loginWithPin, logout } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loginWithPin(pin)) {
      onSuccess();
    } else {
      setError('Invalid PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 gradient-calm rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Enter your PIN to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium mb-2">
                4-Digit PIN
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="input-primary text-center text-2xl tracking-widest"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pin.length !== 4}
              className="btn-primary w-full disabled:opacity-50"
            >
              Enter
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;