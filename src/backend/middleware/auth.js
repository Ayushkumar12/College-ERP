const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Verify Firebase token (alternative authentication method)
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid Firebase token.' });
  }
};

// Role-based access control
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = authorize(['admin']);

// Check if user is faculty
const isFaculty = authorize(['faculty', 'admin']);

// Check if user is staff
const isStaff = authorize(['staff', 'admin']);

// Check if user is student
const isStudent = authorize(['student', 'faculty', 'admin']);

// Check if user can access student data (student themselves, faculty, or admin)
const canAccessStudentData = (req, res, next) => {
  const userRole = req.user.role;
  const requestedStudentId = req.params.studentId || req.body.studentId;
  
  if (userRole === 'admin' || userRole === 'faculty') {
    return next();
  }
  
  if (userRole === 'student' && req.user.uid === requestedStudentId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied. Cannot access this student data.' });
};

module.exports = {
  verifyToken,
  verifyFirebaseToken,
  authorize,
  isAdmin,
  isFaculty,
  isStaff,
  isStudent,
  canAccessStudentData
};