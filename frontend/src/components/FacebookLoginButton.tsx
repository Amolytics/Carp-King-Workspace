import React from 'react';

const FACEBOOK_APP_ID = '25718218787871928'; // Replace with your actual App ID

export const FacebookLoginButton: React.FC = () => {
  const handleLogin = () => {
    // Redirect to Facebook OAuth dialog
    const redirectUri = window.location.origin + '/';
    const url = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile,pages_manage_posts,pages_read_engagement,read_insights&response_type=token`;
    window.location.href = url;
  };

  return (
    <button
      type="button"
      style={{
        padding: '12px 32px',
        borderRadius: 6,
        background: '#4267B2',
        color: '#fff',
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
      onClick={handleLogin}
    >
      Login with Facebook
    </button>
  );
};

export default FacebookLoginButton;
