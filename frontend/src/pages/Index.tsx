import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginScreen from '../components/auth/LoginScreen';
import OTPVerification from '../components/auth/OTPVerification';
import PinDisplay from '../components/auth/PinDisplay';
import PinLogin from '../components/auth/PinLogin';
import PersonalityQuiz from '../components/personality/PersonalityQuiz';
import Dashboard from '../components/dashboard/Dashboard';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'login' | 'otp' | 'pin-display' | 'pin-login' | 'quiz' | 'dashboard'>('login');
  const [generatedPin, setGeneratedPin] = useState('');

  useEffect(() => {
    if (user) {
      // Check if user has saved PIN (returning user)
      const savedPin = localStorage.getItem('userPin');
      if (savedPin && !user.isFirstLogin) {
        setCurrentStep('dashboard');
      } else if (user.isFirstLogin && !user.personality) {
        setCurrentStep('quiz');
      } else {
        setCurrentStep('dashboard');
      }
    } else {
      // Check if there's a saved PIN (returning user)
      const savedPin = localStorage.getItem('userPin');
      if (savedPin) {
        setCurrentStep('pin-login');
      } else {
        setCurrentStep('login');
      }
    }
  }, [user]);

  const handleLoginSuccess = () => {
    setCurrentStep('otp');
  };

  const handleOTPSuccess = (pin: string) => {
    setGeneratedPin(pin);
    setCurrentStep('pin-display');
  };

  const handlePinDisplayContinue = () => {
    setCurrentStep('quiz');
  };

  const handlePinLoginSuccess = () => {
    setCurrentStep('dashboard');
  };

  const handleQuizComplete = () => {
    setCurrentStep('dashboard');
  };

  // Loading state while determining auth status
  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      {currentStep === 'login' && <LoginScreen onNext={handleLoginSuccess} />}
      {currentStep === 'otp' && <OTPVerification onNext={handleOTPSuccess} />}
      {currentStep === 'pin-display' && (
        <PinDisplay pin={generatedPin} onContinue={handlePinDisplayContinue} />
      )}
      {currentStep === 'pin-login' && <PinLogin onSuccess={handlePinLoginSuccess} />}
      {currentStep === 'quiz' && <PersonalityQuiz onComplete={handleQuizComplete} />}
      {currentStep === 'dashboard' && <Dashboard />}
    </>
  );
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;