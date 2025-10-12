import React, { useState, useEffect } from 'react';
import './QuestionBankSelector.css';

/**
 * QuestionBankSelector component
 * Allows users to select which question bank to use for the game
 */
function QuestionBankSelector({ currentBank, onBankChange, translations }) {
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const t = translations || {
    selectBank: 'Select Question Bank',
    loading: 'Loading...'
  };

  useEffect(() => {
    loadQuestionBanks();
  }, []);

  const loadQuestionBanks = async () => {
    try {
      const response = await fetch('/api/question-banks', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load question banks');
      }

      const data = await response.json();
      setBanks(data);
    } catch (error) {
      console.error('Error loading question banks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankSelect = (bank) => {
    onBankChange(bank);
    setIsOpen(false);
  };

  const currentBankInfo = banks.find(b => b.folder === currentBank);

  return (
    <div className="question-bank-selector">
      <button 
        className="bank-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <span className="bank-icon">📚</span>
        <span className="bank-name">
          {isLoading ? t.loading : (currentBankInfo?.name || currentBank || t.selectBank)}
        </span>
        <span className={`bank-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && !isLoading && (
        <div className="bank-dropdown">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className={`bank-option ${bank.folder === currentBank ? 'active' : ''}`}
              onClick={() => handleBankSelect(bank)}
            >
              <div className="bank-option-name">{bank.name}</div>
              <div className="bank-option-info">
                {bank.folder} • {bank.question_count} questions
              </div>
              {bank.description && (
                <div className="bank-option-description">{bank.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuestionBankSelector;
