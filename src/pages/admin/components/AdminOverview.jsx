import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminOverview = ({ stats }) => {
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    setLoading(true);
    try {
      // This would be a real API call in production
      // For now, we'll simulate some recent activities
      const activities = [
        {
          id: 1,
          type: 'user_created',
          message: 'New student John Doe registered',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          icon: '👤'
        },
        {
          id: 2,
          type: 'course_created',
          message: 'Course "Advanced Mathematics" was created',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          icon: '📚'
        },
        {
          id: 3,
          type: 'attendance_marked',
          message: '45 students marked attendance today',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          icon: '✅'
        },
        {
          id: 4,
          type: 'grade_submitted',
          message: 'Grades submitted for Physics 101',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          icon: '📊'
        }
      ];
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const getAttendancePercentage = () => {
    if (!stats?.attendanceToday) return 0;
    const { present, total } = stats.attendanceToday;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  return (
    <div className="admin-overview">
      <div className="overview-header">
        <h2>📊 Dashboard Overview</h2>
        <p>Welcome to your admin dashboard. Here's what's happening today.</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
            <div className="stat-trend">
              <span className="trend-up">+{stats.newUsersThisMonth} this month</span>
            </div>
          </div>
          
          <div className="stat-card">
            <h3>{stats.totalFaculty}</h3>
            <p>Faculty Members</p>
            <div className="stat-trend">
              <span className="trend-neutral">Active faculty</span>
            </div>
          </div>
          
          <div className="stat-card">
            <h3>{stats.totalCourses}</h3>
            <p>Total Courses</p>
            <div className="stat-trend">
              <span className="trend-neutral">Available courses</span>
            </div>
          </div>
          
          <div className="stat-card">
            <h3>{getAttendancePercentage()}%</h3>
            <p>Today's Attendance</p>
            <div className="stat-trend">
              <span className="trend-info">
                {stats.attendanceToday?.present || 0} of {stats.attendanceToday?.total || 0} present
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="overview-content">
        {/* Department Distribution */}
        {stats?.departmentDistribution && (
          <div className="admin-card">
            <h3>📈 Department Distribution</h3>
            <div className="department-stats">
              {Object.entries(stats.departmentDistribution).map(([dept, count]) => (
                <div key={dept} className="department-item">
                  <div className="department-info">
                    <span className="department-name">{dept}</span>
                    <span className="department-count">{count} students</span>
                  </div>
                  <div className="department-bar">
                    <div 
                      className="department-fill"
                      style={{ 
                        width: `${(count / stats.totalStudents) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="admin-card">
          <h3>🕒 Recent Activities</h3>
          {loading ? (
            <div className="loading-activities">
              <div className="loading-spinner"></div>
              <p>Loading activities...</p>
            </div>
          ) : (
            <div className="activities-list">
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="admin-card">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions">
            <button className="btn btn-primary">
              <span>👤</span>
              Add New User
            </button>
            <button className="btn btn-success">
              <span>📚</span>
              Create Course
            </button>
            <button className="btn btn-warning">
              <span>📊</span>
              Generate Report
            </button>
            <button className="btn btn-secondary">
              <span>⚙️</span>
              System Settings
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="admin-card">
          <h3>🔧 System Status</h3>
          <div className="system-status">
            <div className="status-item">
              <div className="status-indicator status-online"></div>
              <span>Database Connection</span>
              <span className="status-text">Online</span>
            </div>
            <div className="status-item">
              <div className="status-indicator status-online"></div>
              <span>Authentication Service</span>
              <span className="status-text">Online</span>
            </div>
            <div className="status-item">
              <div className="status-indicator status-online"></div>
              <span>File Storage</span>
              <span className="status-text">Online</span>
            </div>
            <div className="status-item">
              <div className="status-indicator status-warning"></div>
              <span>Email Service</span>
              <span className="status-text">Limited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;