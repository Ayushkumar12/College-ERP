import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to College ERP System</h1>
      <p>Hello, {user?.firstName} {user?.lastName}</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout} style={{ 
        padding: '10px 20px', 
        backgroundColor: '#dc3545', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px',
        cursor: 'pointer'
      }}>
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;