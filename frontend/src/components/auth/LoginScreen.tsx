import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginScreenProps {
  onNext: () => void;
  onPinLoginSuccess: () => void; // Add this prop to directly go to dashboard
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNext, onPinLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSavedPin, setHasSavedPin] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const { login, loginWithPin } = useAuth();

  // Check for saved PIN on component mount
  useEffect(() => {
    const savedPin = localStorage.getItem('userSecurePin');
    const savedUserEmail = localStorage.getItem('userEmail');
    
    if (savedPin && savedUserEmail) {
      setHasSavedPin(true);
      setSavedEmail(savedUserEmail);
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email);
      if (success) {
        // Save email for future PIN logins
        localStorage.setItem('userEmail', email);
        onNext(); // This will go to OTP verification
      } else {
        setError('Only @nitsri.in email addresses are allowed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const savedPin = localStorage.getItem('userSecurePin');
      
      if (pin === savedPin) {
        // PIN matches, authenticate user and go directly to dashboard
        if (loginWithPin) {
          const success = await loginWithPin(savedEmail);
          if (success) {
            // Skip OTP verification and go directly to dashboard
            onPinLoginSuccess(); // Use the new prop instead of onNext
          } else {
            setError('Authentication failed. Please try again.');
          }
        } else {
          // Fallback: use regular login but mark as PIN authenticated
          const success = await login(savedEmail, true); // Pass true to indicate PIN login
          if (success) {
            onPinLoginSuccess(); // Skip OTP verification
          } else {
            setError('Authentication failed. Please try again.');
          }
        }
      } else {
        setError('Incorrect PIN. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToEmailLogin = () => {
    setHasSavedPin(false);
    setPin('');
    setError('');
  };

  const clearSavedData = () => {
    localStorage.removeItem('userSecurePin');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('pinSavedAt');
    setHasSavedPin(false);
    setPin('');
    setError('');
  };

  if (hasSavedPin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 gradient-calm bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Enter your PIN to continue
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {savedEmail}
              </p>
            </div>
            
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium mb-2">
                  Enter PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input-primary text-center text-2xl font-mono tracking-wider"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Quick access - no OTP required
                </p>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 space-y-2 text-center">
              <button
                onClick={switchToEmailLogin}
                className="block w-full text-sm text-muted-foreground hover:text-foreground underline"
              >
                Use different email instead
              </button>
              <button
                onClick={clearSavedData}
                className="block w-full text-xs text-red-500 hover:text-red-600 underline"
              >
                Clear saved login data
              </button>
            </div>
            
            <div className="mt-8 text-center">
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 gradient-calm bg-clip-text text-transparent">
              Welcome to MindSpace
            </h1>
            <p className="text-muted-foreground">
              Your personal self-help companion
            </p>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-primary"
                placeholder="your.name@nitsri.in"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only @nitsri.in email addresses are accepted
              </p>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? 'Sending OTP...' : 'Get OTP'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
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

export default LoginScreen;