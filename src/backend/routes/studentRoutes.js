const express = require('express');
const { verifyToken, isAdmin, isFaculty, canAccessStudentData } = require('../middleware/auth');

const router = express.Router();

// Get all students (Admin and Faculty only)
router.get('/', verifyToken, isFaculty, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', year = '', section = '' } = req.query;
    
    let query = global.db.collection('students');
    
    // Apply filters
    if (department) {
      query = query.where('department', '==', department);
    }
    if (year) {
      query = query.where('year', '==', parseInt(year));
    }
    if (section) {
      query = query.where('section', '==', section);
    }

    // Get documents
    const snapshot = await query.get();
    let students = [];
    
    snapshot.forEach(doc => {
      const studentData = doc.data();
      delete studentData.password; // Remove sensitive data
      students.push(studentData);
    });

    // Apply search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(student => 
        student.firstName?.toLowerCase().includes(searchLower) ||
        student.lastName?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.rollNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedStudents = students.slice(startIndex, endIndex);

    res.json({
      students: paginatedStudents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(students.length / limit),
        totalStudents: students.length,
        hasNext: endIndex < students.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
router.get('/:studentId', verifyToken, canAccessStudentData, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const studentDoc = await global.db.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = studentDoc.data();
    delete studentData.password;

    res.json({
      student: studentData
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student profile
router.put('/:studentId', verifyToken, canAccessStudentData, async (req, res) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.uid;
    delete updates.createdAt;

    // Add updated timestamp
    updates.updatedAt = new Date().toISOString();

    // Check if student exists
    const studentDoc = await global.db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update student document
    await global.db.collection('students').doc(studentId).update(updates);

    // Also update main users collection
    await global.db.collection('users').doc(studentId).update(updates);

    res.json({
      message: 'Student profile updated successfully',
      updates
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's courses
router.get('/:studentId/courses', verifyToken, canAccessStudentData, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student's enrolled courses
    const enrollmentsSnapshot = await global.db
      .collection('enrollments')
      .where('studentId', '==', studentId)
      .get();

    const courseIds = [];
    enrollmentsSnapshot.forEach(doc => {
      courseIds.push(doc.data().courseId);
    });

    if (courseIds.length === 0) {
      return res.json({ courses: [] });
    }

    // Get course details
    const courses = [];
    for (const courseId of courseIds) {
      const courseDoc = await global.db.collection('courses').doc(courseId).get();
      if (courseDoc.exists) {
        courses.push({ id: courseId, ...courseDoc.data() });
      }
    }

    res.json({
      courses
    });

  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll student in a course
router.post('/:studentId/enroll', verifyToken, isFaculty, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if student exists
    const studentDoc = await global.db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if course exists
    const courseDoc = await global.db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await global.db
      .collection('enrollments')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .get();

    if (!existingEnrollment.empty) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }

    // Create enrollment
    const enrollmentData = {
      studentId,
      courseId,
      enrolledAt: new Date().toISOString(),
      status: 'active',
      grade: null,
      credits: courseDoc.data().credits || 0
    };

    await global.db.collection('enrollments').add(enrollmentData);

    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollment: enrollmentData
    });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's attendance
router.get('/:studentId/attendance', verifyToken, canAccessStudentData, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    let query = global.db
      .collection('attendance')
      .where('studentId', '==', studentId);

    if (courseId) {
      query = query.where('courseId', '==', courseId);
    }

    const attendanceSnapshot = await query.get();
    const attendanceRecords = [];

    attendanceSnapshot.forEach(doc => {
      const record = { id: doc.id, ...doc.data() };
      
      // Apply date filters
      if (startDate && new Date(record.date) < new Date(startDate)) return;
      if (endDate && new Date(record.date) > new Date(endDate)) return;
      
      attendanceRecords.push(record);
    });

    // Calculate attendance statistics
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(record => record.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    res.json({
      attendance: attendanceRecords,
      statistics: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      }
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's grades
router.get('/:studentId/grades', verifyToken, canAccessStudentData, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, year } = req.query;

    let query = global.db
      .collection('grades')
      .where('studentId', '==', studentId);

    if (semester) {
      query = query.where('semester', '==', semester);
    }
    if (year) {
      query = query.where('year', '==', parseInt(year));
    }

    const gradesSnapshot = await query.get();
    const grades = [];

    for (const doc of gradesSnapshot.docs) {
      const gradeData = { id: doc.id, ...doc.data() };
      
      // Get course details
      const courseDoc = await global.db.collection('courses').doc(gradeData.courseId).get();
      if (courseDoc.exists) {
        gradeData.courseDetails = courseDoc.data();
      }
      
      grades.push(gradeData);
    }

    // Calculate GPA
    const totalCredits = grades.reduce((sum, grade) => sum + (grade.credits || 0), 0);
    const totalGradePoints = grades.reduce((sum, grade) => {
      const gradePoint = getGradePoint(grade.grade);
      return sum + (gradePoint * (grade.credits || 0));
    }, 0);
    
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    res.json({
      grades,
      statistics: {
        totalCredits,
        gpa: Math.round(gpa * 100) / 100,
        totalCourses: grades.length
      }
    });

  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to convert letter grade to grade point
function getGradePoint(grade) {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };
  return gradePoints[grade] || 0.0;
}

// Delete student (Admin only)
router.delete('/:studentId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if student exists
    const studentDoc = await global.db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete from students collection
    await global.db.collection('students').doc(studentId).delete();
    
    // Delete from users collection
    await global.db.collection('users').doc(studentId).delete();

    // Delete related data (enrollments, attendance, grades)
    const batch = global.db.batch();

    // Delete enrollments
    const enrollmentsSnapshot = await global.db
      .collection('enrollments')
      .where('studentId', '==', studentId)
      .get();
    enrollmentsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete attendance records
    const attendanceSnapshot = await global.db
      .collection('attendance')
      .where('studentId', '==', studentId)
      .get();
    attendanceSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete grades
    const gradesSnapshot = await global.db
      .collection('grades')
      .where('studentId', '==', studentId)
      .get();
    gradesSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    res.json({
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;