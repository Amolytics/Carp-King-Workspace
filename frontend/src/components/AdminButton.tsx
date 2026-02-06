import React from 'react';
import { useAuth } from './AuthContext';

const AdminButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return null;
  return (
    <button
      onClick={onClick}
      style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, fontSize: 14, borderRadius: 8, padding: '8px 16px', border: 'none', boxShadow: '0 1px 4px #0004', cursor: 'pointer', marginBottom: 8 }}
    >Admin</button>
  );
};

export default AdminButton;
