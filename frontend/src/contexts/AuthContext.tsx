import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  pin: string;
  name: string;
  personality?: string;
  isFirstLogin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, isPinLogin?: boolean) => Promise<boolean>;
  verifyOTP: (otp: string) => Promise<string | null>;
  setPin: (pin: string) => void;
  loginWithPin: (email: string) => Promise<boolean>;
  setPersonality: (personality: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Generate random name for user
  const generateRandomName = (): string => {
    const adjectives = ['Peaceful', 'Bright', 'Creative', 'Gentle', 'Wise', 'Kind', 'Strong', 'Calm', 'Happy', 'Brave'];
    const nouns = ['Explorer', 'Dreamer', 'Thinker', 'Seeker', 'Builder', 'Creator', 'Helper', 'Learner', 'Friend', 'Soul'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective} ${randomNoun}`;
  };

  useEffect(() => {
    // Check for both old and new localStorage keys for backward compatibility
    const savedPin = localStorage.getItem('userSecurePin') || localStorage.getItem('userPin');
    const savedUser = localStorage.getItem('user');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (savedPin && savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    } else if (savedPin && savedEmail) {
      // Handle case where we have pin and email but no full user data
      const userData: User = {
        email: savedEmail,
        pin: savedPin,
        name: generateRandomName(),
        isFirstLogin: false
      };
      setUser(userData);
      setIsAuthenticated(true);
      // Save the full user data for future use
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }, []);

  const login = async (email: string, isPinLogin: boolean = false): Promise<boolean> => {
    // If it's a PIN login (fallback), authenticate immediately
    if (isPinLogin) {
      setIsAuthenticated(true);
      return true;
    }

    // Validate @nitsri.in email
    if (!email.endsWith('@nitsri.in')) {
      return false;
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    setPendingEmail(email);

    // Simulate sending OTP (in real app, this would be an API call)
    console.log(`OTP sent to ${email}: ${otp}`);
    alert(`Simulated OTP sent: ${otp}`); // For demo purposes
    
    return true;
  };

  const verifyOTP = async (otp: string): Promise<string | null> => {
    if (otp === generatedOTP) {
      // Generate 4-digit PIN
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      
      const newUser: User = {
        email: pendingEmail,
        pin,
        name: generateRandomName(),
        isFirstLogin: true
      };

      setUser(newUser);
      setIsAuthenticated(true);
      
      // Store with both key formats for compatibility
      localStorage.setItem('userSecurePin', pin); // Used by LoginScreen
      localStorage.setItem('userPin', pin); // Legacy support
      localStorage.setItem('userEmail', pendingEmail); // Used by LoginScreen
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('pinSavedAt', new Date().toISOString()); // Used by LoginScreen
      
      return pin;
    }
    return null;
  };

  const setPin = (pin: string) => {
    if (user) {
      const updatedUser = { ...user, pin };
      setUser(updatedUser);
      localStorage.setItem('userSecurePin', pin);
      localStorage.setItem('userPin', pin);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const loginWithPin = async (email: string): Promise<boolean> => {
    const savedPin = localStorage.getItem('userSecurePin') || localStorage.getItem('userPin');
    const savedUser = localStorage.getItem('user');
    
    if (savedPin && savedUser) {
      const userData = JSON.parse(savedUser);
      // Verify the email matches
      if (userData.email === email) {
        setUser({ ...userData, isFirstLogin: false });
        setIsAuthenticated(true);
        return true;
      }
    } else if (savedPin && email) {
      // Create user data if we only have pin and email
      const userData: User = {
        email,
        pin: savedPin,
        name: generateRandomName(),
        isFirstLogin: false
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    
    return false;
  };

  const setPersonality = (personality: string) => {
    if (user) {
      const updatedUser = { ...user, personality, isFirstLogin: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    // Clear all localStorage keys
    localStorage.removeItem('userSecurePin');
    localStorage.removeItem('userPin');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');
    localStorage.removeItem('pinSavedAt');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      verifyOTP,
      setPin,
      loginWithPin,
      setPersonality,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};