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
  const [bankToDelete, setBankToDelete] = useState(null); // Track bank being deleted

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

  // Bulk upload form
  const [bulkUploadBank, setBulkUploadBank] = useState('');
  const [bulkJsonText, setBulkJsonText] = useState('');

  const t = translations;

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

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!bulkUploadBank) {
      setError('Please select a question bank');
      return;
    }

    if (!bulkJsonText.trim()) {
      setError('Please paste JSON or upload a file');
      return;
    }

    setIsLoading(true);

    try {
      // Parse and validate JSON
      let questions;
      try {
        questions = JSON.parse(bulkJsonText);
      } catch (parseError) {
        throw new Error(t.bulkUploadInvalidJson + ': ' + parseError.message);
      }

      // Validate it's an array
      if (!Array.isArray(questions)) {
        throw new Error('JSON must be an array of questions');
      }

      if (questions.length === 0) {
        throw new Error('No questions found in JSON');
      }

      // Validate each question structure
      const invalidQuestions = [];
      questions.forEach((q, index) => {
        if (!q.question || !q.options || !q.answer) {
          invalidQuestions.push(`Question ${index + 1}: missing required fields (question, options, answer)`);
        } else if (!Array.isArray(q.options) || q.options.length !== 4) {
          invalidQuestions.push(`Question ${index + 1}: must have exactly 4 options`);
        } else if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
          invalidQuestions.push(`Question ${index + 1}: answer must be A, B, C, or D`);
        }
      });

      if (invalidQuestions.length > 0) {
        throw new Error('Validation errors:\n' + invalidQuestions.join('\n'));
      }

      // Upload questions
      const response = await fetch(`/api/question-banks/${bulkUploadBank}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questions })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload questions');
      }

      setSuccess(`${t.bulkUploadSuccess} ${data.addedCount} question(s)! Total in bank: ${data.totalCount}`);
      setBulkJsonText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkJsonText(event.target.result);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleDeleteBank = async (folder) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/question-banks/${folder}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete question bank');
      }

      setSuccess(t.deleteBankSuccess);
      setBankToDelete(null);
      
      // Reload the page after successful deletion
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.message);
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
          <button
            className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('bulk');
              setError('');
              setSuccess('');
            }}
          >
            {t.bulkUploadTab}
          </button>
          <button
            className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('manage');
              setError('');
              setSuccess('');
            }}
          >
            {t.manageBanksTab}
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
          ) : activeTab === 'add' ? (
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
          ) : activeTab === 'bulk' ? (
            <form className="admin-form" onSubmit={handleBulkUpload}>
              <div className="form-group">
                <label htmlFor="bulk-bank-select">{t.selectBank}</label>
                <select
                  id="bulk-bank-select"
                  value={bulkUploadBank}
                  onChange={(e) => setBulkUploadBank(e.target.value)}
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
                <label htmlFor="bulk-json">{t.bulkJsonLabel}</label>
                <textarea
                  id="bulk-json"
                  rows="12"
                  value={bulkJsonText}
                  onChange={(e) => setBulkJsonText(e.target.value)}
                  placeholder={t.bulkJsonPlaceholder}
                  disabled={isLoading}
                  required
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
                <div className="helper-text">
                  Expected format: [{'{'}"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"{'}'},...]
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bulk-file">{t.bulkFileUpload}</label>
                <input
                  id="bulk-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  style={{
                    padding: '8px',
                    background: '#16213e',
                    border: '2px solid #2a3f5f',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? t.loading : t.bulkUploadButton}
              </button>
            </form>
          ) : activeTab === 'manage' ? (
            <div className="manage-banks-section">
              <h3 style={{ color: '#ffe082', marginBottom: '20px' }}>{t.manageBanksTitle}</h3>
              
              {banks.length === 0 ? (
                <div style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>
                  {t.noBanksAvailable}
                </div>
              ) : (
                <div className="banks-list">
                  {banks.map((bank) => (
                    <div key={bank.id} className="bank-row">
                      <div className="bank-info">
                        <div className="bank-name">{bank.name}</div>
                        <div className="bank-details">
                          <span className="bank-folder">{bank.folder}</span>
                          {bank.description && (
                            <span className="bank-description"> - {bank.description}</span>
                          )}
                        </div>
                        <div className="bank-meta">
                          {t.questionCount}: {bank.question_count || 0}
                        </div>
                      </div>
                      <button
                        className="delete-bank-button"
                        onClick={() => setBankToDelete(bank)}
                        disabled={isLoading}
                        title={t.deleteBank}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Delete Confirmation Modal */}
        {bankToDelete && (
          <div className="confirm-modal-overlay" onClick={() => setBankToDelete(null)}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{t.confirmDeleteTitle}</h3>
              <p>{t.confirmDeleteMessage}</p>
              <div className="bank-to-delete">
                <strong>{bankToDelete.name}</strong> ({bankToDelete.folder})
              </div>
              <div className="confirm-modal-buttons">
                <button
                  className="confirm-delete-button"
                  onClick={() => handleDeleteBank(bankToDelete.folder)}
                  disabled={isLoading}
                >
                  {isLoading ? t.loading : t.confirmDeleteButton}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setBankToDelete(null)}
                  disabled={isLoading}
                >
                  {t.cancelButton}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
