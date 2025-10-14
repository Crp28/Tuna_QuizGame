import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

/**
 * AdminPanel component
 * Allows admins to create question banks and add questions
 */
function AdminPanel({ onClose, translations }) {
  const [activeTab, setActiveTab] = useState('create');
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create bank form
  const [createForm, setCreateForm] = useState({
    folder: '',
    name: '',
    description: ''
  });

  // Add questions form
  const [selectedBank, setSelectedBank] = useState('');
  const [questionForm, setQuestionForm] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    answer: 'A'
  });

  const t = translations || {
    adminPanelTitle: 'Admin Panel',
    createBankTab: 'Create Bank',
    addQuestionsTab: 'Add Questions',
    close: 'Close',
    folder: 'Folder ID',
    name: 'Bank Name',
    description: 'Description (optional)',
    createButton: 'Create Question Bank',
    selectBank: 'Select Bank',
    questionText: 'Question Text',
    optionA: 'Option A',
    optionB: 'Option B',
    optionC: 'Option C',
    optionD: 'Option D',
    correctAnswer: 'Correct Answer',
    addQuestionButton: 'Add Question',
    loading: 'Loading...',
    bankName: 'Bank Name',
    questionPlaceholder: 'Enter your question here...',
    optionPlaceholder: 'Enter option text...'
  };

  useEffect(() => {
    loadQuestionBanks();
  }, []);

  const loadQuestionBanks = async () => {
    try {
      const response = await fetch('/api/question-banks', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBanks(data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const handleCreateBank = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/question-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create question bank');
      }

      setSuccess('Question bank created successfully!');
      setCreateForm({ folder: '', name: '', description: '' });
      loadQuestionBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestions = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedBank) {
      setError('Please select a question bank');
      return;
    }

    // Validate all fields are filled
    if (!questionForm.question.trim() || 
        !questionForm.optionA.trim() || 
        !questionForm.optionB.trim() || 
        !questionForm.optionC.trim() || 
        !questionForm.optionD.trim()) {
      setError('Please fill in all question fields');
      return;
    }

    setIsLoading(true);

    try {
      // Create question object
      const question = {
        question: questionForm.question.trim(),
        options: [
          questionForm.optionA.trim(),
          questionForm.optionB.trim(),
          questionForm.optionC.trim(),
          questionForm.optionD.trim()
        ],
        answer: questionForm.answer
      };

      const response = await fetch(`/api/question-banks/${selectedBank}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questions: [question] })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add question');
      }

      setSuccess(`Successfully added question to the question bank!`);
      // Clear form
      setQuestionForm({
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        answer: 'A'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>⚙️ {t.adminPanelTitle}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="admin-panel-tabs">
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              setError('');
              setSuccess('');
            }}
          >
            {t.createBankTab}
          </button>
          <button
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('add');
              setError('');
              setSuccess('');
            }}
          >
            {t.addQuestionsTab}
          </button>
        </div>

        {error && <div className="message error-message">{error}</div>}
        {success && <div className="message success-message">{success}</div>}

        <div className="admin-panel-content">
          {activeTab === 'create' ? (
            <form className="admin-form" onSubmit={handleCreateBank}>
              <div className="form-group">
                <label htmlFor="folder">{t.folder}</label>
                <input
                  id="folder"
                  type="text"
                  required
                  pattern="[a-zA-Z0-9-]{3,100}"
                  value={createForm.folder}
                  onChange={(e) => setCreateForm({ ...createForm, folder: e.target.value })}
                  placeholder="e.g., comp705-03"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">{t.name}</label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={200}
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Database Systems"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">{t.description}</label>
                <textarea
                  id="description"
                  rows="3"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Brief description of the question bank..."
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? t.loading : t.createButton}
              </button>
            </form>
          ) : (
            <form className="admin-form" onSubmit={handleAddQuestions}>
              <div className="form-group">
                <label htmlFor="bank-select">{t.selectBank}</label>
                <select
                  id="bank-select"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  disabled={isLoading}
                  required
                >
                  <option value="">{t.selectBank}</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.folder}>
                      {bank.name} ({bank.folder})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="question-text">{t.questionText}</label>
                <textarea
                  id="question-text"
                  rows="3"
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  placeholder={t.questionPlaceholder}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="option-a">{t.optionA}</label>
                <input
                  id="option-a"
                  type="text"
                  value={questionForm.optionA}
                  onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                  placeholder={t.optionPlaceholder}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="option-b">{t.optionB}</label>
                <input
                  id="option-b"
                  type="text"
                  value={questionForm.optionB}
                  onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                  placeholder={t.optionPlaceholder}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="option-c">{t.optionC}</label>
                <input
                  id="option-c"
                  type="text"
                  value={questionForm.optionC}
                  onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                  placeholder={t.optionPlaceholder}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="option-d">{t.optionD}</label>
                <input
                  id="option-d"
                  type="text"
                  value={questionForm.optionD}
                  onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                  placeholder={t.optionPlaceholder}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="correct-answer">{t.correctAnswer}</label>
                <select
                  id="correct-answer"
                  value={questionForm.answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                  disabled={isLoading}
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? t.loading : t.addQuestionButton}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
