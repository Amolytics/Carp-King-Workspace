import React from 'react';
import { useAuth } from './AuthContext';

const LogoutButton: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { logout } = useAuth();
  return (
    <button
      onClick={() => {
        logout();
        localStorage.removeItem('ck.page');
        onNavigate('welcome');
      }}
      style={{ marginTop: 12, background: '#c00', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 8, padding: '8px 16px', border: 'none', boxShadow: '0 1px 4px #0004', cursor: 'pointer' }}
    >Logout</button>
  );
};

export default LogoutButton;