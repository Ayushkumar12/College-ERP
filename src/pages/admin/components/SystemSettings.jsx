import React, { useState, useEffect } from 'react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      institutionName: 'College ERP System',
      institutionCode: 'CERP',
      academicYear: '2024-2025',
      currentSemester: 'Fall',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      language: 'en'
    },
    attendance: {
      attendanceWindow: 15, // minutes
      lateThreshold: 10, // minutes
      autoMarkAbsent: true,
      requireGeoLocation: false,
      allowMakeupAttendance: true,
      makeupWindow: 24 // hours
    },
    grading: {
      gradingScale: 'standard',
      passingGrade: 'D',
      maxGPA: 4.0,
      allowGradeOverride: true,
      requireComments: false,
      lockGradesAfter: 30 // days
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      attendanceAlerts: true,
      gradeAlerts: true,
      systemAlerts: true
    },
    security: {
      sessionTimeout: 60, // minutes
      passwordMinLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      passwordExpiry: 90, // days
      maxLoginAttempts: 5,
      lockoutDuration: 30 // minutes
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30, // days
      backupLocation: 'cloud',
      lastBackup: '2024-01-15T10:30:00Z'
    }
  });

  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const sections = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'attendance', label: 'Attendance', icon: '📊' },
    { id: 'grading', label: 'Grading System', icon: '🎓' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'backup', label: 'Backup & Recovery', icon: '💾' }
  ];

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      // Reset to default values
      setHasChanges(true);
      alert('Settings reset to defaults. Click Save to apply changes.');
    }
  };

  const handleBackupNow = async () => {
    try {
      alert('Backup initiated. You will be notified when complete.');
      // In a real app, this would trigger a backup
    } catch (error) {
      console.error('Error initiating backup:', error);
      alert('Error initiating backup. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="system-settings">
      <div className="page-header">
        <h2>⚙️ System Settings</h2>
        <p>Configure system-wide settings and preferences</p>
        <div className="header-actions">
          {hasChanges && (
            <button 
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="settings-layout">
        {/* Settings Navigation */}
        <div className="settings-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="admin-card">
              <h3>⚙️ General Settings</h3>
              
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Institution Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.general.institutionName}
                      onChange={(e) => handleSettingChange('general', 'institutionName', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Institution Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.general.institutionCode}
                      onChange={(e) => handleSettingChange('general', 'institutionCode', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.general.academicYear}
                      onChange={(e) => handleSettingChange('general', 'academicYear', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Current Semester</label>
                    <select
                      className="form-control form-select"
                      value={settings.general.currentSemester}
                      onChange={(e) => handleSettingChange('general', 'currentSemester', e.target.value)}
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select
                      className="form-control form-select"
                      value={settings.general.timezone}
                      onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Date Format</label>
                    <select
                      className="form-control form-select"
                      value={settings.general.dateFormat}
                      onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Settings */}
          {activeSection === 'attendance' && (
            <div className="admin-card">
              <h3>📊 Attendance Settings</h3>
              
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Attendance Window (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.attendance.attendanceWindow}
                      onChange={(e) => handleSettingChange('attendance', 'attendanceWindow', parseInt(e.target.value))}
                      min="5"
                      max="60"
                    />
                    <small className="form-help">Time window for marking attendance</small>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Late Threshold (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.attendance.lateThreshold}
                      onChange={(e) => handleSettingChange('attendance', 'lateThreshold', parseInt(e.target.value))}
                      min="1"
                      max="30"
                    />
                    <small className="form-help">Minutes after which student is marked late</small>
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.attendance.autoMarkAbsent}
                        onChange={(e) => handleSettingChange('attendance', 'autoMarkAbsent', e.target.checked)}
                      />
                      <span>Automatically mark students absent after attendance window</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.attendance.requireGeoLocation}
                        onChange={(e) => handleSettingChange('attendance', 'requireGeoLocation', e.target.checked)}
                      />
                      <span>Require geo-location for attendance marking</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.attendance.allowMakeupAttendance}
                        onChange={(e) => handleSettingChange('attendance', 'allowMakeupAttendance', e.target.checked)}
                      />
                      <span>Allow makeup attendance</span>
                    </label>
                  </div>
                </div>

                {settings.attendance.allowMakeupAttendance && (
                  <div className="form-group">
                    <label className="form-label">Makeup Window (hours)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.attendance.makeupWindow}
                      onChange={(e) => handleSettingChange('attendance', 'makeupWindow', parseInt(e.target.value))}
                      min="1"
                      max="168"
                    />
                    <small className="form-help">Time window for makeup attendance</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grading Settings */}
          {activeSection === 'grading' && (
            <div className="admin-card">
              <h3>🎓 Grading System Settings</h3>
              
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Grading Scale</label>
                    <select
                      className="form-control form-select"
                      value={settings.grading.gradingScale}
                      onChange={(e) => handleSettingChange('grading', 'gradingScale', e.target.value)}
                    >
                      <option value="standard">Standard (A, B, C, D, F)</option>
                      <option value="plus-minus">Plus/Minus (A+, A, A-, etc.)</option>
                      <option value="numerical">Numerical (0-100)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Passing Grade</label>
                    <select
                      className="form-control form-select"
                      value={settings.grading.passingGrade}
                      onChange={(e) => handleSettingChange('grading', 'passingGrade', e.target.value)}
                    >
                      <option value="D">D</option>
                      <option value="C">C</option>
                      <option value="B">B</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Maximum GPA</label>
                    <select
                      className="form-control form-select"
                      value={settings.grading.maxGPA}
                      onChange={(e) => handleSettingChange('grading', 'maxGPA', parseFloat(e.target.value))}
                    >
                      <option value={4.0}>4.0</option>
                      <option value={5.0}>5.0</option>
                      <option value={10.0}>10.0</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Lock Grades After (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.grading.lockGradesAfter}
                      onChange={(e) => handleSettingChange('grading', 'lockGradesAfter', parseInt(e.target.value))}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.grading.allowGradeOverride}
                        onChange={(e) => handleSettingChange('grading', 'allowGradeOverride', e.target.checked)}
                      />
                      <span>Allow grade override by administrators</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.grading.requireComments}
                        onChange={(e) => handleSettingChange('grading', 'requireComments', e.target.checked)}
                      />
                      <span>Require comments for failing grades</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <div className="admin-card">
              <h3>🔔 Notification Settings</h3>
              
              <div className="settings-form">
                <div className="notification-types">
                  <div className="form-group">
                    <h4>Notification Channels</h4>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailNotifications}
                          onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                        />
                        <span>Email Notifications</span>
                      </label>
                    </div>
                    
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.smsNotifications}
                          onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                        />
                        <span>SMS Notifications</span>
                      </label>
                    </div>
                    
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.pushNotifications}
                          onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                        />
                        <span>Push Notifications</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <h4>Alert Types</h4>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.attendanceAlerts}
                          onChange={(e) => handleSettingChange('notifications', 'attendanceAlerts', e.target.checked)}
                        />
                        <span>Attendance Alerts</span>
                      </label>
                    </div>
                    
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.gradeAlerts}
                          onChange={(e) => handleSettingChange('notifications', 'gradeAlerts', e.target.checked)}
                        />
                        <span>Grade Alerts</span>
                      </label>
                    </div>
                    
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.systemAlerts}
                          onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                        />
                        <span>System Alerts</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className="admin-card">
              <h3>🔒 Security Settings</h3>
              
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      min="15"
                      max="480"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password Minimum Length</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      min="6"
                      max="20"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password Expiry (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.security.passwordExpiry}
                      onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                      min="30"
                      max="365"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Max Login Attempts</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      min="3"
                      max="10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.security.requireSpecialChars}
                        onChange={(e) => handleSettingChange('security', 'requireSpecialChars', e.target.checked)}
                      />
                      <span>Require special characters in passwords</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.security.requireNumbers}
                        onChange={(e) => handleSettingChange('security', 'requireNumbers', e.target.checked)}
                      />
                      <span>Require numbers in passwords</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeSection === 'backup' && (
            <div className="admin-card">
              <h3>💾 Backup & Recovery Settings</h3>
              
              <div className="settings-form">
                <div className="form-group">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.backup.autoBackup}
                        onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
                      />
                      <span>Enable automatic backups</span>
                    </label>
                  </div>
                </div>

                {settings.backup.autoBackup && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Backup Frequency</label>
                        <select
                          className="form-control form-select"
                          value={settings.backup.backupFrequency}
                          onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Retention Period (days)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={settings.backup.retentionPeriod}
                          onChange={(e) => handleSettingChange('backup', 'retentionPeriod', parseInt(e.target.value))}
                          min="7"
                          max="365"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Backup Location</label>
                      <select
                        className="form-control form-select"
                        value={settings.backup.backupLocation}
                        onChange={(e) => handleSettingChange('backup', 'backupLocation', e.target.value)}
                      >
                        <option value="local">Local Storage</option>
                        <option value="cloud">Cloud Storage</option>
                        <option value="both">Both Local and Cloud</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="backup-status">
                  <h4>Backup Status</h4>
                  <div className="status-info">
                    <div className="status-item">
                      <span className="status-label">Last Backup:</span>
                      <span className="status-value">
                        {settings.backup.lastBackup ? formatDate(settings.backup.lastBackup) : 'Never'}
                      </span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">Status:</span>
                      <span className="status-value status-success">Healthy</span>
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-primary"
                    onClick={handleBackupNow}
                  >
                    Backup Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save/Reset Actions */}
          <div className="settings-actions">
            <button 
              className="btn btn-primary btn-lg"
              onClick={handleSaveSettings}
              disabled={!hasChanges || saving}
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleResetSettings}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;