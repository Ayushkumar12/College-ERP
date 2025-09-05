require('dotenv').config();
const admin = require('firebase-admin');

console.log('🔥 Testing Firebase Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');

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

console.log('\n🔧 Service Account Configuration:');
console.log('- Project ID:', serviceAccount.project_id);
console.log('- Client Email:', serviceAccount.client_email);
console.log('- Private Key ID:', serviceAccount.private_key_id);
console.log('- Private Key Length:', serviceAccount.private_key ? serviceAccount.private_key.length : 'Missing');

try {
  console.log('\n🚀 Initializing Firebase Admin...');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  
  console.log('✅ Firebase Admin initialized successfully!');
  
  const db = admin.firestore();
  console.log('✅ Firestore database connection established!');
  
  // Test a simple operation
  console.log('\n🧪 Testing Firestore operation...');
  
  db.collection('test').doc('connection-test').set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    message: 'Firebase connection test successful'
  }).then(() => {
    console.log('✅ Firestore write test successful!');
    
    // Clean up test document
    return db.collection('test').doc('connection-test').delete();
  }).then(() => {
    console.log('✅ Firestore delete test successful!');
    console.log('\n🎉 All Firebase tests passed! Your configuration is working correctly.');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Firestore operation failed:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.error('\n🔍 Common issues:');
  console.error('1. Check if your private key is properly formatted');
  console.error('2. Ensure all Firebase environment variables are set');
  console.error('3. Verify your Firebase project has Firestore enabled');
  console.error('4. Check if your service account has proper permissions');
  process.exit(1);
}