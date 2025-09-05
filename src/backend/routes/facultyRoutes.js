const express = require('express');
const { verifyToken, isAdmin, isFaculty } = require('../middleware/auth');

const router = express.Router();

// Get all faculty members (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '' } = req.query;
    
    let query = global.db.collection('faculty');
    
    // Apply department filter
    if (department) {
      query = query.where('department', '==', department);
    }

    const snapshot = await query.get();
    let faculty = [];
    
    snapshot.forEach(doc => {
      const facultyData = doc.data();
      delete facultyData.password;
      faculty.push(facultyData);
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      faculty = faculty.filter(member => 
        member.firstName?.toLowerCase().includes(searchLower) ||
        member.lastName?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.employeeId?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFaculty = faculty.slice(startIndex, endIndex);

    res.json({
      faculty: paginatedFaculty,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(faculty.length / limit),
        totalFaculty: faculty.length,
        hasNext: endIndex < faculty.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get faculty member by ID
router.get('/:facultyId', verifyToken, isFaculty, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Check if user can access this faculty data
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const facultyDoc = await global.db.collection('faculty').doc(facultyId).get();
    
    if (!facultyDoc.exists) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    const facultyData = facultyDoc.data();
    delete facultyData.password;

    res.json({
      faculty: facultyData
    });

  } catch (error) {
    console.error('Get faculty member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update faculty profile
router.put('/:facultyId', verifyToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const updates = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.uid;
    delete updates.createdAt;

    updates.updatedAt = new Date().toISOString();

    // Check if faculty exists
    const facultyDoc = await global.db.collection('faculty').doc(facultyId).get();
    if (!facultyDoc.exists) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    // Update faculty document
    await global.db.collection('faculty').doc(facultyId).update(updates);
    
    // Also update main users collection
    await global.db.collection('users').doc(facultyId).update(updates);

    res.json({
      message: 'Faculty profile updated successfully',
      updates
    });

  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get faculty's assigned courses
router.get('/:facultyId/courses', verifyToken, isFaculty, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const coursesSnapshot = await global.db
      .collection('courses')
      .where('facultyId', '==', facultyId)
      .get();

    const courses = [];
    coursesSnapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      courses
    });

  } catch (error) {
    console.error('Get faculty courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course (Faculty can create, Admin can assign to any faculty)
router.post('/:facultyId/courses', verifyToken, isFaculty, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const courseData = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate required fields
    const { courseName, courseCode, credits, department, semester, year } = courseData;
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

    const newCourseData = {
      ...courseData,
      facultyId,
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
router.put('/:facultyId/courses/:courseId', verifyToken, isFaculty, async (req, res) => {
  try {
    const { facultyId, courseId } = req.params;
    const updates = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if course exists and belongs to faculty
    const courseDoc = await global.db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = courseDoc.data();
    if (courseData.facultyId !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this course' });
    }

    delete updates.facultyId;
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

// Get students enrolled in faculty's courses
router.get('/:facultyId/students', verifyToken, isFaculty, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { courseId } = req.query;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let coursesQuery = global.db.collection('courses').where('facultyId', '==', facultyId);
    
    if (courseId) {
      coursesQuery = coursesQuery.where(global.admin.firestore.FieldPath.documentId(), '==', courseId);
    }

    const coursesSnapshot = await coursesQuery.get();
    const courseIds = [];
    coursesSnapshot.forEach(doc => courseIds.push(doc.id));

    if (courseIds.length === 0) {
      return res.json({ students: [] });
    }

    // Get enrollments for these courses
    const students = [];
    for (const courseId of courseIds) {
      const enrollmentsSnapshot = await global.db
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .get();

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Get student details
        const studentDoc = await global.db.collection('students').doc(enrollment.studentId).get();
        if (studentDoc.exists) {
          const studentData = studentDoc.data();
          delete studentData.password;
          
          students.push({
            ...studentData,
            courseId,
            enrollmentStatus: enrollment.status
          });
        }
      }
    }

    res.json({
      students
    });

  } catch (error) {
    console.error('Get faculty students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit grades for students
router.post('/:facultyId/grades', verifyToken, isFaculty, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { grades } = req.body; // Array of { studentId, courseId, grade, credits, semester, year }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ error: 'Grades array is required' });
    }

    const batch = global.db.batch();
    const results = [];

    for (const gradeData of grades) {
      const { studentId, courseId, grade, credits, semester, year } = gradeData;

      // Validate required fields
      if (!studentId || !courseId || !grade) {
        continue; // Skip invalid entries
      }

      // Verify course belongs to faculty
      const courseDoc = await global.db.collection('courses').doc(courseId).get();
      if (!courseDoc.exists || courseDoc.data().facultyId !== facultyId) {
        continue; // Skip unauthorized courses
      }

      // Check if grade already exists
      const existingGradeQuery = await global.db
        .collection('grades')
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .where('semester', '==', semester)
        .where('year', '==', year)
        .get();

      const gradeRecord = {
        studentId,
        courseId,
        facultyId,
        grade,
        credits: credits || courseDoc.data().credits || 0,
        semester: semester || 'current',
        year: year || new Date().getFullYear(),
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingGradeQuery.empty) {
        // Create new grade
        const gradeRef = global.db.collection('grades').doc();
        batch.set(gradeRef, gradeRecord);
        results.push({ action: 'created', ...gradeRecord });
      } else {
        // Update existing grade
        const existingGradeDoc = existingGradeQuery.docs[0];
        batch.update(existingGradeDoc.ref, gradeRecord);
        results.push({ action: 'updated', ...gradeRecord });
      }
    }

    await batch.commit();

    res.json({
      message: 'Grades submitted successfully',
      results
    });

  } catch (error) {
    console.error('Submit grades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get faculty's schedule/timetable
router.get('/:facultyId/schedule', verifyToken, isFaculty, async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== facultyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const scheduleSnapshot = await global.db
      .collection('schedules')
      .where('facultyId', '==', facultyId)
      .get();

    const schedule = [];
    for (const doc of scheduleSnapshot.docs) {
      const scheduleData = { id: doc.id, ...doc.data() };
      
      // Get course details
      const courseDoc = await global.db.collection('courses').doc(scheduleData.courseId).get();
      if (courseDoc.exists) {
        scheduleData.courseDetails = courseDoc.data();
      }
      
      schedule.push(scheduleData);
    }

    res.json({
      schedule
    });

  } catch (error) {
    console.error('Get faculty schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete faculty member (Admin only)
router.delete('/:facultyId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Check if faculty exists
    const facultyDoc = await global.db.collection('faculty').doc(facultyId).get();
    if (!facultyDoc.exists) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    // Delete from faculty collection
    await global.db.collection('faculty').doc(facultyId).delete();
    
    // Delete from users collection
    await global.db.collection('users').doc(facultyId).delete();

    // Update courses to remove faculty assignment
    const coursesSnapshot = await global.db
      .collection('courses')
      .where('facultyId', '==', facultyId)
      .get();

    const batch = global.db.batch();
    coursesSnapshot.forEach(doc => {
      batch.update(doc.ref, { 
        facultyId: null, 
        updatedAt: new Date().toISOString() 
      });
    });

    await batch.commit();

    res.json({
      message: 'Faculty member deleted successfully'
    });

  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;