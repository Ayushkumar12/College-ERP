import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: '#667eea' }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '10px 0', color: '#333' }}>Page Not Found</h2>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/dashboard" 
        style={{
          padding: '12px 24px',
          backgroundColor: '#667eea',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          transition: 'all 0.3s ease'
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;