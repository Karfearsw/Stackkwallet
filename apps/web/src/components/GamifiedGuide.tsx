import React, { useState, useEffect } from 'react';
import { CheckCircle, Star, Trophy, Target, Zap, Gift } from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  points: number;
  action?: string;
}

interface GamifiedGuideProps {
  onStepComplete: (stepId: string) => void;
  completedSteps: string[];
}

const GamifiedGuide: React.FC<GamifiedGuideProps> = ({ completedSteps }) => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const guideSteps: GuideStep[] = [
    {
      id: 'generate-wallet',
      title: 'Create Your First Wallet',
      description: 'Generate a new Solana wallet to get started with crypto!',
      icon: <Zap className="w-6 h-6" />,
      completed: completedSteps.includes('generate-wallet'),
      points: 100,
      action: 'Click "Generate New Wallet" to create your first wallet'
    },
    {
      id: 'backup-seed',
      title: 'Secure Your Seed Phrase',
      description: 'Back up your seed phrase to keep your wallet safe forever!',
      icon: <Target className="w-6 h-6" />,
      completed: completedSteps.includes('backup-seed'),
      points: 150,
      action: 'Show and copy your seed phrase, then check the backup confirmation'
    },
    {
      id: 'check-balance',
      title: 'Check Your Balance',
      description: 'View your SOL balance and explore your wallet overview!',
      icon: <Star className="w-6 h-6" />,
      completed: completedSteps.includes('check-balance'),
      points: 75,
      action: 'Your balance is automatically displayed in the wallet overview'
    },
    {
      id: 'explore-tokens',
      title: 'Discover Token Holdings',
      description: 'Learn about SPL tokens and see what tokens you might have!',
      icon: <Gift className="w-6 h-6" />,
      completed: completedSteps.includes('explore-tokens'),
      points: 125,
      action: 'Token balances will appear automatically when you have any'
    },
    {
      id: 'network-switch',
      title: 'Master Network Switching',
      description: 'Learn to switch between Devnet and Mainnet like a pro!',
      icon: <Trophy className="w-6 h-6" />,
      completed: completedSteps.includes('network-switch'),
      points: 200,
      action: 'Try switching networks using the network selector'
    }
  ];

  useEffect(() => {
    const points = guideSteps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.points, 0);
    setTotalPoints(points);

    // Show celebration when a step is completed
    if (completedSteps.length > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  }, [completedSteps]);

  const completedCount = guideSteps.filter(step => step.completed).length;
  const progressPercentage = (completedCount / guideSteps.length) * 100;

  const getNextIncompleteStep = () => {
    return guideSteps.find(step => !step.completed);
  };

  const nextStep = getNextIncompleteStep();

  return (
    <div className="gamified-guide">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <div className="celebration-text">Step Completed!</div>
            <div className="celebration-points">+{guideSteps.find(s => completedSteps.includes(s.id))?.points} points</div>
          </div>
        </div>
      )}

      <div className="guide-header">
        <div className="guide-title-section">
          <h3 className="guide-title">🚀 Wallet Mastery Guide</h3>
          <div className="guide-subtitle">Complete challenges to become a crypto pro!</div>
        </div>
        
        <div className="guide-stats">
          <div className="stat-item">
            <div className="stat-value">{totalPoints}</div>
            <div className="stat-label">Points</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{completedCount}/{guideSteps.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="progress-text">{Math.round(progressPercentage)}% Complete</div>
      </div>

      {/* Current Challenge */}
      {nextStep && (
        <div className="current-challenge">
          <div className="challenge-header">
            <div className="challenge-icon">{nextStep.icon}</div>
            <div className="challenge-info">
              <h4 className="challenge-title">Next Challenge</h4>
              <h3 className="challenge-name">{nextStep.title}</h3>
            </div>
            <div className="challenge-points">
              <Star className="w-4 h-4" />
              {nextStep.points}
            </div>
          </div>
          <p className="challenge-description">{nextStep.description}</p>
          {nextStep.action && (
            <div className="challenge-action">
              <strong>Action:</strong> {nextStep.action}
            </div>
          )}
        </div>
      )}

      {/* All Steps Overview */}
      <div className="steps-overview">
        <h4 className="steps-title">All Challenges</h4>
        <div className="steps-grid">
          {guideSteps.map((step) => (
            <div 
              key={step.id} 
              className={`step-card ${step.completed ? 'completed' : ''} ${nextStep?.id === step.id ? 'current' : ''}`}
            >
              <div className="step-header">
                <div className="step-icon">
                  {step.completed ? <CheckCircle className="w-5 h-5 text-green-400" /> : step.icon}
                </div>
                <div className="step-points">
                  <Star className="w-3 h-3" />
                  {step.points}
                </div>
              </div>
              <h5 className="step-title">{step.title}</h5>
              <p className="step-description">{step.description}</p>
              {step.completed && (
                <div className="step-completed-badge">
                  <CheckCircle className="w-4 h-4" />
                  Completed!
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Completion Celebration */}
      {completedCount === guideSteps.length && (
        <div className="completion-celebration">
          <div className="completion-content">
            <div className="completion-emoji">🏆</div>
            <h3 className="completion-title">Congratulations!</h3>
            <p className="completion-message">
              You've mastered the Stackk Wallet! You're now ready to explore the world of Solana DeFi.
            </p>
            <div className="completion-stats">
              <div className="final-points">Total Points: {totalPoints}</div>
              <div className="completion-badge">🎖️ Wallet Master</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gamified-guide {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1));
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(139, 92, 246, 0.2);
          backdrop-filter: blur(10px);
          margin-bottom: 2rem;
          position: relative;
        }

        .celebration-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }

        .celebration-content {
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          color: white;
          animation: celebrationBounce 0.6s ease-out;
        }

        .celebration-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: spin 1s ease-in-out;
        }

        .celebration-text {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .celebration-points {
          font-size: 1.2rem;
          font-weight: 600;
          opacity: 0.9;
        }

        .guide-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .guide-title-section {
          flex: 1;
        }

        .guide-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f3f4f6;
          margin-bottom: 0.5rem;
        }

        .guide-subtitle {
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .guide-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
          background: rgba(139, 92, 246, 0.2);
          padding: 0.75rem;
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #8B5CF6;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          font-weight: 600;
        }

        .progress-container {
          margin-bottom: 1.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8B5CF6, #06B6D4);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .progress-text {
          text-align: center;
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 600;
        }

        .current-challenge {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
          border: 2px solid rgba(139, 92, 246, 0.4);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .challenge-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .challenge-icon {
          color: #8B5CF6;
          background: rgba(139, 92, 246, 0.2);
          padding: 0.75rem;
          border-radius: 12px;
        }

        .challenge-info {
          flex: 1;
        }

        .challenge-title {
          font-size: 0.875rem;
          color: #9ca3af;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .challenge-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f3f4f6;
        }

        .challenge-points {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #fbbf24;
          font-weight: 700;
          background: rgba(251, 191, 36, 0.2);
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
        }

        .challenge-description {
          color: #d1d5db;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .challenge-action {
          color: #06b6d4;
          font-size: 0.875rem;
          background: rgba(6, 182, 212, 0.1);
          padding: 0.75rem;
          border-radius: 8px;
          border-left: 3px solid #06b6d4;
        }

        .steps-overview {
          margin-top: 1.5rem;
        }

        .steps-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f3f4f6;
          margin-bottom: 1rem;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .step-card {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s ease;
          position: relative;
        }

        .step-card.completed {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .step-card.current {
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }

        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .step-icon {
          color: #8B5CF6;
        }

        .step-card.completed .step-icon {
          color: #10b981;
        }

        .step-points {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #fbbf24;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .step-title {
          font-size: 1rem;
          font-weight: 600;
          color: #f3f4f6;
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: #9ca3af;
          font-size: 0.875rem;
          line-height: 1.4;
          margin-bottom: 0.75rem;
        }

        .step-completed-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .completion-celebration {
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          color: white;
          margin-top: 1.5rem;
          animation: completionGlow 2s ease-in-out infinite;
        }

        .completion-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 2s ease-in-out infinite;
        }

        .completion-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .completion-message {
          font-size: 1rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }

        .completion-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          align-items: center;
        }

        .final-points {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .completion-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes celebrationBounce {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
        }

        @keyframes completionGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 50px rgba(16, 185, 129, 0.6); }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default GamifiedGuide;