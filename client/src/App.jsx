import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import useRealTimeUpdates from './hooks/useRealTimeUpdates';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProgressPage from './pages/ProgressPage';
import ChatPage from './pages/ChatPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ActivitiesPage from './pages/ActivitiesPage';
import StudentProgressPage from './pages/StudentProgressPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import ResourcesPage from './pages/ResourcesPage';
import SMTPConfigPage from './pages/SMTPConfigPage';
import './App.css';
import './styles/colors.css';

const AppContent = () => {
  // useRealTimeUpdates(); // Temporarily disabled to fix notification spam
  
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/student-progress" element={<StudentProgressPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/smtp-config" element={<SMTPConfigPage />} />
          <Route path="/enrollments" element={<EnrollmentsPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <Router>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </Router>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}

export default App;
