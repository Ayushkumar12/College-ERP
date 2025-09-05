# College ERP System

A comprehensive Enterprise Resource Planning (ERP) system for colleges built with React.js, Express.js, and Firebase. Features include student management, faculty management, admin controls, staff management, and QR code-based attendance tracking.

## Features

### 🎓 Student Features
- Student dashboard with course overview
- QR code scanning for attendance marking
- View attendance records and statistics
- Grade viewing and academic progress tracking
- Profile management

### 👨‍🏫 Faculty Features
- Faculty dashboard with course management
- Generate QR codes for attendance sessions
- View and manage student attendance
- Grade management and submission
- Student enrollment tracking

### 👨‍💼 Admin Features
- Comprehensive admin dashboard
- User management (students, faculty, staff)
- Course creation and management
- System-wide reports and analytics
- Bulk operations and data management

### 👷‍♂️ Staff Features
- Staff dashboard with task management
- Time tracking and attendance
- Work schedule management
- Profile and task updates

### 📱 QR Code Attendance System
- Real-time QR code generation for attendance sessions
- Mobile-friendly QR code scanning
- Automatic attendance marking with location tracking
- Session-based attendance with expiration times
- Comprehensive attendance reports and statistics

## Technology Stack

### Frontend
- **React.js** - User interface framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React QR Code** - QR code generation
- **QR Scanner** - QR code scanning functionality

### Backend
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Database and authentication
- **Firebase Firestore** - NoSQL database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **QRCode** - Server-side QR code generation
- **UUID** - Unique identifier generation

### Database
- **Firebase Firestore** - Cloud NoSQL database
- **Firebase Authentication** - User authentication service
- **Firebase Storage** - File storage (for future use)

## Project Structure

```
erp/
├── src/
│   ├── backend/
│   │   ├── middleware/
│   │   │   └── auth.js              # Authentication middleware
│   │   └── routes/
│   │       ├── authRoutes.js        # Authentication routes
│   │       ├── studentRoutes.js     # Student management routes
│   │       ├── facultyRoutes.js     # Faculty management routes
│   │       ├── adminRoutes.js       # Admin management routes
│   │       ├── staffRoutes.js       # Staff management routes
│   │       └── attendanceRoutes.js  # Attendance management routes
│   ├── components/
│   │   ├── common/
│   │   │   └── LoadingSpinner.jsx   # Loading component
│   │   └── attendance/
│   │       └── QRScanner.jsx        # QR code scanner component
│   ├── contexts/
│   │   └── AuthContext.jsx          # Authentication context
│   ├── pages/
│   │   ├── auth/                    # Authentication pages
│   │   ├── student/                 # Student dashboard
│   │   ├── faculty/                 # Faculty dashboard
│   │   ├── admin/                   # Admin dashboard
│   │   ├── staff/                   # Staff dashboard
│   │   └── ...                      # Other pages
│   ├── services/
│   │   └── api.js                   # API service layer
│   ├── config/
│   │   └── firebase.js              # Firebase configuration
│   └── App.jsx                      # Main application component
├── server.js                        # Express server entry point
├── package.json                     # Dependencies and scripts
└── .env                            # Environment variables
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore enabled

### 1. Clone the Repository
```bash
git clone <repository-url>
cd erp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup

#### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (Email/Password)

#### Get Firebase Configuration
1. Go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click on "Web app" and copy the config object

#### Generate Service Account Key
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# Firebase Web Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Backend Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project_id.iam.gserviceaccount.com
```

### 5. Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Students collection
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == studentId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty']);
    }
    
    // Faculty collection
    match /faculty/{facultyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == facultyId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Staff collection
    match /staff/{staffId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == staffId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty'];
    }
    
    // Attendance collections
    match /attendance/{attendanceId} {
      allow read, write: if request.auth != null;
    }
    
    match /attendance_sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Enrollments
    match /enrollments/{enrollmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow admin full access
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 6. Run the Application

#### Development Mode
```bash
# Start the backend server
npm run server:dev

# In another terminal, start the frontend
npm run dev
```

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the production server
npm run server
```

### 7. Access the Application

- Frontend: http://localhost:5173 (development) or http://localhost:5000 (production)
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Demo Accounts

The system includes demo accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | admin123 |
| Faculty | faculty@college.edu | faculty123 |
| Student | student@college.edu | student123 |
| Staff | staff@college.edu | staff123 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students (Admin)
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/:id/courses` - Get student's courses
- `GET /api/students/:id/attendance` - Get student's attendance
- `GET /api/students/:id/grades` - Get student's grades

### Faculty
- `GET /api/faculty` - Get all faculty (Admin)
- `GET /api/faculty/:id` - Get faculty by ID
- `GET /api/faculty/:id/courses` - Get faculty's courses
- `POST /api/faculty/:id/courses` - Create new course
- `GET /api/faculty/:id/students` - Get faculty's students

### Attendance
- `POST /api/attendance/generate-qr` - Generate QR code (Faculty)
- `POST /api/attendance/mark-attendance` - Mark attendance (Student)
- `GET /api/attendance/sessions` - Get attendance sessions
- `GET /api/attendance/statistics` - Get attendance statistics

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/reports` - Get system reports

## Features in Detail

### QR Code Attendance System

The QR code attendance system works as follows:

1. **Faculty generates QR code**: Faculty selects a course and creates an attendance session with a specified duration
2. **QR code contains session data**: The QR code includes session ID, course ID, timestamp, and other metadata
3. **Students scan QR code**: Students use their mobile devices to scan the QR code through the web application
4. **Automatic attendance marking**: The system verifies the session, checks enrollment, and marks attendance
5. **Real-time updates**: Attendance counts are updated in real-time for faculty to monitor

### Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Firebase security rules
- Input validation and sanitization
- CORS protection
- Rate limiting (can be added)

### Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- QR code scanning works on mobile devices with camera access

## Deployment

### Environment Variables for Production

Update the following for production:

```env
NODE_ENV=production
VITE_API_BASE_URL=https://your-domain.com/api
```

### Build for Production

```bash
npm run build
```

### Deploy to Hosting Service

The built files will be in the `dist` directory. You can deploy to:
- Vercel
- Netlify
- Firebase Hosting
- Heroku
- AWS
- Any other hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## Future Enhancements

- [ ] Email notifications
- [ ] SMS integration
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] File upload and management
- [ ] Calendar integration
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Dark mode theme