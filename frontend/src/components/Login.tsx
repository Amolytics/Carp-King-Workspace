
import React, { useState } from 'react';
import { login as apiLogin, signup as apiSignup } from '../api';
import { useAuth } from './AuthContext';
import FacebookLoginButton from './FacebookLoginButton';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [chatUsername, setChatUsername] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let user;
      if (isSignup) {
        user = await apiSignup(name, password, chatUsername);
      } else {
        user = await apiLogin(name, password);
      }
      login(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'none',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <video className="login-bg-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src="/underwater.mp4" type="video/mp4" />
      </video>
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'rgba(30,32,24,0.98)',
          position: 'relative',
          zIndex: 2,
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 6px 32px #000a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 340,
          maxWidth: 380,
          width: '100%',
          border: '1.5px solid #ffe06644',
        }}
      >
        <h2 style={{
          color: '#ffe066',
          marginBottom: 28,
          textShadow: '1px 1px 12px #222',
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 1.5,
        }}>{isSignup ? 'Sign Up' : 'Login'}</h2>

        <label style={{ color: '#ffe066', alignSelf: 'flex-start', marginBottom: 4, fontWeight: 600 }}>Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{
            marginBottom: 18,
            padding: 10,
            borderRadius: 6,
            border: '1.5px solid #ffe06699',
            width: '100%',
            fontSize: 16,
            background: '#23241a',
            color: '#ffe066',
            outline: 'none',
          }}
        />

        <label style={{ color: '#ffe066', alignSelf: 'flex-start', marginBottom: 4, fontWeight: 600 }}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            marginBottom: 18,
            padding: 10,
            borderRadius: 6,
            border: '1.5px solid #ffe06699',
            width: '100%',
            fontSize: 16,
            background: '#23241a',
            color: '#ffe066',
            outline: 'none',
          }}
        />

        {isSignup && (
          <>
            <label style={{ color: '#ffe066', alignSelf: 'flex-start', marginBottom: 4, fontWeight: 600 }}>Chat Username</label>
            <input
              type="text"
              placeholder="Choose a chat username"
              value={chatUsername}
              onChange={e => setChatUsername(e.target.value)}
              required
              style={{
                marginBottom: 18,
                padding: 10,
                borderRadius: 6,
                border: '1.5px solid #ffe06699',
                width: '100%',
                fontSize: 16,
                background: '#23241a',
                color: '#ffe066',
                outline: 'none',
              }}
            />
          </>
        )}

        <div style={{
          marginBottom: 18,
          color: '#ffe066',
          fontSize: 14,
          textAlign: 'center',
          background: 'rgba(40,40,20,0.7)',
          borderRadius: 6,
          padding: '8px 12px',
          width: '100%',
        }}>
          {isSignup ? (
            <>
              All new members are <b>editors</b>.<br />
              If your name is <b>craig needham</b>, you will be admin.<br />
              Please choose a password and chat username.
            </>
          ) : (
            <>Sign in with your name and password.</>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 32px',
            borderRadius: 6,
            background: '#ffe066',
            color: '#23241a',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0004',
            marginBottom: 10,
            fontSize: 18,
            letterSpacing: 1,
            width: '100%',
            transition: 'background 0.2s',
          }}
        >
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
        <FacebookLoginButton />
        <button
          type="button"
          onClick={() => setIsSignup(s => !s)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffe066',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 15,
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          {isSignup ? 'Already have an account? Login' : 'New here? Sign Up'}
        </button>
        {error && <div style={{ color: '#ff4d4f', marginTop: 14, fontWeight: 700 }}>{error}</div>}
      </form>
    </div>
  );
};

export default Login;
