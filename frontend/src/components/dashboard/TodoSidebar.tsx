import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface Milestone {
  threshold: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  achieved: boolean;
  achievedAt?: string;
}

interface MilestoneState {
  [key: number]: {
    achieved: boolean;
    achievedAt?: string;
  };
}

interface TodoSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const TodoSidebar: React.FC<TodoSidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  const [milestoneStates, setMilestoneStates] = useState<MilestoneState>({});
  const [isMobile, setIsMobile] = useState(false);
  
  const baseMilestones = [
    {
      threshold: 5,
      title: "First Steps",
      description: "Complete your first 5 tasks",
      icon: "🌱",
      color: "bg-green-100 text-green-800 border-green-200"
    },
    {
      threshold: 15,
      title: "Getting Momentum",
      description: "Finish 15 tasks total",
      icon: "🚀",
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      threshold: 30,
      title: "Productivity Pro",
      description: "Complete 30 tasks",
      icon: "⭐",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    {
      threshold: 50,
      title: "Task Master",
      description: "Achieve 50 completed tasks",
      icon: "👑",
      color: "bg-purple-100 text-purple-800 border-purple-200"
    },
    {
      threshold: 100,
      title: "Century Club",
      description: "Complete 100 tasks!",
      icon: "💎",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200"
    }
  ];

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Use lg breakpoint to match Dashboard
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create milestones with persistent achievement state
  const milestones: Milestone[] = baseMilestones.map(milestone => ({
    ...milestone,
    achieved: milestoneStates[milestone.threshold]?.achieved || totalTasksCompleted >= milestone.threshold,
    achievedAt: milestoneStates[milestone.threshold]?.achievedAt
  }));

  // Function to load milestone states from localStorage
  const loadMilestoneStates = () => {
    try {
      const savedStates = localStorage.getItem('milestoneStates');
      if (savedStates) {
        const parsed = JSON.parse(savedStates);
        setMilestoneStates(parsed);
        console.log('Loaded milestone states:', parsed);
      }
    } catch (error) {
      console.error('Error loading milestone states:', error);
    }
  };

  // Function to save milestone states
  const saveMilestoneStates = (states: MilestoneState) => {
    try {
      localStorage.setItem('milestoneStates', JSON.stringify(states));
      setMilestoneStates(states);
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'milestoneStates', value: JSON.stringify(states) }
      }));
      console.log('Saved milestone states:', states);
    } catch (error) {
      console.error('Error saving milestone states:', error);
    }
  };

  // Function to check and update milestones
  const checkMilestones = (currentTotal: number) => {
    const newStates = { ...milestoneStates };
    let updated = false;

    baseMilestones.forEach(milestone => {
      const currentState = newStates[milestone.threshold];
      const shouldBeAchieved = currentTotal >= milestone.threshold;
      
      // Only mark as achieved if not already achieved and threshold is met
      if (!currentState?.achieved && shouldBeAchieved) {
        newStates[milestone.threshold] = {
          achieved: true,
          achievedAt: new Date().toISOString()
        };
        updated = true;
        console.log(`Milestone achieved: ${milestone.title} at ${currentTotal} tasks`);
      }
      // Initialize state if it doesn't exist
      else if (!currentState) {
        newStates[milestone.threshold] = {
          achieved: false
        };
      }
    });

    if (updated) {
      saveMilestoneStates(newStates);
    }
  };

  // Function to load tasks from localStorage
  const loadTasks = () => {
    try {
      const savedTasks = localStorage.getItem('todoTasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        console.log('TodoSidebar: Loading tasks from localStorage:', parsedTasks.length, 'tasks');
        setTasks(parsedTasks);
        
        // Load the persistent total count
        const savedTotal = localStorage.getItem('totalTasksCompleted');
        const totalFromStorage = savedTotal ? parseInt(savedTotal, 10) : 0;
        
        // Current completed tasks count
        const currentCompletedCount = parsedTasks.filter((task: Task) => task.completed).length;
        
        // Use the higher value between stored total and current completed
        const finalTotal = Math.max(totalFromStorage, currentCompletedCount);
        
        setTotalTasksCompleted(finalTotal);
        checkMilestones(finalTotal);
      } else {
        console.log('TodoSidebar: No tasks found in localStorage');
        setTasks([]);
        setTotalTasksCompleted(0);
      }
    } catch (error) {
      console.error('TodoSidebar: Error loading tasks:', error);
      setTasks([]);
      setTotalTasksCompleted(0);
    }
  };

  // Function to save tasks and dispatch event
  const saveTasks = (updatedTasks: Task[]) => {
    try {
      localStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'todoTasks', value: JSON.stringify(updatedTasks) }
      }));
      
      console.log('TodoSidebar: Saved tasks to localStorage:', updatedTasks.length, 'tasks');
    } catch (error) {
      console.error('TodoSidebar: Error saving tasks:', error);
    }
  };

  // Load data from storage on component mount
  useEffect(() => {
    loadMilestoneStates();
    loadTasks();
  }, []);

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'todoTasks') {
        console.log('TodoSidebar: Storage event received for todoTasks');
        loadTasks();
      } else if (e.key === 'totalTasksCompleted') {
        const newTotal = e.newValue ? parseInt(e.newValue, 10) : 0;
        setTotalTasksCompleted(newTotal);
        checkMilestones(newTotal);
      } else if (e.key === 'milestoneStates') {
        console.log('TodoSidebar: Storage event received for milestoneStates');
        loadMilestoneStates();
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === 'todoTasks') {
        console.log('TodoSidebar: Custom storage event received for todoTasks');
        loadTasks();
      } else if (e.detail.key === 'totalTasksCompleted') {
        const newTotal = e.detail.value ? parseInt(e.detail.value, 10) : 0;
        setTotalTasksCompleted(newTotal);
        checkMilestones(newTotal);
      } else if (e.detail.key === 'milestoneStates') {
        console.log('TodoSidebar: Custom storage event received for milestoneStates');
        loadMilestoneStates();
      }
    };

    // Listen for storage events from other windows/tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events for same-window changes
    window.addEventListener('localStorageChange' as any, handleCustomStorageChange);

    // Periodic refresh to ensure sync
    const intervalId = setInterval(() => {
      loadTasks();
    }, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange' as any, handleCustomStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Save total completed count to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('totalTasksCompleted', totalTasksCompleted.toString());
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'totalTasksCompleted', value: totalTasksCompleted.toString() }
      }));
      checkMilestones(totalTasksCompleted);
    } catch (error) {
      console.error('Error saving total completed count:', error);
    }
  }, [totalTasksCompleted]);

  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task: Task = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const updatedTasks = [task, ...tasks];
    saveTasks(updatedTasks);
    setNewTask('');
    console.log('TodoSidebar: Added new task:', task.text);
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const wasCompleted = task.completed;
        const updatedTask = {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined
        };
        
        // Update total completed count - only increment the lifetime total when completing
        if (!wasCompleted && updatedTask.completed) {
          // Task being completed for the first time
          const newTotal = totalTasksCompleted + 1;
          setTotalTasksCompleted(newTotal);
          // Save to localStorage immediately for consistency
          try {
            localStorage.setItem('totalTasksCompleted', newTotal.toString());
          } catch (error) {
            console.error('Error saving total count during toggle:', error);
          }
          checkMilestones(newTotal);
        }
        // Note: We don't decrement the lifetime total when unchecking, as milestones should remain achieved
        
        return updatedTask;
      }
      return task;
    });
    
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    // When deleting tasks, we don't change the lifetime total - milestones stay achieved
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  const clearCompleted = () => {
    // When clearing completed tasks, we don't change the lifetime total - milestones stay achieved
    const updatedTasks = tasks.filter(task => !task.completed);
    saveTasks(updatedTasks);
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const progress = totalTasksCompleted;
  const nextMilestone = milestones.find(m => !m.achieved);
  const progressPercentage = nextMilestone 
    ? Math.min((progress / nextMilestone.threshold) * 100, 100)
    : 100;

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-2xl transition-all duration-300 ease-out
      ${isMobile ? 'z-50' : 'z-30'}
      ${isMobile 
        ? (isCollapsed ? '-translate-x-full w-80' : 'translate-x-0 w-80')
        : (isCollapsed ? 'w-16' : 'w-80')
      }
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="flex items-center justify-between">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Tasks</h3>
                <p className="text-xs text-gray-500">{tasks.length} active • {progress} completed lifetime</p>
              </div>
            </div>
          )}
          {/* Always show button, even when collapsed on mobile */}
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            {isMobile ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {(!isCollapsed || isMobile) && (
        <>
          {/* Progress Section */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="space-y-4">
              {/* Current Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">
                    {nextMilestone ? `Progress to "${nextMilestone.title}"` : 'All milestones achieved!'}
                  </span>
                  <span className="text-gray-500">
                    {nextMilestone ? `${progress}/${nextMilestone.threshold}` : `${progress} total`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                {nextMilestone && (
                  <p className="text-xs text-gray-500 mt-1">{nextMilestone.description}</p>
                )}
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Milestones</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 ${
                        milestone.achieved 
                          ? `${milestone.color} scale-105` 
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{milestone.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">{milestone.title}</span>
                          {milestone.achieved && (
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs opacity-75">
                          {milestone.threshold} tasks
                          {milestone.achieved && milestone.achievedAt && 
                            ` • Achieved ${new Date(milestone.achievedAt).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Add Task */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTask();
                    }
                  }}
                />
                <button
                  onClick={addTask}
                  disabled={!newTask.trim()}
                  className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              
              {tasks.length > 0 && completedTasks > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
                >
                  Clear {completedTasks} completed task{completedTasks !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-800 mb-1">No tasks yet</h4>
                <p className="text-sm text-gray-500">Add your first task to get started!</p>
                <p className="text-xs text-gray-400 mt-2">
                  Tasks added through the chatbot will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      task.completed
                        ? 'bg-green-50 border-green-200 opacity-75'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        task.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${
                        task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {task.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {task.completed 
                          ? `Completed ${new Date(task.completedAt!).toLocaleDateString()}`
                          : `Added ${new Date(task.createdAt).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Collapsed State - Desktop only */}
      {!isMobile && isCollapsed && (
        <div className="p-4 flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
            <div className="w-2 h-8 bg-gray-200 rounded-full">
              <div 
                className="bg-gradient-to-t from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ height: `${nextMilestone ? progressPercentage : 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{progress}</p>
          </div>
          <div className="space-y-2">
            {milestones.slice(0, 3).map((milestone, index) => (
              <div
                key={index}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  milestone.achieved ? milestone.color : 'bg-gray-100 text-gray-400'
                }`}
              >
                {milestone.icon}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">{tasks.length}</p>
            <p className="text-xs text-gray-400">tasks</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoSidebar;