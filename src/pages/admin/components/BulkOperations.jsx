import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BulkOperations = () => {
  const [activeOperation, setActiveOperation] = useState('bulk-enroll');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Bulk Enrollment State
  const [enrollmentData, setEnrollmentData] = useState({
    selectedStudents: [],
    selectedCourse: '',
    csvData: ''
  });

  // Bulk Grade Update State
  const [gradeData, setGradeData] = useState({
    csvData: '',
    semester: 'Fall',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users?role=student&limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.users);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/courses?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleBulkEnrollment = async () => {
    if (!enrollmentData.selectedCourse) {
      alert('Please select a course');
      return;
    }

    let studentsToEnroll = [];

    if (enrollmentData.selectedStudents.length > 0) {
      // Use selected students
      studentsToEnroll = enrollmentData.selectedStudents.map(studentId => ({
        studentId,
        courseId: enrollmentData.selectedCourse
      }));
    } else if (enrollmentData.csvData.trim()) {
      // Parse CSV data
      const lines = enrollmentData.csvData.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const studentIdIndex = headers.findIndex(h => h.includes('student') && h.includes('id'));
      
      if (studentIdIndex === -1) {
        alert('CSV must contain a "Student ID" column');
        return;
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const studentId = values[studentIdIndex];
        
        if (studentId) {
          studentsToEnroll.push({
            studentId,
            courseId: enrollmentData.selectedCourse
          });
        }
      }
    } else {
      alert('Please select students or provide CSV data');
      return;
    }

    if (studentsToEnroll.length === 0) {
      alert('No students to enroll');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/bulk-operations', {
        operation: 'bulk-enroll',
        data: studentsToEnroll
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResults(response.data.results);
      setShowResults(true);
      
      // Reset form
      setEnrollmentData({
        selectedStudents: [],
        selectedCourse: '',
        csvData: ''
      });
      
    } catch (error) {
      console.error('Error performing bulk enrollment:', error);
      alert('Error performing bulk enrollment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGradeUpdate = async () => {
    if (!gradeData.csvData.trim()) {
      alert('Please provide CSV data');
      return;
    }

    // Parse CSV data
    const lines = gradeData.csvData.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const studentIdIndex = headers.findIndex(h => h.includes('student') && h.includes('id'));
    const courseIdIndex = headers.findIndex(h => h.includes('course') && h.includes('id'));
    const gradeIndex = headers.findIndex(h => h.includes('grade'));
    
    if (studentIdIndex === -1 || courseIdIndex === -1 || gradeIndex === -1) {
      alert('CSV must contain "Student ID", "Course ID", and "Grade" columns');
      return;
    }

    const gradesToUpdate = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const studentId = values[studentIdIndex];
      const courseId = values[courseIdIndex];
      const grade = values[gradeIndex];
      
      if (studentId && courseId && grade) {
        gradesToUpdate.push({
          studentId,
          courseId,
          grade,
          semester: gradeData.semester,
          year: gradeData.year
        });
      }
    }

    if (gradesToUpdate.length === 0) {
      alert('No valid grade data found');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/bulk-operations', {
        operation: 'bulk-grade-update',
        data: gradesToUpdate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResults(response.data.results);
      setShowResults(true);
      
      // Reset form
      setGradeData({
        csvData: '',
        semester: 'Fall',
        year: new Date().getFullYear()
      });
      
    } catch (error) {
      console.error('Error performing bulk grade update:', error);
      alert('Error performing bulk grade update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelection = (studentId) => {
    setEnrollmentData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
  };

  const handleSelectAllStudents = () => {
    setEnrollmentData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.length === students.length 
        ? [] 
        : students.map(s => s.id)
    }));
  };

  const operations = [
    { id: 'bulk-enroll', label: 'Bulk Enrollment', icon: '📚' },
    { id: 'bulk-grade', label: 'Bulk Grade Update', icon: '📊' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled':
      case 'created':
      case 'updated':
        return '#28a745';
      case 'already_enrolled':
        return '#ffc107';
      case 'error':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="bulk-operations">
      <div className="page-header">
        <h2>⚡ Bulk Operations</h2>
        <p>Perform bulk operations on users and data</p>
      </div>

      {/* Operation Tabs */}
      <div className="admin-card">
        <div className="operation-tabs">
          {operations.map(op => (
            <button
              key={op.id}
              className={`tab-button ${activeOperation === op.id ? 'active' : ''}`}
              onClick={() => setActiveOperation(op.id)}
            >
              <span className="tab-icon">{op.icon}</span>
              <span className="tab-label">{op.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Enrollment */}
      {activeOperation === 'bulk-enroll' && (
        <div className="admin-card">
          <h3>📚 Bulk Student Enrollment</h3>
          <p>Enroll multiple students in a course at once</p>

          <div className="bulk-form">
            <div className="form-group">
              <label className="form-label">Select Course *</label>
              <select
                className="form-control form-select"
                value={enrollmentData.selectedCourse}
                onChange={(e) => setEnrollmentData(prev => ({ ...prev, selectedCourse: e.target.value }))}
              >
                <option value="">Choose a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="enrollment-methods">
              <div className="method-section">
                <h4>Method 1: Select Students</h4>
                <div className="student-selection">
                  <div className="selection-header">
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={handleSelectAllStudents}
                    >
                      {enrollmentData.selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="selection-count">
                      {enrollmentData.selectedStudents.length} of {students.length} selected
                    </span>
                  </div>
                  
                  <div className="student-list">
                    {students.slice(0, 20).map(student => (
                      <div key={student.id} className="student-item">
                        <input
                          type="checkbox"
                          checked={enrollmentData.selectedStudents.includes(student.id)}
                          onChange={() => handleStudentSelection(student.id)}
                        />
                        <span className="student-name">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="student-id">
                          ID: {student.studentId}
                        </span>
                      </div>
                    ))}
                    {students.length > 20 && (
                      <p className="more-students">
                        ... and {students.length - 20} more students
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="method-divider">OR</div>

              <div className="method-section">
                <h4>Method 2: Upload CSV</h4>
                <div className="csv-section">
                  <div className="csv-format">
                    <h5>CSV Format:</h5>
                    <code>Student ID,Name<br/>STU001,John Doe<br/>STU002,Jane Smith</code>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">CSV Data</label>
                    <textarea
                      className="form-control"
                      rows="6"
                      placeholder="Paste your CSV data here..."
                      value={enrollmentData.csvData}
                      onChange={(e) => setEnrollmentData(prev => ({ ...prev, csvData: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleBulkEnrollment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Enroll Students'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Grade Update */}
      {activeOperation === 'bulk-grade' && (
        <div className="admin-card">
          <h3>📊 Bulk Grade Update</h3>
          <p>Update grades for multiple students at once</p>

          <div className="bulk-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select
                  className="form-control form-select"
                  value={gradeData.semester}
                  onChange={(e) => setGradeData(prev => ({ ...prev, semester: e.target.value }))}
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={gradeData.year}
                  onChange={(e) => setGradeData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  min="2020"
                  max="2030"
                />
              </div>
            </div>

            <div className="csv-section">
              <div className="csv-format">
                <h5>CSV Format:</h5>
                <code>
                  Student ID,Course ID,Grade<br/>
                  STU001,CRS001,A<br/>
                  STU002,CRS001,B+<br/>
                  STU003,CRS002,A-
                </code>
              </div>
              
              <div className="form-group">
                <label className="form-label">CSV Data *</label>
                <textarea
                  className="form-control"
                  rows="8"
                  placeholder="Paste your CSV data here..."
                  value={gradeData.csvData}
                  onChange={(e) => setGradeData(prev => ({ ...prev, csvData: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleBulkGradeUpdate}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Update Grades'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && (
        <div className="modal-overlay" onClick={() => setShowResults(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Operation Results</h3>
              <button 
                className="modal-close"
                onClick={() => setShowResults(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="results-summary">
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-number">{results.length}</span>
                    <span className="stat-label">Total Processed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">
                      {results.filter(r => ['enrolled', 'created', 'updated'].includes(r.status)).length}
                    </span>
                    <span className="stat-label">Successful</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">
                      {results.filter(r => r.status === 'error').length}
                    </span>
                    <span className="stat-label">Errors</span>
                  </div>
                </div>
              </div>

              <div className="results-table">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Course ID</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td>{result.studentId}</td>
                        <td>{result.courseId}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: getStatusColor(result.status) + '20',
                              color: getStatusColor(result.status)
                            }}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td>{result.error || 'Success'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="admin-card">
        <h3>❓ Help & Guidelines</h3>
        <div className="help-content">
          <div className="help-section">
            <h4>Bulk Enrollment</h4>
            <ul>
              <li>Select a course first before choosing students</li>
              <li>You can either select students manually or upload a CSV file</li>
              <li>CSV should contain Student ID and optionally student names</li>
              <li>Students already enrolled will be skipped</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Bulk Grade Update</h4>
            <ul>
              <li>CSV must contain Student ID, Course ID, and Grade columns</li>
              <li>Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F</li>
              <li>Existing grades will be updated, new grades will be created</li>
              <li>Make sure to set the correct semester and year</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;