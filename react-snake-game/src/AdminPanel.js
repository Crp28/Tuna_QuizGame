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
  const [questionsText, setQuestionsText] = useState('');

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
    questionsPlaceholder: 'Paste questions in JSON format...',
    addQuestionsButton: 'Add Questions',
    loading: 'Loading...',
    bankName: 'Bank Name'
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

    if (!questionsText.trim()) {
      setError('Please enter questions');
      return;
    }

    setIsLoading(true);

    try {
      // Parse questions JSON
      const questions = JSON.parse(questionsText);

      if (!Array.isArray(questions)) {
        throw new Error('Questions must be an array');
      }

      const response = await fetch(`/api/question-banks/${selectedBank}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questions })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add questions');
      }

      setSuccess(`Successfully added ${data.addedCount} questions!`);
      setQuestionsText('');
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
                <label htmlFor="questions-text">Questions (JSON)</label>
                <textarea
                  id="questions-text"
                  rows="15"
                  value={questionsText}
                  onChange={(e) => setQuestionsText(e.target.value)}
                  placeholder={t.questionsPlaceholder}
                  disabled={isLoading}
                  required
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <div className="helper-text">
                  Format: [{"{"}"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"{"}"}]
                </div>
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? t.loading : t.addQuestionsButton}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
