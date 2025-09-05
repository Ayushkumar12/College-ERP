import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { facultyAPI, attendanceAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import QRCode from 'react-qr-code';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    students: [],
    sessions: []
  });
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrForm, setQrForm] = useState({
    courseId: '',
    sessionTitle: '',
    duration: 30,
    location: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, studentsRes, sessionsRes] = await Promise.all([
        facultyAPI.getCourses(user.uid),
        facultyAPI.getStudents(user.uid),
        attendanceAPI.getSessions()
      ]);

      setDashboardData({
        courses: coursesRes.data.courses || [],
        students: studentsRes.data.students || [],
        sessions: sessionsRes.data.sessions || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    try {
      const response = await attendanceAPI.generateQR(qrForm);
      setQrData(response.data);
      setShowQRGenerator(false);
    } catch (error) {
      alert('Error generating QR code: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading faculty dashboard..." />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1>Faculty Dashboard</h1>
          <p>Welcome, {user.firstName} {user.lastName}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowQRGenerator(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Generate QR Code
          </button>
          <button 
            onClick={logout}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* My Courses */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h2>📚 My Courses ({dashboardData.courses.length})</h2>
          {dashboardData.courses.length > 0 ? (
            <div>
              {dashboardData.courses.slice(0, 5).map((course) => (
                <div key={course.id} style={{ 
                  padding: '10px', 
                  margin: '10px 0', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '5px' 
                }}>
                  <strong>{course.courseName}</strong>
                  <br />
                  <small>{course.courseCode} • {course.credits} Credits</small>
                </div>
              ))}
            </div>
          ) : (
            <p>No courses assigned yet</p>
          )}
        </div>

        {/* Active Sessions */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h2>📱 Active Sessions ({dashboardData.sessions.filter(s => s.isActive).length})</h2>
          {dashboardData.sessions.filter(s => s.isActive).length > 0 ? (
            <div>
              {dashboardData.sessions.filter(s => s.isActive).slice(0, 3).map((session) => (
                <div key={session.id} style={{ 
                  padding: '10px', 
                  margin: '10px 0', 
                  backgroundColor: '#d4edda', 
                  borderRadius: '5px',
                  border: '1px solid #c3e6cb'
                }}>
                  <strong>{session.sessionTitle}</strong>
                  <br />
                  <small>Attendance: {session.attendanceCount} students</small>
                  <br />
                  <small>Expires: {new Date(session.expiresAt).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>No active attendance sessions</p>
          )}
        </div>

        {/* Students */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h2>👥 My Students ({dashboardData.students.length})</h2>
          {dashboardData.students.length > 0 ? (
            <div>
              {dashboardData.students.slice(0, 5).map((student, index) => (
                <div key={index} style={{ 
                  padding: '10px', 
                  margin: '10px 0', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '5px' 
                }}>
                  <strong>{student.studentName}</strong>
                  <br />
                  <small>{student.courseName}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>No students enrolled in your courses</p>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {qrData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>Attendance QR Code</h3>
            <p><strong>{qrData.session.sessionTitle}</strong></p>
            <p>Duration: {qrData.session.duration} minutes</p>
            <div style={{ margin: '20px 0' }}>
              <QRCode value={qrData.qrData} size={256} />
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Students can scan this QR code to mark their attendance
            </p>
            <button 
              onClick={() => setQrData(null)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QR Generator Modal */}
      {showQRGenerator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>Generate Attendance QR Code</h3>
            <form onSubmit={handleGenerateQR}>
              <div style={{ marginBottom: '15px' }}>
                <label>Course:</label>
                <select 
                  value={qrForm.courseId}
                  onChange={(e) => setQrForm({...qrForm, courseId: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">Select Course</option>
                  {dashboardData.courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.courseName} ({course.courseCode})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Session Title:</label>
                <input 
                  type="text"
                  value={qrForm.sessionTitle}
                  onChange={(e) => setQrForm({...qrForm, sessionTitle: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  placeholder="e.g., Lecture 1, Lab Session"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Duration (minutes):</label>
                <input 
                  type="number"
                  value={qrForm.duration}
                  onChange={(e) => setQrForm({...qrForm, duration: parseInt(e.target.value)})}
                  min="5"
                  max="180"
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Location (optional):</label>
                <input 
                  type="text"
                  value={qrForm.location}
                  onChange={(e) => setQrForm({...qrForm, location: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  placeholder="e.g., Room 101, Lab A"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Generate QR Code
                </button>
                <button 
                  type="button"
                  onClick={() => setShowQRGenerator(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;