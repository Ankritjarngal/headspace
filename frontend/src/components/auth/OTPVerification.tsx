import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface OTPVerificationProps {
  onNext: (pin: string) => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ onNext }) => {
  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { verifyOTP } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const pin = await verifyOTP(otp);
      if (pin) {
        onNext(pin);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-muted-foreground">
              We've sent a 6-digit verification code to your email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                className="input-primary text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
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
              disabled={isLoading || otp.length !== 6}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button className="text-sm text-muted-foreground hover:text-foreground">
              Didn't receive the code? Resend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;