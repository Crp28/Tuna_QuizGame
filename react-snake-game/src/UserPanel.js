import React, { useState } from 'react';
import './UserPanel.css';
import AdminPanel from './AdminPanel';

/**
 * UserPanel component
 * Shows user info, logout button, and admin panel toggle
 */
function UserPanel({ user, onLogout, onQuestionBankChange, translations }) {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const t = translations || {
    logout: 'Logout',
    adminPanel: 'Admin Panel',
    loggingOut: 'Logging out...'
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        onLogout();
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleAdminPanelClose = () => {
    setShowAdminPanel(false);
    // Optionally refresh question banks when admin panel closes
    if (onQuestionBankChange) {
      // Trigger a refresh by passing null and letting parent reload
      onQuestionBankChange(null);
    }
  };

  return (
    <>
      <div className="user-panel">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-type">
              {user.accountType === 'admin' ? '👑 Admin' : '🎓 Student'}
            </div>
          </div>
        </div>
        
        <div className="user-actions">
          {user.accountType === 'admin' && (
            <button 
              className="admin-button"
              onClick={() => setShowAdminPanel(true)}
            >
              ⚙️ {t.adminPanel}
            </button>
          )}
          
          <button 
            className="logout-button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            🚪 {isLoggingOut ? t.loggingOut : t.logout}
          </button>
        </div>
      </div>

      {showAdminPanel && user.accountType === 'admin' && (
        <AdminPanel 
          onClose={handleAdminPanelClose}
          translations={translations}
        />
      )}
    </>
  );
}

export default UserPanel;
