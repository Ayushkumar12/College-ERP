const express = require('express');
const { verifyToken, isAdmin, isStaff } = require('../middleware/auth');

const router = express.Router();

// Get all staff members (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '' } = req.query;
    
    let query = global.db.collection('staff');
    
    // Apply department filter
    if (department) {
      query = query.where('department', '==', department);
    }

    const snapshot = await query.get();
    let staff = [];
    
    snapshot.forEach(doc => {
      const staffData = doc.data();
      delete staffData.password;
      staff.push(staffData);
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      staff = staff.filter(member => 
        member.firstName?.toLowerCase().includes(searchLower) ||
        member.lastName?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.employeeId?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedStaff = staff.slice(startIndex, endIndex);

    res.json({
      staff: paginatedStaff,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(staff.length / limit),
        totalStaff: staff.length,
        hasNext: endIndex < staff.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff member by ID
router.get('/:staffId', verifyToken, isStaff, async (req, res) => {
  try {
    const { staffId } = req.params;
    
    // Check if user can access this staff data
    if (req.user.role !== 'admin' && req.user.uid !== staffId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const staffDoc = await global.db.collection('staff').doc(staffId).get();
    
    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staffData = staffDoc.data();
    delete staffData.password;

    res.json({
      staff: staffData
    });

  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update staff profile
router.put('/:staffId', verifyToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const updates = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== staffId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.uid;
    delete updates.createdAt;

    updates.updatedAt = new Date().toISOString();

    // Check if staff exists
    const staffDoc = await global.db.collection('staff').doc(staffId).get();
    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Update staff document
    await global.db.collection('staff').doc(staffId).update(updates);
    
    // Also update main users collection
    await global.db.collection('users').doc(staffId).update(updates);

    res.json({
      message: 'Staff profile updated successfully',
      updates
    });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff's assigned tasks
router.get('/:staffId/tasks', verifyToken, isStaff, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status, priority } = req.query;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== staffId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = global.db
      .collection('tasks')
      .where('assignedTo', '==', staffId);

    if (status) {
      query = query.where('status', '==', status);
    }
    if (priority) {
      query = query.where('priority', '==', priority);
    }

    const tasksSnapshot = await query.get();
    const tasks = [];

    tasksSnapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    // Sort by priority and due date
    tasks.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
    });

    res.json({
      tasks
    });

  } catch (error) {
    console.error('Get staff tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new task (Admin only)
router.post('/:staffId/tasks', verifyToken, isAdmin, async (req, res) => {
  try {
    const { staffId } = req.params;
    const taskData = req.body;

    // Validate required fields
    const { title, description, priority = 'medium', dueDate } = taskData;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Check if staff exists
    const staffDoc = await global.db.collection('staff').doc(staffId).get();
    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const newTaskData = {
      ...taskData,
      assignedTo: staffId,
      assignedBy: req.user.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const taskRef = await global.db.collection('tasks').add(newTaskData);

    res.status(201).json({
      message: 'Task created successfully',
      task: { id: taskRef.id, ...newTaskData }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task status
router.put('/:staffId/tasks/:taskId', verifyToken, isStaff, async (req, res) => {
  try {
    const { staffId, taskId } = req.params;
    const { status, notes } = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== staffId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if task exists and belongs to staff
    const taskDoc = await global.db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = taskDoc.data();
    if (taskData.assignedTo !== staffId) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (status) {
      updates.status = status;
      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
      }
    }

    if (notes) {
      updates.notes = notes;
    }

    await global.db.collection('tasks').doc(taskId).update(updates);

    res.json({
      message: 'Task updated successfully',
      updates
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff's work schedule
router.get('/:staffId/schedule', verifyToken, isStaff, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== staffId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const scheduleSnapshot = await global.db
      .collection('staff_schedules')
      .where('staffId', '==', staffId)
      .get();

    const schedule = [];
    scheduleSnapshot.forEach(doc => {
      schedule.push({ id: doc.id, ...doc.data() });
    });

    // Sort by day of week and start time
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    schedule.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    res.json({
      schedule
    });

  } catch (error) {
    console.error('Get staff schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update staff schedule (Admin only)
router.put('/:staffId/schedule', verifyToken, isAdmin, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { schedule } = req.body; // Array of schedule objects

    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Schedule must be an array' });
    }

    // Check if staff exists
    const staffDoc = await global.db.collection('staff').doc(staffId).get();
    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Delete existing schedule
    const existingScheduleSnapshot = await global.db
      .collection('staff_schedules')
      .where('staffId', '==', staffId)
      .get();

    const batch = global.db.batch();
    existingScheduleSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add new schedule
    schedule.forEach(scheduleItem => {
      const scheduleRef = global.db.collection('staff_schedules').doc();
      batch.set(scheduleRef, {
        ...scheduleItem,
        staffId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();

    res.json({
      message: 'Staff schedule updated successfully'
    });

  } catch (error) {
    console.error('Update staff schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff attendance/work logs
router.get('/:staffId/attendance', verifyToken, isStaff, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.uid !== staffId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = global.db
      .collection('staff_attendance')
      .where('staffId', '==', staffId);

    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    const attendanceSnapshot = await query.get();
    const attendanceRecords = [];

    attendanceSnapshot.forEach(doc => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });

    // Sort by date (newest first)
    attendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
    const totalHours = attendanceRecords.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);

    res.json({
      attendance: attendanceRecords,
      statistics: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        totalHours,
        averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0
      }
    });

  } catch (error) {
    console.error('Get staff attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clock in/out for staff
router.post('/:staffId/clock', verifyToken, isStaff, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { action } = req.body; // 'in' or 'out'

    // Check permissions
    if (req.user.uid !== staffId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['in', 'out'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "in" or "out"' });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString();

    // Check if there's already an attendance record for today
    const todayAttendanceQuery = await global.db
      .collection('staff_attendance')
      .where('staffId', '==', staffId)
      .where('date', '==', today)
      .get();

    if (action === 'in') {
      if (!todayAttendanceQuery.empty) {
        return res.status(400).json({ error: 'Already clocked in today' });
      }

      // Create new attendance record
      const attendanceData = {
        staffId,
        date: today,
        clockInTime: currentTime,
        status: 'present',
        createdAt: currentTime,
        updatedAt: currentTime
      };

      await global.db.collection('staff_attendance').add(attendanceData);

      res.json({
        message: 'Clocked in successfully',
        clockInTime: currentTime
      });

    } else { // action === 'out'
      if (todayAttendanceQuery.empty) {
        return res.status(400).json({ error: 'No clock-in record found for today' });
      }

      const attendanceDoc = todayAttendanceQuery.docs[0];
      const attendanceData = attendanceDoc.data();

      if (attendanceData.clockOutTime) {
        return res.status(400).json({ error: 'Already clocked out today' });
      }

      // Calculate hours worked
      const clockInTime = new Date(attendanceData.clockInTime);
      const clockOutTime = new Date(currentTime);
      const hoursWorked = Math.round(((clockOutTime - clockInTime) / (1000 * 60 * 60)) * 100) / 100;

      // Update attendance record
      await attendanceDoc.ref.update({
        clockOutTime: currentTime,
        hoursWorked,
        updatedAt: currentTime
      });

      res.json({
        message: 'Clocked out successfully',
        clockOutTime: currentTime,
        hoursWorked
      });
    }

  } catch (error) {
    console.error('Clock in/out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete staff member (Admin only)
router.delete('/:staffId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check if staff exists
    const staffDoc = await global.db.collection('staff').doc(staffId).get();
    if (!staffDoc.exists) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Delete from staff collection
    await global.db.collection('staff').doc(staffId).delete();
    
    // Delete from users collection
    await global.db.collection('users').doc(staffId).delete();

    // Delete related data
    const batch = global.db.batch();

    // Delete tasks
    const tasksSnapshot = await global.db
      .collection('tasks')
      .where('assignedTo', '==', staffId)
      .get();
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete schedule
    const scheduleSnapshot = await global.db
      .collection('staff_schedules')
      .where('staffId', '==', staffId)
      .get();
    scheduleSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete attendance records
    const attendanceSnapshot = await global.db
      .collection('staff_attendance')
      .where('staffId', '==', staffId)
      .get();
    attendanceSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    res.json({
      message: 'Staff member deleted successfully'
    });

  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;