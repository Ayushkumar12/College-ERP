import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CoursesPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Courses</h1>
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2>Course Management</h2>
        <p>Role: {user?.role}</p>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
          Course management functionality will be implemented here.
          {user?.role === 'student' && ' Students can view enrolled courses and course details.'}
          {user?.role === 'faculty' && ' Faculty can manage their assigned courses and view enrolled students.'}
          {user?.role === 'admin' && ' Admins can create, edit, and manage all courses.'}
        </p>
      </div>
    </div>
  );
};

export default CoursesPage;