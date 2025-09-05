import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AttendancePage = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Attendance Management</h1>
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2>Attendance Records</h2>
        <p>Role: {user?.role}</p>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
          Attendance management functionality will be implemented here.
          {user?.role === 'student' && ' Students can scan QR codes to mark attendance.'}
          {user?.role === 'faculty' && ' Faculty can generate QR codes and view attendance reports.'}
          {user?.role === 'admin' && ' Admins can view all attendance records and generate reports.'}
        </p>
      </div>
    </div>
  );
};

export default AttendancePage;