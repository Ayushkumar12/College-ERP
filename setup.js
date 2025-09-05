const fs = require('fs');
const path = require('path');

console.log('🚀 College ERP System Setup');
console.log('============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Please create a .env file with your Firebase configuration.');
  console.log('📖 Check README.md for detailed setup instructions.\n');
  process.exit(1);
}

// Read .env file and check for required variables
const envContent = fs.readFileSync(envPath, 'utf8');
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'FIREBASE_PROJECT_ID',
  'JWT_SECRET'
];

const missingVars = [];
requiredVars.forEach(varName => {
  if (!envContent.includes(varName + '=') || envContent.includes(varName + '=your_')) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing or incomplete environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please update your .env file with actual values.');
  console.log('📖 Check README.md for detailed setup instructions.\n');
  process.exit(1);
}

console.log('✅ Environment configuration looks good!');
console.log('✅ All required dependencies should be installed.');
console.log('\n🎯 Next Steps:');
console.log('1. Make sure your Firebase project is set up with Firestore');
console.log('2. Update Firestore security rules (see README.md)');
console.log('3. Run the development servers:');
console.log('   npm run server:dev  (in one terminal)');
console.log('   npm run dev         (in another terminal)');
console.log('\n🌐 The application will be available at:');
console.log('   Frontend: http://localhost:5173');
console.log('   Backend:  http://localhost:5000');
console.log('   Health:   http://localhost:5000/api/health');
console.log('\n📱 Demo Accounts:');
console.log('   Admin:    admin@college.edu / admin123');
console.log('   Faculty:  faculty@college.edu / faculty123');
console.log('   Student:  student@college.edu / student123');
console.log('   Staff:    staff@college.edu / staff123');
console.log('\n🎉 Setup complete! Happy coding!');