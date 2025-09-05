import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Profile Page</h1>
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2>User Information</h2>
        <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Department:</strong> {user?.department || 'Not specified'}</p>
        {user?.rollNumber && <p><strong>Roll Number:</strong> {user.rollNumber}</p>}
        {user?.employeeId && <p><strong>Employee ID:</strong> {user.employeeId}</p>}
        <p style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
          Profile editing functionality will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;