import React, { useState } from 'react';

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Falsches Passwort');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-mark">T</div>
          <h1>TYRN.ON</h1>
          <p className="login-subtitle">Brand Engine</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Team-Passwort"
            autoFocus
          />
          <button type="submit" className="btn-primary">Einloggen</button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
