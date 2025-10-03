import React from 'react';

const LanguageSwitcher = ({ currentLanguage, onLanguageChange, translations }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'rgba(40,62,81,0.9)',
      padding: '10px 16px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      color: '#fff',
      fontWeight: '600',
      fontSize: '1rem',
    }}>
      <label 
        htmlFor="language-select"
        style={{ 
          color: '#ffe082',
          userSelect: 'none',
          cursor: 'default'
        }}
      >
        {translations.languageLabel}
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '2px solid #81ff81',
          background: '#1a232f',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <option value="en">{translations.languageEnglish}</option>
        <option value="mi">{translations.languageMaori}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
