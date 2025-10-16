import React, { useState } from 'react';
import './LoginPage.css';

/**
 * LoginPage component
 * Handles both login and registration with tabbed interface
 */
function LoginPage({ onLoginSuccess, translations }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'student'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations || {
    loginTitle: 'Login',
    registerTitle: 'Register',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Full Name',
    email: 'Email',
    accountType: 'Account Type',
    student: 'Student',
    admin: 'Admin',
    loginButton: 'Login',
    registerButton: 'Register',
    switchToRegister: "Don't have an account? Register here",
    switchToLogin: 'Already have an account? Login here'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Call parent callback with user data
      onLoginSuccess(data.user);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    // if (registerForm.password !== registerForm.confirmPassword) {
    //   setError('Passwords do not match');
    //   return;
    // }

    // Validate password length
    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: registerForm.username,
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          accountType: registerForm.accountType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Call parent callback with user data
      onLoginSuccess(data.user);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="snake-icon">🌊</div>
          <h1>{t.loginGameTitle}</h1>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
          >
            {t.loginTitle}
          </button>
          <button
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
          >
            {t.registerTitle}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'login' ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-username">{t.username}</label>
              <input
                id="login-username"
                type="text"
                required
                maxLength={50}
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder={t.username}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">{t.password}</label>
              <input
                id="login-password"
                type="password"
                required
                minLength={6}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder={t.password}
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Loading...' : t.loginButton}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="register-username">{t.username}</label>
              <input
                id="register-username"
                type="text"
                required
                maxLength={50}
                pattern="[a-zA-Z0-9_]{3,50}"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                placeholder={t.username}
                disabled={isLoading}
                title="3-50 characters, letters, numbers, and underscores only"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-name">{t.name}</label>
              <input
                id="register-name"
                type="text"
                required
                maxLength={100}
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                placeholder={t.name}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">{t.email}</label>
              <input
                id="register-email"
                type="email"
                required
                maxLength={150}
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                placeholder={t.email}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">{t.password}</label>
              <input
                id="register-password"
                type="password"
                required
                minLength={6}
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                placeholder={t.password}
                disabled={isLoading}
              />
            </div>

            {/* <div className="form-group">
              <label htmlFor="register-confirm-password">{t.confirmPassword}</label>
              <input
                id="register-confirm-password"
                type="password"
                required
                minLength={6}
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                placeholder={t.confirmPassword}
                disabled={isLoading}
              />
            </div> */}

            <div className="form-group">
              <label htmlFor="register-account-type">{t.accountType}</label>
              <select
                id="register-account-type"
                value={registerForm.accountType}
                onChange={(e) => setRegisterForm({ ...registerForm, accountType: e.target.value })}
                disabled={isLoading}
              >
                <option value="student">{t.student}</option>
                <option value="admin">{t.admin}</option>
              </select>
            </div>

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Loading...' : t.registerButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
