import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import JournalTab from './JournalTab';
import FloatingChatbot from './FloatingChatbot';
import TodoSidebar from './TodoSidebar';

interface TaskUpdates {
  newTasks: Array<{
    text: string;
    reason: string;
  }>;
  removeTasks: Array<{
    id: string;
    reason: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journal' | 'chat'>('journal');
  const [isTodoCollapsed, setIsTodoCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const todoSidebarRef = useRef<any>(null);

  const personalityInfo = {
    'aura_calm': { name: 'Aura', icon: '🌸', greeting: 'Welcome back, dear soul' },
    'zenith_mindful': { name: 'Zenith', icon: '🧘', greeting: 'Find your center today' },
    'summit_proactive': { name: 'Summit', icon: '⚡', greeting: 'Ready to conquer your goals?' },
    'luna_empathic': { name: 'Luna', icon: '🌙', greeting: 'How are you feeling today?' },
    'sage_introspective': { name: 'Sage', icon: '🦉', greeting: 'Let\'s find some wisdom together' },
    'default': { name: 'Companion', icon: '💙', greeting: 'How can I help you today?' }
  };

  const companion = personalityInfo[user?.personality as keyof typeof personalityInfo] || personalityInfo.default;

  const toggleTodoSidebar = () => {
    setIsTodoCollapsed(!isTodoCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTaskUpdates = (updates: TaskUpdates) => {
    console.log('Handling task updates from chatbot:', updates);
    
    // Get current tasks from localStorage
    try {
      const savedTasks = localStorage.getItem('todoTasks');
      let currentTasks = savedTasks ? JSON.parse(savedTasks) : [];
      
      // Remove tasks marked for removal
      if (updates.removeTasks && updates.removeTasks.length > 0) {
        updates.removeTasks.forEach(removeTask => {
          currentTasks = currentTasks.filter((task: any) => task.id !== removeTask.id);
          console.log(`Removed task: ${removeTask.reason}`);
        });
      }
      
      // Add new tasks
      if (updates.newTasks && updates.newTasks.length > 0) {
        updates.newTasks.forEach(newTask => {
          const task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            text: newTask.text,
            completed: false,
            createdAt: new Date().toISOString()
          };
          currentTasks.unshift(task); // Add to beginning of list
          console.log(`Added task: ${newTask.text} (${newTask.reason})`);
        });
      }
      
      // Save updated tasks
      localStorage.setItem('todoTasks', JSON.stringify(currentTasks));
      
      // Trigger storage change event for real-time updates
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'todoTasks' }
      }));
      
      // Show a brief notification (optional)
      if (updates.newTasks.length > 0 || updates.removeTasks.length > 0) {
        console.log('Task list updated by AI assistant');
      }
      
    } catch (error) {
      console.error('Error handling task updates:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Todo Sidebar - Responsive */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-out
        lg:relative lg:z-auto
      `}>
        <TodoSidebar 
          isCollapsed={isTodoCollapsed} 
          onToggle={toggleTodoSidebar}
        />
      </div>

      {/* Main Content Area */}
      <div className={`
        transition-all duration-300 min-h-screen
        lg:ml-16 ${!isTodoCollapsed ? 'lg:ml-80' : ''}
      `}>
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile menu button */}
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-calm rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-xl">{companion.icon}</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold truncate">HeadSpace</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                    {companion.greeting}
                  </p>
                </div>
              </div>
              
              {/* Right side */}
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium truncate max-w-32">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">with {companion.name}</p>
                </div>
                
                {/* Mobile user info */}
                <div className="sm:hidden">
                  <p className="text-sm font-medium">{user?.name?.split(' ')[0]}</p>
                </div>

                <button 
                  onClick={logout}
                  className="btn-ghost !px-2 sm:!px-4 !py-2 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile greeting */}
            <div className="sm:hidden mt-2">
              <p className="text-xs text-muted-foreground">{companion.greeting}</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {activeTab === 'journal' && <JournalTab />}
        </main>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot 
        companionName={companion.name} 
        onTaskUpdate={handleTaskUpdates}
      />
    </div>
  );
};

export default Dashboard;