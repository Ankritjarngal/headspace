import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const personalities = {
  'aura_calm': {
    name: 'Aura',
    description: 'A calm, encouraging, and gentle companion, ideal for finding peace and serenity.',
    icon: '🌸',
    color: 'gradient-primary'
  },
  'zenith_mindful': {
    name: 'Zenith', 
    description: 'A focused guide for mindfulness and presence, helping you stay grounded in the moment.',
    icon: '🧘',
    color: 'gradient-secondary'
  },
  'summit_proactive': {
    name: 'Summit',
    description: 'A proactive and goal-oriented motivator, perfect for achieving your aspirations and milestones.', 
    icon: '⚡',
    color: 'gradient-accent'
  },
  'luna_empathic': {
    name: 'Luna',
    description: 'An empathetic and supportive friend, prioritizing emotional connection and understanding.',
    icon: '🌙',
    color: 'gradient-calm'
  },
  'sage_introspective': {
    name: 'Sage',
    description: 'A wise and introspective guide, encouraging deep thought and personal insight.',
    icon: '🦉',
    color: 'gradient-tertiary'
  }
};

const questions = [
  {
    question: "When facing a new challenge, I am most likely to:",
    answers: [
      { text: "Take a step back to breathe and center myself.", personality: "aura_calm" },
      { text: "Analyze the problem and immediately create an action plan.", personality: "summit_proactive" },
      { text: "Consider how this challenge makes me feel emotionally.", personality: "luna_empathic" },
      { text: "Observe my thoughts and reactions without judgment.", personality: "zenith_mindful" },
      { text: "Ponder the deeper meaning or lesson in the challenge.", personality: "sage_introspective" }
    ]
  },
  {
    question: "My ideal way to de-stress is:",
    answers: [
      { text: "Engaging in a mindful activity like cooking or gardening.", personality: "zenith_mindful" },
      { text: "Making a list of small, achievable tasks to regain a sense of control.", personality: "summit_proactive" },
      { text: "Practicing gentle yoga or meditation to relax my body and mind.", personality: "aura_calm" },
      { text: "Talking to a close friend or family member about my feelings.", personality: "luna_empathic" },
      { text: "Reflecting on what truly matters to me and putting things in perspective.", personality: "sage_introspective" }
    ]
  },
  {
    question: "When helping a friend, I tend to:",
    answers: [
      { text: "Listen attentively and validate their emotions.", personality: "luna_empathic" },
      { text: "Break down their problem and offer practical solutions.", personality: "summit_proactive" },
      { text: "Provide a calming presence and reassure them it will be okay.", personality: "aura_calm" },
      { text: "Encourage them to focus on the present moment.", personality: "zenith_mindful" },
      { text: "Ask thought-provoking questions to help them find their own answers.", personality: "sage_introspective" }
    ]
  },
  {
    question: "My personal growth is most motivated by:",
    answers: [
      { text: "The desire to feel more centered and at peace.", personality: "aura_calm" },
      { text: "Setting and achieving ambitious personal goals.", personality: "summit_proactive" },
      { text: "Understanding my own emotions and those of others.", personality: "luna_empathic" },
      { text: "Cultivating a deeper sense of awareness in my daily life.", personality: "zenith_mindful" },
      { text: "Gaining new insights and expanding my knowledge.", personality: "sage_introspective" }
    ]
  },
  {
    question: "In my daily routine, I prioritize:",
    answers: [
      { text: "Making time for quiet reflection or meditation.", personality: "zenith_mindful" },
      { text: "Checking off items on my to-do list.", personality: "summit_proactive" },
      { text: "Connecting with loved ones and community.", personality: "luna_empathic" },
      { text: "Moments of gentle self-care and relaxation.", personality: "aura_calm" },
      { text: "Reading or learning something new to stimulate my mind.", personality: "sage_introspective" }
    ]
  },
  {
    question: "I feel most aligned with myself when:",
    answers: [
      { text: "I'm in a state of calm and clarity.", personality: "aura_calm" },
      { text: "I'm making tangible progress toward a goal.", personality: "summit_proactive" },
      { text: "I'm feeling understood and emotionally connected.", personality: "luna_empathic" },
      { text: "I'm fully present in the moment, appreciating my surroundings.", personality: "zenith_mindful" },
      { text: "I've had a breakthrough in my thinking or perspective.", personality: "sage_introspective" }
    ]
  },
  {
    question: "My preferred communication style is:",
    answers: [
      { text: "Soft-spoken and reassuring.", personality: "aura_calm" },
      { text: "Direct, concise, and solution-focused.", personality: "summit_proactive" },
      { text: "Warm and encouraging, with an emphasis on feelings.", personality: "luna_empathic" },
      { text: "Thoughtful and deliberate, focused on the deeper meaning.", personality: "sage_introspective" },
      { text: "Clear and simple, focusing on one thing at a time.", personality: "zenith_mindful" }
    ]
  },
  {
    question: "When I feel overwhelmed, I'm most likely to:",
    answers: [
      { text: "Take a break to find a sense of inner quiet.", personality: "aura_calm" },
      { text: "Make a list to break down the problem into smaller parts.", personality: "summit_proactive" },
      { text: "Share my feelings with someone I trust.", personality: "luna_empathic" },
      { text: "Do a quick breathing exercise to regain my focus.", personality: "zenith_mindful" },
      { text: "Try to understand the root cause of my feelings.", personality: "sage_introspective" }
    ]
  },
  {
    question: "I see my journey as:",
    answers: [
      { text: "A peaceful path of self-discovery.", personality: "aura_calm" },
      { text: "A series of opportunities to grow and achieve.", personality: "summit_proactive" },
      { text: "A shared experience of connection and understanding.", personality: "luna_empathic" },
      { text: "An unfolding process of being present.", personality: "zenith_mindful" },
      { text: "A quest for deeper knowledge and wisdom.", personality: "sage_introspective" }
    ]
  },
  {
    question: "The most important part of a good support system is:",
    answers: [
      { text: "A calm and non-judgmental atmosphere.", personality: "aura_calm" },
      { text: "Actionable advice and helpful feedback.", personality: "summit_proactive" },
      { text: "Emotional validation and compassion.", personality: "luna_empathic" },
      { text: "A gentle reminder to stay centered.", personality: "zenith_mindful" },
      { text: "The opportunity for meaningful conversations.", personality: "sage_introspective" }
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
    setPersonality('aura_calm'); 
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