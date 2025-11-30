import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import useRealTimeUpdates from './hooks/useRealTimeUpdates';
import { ThemeProvider } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProgressPage from './pages/ProgressPage';
import ChatPage from './pages/ChatPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import StudentProgressPage from './pages/StudentProgressPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import ResourcesPage from './pages/ResourcesPage';
import SMTPConfigPage from './pages/SMTPConfigPage';
import AwardMedalsPage from './pages/AwardMedalsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AttendancePage from './pages/AttendancePage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import HRAttendancePage from './pages/HRAttendancePage';
import ManualAttendancePage from './pages/ManualAttendancePage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import ManageEnrollmentsPage from './pages/ManageEnrollmentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import RoleAccessPage from './pages/RoleAccessPage';
import RoleAccessPro from './pages/RoleAccessPro';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import CourseProgressDetailPage from './pages/CourseProgressDetailPage';
import QuizManagementPage from './pages/QuizManagementPage';
import QuizPreviewPage from './pages/QuizPreviewPage';
import QuizBuilderPage from './pages/QuizBuilderPage';
import MyEnrollmentsPage from './pages/MyEnrollmentsPage';
import StudentQuizPage from './pages/StudentQuizPage';
import QuizResultsPage from './pages/QuizResultsPage';
import QuestionBankPage from './pages/QuestionBankPage';
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
          <Route path="/activity/:activityId" element={<ActivityDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/student-progress" element={<StudentProgressPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/smtp-config" element={<SMTPConfigPage />} />
          <Route path="/enrollments" element={<EnrollmentsPage />} />
          <Route path="/award-medals/:classId" element={<AwardMedalsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/attendance-management" element={<ManualAttendancePage />} />
          <Route path="/my-attendance" element={<StudentAttendancePage />} />
          <Route path="/hr-attendance" element={<HRAttendancePage />} />
          <Route path="/class-schedules" element={<ClassSchedulePage />} />
          <Route path="/manage-enrollments" element={<ManageEnrollmentsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
          <Route path="/role-access" element={<RoleAccessPage />} />
          <Route path="/role-access-pro" element={<RoleAccessPro />} />
          {/* Redirect old student-profile to new unified dashboard */}
          <Route path="/student-profile" element={<StudentDashboardPage />} />
          <Route path="/student-dashboard" element={<StudentDashboardPage />} />
          <Route path="/my-enrollments" element={<MyEnrollmentsPage />} />
          <Route path="/course-progress/:courseId" element={<CourseProgressDetailPage />} />
          <Route path="/quiz-management" element={<QuizManagementPage />} />
          <Route path="/quiz-preview/:quizId" element={<QuizPreviewPage />} />
          <Route path="/quiz-builder" element={<QuizBuilderPage />} />
          <Route path="/quiz/:quizId" element={<StudentQuizPage />} />
          <Route path="/quiz-results" element={<QuizResultsPage />} />
          {/* Class Story removed */}
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <Router>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </Router>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
