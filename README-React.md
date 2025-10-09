# CS Learning Hub - React Version

A modern, React-based learning management system built with Firebase.

## 🚀 Features

- **Modern React Architecture**: Built with React 18, React Router, and modern hooks
- **Firebase Integration**: Authentication, Firestore database, Cloud Functions
- **Admin Dashboard**: Complete CRUD operations for activities, announcements, and user management
- **Student Portal**: Progress tracking, leaderboard, and activity management
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Real-time Updates**: Live data synchronization with Firebase

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM, CSS3
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting)
- **Build Tool**: Vite
- **Deployment**: Firebase Hosting

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React Context providers
│   │   ├── firebase/       # Firebase configuration and utilities
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main App component
├── functions/              # Firebase Cloud Functions
├── firestore.rules        # Firestore security rules
├── storage.rules          # Firebase Storage rules
└── firebase.json          # Firebase configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project set up

### Installation

1. **Clone and install dependencies**:
```bash
git clone <your-repo>
cd courses
cd client && npm install
```

2. **Configure Firebase**:
   - Update `client/src/firebase/config.js` with your Firebase config
   - Ensure your Firebase project has Authentication, Firestore, and Functions enabled

3. **Development**:
```bash
# Start development server
npm run dev

# Or from root directory
cd client && npm run dev
```

4. **Build and Deploy**:
```bash
# Build the React app
npm run build

# Deploy to Firebase Hosting
npm run deploy

# Or deploy only hosting
npm run deploy:hosting
```

## 🔧 Configuration

### Firebase Setup

1. **Authentication**: Enable Email/Password authentication in Firebase Console
2. **Firestore**: Import your existing Firestore rules and data
3. **Functions**: Deploy the existing Cloud Functions for admin claims and allowlist management

### Environment Variables

Create a `.env` file in the `client` directory if needed for additional configuration.

## 📱 Usage

### For Students:
1. Sign up with an email from the allowlist
2. Browse and complete activities
3. Track progress and view leaderboard
4. Receive announcements

### For Admins:
1. Sign in with an admin email
2. Access the Dashboard from the navigation
3. Manage activities, announcements, and users
4. Update the allowlist for new students

## 🔐 Admin Access

To become an admin:
1. Add your email to the `adminEmails` array in Firestore `config/allowlist` document
2. Sign out and sign back in to refresh your token
3. You'll now see the Dashboard link in the navigation

## 🚀 Deployment Options

### Firebase Hosting (Recommended)
```bash
npm run deploy
```

### Vercel
1. Connect your GitHub repo to Vercel
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/dist`
4. Deploy automatically on push

### GitHub Pages
1. Build the app: `npm run build`
2. Deploy the `client/dist` folder to GitHub Pages

## 🔄 Migration from Static HTML

The React version maintains all functionality from the original static HTML version:

- ✅ All Firebase integrations preserved
- ✅ Admin dashboard functionality enhanced
- ✅ User authentication and roles maintained
- ✅ Firestore rules and data structure unchanged
- ✅ Cloud Functions remain the same

## 🐛 Troubleshooting

### Common Issues:

1. **Build Errors**: Ensure all dependencies are installed in the `client` directory
2. **Firebase Connection**: Check your Firebase config in `client/src/firebase/config.js`
3. **Admin Access**: Verify your email is in the Firestore allowlist and you've signed out/in
4. **Deployment**: Make sure Firebase CLI is logged in (`firebase login`)

## 📝 Development Commands

```bash
# Development
npm run dev              # Start dev server
cd client && npm run dev # Alternative

# Building
npm run build           # Build for production
cd client && npm run build

# Deployment
npm run deploy          # Full deployment
npm run deploy:hosting  # Hosting only
npm run deploy:functions # Functions only
npm run deploy:firestore # Firestore rules only

# Preview
npm run preview         # Preview production build
```

## 🎯 Next Steps

1. **Test the Application**: Ensure all features work correctly
2. **Add More Features**: Consider adding real-time chat, file uploads, etc.
3. **Performance Optimization**: Implement code splitting and lazy loading
4. **Testing**: Add unit and integration tests
5. **CI/CD**: Set up automated deployment pipelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
