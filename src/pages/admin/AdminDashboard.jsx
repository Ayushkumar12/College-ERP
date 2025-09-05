import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Import admin components
import AdminOverview from './components/AdminOverview';
import UserManagement from './components/UserManagement';
import CourseManagement from './components/CourseManagement';
import ReportsManagement from './components/ReportsManagement';
import SystemSettings from './components/SystemSettings';
import BulkOperations from './components/BulkOperations';

import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname.split('/').pop();
    if (path && path !== 'admin') {
      setActiveTab(path);
    } else {
      setActiveTab('overview');
    }
  }, [location]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab, path) => {
    setActiveTab(tab);
    navigate(`/admin/${path}`);
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊', path: '' },
    { id: 'users', label: 'User Management', icon: '👥', path: 'users' },
    { id: 'courses', label: 'Course Management', icon: '📚', path: 'courses' },
    { id: 'reports', label: 'Reports', icon: '📈', path: 'reports' },
    { id: 'bulk', label: 'Bulk Operations', icon: '⚡', path: 'bulk' },
    { id: 'settings', label: 'System Settings', icon: '⚙️', path: 'settings' }
  ];

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>🎓 Admin Dashboard</h1>
            <p>Welcome, {user.firstName} {user.lastName}</p>
          </div>
          <div className="admin-header-actions">
            <div className="admin-stats-summary">
              {dashboardStats && (
                <>
                  <div className="stat-item">
                    <span className="stat-number">{dashboardStats.totalStudents}</span>
                    <span className="stat-label">Students</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{dashboardStats.totalFaculty}</span>
                    <span className="stat-label">Faculty</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{dashboardStats.totalCourses}</span>
                    <span className="stat-label">Courses</span>
                  </div>
                </>
              )}
            </div>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* Sidebar Navigation */}
        <nav className="admin-sidebar">
          <div className="admin-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleTabClick(item.id, item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="admin-main">
          <Routes>
            <Route path="/" element={<AdminOverview stats={dashboardStats} />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/courses" element={<CourseManagement />} />
            <Route path="/reports" element={<ReportsManagement />} />
            <Route path="/bulk" element={<BulkOperations />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;