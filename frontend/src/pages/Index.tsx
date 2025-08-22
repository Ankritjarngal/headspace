import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import PinSetupScreen from '../components/auth/PinSetupScreen';
import PinLoginScreen from '../components/auth/PinLoginScreen';
import PersonalityQuiz from '../components/personality/PersonalityQuiz';
import Dashboard from '../components/dashboard/Dashboard';

const IndexContent = () => {
  const { isAuthenticated, isNewUser, user } = useAuth();

  // Show loading while auth state is being determined
  if (isNewUser === undefined || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // New user flow: Setup PIN → Take Quiz → Dashboard
  if (isNewUser) {
    return <PinSetupScreen onSuccess={() => {}} />;
  }

  // Existing user but not authenticated: Login with PIN
  if (!isAuthenticated) {
    return <PinLoginScreen onSuccess={() => {}} />;
  }

  // Authenticated but hasn't completed quiz: Show quiz
  if (user && !user.hasCompletedQuiz) {
    return <PersonalityQuiz onComplete={() => {}} />;
  }

  // Fully authenticated and setup complete: Show Dashboard
  return <Dashboard />;
};

const Index = () => {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
};

export default Index;