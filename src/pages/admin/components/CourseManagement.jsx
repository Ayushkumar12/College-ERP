import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    facultyId: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    courseName: '',
    courseCode: '',
    credits: '',
    department: '',
    facultyId: '',
    description: '',
    semester: '',
    year: new Date().getFullYear()
  });

  const departments = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Economics',
    'Psychology',
    'Engineering'
  ];

  useEffect(() => {
    fetchCourses();
    fetchFaculty();
  }, [filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      const response = await axios.get(`/api/admin/courses?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(response.data.courses);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert('Error fetching courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users?role=faculty&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaculty(response.data.users);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleFormChange = (key, value) => {
    setCourseForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      courseName: '',
      courseCode: '',
      credits: '',
      department: '',
      facultyId: '',
      description: '',
      semester: '',
      year: new Date().getFullYear()
    });
    setShowCourseModal(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      courseName: course.courseName || '',
      courseCode: course.courseCode || '',
      credits: course.credits || '',
      department: course.department || '',
      facultyId: course.facultyId || '',
      description: course.description || '',
      semester: course.semester || '',
      year: course.year || new Date().getFullYear()
    });
    setShowCourseModal(true);
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    
    if (!courseForm.courseName || !courseForm.courseCode || !courseForm.credits || !courseForm.department) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (editingCourse) {
        // Update existing course
        await axios.put(`/api/admin/courses/${editingCourse.id}`, courseForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Course updated successfully');
      } else {
        // Create new course
        await axios.post('/api/admin/courses', courseForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Course created successfully');
      }
      
      setShowCourseModal(false);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert(error.response?.data?.error || 'Error saving course. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete "${courseName}"? This will also delete all related enrollments, attendance, and grades.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course. Please try again.');
    }
  };

  const getFacultyName = (facultyId) => {
    const facultyMember = faculty.find(f => f.id === facultyId);
    return facultyMember ? `${facultyMember.firstName} ${facultyMember.lastName}` : 'Unassigned';
  };

  return (
    <div className="course-management">
      <div className="page-header">
        <h2>📚 Course Management</h2>
        <p>Manage all courses in the system</p>
        <button className="btn btn-primary" onClick={handleCreateCourse}>
          <span>➕</span>
          Create New Course
        </button>
      </div>

      {/* Search and Filters */}
      <div className="admin-card">
        <div className="search-filters">
          <div className="form-group filter-select">
            <select
              className="form-control form-select"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="form-group filter-select">
            <select
              className="form-control form-select"
              value={filters.facultyId}
              onChange={(e) => handleFilterChange('facultyId', e.target.value)}
            >
              <option value="">All Faculty</option>
              {faculty.map(f => (
                <option key={f.id} value={f.id}>
                  {f.firstName} {f.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group filter-select">
            <select
              className="form-control form-select"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="admin-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Department</th>
                  <th>Credits</th>
                  <th>Faculty</th>
                  <th>Enrollments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.courseCode}</strong>
                    </td>
                    <td>
                      <div className="course-info">
                        <strong>{course.courseName}</strong>
                        {course.description && (
                          <small className="course-description">
                            {course.description.substring(0, 100)}...
                          </small>
                        )}
                      </div>
                    </td>
                    <td>{course.department}</td>
                    <td>{course.credits}</td>
                    <td>{getFacultyName(course.facultyId)}</td>
                    <td>
                      <span className="enrollment-count">
                        {course.enrollmentCount || 0} students
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleEditCourse(course)}
                          title="Edit Course"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteCourse(course.id, course.courseName)}
                          title="Delete Course"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {courses.length === 0 && (
              <div className="empty-state">
                <p>No courses found matching your criteria.</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={page === pagination.currentPage ? 'active' : ''}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCourseModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitCourse} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={courseForm.courseName}
                    onChange={(e) => handleFormChange('courseName', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={courseForm.courseCode}
                    onChange={(e) => handleFormChange('courseCode', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Credits *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={courseForm.credits}
                    onChange={(e) => handleFormChange('credits', parseInt(e.target.value))}
                    min="1"
                    max="6"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-control form-select"
                    value={courseForm.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Faculty</label>
                  <select
                    className="form-control form-select"
                    value={courseForm.facultyId}
                    onChange={(e) => handleFormChange('facultyId', e.target.value)}
                  >
                    <option value="">Select Faculty</option>
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.firstName} {f.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    className="form-control form-select"
                    value={courseForm.semester}
                    onChange={(e) => handleFormChange('semester', e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={courseForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Course description..."
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCourseModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Stats */}
      <div className="admin-card">
        <h3>📊 Course Statistics</h3>
        <div className="course-stats">
          <div className="stat-item">
            <span className="stat-label">Total Courses:</span>
            <span className="stat-value">{pagination.totalCourses || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Enrollments:</span>
            <span className="stat-value">
              {courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Departments:</span>
            <span className="stat-value">
              {new Set(courses.map(course => course.department)).size}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;