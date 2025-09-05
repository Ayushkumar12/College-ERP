import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentsAPI, attendanceAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import QRScanner from '../../components/attendance/QRScanner';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    recentAttendance: [],
    grades: [],
    attendanceStats: null
  });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, attendanceRes, gradesRes, statsRes] = await Promise.all([
        studentsAPI.getCourses(user.uid),
        studentsAPI.getAttendance(user.uid, { limit: 5 }),
        studentsAPI.getGrades(user.uid),
        attendanceAPI.getStatistics({ studentId: user.uid })
      ]);

      setDashboardData({
        courses: coursesRes.data.courses || [],
        recentAttendance: attendanceRes.data.attendance || [],
        grades: gradesRes.data.grades || [],
        attendanceStats: statsRes.data.statistics || null
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrData) => {
    try {
      const result = await attendanceAPI.markAttendance({ qrData });
      if (result.data) {
        alert('Attendance marked successfully!');
        setShowQRScanner(false);
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to mark attendance';
      alert(errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>Welcome, {user.firstName} {user.lastName}</h1>
            <p className="user-role">Student Dashboard</p>
          </div>
          <div className="header-actions">
            <button 
              className="qr-scan-btn"
              onClick={() => setShowQRScanner(true)}
            >
              📱 Scan QR for Attendance
            </button>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <main className="dashboard-main">
        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <h3>{dashboardData.courses.length}</h3>
                <p>Enrolled Courses</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{dashboardData.attendanceStats?.attendancePercentage || 0}%</h3>
                <p>Attendance Rate</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-content">
                <h3>{dashboardData.grades.length}</h3>
                <p>Graded Courses</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{dashboardData.grades.reduce((sum, g) => sum + (g.credits || 0), 0)}</h3>
                <p>Total Credits</p>
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-grid">
          {/* Enrolled Courses */}
          <section className="dashboard-card">
            <div className="card-header">
              <h2>📚 My Courses</h2>
              <a href="/courses" className="view-all-link">View All</a>
            </div>
            <div className="card-content">
              {dashboardData.courses.length > 0 ? (
                <div className="courses-list">
                  {dashboardData.courses.slice(0, 4).map((course) => (
                    <div key={course.id} className="course-item">
                      <div className="course-info">
                        <h4>{course.courseName}</h4>
                        <p>{course.courseCode} • {course.credits} Credits</p>
                        <span className="course-department">{course.department}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No courses enrolled yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Attendance */}
          <section className="dashboard-card">
            <div className="card-header">
              <h2>📅 Recent Attendance</h2>
              <a href="/attendance" className="view-all-link">View All</a>
            </div>
            <div className="card-content">
              {dashboardData.recentAttendance.length > 0 ? (
                <div className="attendance-list">
                  {dashboardData.recentAttendance.map((record, index) => (
                    <div key={index} className="attendance-item">
                      <div className="attendance-info">
                        <h4>{record.sessionTitle}</h4>
                        <p>{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                      <div className={`attendance-status ${record.status}`}>
                        {record.status === 'present' ? '✅' : '❌'}
                        {record.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No attendance records yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Grades */}
          <section className="dashboard-card">
            <div className="card-header">
              <h2>🎓 Recent Grades</h2>
              <a href="/grades" className="view-all-link">View All</a>
            </div>
            <div className="card-content">
              {dashboardData.grades.length > 0 ? (
                <div className="grades-list">
                  {dashboardData.grades.slice(0, 4).map((grade, index) => (
                    <div key={index} className="grade-item">
                      <div className="grade-info">
                        <h4>{grade.courseDetails?.courseName || 'Course'}</h4>
                        <p>{grade.courseDetails?.courseCode} • {grade.credits} Credits</p>
                      </div>
                      <div className={`grade-value grade-${grade.grade?.toLowerCase()}`}>
                        {grade.grade}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No grades available yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="dashboard-card">
            <div className="card-header">
              <h2>⚡ Quick Actions</h2>
            </div>
            <div className="card-content">
              <div className="quick-actions">
                <button 
                  className="action-btn"
                  onClick={() => setShowQRScanner(true)}
                >
                  📱 Mark Attendance
                </button>
                <a href="/courses" className="action-btn">
                  📚 View Courses
                </a>
                <a href="/grades" className="action-btn">
                  🎓 Check Grades
                </a>
                <a href="/profile" className="action-btn">
                  👤 Edit Profile
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Scan QR Code for Attendance</h3>
              <button 
                className="close-btn"
                onClick={() => setShowQRScanner(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <QRScanner
                onScan={handleQRScan}
                onError={(error) => {
                  console.error('QR Scanner error:', error);
                  alert('QR Scanner error: ' + error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;