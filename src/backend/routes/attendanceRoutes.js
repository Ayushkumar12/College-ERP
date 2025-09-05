const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, isFaculty, isStudent } = require('../middleware/auth');

const router = express.Router();

// Generate QR code for attendance (Faculty only)
router.post('/generate-qr', verifyToken, isFaculty, async (req, res) => {
  try {
    const { courseId, sessionTitle, duration = 30, location } = req.body;
    const facultyId = req.user.uid;

    // Validate required fields
    if (!courseId || !sessionTitle) {
      return res.status(400).json({ error: 'Course ID and session title are required' });
    }

    // Verify course belongs to faculty
    const courseDoc = await global.db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = courseDoc.data();
    if (courseData.facultyId !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this course' });
    }

    // Generate unique session ID
    const sessionId = uuidv4();
    const currentTime = new Date();
    const expiryTime = new Date(currentTime.getTime() + duration * 60000); // duration in minutes

    // Create attendance session
    const sessionData = {
      sessionId,
      courseId,
      facultyId,
      sessionTitle,
      location: location || '',
      createdAt: currentTime.toISOString(),
      expiresAt: expiryTime.toISOString(),
      isActive: true,
      duration,
      attendanceCount: 0
    };

    await global.db.collection('attendance_sessions').doc(sessionId).set(sessionData);

    // Generate QR code data
    const qrData = {
      sessionId,
      courseId,
      type: 'attendance',
      timestamp: currentTime.toISOString()
    };

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      message: 'QR code generated successfully',
      session: sessionData,
      qrCode: qrCodeDataURL,
      qrData: JSON.stringify(qrData)
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance using QR code (Students)
router.post('/mark-attendance', verifyToken, isStudent, async (req, res) => {
  try {
    const { qrData, location } = req.body;
    const studentId = req.user.uid;

    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    let parsedQRData;
    try {
      parsedQRData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid QR code data' });
    }

    const { sessionId, courseId, type } = parsedQRData;

    // Validate QR code type
    if (type !== 'attendance') {
      return res.status(400).json({ error: 'Invalid QR code type' });
    }

    // Get attendance session
    const sessionDoc = await global.db.collection('attendance_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Attendance session not found' });
    }

    const sessionData = sessionDoc.data();

    // Check if session is still active
    if (!sessionData.isActive) {
      return res.status(400).json({ error: 'Attendance session is no longer active' });
    }

    // Check if session has expired
    const currentTime = new Date();
    const expiryTime = new Date(sessionData.expiresAt);
    if (currentTime > expiryTime) {
      // Deactivate expired session
      await global.db.collection('attendance_sessions').doc(sessionId).update({
        isActive: false,
        updatedAt: currentTime.toISOString()
      });
      return res.status(400).json({ error: 'Attendance session has expired' });
    }

    // Verify student is enrolled in the course
    const enrollmentQuery = await global.db
      .collection('enrollments')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .get();

    if (enrollmentQuery.empty) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if attendance already marked for this session
    const existingAttendanceQuery = await global.db
      .collection('attendance')
      .where('studentId', '==', studentId)
      .where('sessionId', '==', sessionId)
      .get();

    if (!existingAttendanceQuery.empty) {
      return res.status(400).json({ error: 'Attendance already marked for this session' });
    }

    // Get student details
    const studentDoc = await global.db.collection('students').doc(studentId).get();
    const studentData = studentDoc.exists ? studentDoc.data() : {};

    // Mark attendance
    const attendanceData = {
      studentId,
      courseId,
      sessionId,
      facultyId: sessionData.facultyId,
      studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
      sessionTitle: sessionData.sessionTitle,
      date: currentTime.toISOString().split('T')[0],
      timestamp: currentTime.toISOString(),
      status: 'present',
      location: location || '',
      markedVia: 'qr_code'
    };

    await global.db.collection('attendance').add(attendanceData);

    // Update session attendance count
    await global.db.collection('attendance_sessions').doc(sessionId).update({
      attendanceCount: global.admin.firestore.FieldValue.increment(1),
      updatedAt: currentTime.toISOString()
    });

    res.json({
      message: 'Attendance marked successfully',
      attendance: attendanceData
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active attendance sessions (Faculty)
router.get('/sessions', verifyToken, isFaculty, async (req, res) => {
  try {
    const facultyId = req.user.uid;
    const { courseId, includeExpired = false } = req.query;

    let query = global.db.collection('attendance_sessions');
    
    if (req.user.role !== 'admin') {
      query = query.where('facultyId', '==', facultyId);
    }
    
    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }

    if (!includeExpired) {
      query = query.where('isActive', '==', true);
    }

    const sessionsSnapshot = await query.get();
    const sessions = [];

    for (const doc of sessionsSnapshot.docs) {
      const sessionData = { id: doc.id, ...doc.data() };
      
      // Get course details
      const courseDoc = await global.db.collection('courses').doc(sessionData.courseId).get();
      if (courseDoc.exists) {
        sessionData.courseDetails = courseDoc.data();
      }

      // Check if session has expired and update status
      const currentTime = new Date();
      const expiryTime = new Date(sessionData.expiresAt);
      if (currentTime > expiryTime && sessionData.isActive) {
        await global.db.collection('attendance_sessions').doc(doc.id).update({
          isActive: false,
          updatedAt: currentTime.toISOString()
        });
        sessionData.isActive = false;
      }

      sessions.push(sessionData);
    }

    // Sort by creation time (newest first)
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      sessions
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance for a specific session
router.get('/sessions/:sessionId/attendance', verifyToken, isFaculty, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const facultyId = req.user.uid;

    // Verify session exists and belongs to faculty
    const sessionDoc = await global.db.collection('attendance_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();
    if (sessionData.facultyId !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Get attendance records for this session
    const attendanceSnapshot = await global.db
      .collection('attendance')
      .where('sessionId', '==', sessionId)
      .get();

    const attendanceRecords = [];
    attendanceSnapshot.forEach(doc => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });

    // Get all enrolled students for comparison
    const enrollmentsSnapshot = await global.db
      .collection('enrollments')
      .where('courseId', '==', sessionData.courseId)
      .where('status', '==', 'active')
      .get();

    const enrolledStudents = [];
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollment = doc.data();
      const studentDoc = await global.db.collection('students').doc(enrollment.studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        const hasAttended = attendanceRecords.some(record => record.studentId === enrollment.studentId);
        
        enrolledStudents.push({
          studentId: enrollment.studentId,
          studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
          email: studentData.email,
          rollNumber: studentData.rollNumber,
          hasAttended,
          attendanceStatus: hasAttended ? 'present' : 'absent'
        });
      }
    }

    res.json({
      session: sessionData,
      attendanceRecords,
      enrolledStudents,
      statistics: {
        totalEnrolled: enrolledStudents.length,
        totalPresent: attendanceRecords.length,
        totalAbsent: enrolledStudents.length - attendanceRecords.length,
        attendancePercentage: enrolledStudents.length > 0 ? 
          Math.round((attendanceRecords.length / enrolledStudents.length) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get session attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Close/deactivate attendance session
router.put('/sessions/:sessionId/close', verifyToken, isFaculty, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const facultyId = req.user.uid;

    // Verify session exists and belongs to faculty
    const sessionDoc = await global.db.collection('attendance_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();
    if (sessionData.facultyId !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Update session status
    await global.db.collection('attendance_sessions').doc(sessionId).update({
      isActive: false,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({
      message: 'Attendance session closed successfully'
    });

  } catch (error) {
    console.error('Close session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual attendance marking (Faculty)
router.post('/manual-mark', verifyToken, isFaculty, async (req, res) => {
  try {
    const { attendanceRecords } = req.body; // Array of { studentId, courseId, status, date, sessionTitle }
    const facultyId = req.user.uid;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ error: 'Attendance records array is required' });
    }

    const results = [];
    const batch = global.db.batch();

    for (const record of attendanceRecords) {
      const { studentId, courseId, status, date, sessionTitle } = record;

      // Validate required fields
      if (!studentId || !courseId || !status || !date) {
        results.push({ studentId, status: 'error', error: 'Missing required fields' });
        continue;
      }

      // Verify course belongs to faculty
      const courseDoc = await global.db.collection('courses').doc(courseId).get();
      if (!courseDoc.exists || (courseDoc.data().facultyId !== facultyId && req.user.role !== 'admin')) {
        results.push({ studentId, status: 'error', error: 'Access denied to course' });
        continue;
      }

      // Verify student is enrolled
      const enrollmentQuery = await global.db
        .collection('enrollments')
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .where('status', '==', 'active')
        .get();

      if (enrollmentQuery.empty) {
        results.push({ studentId, status: 'error', error: 'Student not enrolled in course' });
        continue;
      }

      // Check if attendance already exists for this date
      const existingAttendanceQuery = await global.db
        .collection('attendance')
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .where('date', '==', date)
        .get();

      const attendanceData = {
        studentId,
        courseId,
        facultyId,
        sessionTitle: sessionTitle || 'Manual Entry',
        date,
        timestamp: new Date().toISOString(),
        status,
        markedVia: 'manual'
      };

      if (existingAttendanceQuery.empty) {
        // Create new attendance record
        const attendanceRef = global.db.collection('attendance').doc();
        batch.set(attendanceRef, attendanceData);
        results.push({ studentId, status: 'created' });
      } else {
        // Update existing record
        const existingDoc = existingAttendanceQuery.docs[0];
        batch.update(existingDoc.ref, {
          ...attendanceData,
          updatedAt: new Date().toISOString()
        });
        results.push({ studentId, status: 'updated' });
      }
    }

    await batch.commit();

    res.json({
      message: 'Manual attendance marking completed',
      results
    });

  } catch (error) {
    console.error('Manual attendance marking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance statistics
router.get('/statistics', verifyToken, isFaculty, async (req, res) => {
  try {
    const { courseId, startDate, endDate, studentId } = req.query;
    const facultyId = req.user.uid;

    let query = global.db.collection('attendance');

    // Apply filters based on user role
    if (req.user.role === 'student') {
      query = query.where('studentId', '==', req.user.uid);
    } else if (req.user.role === 'faculty') {
      query = query.where('facultyId', '==', facultyId);
    }

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }
    if (studentId && req.user.role !== 'student') {
      query = query.where('studentId', '==', studentId);
    }
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    const attendanceSnapshot = await query.get();
    const attendanceRecords = [];

    attendanceSnapshot.forEach(doc => {
      attendanceRecords.push(doc.data());
    });

    // Calculate statistics
    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter(record => record.status === 'present').length;
    const absentRecords = totalRecords - presentRecords;
    const attendancePercentage = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

    // Group by date
    const dailyStats = {};
    attendanceRecords.forEach(record => {
      if (!dailyStats[record.date]) {
        dailyStats[record.date] = { present: 0, absent: 0, total: 0 };
      }
      dailyStats[record.date][record.status]++;
      dailyStats[record.date].total++;
    });

    // Group by course (if not filtered by course)
    const courseStats = {};
    if (!courseId) {
      for (const record of attendanceRecords) {
        if (!courseStats[record.courseId]) {
          courseStats[record.courseId] = { present: 0, absent: 0, total: 0, courseName: '' };
          
          // Get course name
          const courseDoc = await global.db.collection('courses').doc(record.courseId).get();
          if (courseDoc.exists) {
            courseStats[record.courseId].courseName = courseDoc.data().courseName;
          }
        }
        courseStats[record.courseId][record.status]++;
        courseStats[record.courseId].total++;
      }
    }

    res.json({
      statistics: {
        totalRecords,
        presentRecords,
        absentRecords,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      },
      dailyStats,
      courseStats: Object.keys(courseStats).length > 0 ? courseStats : null
    });

  } catch (error) {
    console.error('Get attendance statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete attendance session (Faculty/Admin)
router.delete('/sessions/:sessionId', verifyToken, isFaculty, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const facultyId = req.user.uid;

    // Verify session exists and belongs to faculty
    const sessionDoc = await global.db.collection('attendance_sessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = sessionDoc.data();
    if (sessionData.facultyId !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Delete session and related attendance records
    const batch = global.db.batch();

    // Delete session
    batch.delete(global.db.collection('attendance_sessions').doc(sessionId));

    // Delete attendance records for this session
    const attendanceSnapshot = await global.db
      .collection('attendance')
      .where('sessionId', '==', sessionId)
      .get();

    attendanceSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      message: 'Attendance session deleted successfully'
    });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;