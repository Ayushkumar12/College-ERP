import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReportsManagement = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: ''
  });
  const [activeReport, setActiveReport] = useState('attendance');

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== 'all')
      );
      
      const response = await axios.get(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Error fetching reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = (reportType, format = 'csv') => {
    const reportData = reports[reportType];
    if (!reportData) return;

    let csvContent = '';
    let filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`;

    switch (reportType) {
      case 'attendance':
        csvContent = 'Date,Present,Absent,Total\n';
        Object.entries(reportData.byDate || {}).forEach(([date, data]) => {
          csvContent += `${date},${data.present},${data.absent},${data.present + data.absent}\n`;
        });
        break;
      
      case 'enrollment':
        csvContent = 'Course,Enrollments\n';
        Object.entries(reportData.byCourse || {}).forEach(([course, count]) => {
          csvContent += `"${course}",${count}\n`;
        });
        break;
      
      case 'grades':
        csvContent = 'Grade,Count\n';
        Object.entries(reportData.gradeDistribution || {}).forEach(([grade, count]) => {
          csvContent += `${grade},${count}\n`;
        });
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendancePercentage = (present, total) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  const reportTabs = [
    { id: 'attendance', label: 'Attendance Reports', icon: '📊' },
    { id: 'enrollment', label: 'Enrollment Reports', icon: '📈' },
    { id: 'grades', label: 'Grade Reports', icon: '🎓' }
  ];

  return (
    <div className="reports-management">
      <div className="page-header">
        <h2>📈 Reports Management</h2>
        <p>Generate and view system reports</p>
      </div>

      {/* Filters */}
      <div className="admin-card">
        <div className="search-filters">
          <div className="form-group">
            <label className="form-label">Report Type</label>
            <select
              className="form-control form-select"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Reports</option>
              <option value="attendance">Attendance Only</option>
              <option value="enrollment">Enrollment Only</option>
              <option value="grades">Grades Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button 
              className="btn btn-primary"
              onClick={fetchReports}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Reports'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="admin-card">
        <div className="report-tabs">
          {reportTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeReport === tab.id ? 'active' : ''}`}
              onClick={() => setActiveReport(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-card">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Generating reports...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Attendance Report */}
          {activeReport === 'attendance' && reports.attendance && (
            <div className="admin-card">
              <div className="report-header">
                <h3>📊 Attendance Report</h3>
                <button 
                  className="btn btn-success"
                  onClick={() => exportReport('attendance')}
                >
                  📥 Export CSV
                </button>
              </div>

              <div className="report-summary">
                <div className="summary-stats">
                  <div className="stat-card">
                    <h4>{reports.attendance.totalRecords}</h4>
                    <p>Total Records</p>
                  </div>
                  <div className="stat-card">
                    <h4>{reports.attendance.present}</h4>
                    <p>Present</p>
                  </div>
                  <div className="stat-card">
                    <h4>{reports.attendance.absent}</h4>
                    <p>Absent</p>
                  </div>
                  <div className="stat-card">
                    <h4>{getAttendancePercentage(reports.attendance.present, reports.attendance.totalRecords)}%</h4>
                    <p>Attendance Rate</p>
                  </div>
                </div>
              </div>

              {Object.keys(reports.attendance.byDate || {}).length > 0 && (
                <div className="report-table">
                  <h4>Daily Attendance Breakdown</h4>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Total</th>
                        <th>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reports.attendance.byDate)
                        .sort(([a], [b]) => new Date(b) - new Date(a))
                        .map(([date, data]) => {
                          const total = data.present + data.absent;
                          const percentage = getAttendancePercentage(data.present, total);
                          return (
                            <tr key={date}>
                              <td>{formatDate(date)}</td>
                              <td>{data.present}</td>
                              <td>{data.absent}</td>
                              <td>{total}</td>
                              <td>
                                <span className={`percentage ${percentage >= 75 ? 'good' : percentage >= 50 ? 'average' : 'poor'}`}>
                                  {percentage}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Enrollment Report */}
          {activeReport === 'enrollment' && reports.enrollment && (
            <div className="admin-card">
              <div className="report-header">
                <h3>📈 Enrollment Report</h3>
                <button 
                  className="btn btn-success"
                  onClick={() => exportReport('enrollment')}
                >
                  📥 Export CSV
                </button>
              </div>

              <div className="report-summary">
                <div className="summary-stats">
                  <div className="stat-card">
                    <h4>{reports.enrollment.totalEnrollments}</h4>
                    <p>Total Enrollments</p>
                  </div>
                  <div className="stat-card">
                    <h4>{reports.enrollment.byStatus?.active || 0}</h4>
                    <p>Active</p>
                  </div>
                  <div className="stat-card">
                    <h4>{reports.enrollment.byStatus?.completed || 0}</h4>
                    <p>Completed</p>
                  </div>
                  <div className="stat-card">
                    <h4>{reports.enrollment.byStatus?.inactive || 0}</h4>
                    <p>Inactive</p>
                  </div>
                </div>
              </div>

              {Object.keys(reports.enrollment.byCourse || {}).length > 0 && (
                <div className="report-table">
                  <h4>Enrollments by Course</h4>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Enrollments</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reports.enrollment.byCourse)
                        .sort(([,a], [,b]) => b - a)
                        .map(([course, count]) => {
                          const percentage = Math.round((count / reports.enrollment.totalEnrollments) * 100);
                          return (
                            <tr key={course}>
                              <td>{course}</td>
                              <td>{count}</td>
                              <td>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                  <span className="progress-text">{percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Grades Report */}
          {activeReport === 'grades' && reports.grades && (
            <div className="admin-card">
              <div className="report-header">
                <h3>🎓 Grade Report</h3>
                <button 
                  className="btn btn-success"
                  onClick={() => exportReport('grades')}
                >
                  📥 Export CSV
                </button>
              </div>

              <div className="report-summary">
                <div className="summary-stats">
                  <div className="stat-card">
                    <h4>{reports.grades.totalGrades}</h4>
                    <p>Total Grades</p>
                  </div>
                  <div className="stat-card">
                    <h4>{reports.grades.averageGPA}</h4>
                    <p>Average GPA</p>
                  </div>
                  <div className="stat-card">
                    <h4>{Object.keys(reports.grades.gradeDistribution || {}).length}</h4>
                    <p>Grade Types</p>
                  </div>
                  <div className="stat-card">
                    <h4>{reports.grades.gradeDistribution?.['A'] || 0}</h4>
                    <p>A Grades</p>
                  </div>
                </div>
              </div>

              {Object.keys(reports.grades.gradeDistribution || {}).length > 0 && (
                <div className="report-table">
                  <h4>Grade Distribution</h4>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Grade</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reports.grades.gradeDistribution)
                        .sort(([a], [b]) => {
                          const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
                          return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
                        })
                        .map(([grade, count]) => {
                          const percentage = Math.round((count / reports.grades.totalGrades) * 100);
                          return (
                            <tr key={grade}>
                              <td>
                                <span className={`grade-badge grade-${grade.replace('+', 'plus').replace('-', 'minus')}`}>
                                  {grade}
                                </span>
                              </td>
                              <td>{count}</td>
                              <td>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                  <span className="progress-text">{percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Report Generation Info */}
      <div className="admin-card">
        <h3>ℹ️ Report Information</h3>
        <div className="report-info">
          <p><strong>Last Generated:</strong> {reports.generatedAt ? formatDate(reports.generatedAt) : 'Not generated yet'}</p>
          <p><strong>Date Range:</strong> {filters.startDate && filters.endDate ? `${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}` : 'All time'}</p>
          <p><strong>Report Types:</strong> {filters.type === 'all' ? 'All reports' : filters.type}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;