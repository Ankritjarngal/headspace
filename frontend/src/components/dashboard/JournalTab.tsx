import React, { useState, useEffect } from 'react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: string;
  moodTimestamp?: string;
  summary?: string;
}

const JournalTab: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const moods = [
    { emoji: '😊', label: 'Happy', value: 'happy' },
    { emoji: '😔', label: 'Sad', value: 'sad' },
    { emoji: '😰', label: 'Anxious', value: 'anxious' },
    { emoji: '😌', label: 'Calm', value: 'calm' },
    { emoji: '😴', label: 'Tired', value: 'tired' },
    { emoji: '🤗', label: 'Grateful', value: 'grateful' }
  ];

  // Load journals from localStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save journals to localStorage
  const saveEntries = (newEntries: JournalEntry[]) => {
    localStorage.setItem('journalEntries', JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  // Generate summary from backend
  const generateSummary = async (journalContent: string, moodValue: string): Promise<string> => {
    try {
      const response = await fetch('https://headspace-backend.onrender.com/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journalText: journalContent,
          moodScale: moodValue
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      return data.summary || 'Summary generation failed';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Unable to generate summary at this time';
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsGeneratingSummary(true);

    try {
      // Generate summary if there's content and mood
      let summary = '';
      if (content.trim() && mood) {
        summary = await generateSummary(content, mood);
      }

      const now = new Date().toISOString();

      if (editingEntry) {
        // Update existing entry
        const updatedEntries = entries.map(entry =>
          entry.id === editingEntry.id
            ? { 
                ...entry, 
                title, 
                content, 
                mood,
                moodTimestamp: mood ? now : entry.moodTimestamp,
                summary: summary || entry.summary
              }
            : entry
        );
        saveEntries(updatedEntries);
      } else {
        // Create new entry
        const newEntry: JournalEntry = {
          id: Date.now().toString(),
          title,
          content,
          mood,
          moodTimestamp: mood ? now : undefined,
          summary,
          date: now
        };
        saveEntries([newEntry, ...entries]);
      }

      // Update mood tracking in localStorage
      if (mood) {
        const moodData = {
          lastMood: mood,
          lastMoodTimestamp: now
        };
        localStorage.setItem('lastMoodData', JSON.stringify(moodData));
      }

      // Reset form
      setTitle('');
      setContent('');
      setMood('');
      setShowEditor(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || '');
    setEditingEntry(entry);
    setShowEditor(true);
  };

  const handleDelete = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    saveEntries(updatedEntries);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showEditor) {
    return (
      <div className="max-w-4xl mx-auto animate-slide-up px-2 sm:px-0">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">
              {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
            </h2>
            <button
              onClick={() => {
                setShowEditor(false);
                setEditingEntry(null);
                setTitle('');
                setContent('');
                setMood('');
              }}
              className="btn-ghost !px-2 sm:!px-3 !py-2 text-lg sm:text-base touch-manipulation"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-primary text-sm sm:text-base"
                placeholder="How was your day?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">How are you feeling?</label>
              <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3">
                {moods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`p-2 sm:p-3 rounded-lg border transition-all touch-manipulation ${
                      mood === m.value ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-1">{m.emoji}</div>
                    <div className="text-xs">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your thoughts</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-primary min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base"
                placeholder="Write about your thoughts, feelings, experiences..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || isGeneratingSummary}
                className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2 order-2 sm:order-1 touch-manipulation"
              >
                {isGeneratingSummary ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">Saving & Analyzing...</span>
                  </>
                ) : (
                  <span className="text-sm sm:text-base">{editingEntry ? 'Update Entry' : 'Save Entry'}</span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingEntry(null);
                  setTitle('');
                  setContent('');
                  setMood('');
                }}
                className="btn-ghost order-1 sm:order-2 touch-manipulation"
                disabled={isGeneratingSummary}
              >
                Cancel
              </button>
            </div>
            
            {mood && content && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  💡 A personalized summary will be generated for this entry based on your mood and content.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Your Journal</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Reflect on your thoughts and track your emotional journey
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto touch-manipulation"
        >
          <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm sm:text-base">New Entry</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 gradient-secondary rounded-full flex items-center justify-center">
            <svg className="w-8 sm:w-10 h-8 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Start Your Journey</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
            Begin documenting your thoughts and feelings. Every entry is a step towards self-awareness.
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="btn-primary touch-manipulation"
          >
            Write Your First Entry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {entries.map((entry) => (
            <div key={entry.id} className="card p-4 sm:p-6 hover:shadow-medium transition-all">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold truncate flex-1">{entry.title}</h3>
                    {entry.mood && (
                      <span className="text-lg sm:text-xl flex-shrink-0">
                        {moods.find(m => m.value === entry.mood)?.emoji}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatDate(entry.date)}
                  </p>
                </div>
                <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted touch-manipulation"
                  >
                    <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted touch-manipulation"
                  >
                    <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <p className="text-sm sm:text-base text-foreground leading-relaxed line-clamp-3 mb-3 sm:mb-4">
                {entry.content}
              </p>
              
              {entry.summary && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 sm:p-4 rounded-lg border-l-4 border-purple-400">
                  <div className="flex items-start gap-2">
                    <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">AI Insight</p>
                      <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 leading-relaxed">{entry.summary}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalTab;