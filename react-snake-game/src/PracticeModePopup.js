import React, { useState } from 'react';
import './PracticeModePopup.css';

/**
 * PracticeModePopup component
 * Shown to struggling players offering a practice mode
 */
function PracticeModePopup({ onAccept, onDecline, translations }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const t = translations || {
    practiceModeTitle: "Practice Mode Available",
    practiceModeMessage1: "We noticed you're having some challenges! 🎮",
    practiceModeMessage2: "Would you like to try Practice Mode?",
    practiceModeFeatures: "In Practice Mode:",
    practiceFeatureSlower: "🐢 The snake moves slower, giving you more time to react",
    practiceFeatureNoScore: "📊 Your scores won't be recorded on the leaderboard",
    practiceFeatureNoUnlock: "🔒 Levels won't unlock, but you can practice and improve",
    practiceModeAccept: "Try Practice Mode",
    practiceModeDecline: "Continue Normal Mode",
    practiceDontShowAgain: "Don't show this again",
  };

  const handleAccept = () => {
    onAccept(dontShowAgain);
  };

  const handleDecline = () => {
    onDecline(dontShowAgain);
  };

  return (
    <div className="practice-mode-overlay" onClick={handleDecline}>
      <div className="practice-mode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="practice-mode-header">
          <h2>🎯 {t.practiceModeTitle}</h2>
        </div>
        
        <div className="practice-mode-content">
          <p className="practice-message">{t.practiceModeMessage1}</p>
          <p className="practice-message">{t.practiceModeMessage2}</p>
          
          <div className="practice-features">
            <h3>{t.practiceModeFeatures}</h3>
            <ul>
              <li>{t.practiceFeatureSlower}</li>
              <li>{t.practiceFeatureNoScore}</li>
              <li>{t.practiceFeatureNoUnlock}</li>
            </ul>
          </div>
          
          <div className="practice-checkbox">
            <label>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span>{t.practiceDontShowAgain}</span>
            </label>
          </div>

          <div className="practice-mode-actions">
            <button className="practice-button accept" onClick={handleAccept}>
              {t.practiceModeAccept}
            </button>
            <button className="practice-button decline" onClick={handleDecline}>
              {t.practiceModeDecline}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticeModePopup;
