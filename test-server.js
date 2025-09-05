const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Testing Server Components...\n');

// Test 1: Basic Express setup
console.log('1. Testing Express setup...');
const app = express();
console.log('✅ Express app created');

// Test 2: Middleware
console.log('2. Testing middleware...');
app.use(cors());
app.use(express.json());
console.log('✅ Middleware configured');

// Test 3: Firebase Admin
console.log('3. Testing Firebase Admin...');
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  
  global.admin = admin;
  global.db = admin.firestore();
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin failed:', error.message);
  process.exit(1);
}

// Test 4: Routes
console.log('4. Testing route imports...');
try {
  const authRoutes = require('./src/backend/routes/authRoutes');
  console.log('✅ Auth routes imported');
  
  const studentRoutes = require('./src/backend/routes/studentRoutes');
  console.log('✅ Student routes imported');
  
  const facultyRoutes = require('./src/backend/routes/facultyRoutes');
  console.log('✅ Faculty routes imported');
  
  const adminRoutes = require('./src/backend/routes/adminRoutes');
  console.log('✅ Admin routes imported');
  
  const staffRoutes = require('./src/backend/routes/staffRoutes');
  console.log('✅ Staff routes imported');
  
  const attendanceRoutes = require('./src/backend/routes/attendanceRoutes');
  console.log('✅ Attendance routes imported');
  
  // Add routes to app
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/faculty', facultyRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/attendance', attendanceRoutes);
  console.log('✅ All routes configured');
  
} catch (error) {
  console.error('❌ Route import failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Test 5: Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    firebase: global.admin ? 'Connected' : 'Disconnected'
  });
});

// Test 6: Start server
console.log('5. Testing server startup...');
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log('\n🎉 All tests passed! Server is ready.');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});