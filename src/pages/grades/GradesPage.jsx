import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const GradesPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Grades</h1>
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2>Grade Management</h2>
        <p>Role: {user?.role}</p>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
          Grade management functionality will be implemented here.
          {user?.role === 'student' && ' Students can view their grades and academic progress.'}
          {user?.role === 'faculty' && ' Faculty can enter and manage grades for their courses.'}
          {user?.role === 'admin' && ' Admins can view all grades and generate academic reports.'}
        </p>
      </div>
    </div>
  );
};

export default GradesPage;