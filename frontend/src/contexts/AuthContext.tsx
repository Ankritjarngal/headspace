import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Simple hash function for PIN
const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'mindspace_salt_v1'); // Add versioned salt for security
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface User {
  name: string;
  personality?: string;
  hasCompletedQuiz: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  setupPin: (pin: string) => Promise<boolean>;
  login: (pin: string) => Promise<boolean>;
  setPersonality: (personality: string) => void;
  logout: () => void;
  clearAllData: () => Promise<void>;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  confirmClearData: () => void;
  cancelClearData: () => void;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // Generate random name for user
  const generateRandomName = (): string => {
    const adjectives = ['Peaceful', 'Bright', 'Creative', 'Gentle', 'Wise', 'Kind', 'Strong', 'Calm', 'Happy', 'Brave'];
    const nouns = ['Explorer', 'Dreamer', 'Thinker', 'Seeker', 'Builder', 'Creator', 'Helper', 'Learner', 'Friend', 'Soul'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective} ${randomNoun}`;
  };

  // Secure data clearing function with multiple fallback strategies
  const secureDataClear = (): void => {
    try {
      // Strategy 1: Remove known MindSpace keys explicitly
      const knownKeys = [
        'userHashedPin',
        'userData',
        'conversationHistory_Zenith',
        'journalEntries',
        'lastMoodData',
        'pinSavedAt',
        'todoTasks',
        'totalTasksCompleted',
        'user',
        'userEmail',
        'userPin',
        'userSecurePin'
      ];

      // Remove known keys
      knownKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error);
        }
      });

      // Strategy 2: Pattern-based removal for MindSpace-related data
      const allKeys = Object.keys(localStorage);
      const mindspacePatterns = [
        /mindspace/i,
        /^user/i,
        /journal/i,
        /mood/i,
        /todo/i,
        /task/i,
        /conversation/i,
        /^pin/i,
        /auth/i,
        /profile/i,
        /settings/i,
        /preference/i,
        /^ms_/i, // In case you use prefixes
        /_ms$/i  // In case you use suffixes
      ];

      allKeys.forEach(key => {
        const shouldRemove = mindspacePatterns.some(pattern => pattern.test(key));
        if (shouldRemove) {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn(`Failed to remove pattern-matched key ${key}:`, error);
          }
        }
      });

      // Strategy 3: Verification pass - double-check removal
      const remainingKeys = Object.keys(localStorage);
      const problematicKeys = remainingKeys.filter(key => 
        mindspacePatterns.some(pattern => pattern.test(key)) ||
        knownKeys.includes(key)
      );

      if (problematicKeys.length > 0) {
        console.warn('Some keys were not removed:', problematicKeys);
        // Force remove any remaining problematic keys
        problematicKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error(`Critical: Failed to force remove ${key}:`, error);
          }
        });
      }

      // Strategy 4: Clear sessionStorage as well (in case any temp data exists)
      try {
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          const shouldRemove = mindspacePatterns.some(pattern => pattern.test(key)) ||
                              knownKeys.includes(key);
          if (shouldRemove) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Failed to clear sessionStorage:', error);
      }

      console.log('Secure data clearing completed successfully');
    } catch (error) {
      console.error('Error during secure data clearing:', error);
      
      // Fallback: Nuclear option - try to clear everything localStorage
      // Only use this if you're sure no other apps use localStorage
      try {
        const confirmation = confirm(
          'Critical error occurred during data clearing. ' +
          'Would you like to clear ALL localStorage data? ' +
          'This may affect other websites stored data.'
        );
        if (confirmation) {
          localStorage.clear();
          sessionStorage.clear();
        }
      } catch (fallbackError) {
        console.error('Even fallback clearing failed:', fallbackError);
      }
    }
  };

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const hashedPin = localStorage.getItem('userHashedPin');
        const userData = localStorage.getItem('userData');
        
        if (hashedPin && userData) {
          // Returning user - validate data integrity
          try {
            const parsedUser = JSON.parse(userData);
            
            // Basic validation
            if (parsedUser && typeof parsedUser === 'object' && parsedUser.name) {
              setUser(parsedUser);
              setIsNewUser(false);
            } else {
              // Invalid user data - treat as new user
              console.warn('Invalid user data found, treating as new user');
              localStorage.removeItem('userHashedPin');
              localStorage.removeItem('userData');
              setIsNewUser(true);
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            // Corrupted data - clear and start fresh
            localStorage.removeItem('userHashedPin');
            localStorage.removeItem('userData');
            setIsNewUser(true);
          }
        } else {
          // New user
          setIsNewUser(true);
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
        setIsNewUser(true);
      }
    };

    checkExistingUser();
  }, []);

  const setupPin = async (pin: string): Promise<boolean> => {
    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return false;
      }

      const hashedPin = await hashPin(pin);
      const newUser: User = {
        name: generateRandomName(),
        hasCompletedQuiz: false,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage with error handling
      try {
        localStorage.setItem('userHashedPin', hashedPin);
        localStorage.setItem('userData', JSON.stringify(newUser));
      } catch (storageError) {
        console.error('Failed to save user data:', storageError);
        return false;
      }

      setUser(newUser);
      setIsAuthenticated(true);
      setIsNewUser(false);

      return true;
    } catch (error) {
      console.error('Error setting up PIN:', error);
      return false;
    }
  };

  const login = async (pin: string): Promise<boolean> => {
    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return false;
      }

      const storedHashedPin = localStorage.getItem('userHashedPin');
      const userData = localStorage.getItem('userData');

      if (!storedHashedPin || !userData) {
        return false;
      }

      const hashedInputPin = await hashPin(pin);
      
      if (hashedInputPin === storedHashedPin) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Validate parsed user data
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.name) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            return true;
          } else {
            console.error('Invalid user data structure');
            return false;
          }
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const setPersonality = (personality: string) => {
    if (user) {
      try {
        const updatedUser = { 
          ...user, 
          personality, 
          hasCompletedQuiz: true 
        };
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error saving personality:', error);
      }
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    // Don't clear data on logout - user can login again with PIN
  };

  const clearAllData = async (): Promise<void> => {
    setShowConfirmDialog(true);
  };

  const confirmClearData = () => {
    try {
      // Perform secure data clearing
      secureDataClear();

      // Reset application state
      setUser(null);
      setIsAuthenticated(false);
      setIsNewUser(true);
      setShowConfirmDialog(false);

      console.log('All data has been securely cleared');
    } catch (error) {
      console.error('Error during data clearing:', error);
      // You can show a toast here for error notification
      setShowConfirmDialog(false);
    }
  };

  const cancelClearData = () => {
    setShowConfirmDialog(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isNewUser,
      setupPin,
      login,
      setPersonality,
      logout,
      clearAllData,
      showConfirmDialog,
      setShowConfirmDialog,
      confirmClearData,
      cancelClearData
    }}>
      {children}
    </AuthContext.Provider>
  );
};