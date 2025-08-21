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
  const { user, logout } = useAuth();
  const todoSidebarRef = useRef<any>(null);

  const personalityInfo = {
    'aura_calm': { name: 'Aura', icon: '🌸', greeting: 'Welcome back, dear soul' },
    'zenith_mindful': { name: 'Zenith', icon: '🧘', greeting: 'Find your center today' },
    'summit_proactive': { name: 'Summit', icon: '⚡', greeting: 'Ready to conquer your goals?' },
    'default': { name: 'Companion', icon: '💙', greeting: 'How are you feeling today?' }
  };

  const companion = personalityInfo[user?.personality as keyof typeof personalityInfo] || personalityInfo.default;

  const toggleTodoSidebar = () => {
    setIsTodoCollapsed(!isTodoCollapsed);
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
      {/* Todo Sidebar */}
      <TodoSidebar 
        isCollapsed={isTodoCollapsed} 
        onToggle={toggleTodoSidebar}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isTodoCollapsed ? 'ml-16' : 'ml-80'}`}>
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 gradient-calm rounded-full flex items-center justify-center">
                  <span className="text-xl">{companion.icon}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">MindSpace</h1>
                  <p className="text-sm text-muted-foreground">{companion.greeting}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">with {companion.name}</p>
                </div>
                <button 
                  onClick={logout}
                  className="btn-ghost !px-4 !py-2 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
       
        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
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