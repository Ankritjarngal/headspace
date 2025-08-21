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
  const { setPersonality } = useAuth();

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

  if (showResult) {
    const personality = personalities[selectedPersonality as keyof typeof personalities];
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="card p-8 text-center">
            <div className={`w-24 h-24 mx-auto mb-6 ${personality.color} rounded-full flex items-center justify-center text-4xl`}>
              {personality.icon}
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Meet {personality.name}</h1>
            <p className="text-muted-foreground mb-8">
              {personality.description}
            </p>

            <div className="bg-surface p-4 rounded-lg mb-6 text-left">
              <p className="text-sm">
                Based on your responses, <strong>{personality.name}</strong> will be your personal 
                AI companion, tailored to support your unique needs and preferences.
              </p>
            </div>

            <button
              onClick={handleConfirm}
              className="btn-primary w-full"
            >
              Continue with {personality.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="card p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Personality Assessment</h1>
              <span className="text-sm text-muted-foreground">
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

          <div className="mb-8">
            <h2 className="text-lg font-medium mb-6">
              {questions[currentQuestion].question}
            </h2>
            
            <div className="space-y-3">
              {questions[currentQuestion].answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(answer.personality)}
                  className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  {answer.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz;