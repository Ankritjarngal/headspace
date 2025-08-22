import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const personalities = {
  'aura_calm': {
    name: 'Aura',
    description: 'Calm, encouraging, and gentle companion',
    icon: '🌸',
    color: 'gradient-primary'
  },
  'zenith_mindful': {
    name: 'Zenith', 
    description: 'Mindfulness and presence focused',
    icon: '🧘',
    color: 'gradient-secondary'
  },
  'summit_proactive': {
    name: 'Summit',
    description: 'Proactive and goal-oriented motivator', 
    icon: '⚡',
    color: 'gradient-accent'
  },
  'default': {
    name: 'Companion',
    description: 'Supportive and caring AI friend',
    icon: '💙',
    color: 'gradient-calm'
  }
};

const questions = [
  {
    question: "When facing stress, I prefer to:",
    answers: [
      { text: "Take deep breaths and find my center", personality: "zenith_mindful" },
      { text: "Make a plan and take action immediately", personality: "summit_proactive" },
      { text: "Talk through my feelings gently", personality: "aura_calm" },
      { text: "Get support from others", personality: "default" }
    ]
  },
  {
    question: "My ideal way to start the day is:",
    answers: [
      { text: "Meditation or mindful breathing", personality: "zenith_mindful" },
      { text: "Setting goals and making a to-do list", personality: "summit_proactive" },
      { text: "Gentle affirmations and self-care", personality: "aura_calm" },
      { text: "Connecting with loved ones", personality: "default" }
    ]
  },
  {
    question: "When helping others, I tend to:",
    answers: [
      { text: "Guide them to be present and aware", personality: "zenith_mindful" },
      { text: "Help them create actionable solutions", personality: "summit_proactive" },
      { text: "Offer comfort and encouragement", personality: "aura_calm" },
      { text: "Listen and provide emotional support", personality: "default" }
    ]
  }
];

interface PersonalityQuizProps {
  onComplete: () => void;
}

const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState('');
  const { setPersonality, user } = useAuth();

  const handleAnswer = (personalityType: string) => {
    const newAnswers = [...answers, personalityType];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate most common personality type
      const counts = newAnswers.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommon = Object.entries(counts).reduce((a, b) => 
        counts[a[0]] > counts[b[0]] ? a : b
      )[0];
      
      setSelectedPersonality(mostCommon);
      setShowResult(true);
    }
  };

  const handleConfirm = () => {
    setPersonality(selectedPersonality);
    onComplete();
  };

  const skipQuiz = () => {
    setPersonality('default');
    onComplete();
  };

  if (showResult) {
    const personality = personalities[selectedPersonality as keyof typeof personalities];
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md animate-slide-up">
          <div className="card p-6 sm:p-8 text-center">
            <div className={`w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-4 sm:mb-6 ${personality.color} rounded-full flex items-center justify-center text-3xl sm:text-4xl`}>
              {personality.icon}
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Meet {personality.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
              {personality.description}
            </p>

            <div className="bg-surface p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-left">
              <p className="text-xs sm:text-sm leading-relaxed">
                Based on your responses, <strong>{personality.name}</strong> will be your personal 
                AI companion, tailored to support your unique needs and preferences.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <svg className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Setup Complete!</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                You're ready to start your mindfulness journey
              </p>
            </div>

            <button
              onClick={handleConfirm}
              className="btn-primary w-full text-sm sm:text-base py-3 touch-manipulation"
            >
              Enter MindSpace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md sm:max-w-lg animate-fade-in">
        <div className="card p-6 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate">Welcome, {user?.name}!</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Let's personalize your experience</p>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground self-start sm:self-auto flex-shrink-0">
                {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-medium mb-4 sm:mb-6 leading-relaxed">
              {questions[currentQuestion].question}
            </h2>
            
            <div className="space-y-2 sm:space-y-3">
              {questions[currentQuestion].answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(answer.personality)}
                  className="w-full p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-muted transition-colors text-sm sm:text-base leading-relaxed touch-manipulation active:scale-98"
                >
                  {answer.text}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={skipQuiz}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline touch-manipulation"
            >
              Skip personalization for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz;