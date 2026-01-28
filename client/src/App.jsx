import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/Navbar';
import { ErrorBoundary, HelpDrawer } from './components/shared';
import { ThemeProvider } from './contexts/ThemeContext';
import { ColorThemeProvider } from './contexts/ColorThemeContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import { HelpProvider } from './contexts/HelpContext';
import ActivityDetailPage from './pages/ActivityDetailPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AttendancePage from './pages/AttendancePage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import HRAttendancePage from './pages/HRAttendancePage';
import HRPenaltiesPage from './pages/HRPenaltiesPage';
import InstructorParticipationPage from './pages/InstructorParticipationPage';
import InstructorBehaviorPage from './pages/InstructorBehaviorPage';
import InstructorQRScannerPage from './pages/InstructorQRScannerPage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import MigrationPage from './pages/MigrationPage';
import ManageEnrollmentsPage from './pages/ManageEnrollmentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import analytics from './utils/analytics.js';
import RoleAccessPro from './pages/RoleAccessPro';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import CourseProgressDetailPage from './pages/CourseProgressDetailPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizPreviewPage from './pages/QuizPreviewPage';
import MyEnrollmentsPage from './pages/MyEnrollmentsPage';
import StudentQuizPage from './pages/StudentQuizPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuizResultsPage from './pages/QuizResultsPage';
import PostHogTestPage from './pages/PostHogTestPage';
import ReviewResultsPage from './pages/ReviewResultsPage';
import ProgramsManagementPage from './pages/ProgramsManagementPage';
import SubjectsManagementPage from './pages/SubjectsManagementPage';
import ScheduledReportsPage from './pages/ScheduledReportsPage';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import FancyLoading from './components/ui/FancyLoading/FancyLoading';

// Lazy loaded heavy components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MarksEntryPage = lazy(() => import('./pages/MarksEntryPage'));
import './App.css';
import './styles/colors.css';
import './styles/theme.css';

// Track page views
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    console.log('🔍 PageTracker - Route changed:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: new Date().toISOString()
    });
    
    // Use PostHog directly since PostHogProvider manages the instance
    if (window.posthog) {
      analytics.trackPageVisit(location.pathname, {
        search: location.search,
        hash: location.hash,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('🔍 PageTracker - PostHog not ready yet');
    }
  }, [location]);
  
  return null;
}

const AppContent = () => {
  // useRealTimeUpdates(); // Temporarily disabled to fix notification spam
  
  return (
    <div className="app">
      <PageTracker />
      <HelpProvider>
        <Navbar />
        <HelpDrawer />
        <main className="main-content">
        <Suspense fallback={<FancyLoading fullscreen={true} />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* ActivitiesPage, ResourcesPage, QuizResultsPage routes removed - unified in HomePage with ?mode= */}
          <Route path="/activities" element={<Navigate to="/?mode=activities" replace />} />
          <Route path="/resources" element={<Navigate to="/?mode=resources" replace />} />
          <Route path="/quiz-results" element={<Navigate to="/review-results?mode=quiz" replace />} />
          <Route path="/review-results" element={<ReviewResultsPage />} />
          <Route path="/activity/:activityId" element={<ActivityDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/progress" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/enrollments" element={<EnrollmentsPage />} />
          {/* AwardMedalsPage route removed - DEPRECATED */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/my-attendance" element={<StudentAttendancePage />} />
          <Route path="/hr-attendance" element={<HRAttendancePage />} />
          <Route path="/hr-penalties" element={<HRPenaltiesPage />} />
          <Route path="/instructor-participation" element={<InstructorParticipationPage />} />
          <Route path="/instructor-behavior" element={<InstructorBehaviorPage />} />
          <Route path="/qr-scanner" element={<InstructorQRScannerPage />} />
          <Route path="/class-schedules" element={<ClassSchedulePage />} />
          <Route path="/migration" element={<MigrationPage />} />
          <Route path="/manage-enrollments" element={<ManageEnrollmentsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
          <Route path="/role-access-pro" element={<RoleAccessPro />} />
          {/* Redirect old student-profile to new unified dashboard */}
          <Route path="/student-profile" element={<StudentProfilePage />} />
          <Route path="/student-dashboard" element={<StudentDashboardPage />} />
          <Route path="/my-enrollments" element={<MyEnrollmentsPage />} />
          <Route path="/course-progress/:courseId" element={<CourseProgressDetailPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quiz-management" element={<Navigate to="/quizzes" replace />} />
          <Route path="/quiz-builder" element={<Navigate to="/quizzes?mode=add" replace />} />
          <Route path="/quiz-preview/:quizId" element={<QuizPreviewPage />} />
          <Route path="/quiz/:quizId" element={<StudentQuizPage />} />
          {/* QuizResultsPage route removed - unified in HomePage with ?mode=quizzes */}
          {/* PostHog Test Page */}
          <Route path="/posthog-test" element={<PostHogTestPage />} />
          {/* Programs & Subjects Management */}
          <Route path="/programs" element={<ProgramsManagementPage />} />
          <Route path="/subjects" element={<SubjectsManagementPage />} />
          <Route path="/marks-entry" element={<MarksEntryPage />} />
          <Route path="/scheduled-reports" element={<ScheduledReportsPage />} />
          {/* Class Story removed */}
        </Routes>
        </Suspense>
        </main>
      </HelpProvider>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <ColorThemeProvider>
              <Router>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </Router>
            </ColorThemeProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
