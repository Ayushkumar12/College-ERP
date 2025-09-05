const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    // Get counts for different entities
    const [studentsSnapshot, facultySnapshot, staffSnapshot, coursesSnapshot] = await Promise.all([
      global.db.collection('students').get(),
      global.db.collection('faculty').get(),
      global.db.collection('staff').get(),
      global.db.collection('courses').get()
    ]);

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsersSnapshot = await global.db
      .collection('users')
      .where('createdAt', '>=', thirtyDaysAgo.toISOString())
      .get();

    // Get attendance statistics for today
    const today = new Date().toISOString().split('T')[0];
    const todayAttendanceSnapshot = await global.db
      .collection('attendance')
      .where('date', '==', today)
      .get();

    let presentToday = 0;
    let absentToday = 0;
    todayAttendanceSnapshot.forEach(doc => {
      const record = doc.data();
      if (record.status === 'present') presentToday++;
      else absentToday++;
    });

    // Department-wise student distribution
    const departmentStats = {};
    studentsSnapshot.forEach(doc => {
      const student = doc.data();
      const dept = student.department || 'Unknown';
      departmentStats[dept] = (departmentStats[dept] || 0) + 1;
    });

    res.json({
      statistics: {
        totalStudents: studentsSnapshot.size,
        totalFaculty: facultySnapshot.size,
        totalStaff: staffSnapshot.size,
        totalCourses: coursesSnapshot.size,
        newUsersThisMonth: recentUsersSnapshot.size,
        attendanceToday: {
          present: presentToday,
          absent: absentToday,
          total: presentToday + absentToday
        },
        departmentDistribution: departmentStats
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with filters
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search = '', department } = req.query;

    let query = global.db.collection('users');
    
    if (role && role !== 'all') {
      query = query.where('role', '==', role);
    }

    const snapshot = await query.get();
    let users = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      delete userData.password;
      // Ensure id and uid are present for frontend usage
      users.push({ id: doc.id, uid: userData.uid || doc.id, ...userData });
    });

    // Optional department filter (post-fetch to avoid composite index requirements)
    if (department) {
      const deptLower = String(department).toLowerCase();
      users = users.filter(u => (u.department || '').toLowerCase() === deptLower);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.length / limit),
        totalUsers: users.length,
        hasNext: endIndex < users.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:userId/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    // Update in users collection
    await global.db.collection('users').doc(userId).update({
      isActive,
      updatedAt: new Date().toISOString()
    });

    // Update in role-specific collection
    const userDoc = await global.db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const roleCollectionMap = {
        student: 'students',
        faculty: 'faculty',
        admin: 'admins',
        staff: 'staff'
      };

      if (roleCollectionMap[userData.role]) {
        await global.db.collection(roleCollectionMap[userData.role]).doc(userId).update({
          isActive,
          updatedAt: new Date().toISOString()
        });
      }
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all courses with management options
router.get('/courses', verifyToken, isAdmin, async (req, res) => {
  try {
    const { department, facultyId, page = 1, limit = 20 } = req.query;

    let query = global.db.collection('courses');
    
    if (department) {
      query = query.where('department', '==', department);
    }
    if (facultyId) {
      query = query.where('facultyId', '==', facultyId);
    }

    const snapshot = await query.get();
    const courses = [];

    for (const doc of snapshot.docs) {
      const courseData = { id: doc.id, ...doc.data() };
      
      // Get faculty details
      if (courseData.facultyId) {
        const facultyDoc = await global.db.collection('faculty').doc(courseData.facultyId).get();
        if (facultyDoc.exists) {
          const facultyData = facultyDoc.data();
          courseData.facultyName = `${facultyData.firstName} ${facultyData.lastName}`;
        }
      }

      // Get enrollment count
      const enrollmentsSnapshot = await global.db
        .collection('enrollments')
        .where('courseId', '==', doc.id)
        .get();
      courseData.enrollmentCount = enrollmentsSnapshot.size;

      courses.push(courseData);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCourses = courses.slice(startIndex, endIndex);

    res.json({
      courses: paginatedCourses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(courses.length / limit),
        totalCourses: courses.length,
        hasNext: endIndex < courses.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course
router.post('/courses', verifyToken, isAdmin, async (req, res) => {
  try {
    const courseData = req.body;
    const { courseName, courseCode, credits, department, facultyId } = courseData;

    // Validate required fields
    if (!courseName || !courseCode || !credits || !department) {
      return res.status(400).json({ error: 'Missing required course fields' });
    }

    // Check if course code already exists
    const existingCourse = await global.db
      .collection('courses')
      .where('courseCode', '==', courseCode)
      .get();

    if (!existingCourse.empty) {
      return res.status(400).json({ error: 'Course code already exists' });
    }

    // Validate faculty if provided
    if (facultyId) {
      // First check faculty collection
      let facultyDoc = await global.db.collection('faculty').doc(facultyId).get();
      // Fallback: some UIs pass users.id; try users collection
      if (!facultyDoc.exists) {
        const userDoc = await global.db.collection('users').doc(facultyId).get();
        if (!userDoc.exists || (userDoc.exists && userDoc.data()?.role !== 'faculty')) {
          return res.status(400).json({ error: 'Faculty member not found' });
        }
      }
    }

    const newCourseData = {
      ...courseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    const courseRef = await global.db.collection('courses').add(newCourseData);

    res.status(201).json({
      message: 'Course created successfully',
      course: { id: courseRef.id, ...newCourseData }
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course
router.put('/courses/:courseId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;

    // Check if course exists
    const courseDoc = await global.db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Validate faculty if being updated
    if (updates.facultyId) {
      let facultyDoc = await global.db.collection('faculty').doc(updates.facultyId).get();
      if (!facultyDoc.exists) {
        const userDoc = await global.db.collection('users').doc(updates.facultyId).get();
        if (!userDoc.exists || (userDoc.exists && userDoc.data()?.role !== 'faculty')) {
          return res.status(400).json({ error: 'Faculty member not found' });
        }
      }
    }

    delete updates.createdAt;
    updates.updatedAt = new Date().toISOString();

    await global.db.collection('courses').doc(courseId).update(updates);

    res.json({
      message: 'Course updated successfully',
      updates
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course
router.delete('/courses/:courseId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const courseDoc = await global.db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete course and related data
    const batch = global.db.batch();

    // Delete course
    batch.delete(global.db.collection('courses').doc(courseId));

    // Delete enrollments
    const enrollmentsSnapshot = await global.db
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .get();
    enrollmentsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete attendance records
    const attendanceSnapshot = await global.db
      .collection('attendance')
      .where('courseId', '==', courseId)
      .get();
    attendanceSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete grades
    const gradesSnapshot = await global.db
      .collection('grades')
      .where('courseId', '==', courseId)
      .get();
    gradesSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete schedules
    const schedulesSnapshot = await global.db
      .collection('schedules')
      .where('courseId', '==', courseId)
      .get();
    schedulesSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    res.json({
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system reports
router.get('/reports', verifyToken, isAdmin, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const reports = {};

    if (!type || type === 'attendance') {
      // Attendance report
      let attendanceQuery = global.db.collection('attendance');
      
      if (startDate) {
        attendanceQuery = attendanceQuery.where('date', '>=', startDate);
      }
      if (endDate) {
        attendanceQuery = attendanceQuery.where('date', '<=', endDate);
      }

      const attendanceSnapshot = await attendanceQuery.get();
      const attendanceData = {
        totalRecords: attendanceSnapshot.size,
        present: 0,
        absent: 0,
        byDate: {}
      };

      attendanceSnapshot.forEach(doc => {
        const record = doc.data();
        if (record.status === 'present') {
          attendanceData.present++;
        } else {
          attendanceData.absent++;
        }

        // Group by date
        if (!attendanceData.byDate[record.date]) {
          attendanceData.byDate[record.date] = { present: 0, absent: 0 };
        }
        attendanceData.byDate[record.date][record.status]++;
      });

      reports.attendance = attendanceData;
    }

    if (!type || type === 'enrollment') {
      // Enrollment report
      const enrollmentsSnapshot = await global.db.collection('enrollments').get();
      const enrollmentData = {
        totalEnrollments: enrollmentsSnapshot.size,
        byCourse: {},
        byStatus: { active: 0, inactive: 0, completed: 0 }
      };

      for (const doc of enrollmentsSnapshot.docs) {
        const enrollment = doc.data();
        
        // Count by status
        enrollmentData.byStatus[enrollment.status] = 
          (enrollmentData.byStatus[enrollment.status] || 0) + 1;

        // Count by course
        const courseDoc = await global.db.collection('courses').doc(enrollment.courseId).get();
        if (courseDoc.exists) {
          const courseName = courseDoc.data().courseName;
          enrollmentData.byCourse[courseName] = 
            (enrollmentData.byCourse[courseName] || 0) + 1;
        }
      }

      reports.enrollment = enrollmentData;
    }

    if (!type || type === 'grades') {
      // Grades report
      const gradesSnapshot = await global.db.collection('grades').get();
      const gradesData = {
        totalGrades: gradesSnapshot.size,
        gradeDistribution: {},
        averageGPA: 0
      };

      let totalGradePoints = 0;
      let totalCredits = 0;

      gradesSnapshot.forEach(doc => {
        const grade = doc.data();
        
        // Count grade distribution
        gradesData.gradeDistribution[grade.grade] = 
          (gradesData.gradeDistribution[grade.grade] || 0) + 1;

        // Calculate GPA
        const gradePoint = getGradePoint(grade.grade);
        const credits = grade.credits || 0;
        totalGradePoints += gradePoint * credits;
        totalCredits += credits;
      });

      gradesData.averageGPA = totalCredits > 0 ? 
        Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;

      reports.grades = gradesData;
    }

    res.json({
      reports,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function for grade points
function getGradePoint(grade) {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };
  return gradePoints[grade] || 0.0;
}

// Bulk operations
router.post('/bulk-operations', verifyToken, isAdmin, async (req, res) => {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return res.status(400).json({ error: 'Operation and data are required' });
    }

    const results = [];

    switch (operation) {
      case 'bulk-enroll':
        // Bulk enroll students in courses
        for (const enrollment of data) {
          try {
            const { studentId, courseId } = enrollment;
            
            // Check if already enrolled
            const existingEnrollment = await global.db
              .collection('enrollments')
              .where('studentId', '==', studentId)
              .where('courseId', '==', courseId)
              .get();

            if (existingEnrollment.empty) {
              await global.db.collection('enrollments').add({
                studentId,
                courseId,
                enrolledAt: new Date().toISOString(),
                status: 'active'
              });
              results.push({ studentId, courseId, status: 'enrolled' });
            } else {
              results.push({ studentId, courseId, status: 'already_enrolled' });
            }
          } catch (error) {
            results.push({ 
              studentId: enrollment.studentId, 
              courseId: enrollment.courseId, 
              status: 'error', 
              error: error.message 
            });
          }
        }
        break;

      case 'bulk-grade-update':
        // Bulk update grades
        for (const gradeUpdate of data) {
          try {
            const { studentId, courseId, grade, semester, year } = gradeUpdate;
            
            const gradeData = {
              studentId,
              courseId,
              grade,
              semester: semester || 'current',
              year: year || new Date().getFullYear(),
              updatedAt: new Date().toISOString()
            };

            // Check if grade exists
            const existingGrade = await global.db
              .collection('grades')
              .where('studentId', '==', studentId)
              .where('courseId', '==', courseId)
              .where('semester', '==', gradeData.semester)
              .where('year', '==', gradeData.year)
              .get();

            if (existingGrade.empty) {
              await global.db.collection('grades').add({
                ...gradeData,
                submittedAt: new Date().toISOString()
              });
              results.push({ ...gradeUpdate, status: 'created' });
            } else {
              await existingGrade.docs[0].ref.update(gradeData);
              results.push({ ...gradeUpdate, status: 'updated' });
            }
          } catch (error) {
            results.push({ 
              ...gradeUpdate, 
              status: 'error', 
              error: error.message 
            });
          }
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    res.json({
      message: 'Bulk operation completed',
      operation,
      results
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;