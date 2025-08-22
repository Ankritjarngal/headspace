import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize,
  Trash2,
  CheckCircle,
  SendHorizonal,
  Bot
} from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: string;
  summary?: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  taskUpdates?: {
    newTasks: Array<{ text: string }>;
    removeTasks: string[];
  };
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface FloatingChatbotProps {
  companionName: string;
}

const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ companionName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [userPersona, setUserPersona] = useState('');
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { text: "How are you feeling today?", icon: "😊" },
    { text: "Tell me about my recent journal entries", icon: "📖" },
    { text: "I need some motivation", icon: "💪" },
    { text: "Help me reflect on my thoughts", icon: "🤔" },
    { text: "I'm feeling anxious about something", icon: "😰" }
  ];

  // Task Update Indicator Component
  const TaskUpdateIndicator = ({ taskUpdates }: { taskUpdates: { newTasks: Array<{ text: string }>; removeTasks: string[] } }) => {
    const hasNewTasks = taskUpdates.newTasks && taskUpdates.newTasks.length > 0;
    const hasRemovedTasks = taskUpdates.removeTasks && taskUpdates.removeTasks.length > 0;
    
    if (!hasNewTasks && !hasRemovedTasks) return null;

    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Tasks Updated</span>
        </div>
        
        {hasNewTasks && (
          <div className="mb-2">
            <p className="text-xs text-blue-700 mb-1">Added {taskUpdates.newTasks.length} task{taskUpdates.newTasks.length !== 1 ? 's' : ''}:</p>
            <ul className="space-y-1">
              {taskUpdates.newTasks.map((task, index) => (
                <li key={index} className="text-xs text-blue-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0"></span>
                  <span>{task.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {hasRemovedTasks && (
          <div>
            <p className="text-xs text-blue-700 mb-1">Removed {taskUpdates.removeTasks.length} task{taskUpdates.removeTasks.length !== 1 ? 's' : ''}:</p>
            <ul className="space-y-1">
              {taskUpdates.removeTasks.map((task, index) => (
                <li key={index} className="text-xs text-blue-600 flex items-center gap-1 line-through opacity-75">
                  <span className="w-1 h-1 bg-blue-400 rounded-full flex-shrink-0"></span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Function to load tasks from localStorage
  const loadTasks = () => {
    try {
      const savedTasks = localStorage.getItem('todoTasks');
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        setCurrentTasks(tasks);
        console.log('FloatingChatbot: Loaded current tasks:', tasks.length, 'tasks');
      } else {
        setCurrentTasks([]);
      }
    } catch (error) {
      console.error('FloatingChatbot: Error loading tasks:', error);
      setCurrentTasks([]);
    }
  };

  // Function to update tasks in localStorage
  const updateTasks = (taskUpdates: { newTasks: Array<{ text: string }>; removeTasks: string[] }) => {
    try {
      let updatedTasks = [...currentTasks];

      // Add new tasks
      if (taskUpdates.newTasks && taskUpdates.newTasks.length > 0) {
        const newTaskObjects = taskUpdates.newTasks.map(task => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          text: task.text,
          completed: false,
          createdAt: new Date().toISOString()
        }));
        updatedTasks = [...newTaskObjects, ...updatedTasks];
      }

      // Remove tasks (by text match since we might not have exact IDs)
      if (taskUpdates.removeTasks && taskUpdates.removeTasks.length > 0) {
        updatedTasks = updatedTasks.filter(task => 
          !taskUpdates.removeTasks.some(removeText => 
            task.text.toLowerCase().includes(removeText.toLowerCase()) || 
            removeText.toLowerCase().includes(task.text.toLowerCase())
          )
        );
      }

      setCurrentTasks(updatedTasks);
      localStorage.setItem('todoTasks', JSON.stringify(updatedTasks));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'todoTasks', value: JSON.stringify(updatedTasks) }
      }));

      console.log('FloatingChatbot: Tasks updated:', updatedTasks);
    } catch (error) {
      console.error('FloatingChatbot: Error updating tasks:', error);
    }
  };

  // Function to load journal entries from localStorage
  const loadJournalEntries = () => {
    try {
      const savedEntries = localStorage.getItem('journalEntries');
      if (savedEntries) {
        const entries = JSON.parse(savedEntries);
        // Sort entries by date in descending order (most recent first)
        const sortedEntries = entries.sort((a: JournalEntry, b: JournalEntry) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setJournalEntries(sortedEntries);
        console.log('FloatingChatbot: Loaded journal entries:', sortedEntries.length, 'entries');
      } else {
        setJournalEntries([]);
      }
    } catch (error) {
      console.error('FloatingChatbot: Error loading journal entries:', error);
      setJournalEntries([]);
    }
  };

  // Function to load user persona
  const loadUserPersona = () => {
    try {
      const savedPersona = localStorage.getItem('userPersona');
      if (savedPersona) {
        setUserPersona(savedPersona);
      } else {
        // Default persona if none exists
        setUserPersona('A person interested in self-reflection and personal growth through journaling.');
      }
    } catch (error) {
      console.error('FloatingChatbot: Error loading user persona:', error);
      setUserPersona('A person interested in self-reflection and personal growth through journaling.');
    }
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    loadJournalEntries();
    loadUserPersona();
    loadTasks();

    // Load conversation history
    try {
      const savedMessages = localStorage.getItem(`conversationHistory_${companionName}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        console.log('FloatingChatbot: Loaded conversation history:', parsedMessages.length, 'messages');
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('FloatingChatbot: Error loading conversation history:', error);
    }
  }, [companionName]);

  // Listen for localStorage changes to update journal entries and tasks in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'journalEntries') {
        console.log('FloatingChatbot: Journal entries updated in localStorage, reloading...');
        loadJournalEntries();
      } else if (e.key === 'userPersona') {
        console.log('FloatingChatbot: User persona updated in localStorage, reloading...');
        loadUserPersona();
      } else if (e.key === 'todoTasks') {
        console.log('FloatingChatbot: Tasks updated in localStorage, reloading...');
        loadTasks();
      }
    };

    // Custom event listener for same-window localStorage changes
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === 'journalEntries') {
        console.log('FloatingChatbot: Journal entries updated (custom event), reloading...');
        loadJournalEntries();
      } else if (e.detail.key === 'userPersona') {
        console.log('FloatingChatbot: User persona updated (custom event), reloading...');
        loadUserPersona();
      } else if (e.detail.key === 'todoTasks') {
        console.log('FloatingChatbot: Tasks updated (custom event), reloading...');
        loadTasks();
      }
    };

    // Listen for storage events from other windows/tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events for same-window changes
    window.addEventListener('localStorageChange' as any, handleCustomStorageChange);

    // Periodic refresh to catch any missed updates
    const intervalId = setInterval(() => {
      loadJournalEntries();
      loadTasks();
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange' as any, handleCustomStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`conversationHistory_${companionName}`, JSON.stringify(messages));
        console.log('FloatingChatbot: Saved conversation history:', messages.length, 'messages');
      } catch (error) {
        console.error('FloatingChatbot: Error saving conversation history:', error);
      }
    }
  }, [messages, companionName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullScreen]);

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      // Prepare summaries in order of recency (most recent first)
      const summaries = journalEntries
        .map(entry => entry.summary || entry.content)
        .filter(Boolean);
      
      console.log('FloatingChatbot: Sending summaries to backend:', summaries.length, 'summaries');
      console.log('FloatingChatbot: Journal entries count:', journalEntries.length);
      console.log('FloatingChatbot: Current tasks count:', currentTasks.length);
      
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const requestPayload = {
        summaries,
        userPersonaText: userPersona,
        chatbotPersonaId: companionName.toLowerCase(),
        questions: [currentMessage],
        conversationHistory,
        currentTasks: currentTasks.map(task => ({
          id: task.id,
          text: task.text,
          completed: task.completed
        }))
      };

      console.log('FloatingChatbot: Request payload:', requestPayload);

      const response = await fetch('https://headspace-backend.onrender.com/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('FloatingChatbot: Response from backend:', data);
      
      // Create assistant message with proper task updates
      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date().toISOString(),
        taskUpdates: data.taskUpdates && (
          (data.taskUpdates.newTasks && data.taskUpdates.newTasks.length > 0) ||
          (data.taskUpdates.removeTasks && data.taskUpdates.removeTasks.length > 0)
        ) ? {
          newTasks: data.taskUpdates.newTasks || [],
          removeTasks: data.taskUpdates.removeTasks || []
        } : undefined
      };

      console.log('FloatingChatbot: Assistant message with task updates:', assistantMessage);

      setMessages(prev => [...prev, assistantMessage]);

      // Handle task updates if present
      if (assistantMessage.taskUpdates) {
        console.log('FloatingChatbot: Processing task updates:', assistantMessage.taskUpdates);
        updateTasks(assistantMessage.taskUpdates);
      }
    } catch (error) {
      console.error('FloatingChatbot: Error sending message:', error);
      
      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const close = () => {
    setIsOpen(false);
    setIsFullScreen(false);
  };

  const clearConversation = () => {
    const customConfirm = (message: string) => {
      const confirmed = window.confirm(message);
      return confirmed;
    };

    if (customConfirm('Are you sure you want to clear the conversation history? This action cannot be undone.')) {
      setMessages([]);
      try {
        localStorage.removeItem(`conversationHistory_${companionName}`);
        console.log('FloatingChatbot: Conversation history cleared');
      } catch (error) {
        console.error('FloatingChatbot: Error clearing conversation history:', error);
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 active:scale-95 flex items-center justify-center group"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div className="relative">
          {isOpen ? (
            <X size={32} />
          ) : (
            <>
              <Bot size={32} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Chatbot Panel */}
      {isOpen && (
        <>
          {/* Full Screen Mode */}
          {isFullScreen ? (
            <div className="fixed inset-0 z-40 bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
              {/* Header */}
              <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Chat with {companionName}
                    </h1>
                    <p className="text-gray-500">AI Companion • Always here to help • {journalEntries.length} journal entries • {currentTasks.length} tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearConversation}
                    className="p-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                    title="Clear conversation history"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleFullScreen}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                  <button
                    onClick={close}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex max-w-4xl mx-auto w-full px-6 py-8 gap-8">
                {/* Quick Prompts Sidebar */}
                <div className="w-80 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Prompts</h3>
                  <div className="space-y-3">
                    {quickPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        className="w-full text-left p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white hover:shadow-lg transition-all duration-200 hover:scale-105 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{prompt.icon}</span>
                          <span className="text-gray-700 group-hover:text-gray-900">{prompt.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/40 p-8 flex flex-col shadow-xl">
                  <div className="flex-1 mb-6 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Bot className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Start a conversation</h3>
                        <p className="text-gray-600">Hi! I'm {companionName}, your AI companion. I'm here to chat about your thoughts, feelings, and journal entries. How can I help you today?</p>
                        {journalEntries.length > 0 && (
                          <p className="text-sm text-gray-500 mt-2">I have access to your {journalEntries.length} most recent journal entries.</p>
                        )}
                        {currentTasks.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">I can also see your {currentTasks.length} current tasks and suggest updates.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'bg-white/80 text-gray-800 border border-gray-200'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                              {msg.taskUpdates && <TaskUpdateIndicator taskUpdates={msg.taskUpdates} />}
                              <p className={`text-xs mt-2 ${
                                msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white/80 rounded-2xl px-4 py-3 border border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-sm text-gray-500">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="space-y-4">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 resize-none text-gray-800 placeholder-gray-500"
                      placeholder="What's on your mind? Share your thoughts here..."
                      rows={4}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSend}
                        disabled={!message.trim() || isLoading}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            Thinking...
                          </>
                        ) : (
                          <>
                            <SendHorizonal className="w-5 h-5" />
                            Send Message
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setMessage('')}
                        className="py-4 px-6 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-200"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      Press Shift+Enter for new line
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Floating Window Mode */
            <div className="fixed z-40 transition-all duration-300 ease-out bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px]">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden h-full flex flex-col"
                   style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' }}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Quick Chat</h3>
                      <p className="text-sm text-gray-500">with {companionName} • {journalEntries.length} entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={clearConversation}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
                      title="Clear conversation history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleFullScreen}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                    <button
                      onClick={close}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-4 py-2">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Bot className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1">Chat with {companionName}</h4>
                        <p className="text-sm text-gray-600">I'm here to help with your thoughts and feelings</p>
                        {journalEntries.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">{journalEntries.length} journal entries available</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                : 'bg-white/80 text-gray-800 border border-gray-200'
                            }`}>
                              <p className="leading-relaxed">{msg.text}</p>
                              {msg.taskUpdates && <TaskUpdateIndicator taskUpdates={msg.taskUpdates} />}
                              <p className={`text-xs mt-1 ${
                                msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white/80 rounded-xl px-3 py-2 border border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs text-gray-500">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Quick Prompts */}
                  {messages.length === 0 && (
                    <div className="p-4 flex-shrink-0 border-t border-gray-200/50">
                      <p className="text-sm font-medium text-gray-600 mb-3">Quick prompts:</p>
                      <div className="space-y-2">
                        {quickPrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickPrompt(prompt.text)}
                            className="w-full text-left text-sm px-3 py-2 rounded-xl bg-gray-50/80 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 flex items-center gap-2 hover:scale-105"
                          >
                            <span>{prompt.icon}</span>
                            <span>{prompt.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-end">
                    {/* Clear Conversation Button */}
                    {messages.length > 0 && (
                      <div className="flex justify-center">
                        <button
                          onClick={clearConversation}
                          className="px-3 py-1.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear chat
                        </button>
                      </div>
                    )}
                    
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-3 bg-gray-50/50 border-2 border-gray-200/50 rounded-xl focus:border-blue-400 focus:bg-white outline-none transition-all duration-200 resize-none text-gray-800 placeholder-gray-500"
                      placeholder="What's on your mind?"
                      rows={3}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSend}
                        disabled={!message.trim() || isLoading}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            Thinking...
                          </>
                        ) : (
                          <>
                            <SendHorizonal className="w-4 h-4" />
                            Send
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setMessage('')}
                        className="py-2.5 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Shift+Enter for new line
                    </p>
                  </div>
                </>
              </div>
            </div>
          )}

          {/* Backdrop for floating mode */}
          {!isFullScreen && (
            <div
              className="fixed inset-0 bg-black/10 z-30 transition-opacity duration-300"
              onClick={close}
            />
          )}
        </>
      )}
    </>
  );
};

export default FloatingChatbot;
