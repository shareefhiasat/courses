import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/ui/Navbar/Navbar';
import { ErrorBoundary, HelpDrawer, CollapsibleSideWindow, NotificationDrawer, RankDisplay, RankHistory, VariableHelper, StudentQRCodeDisplay, StudentQuickActionModal, ToastProvider, useToast, SideDrawer } from '@ui';
import { ThemeProvider } from './contexts/ThemeContext';
import { ColorThemeProvider } from './contexts/ColorThemeContext';
import logger from './utils/logger';
import HomePage from './pages/auth/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ChatPage from './pages/communications/chat/ChatPage';
import { HelpProvider } from './contexts/HelpContext';
import ActivityDetailPage from './pages/academic/activities/ActivityDetailPage';
import NotificationsPage from './pages/communications/notifications/NotificationsPage';
import ProfileSettingsPage from './pages/users/ProfileSettingsPage';
import AttendancePage from './pages/operations/attendance/AttendancePage';
import StudentAttendancePage from './pages/operations/attendance/StudentAttendancePage';
import HRAttendancePage from './pages/operations/attendance/HRAttendancePage';
import PenaltiesPage from './pages/operations/behavior/PenaltiesPage';
import ParticipationPage from './pages/operations/behavior/ParticipationPage';
import BehaviorPage from './pages/operations/behavior/BehaviorPage';
import InstructorQRScannerPage from './pages/operations/attendance/InstructorQRScannerPage';
import QRCodeDisplayPage from './pages/operations/attendance/QRCodeDisplayPage';
import ClassSchedulePage from './pages/classes/ClassSchedulePage';
import EnrollmentsPage from './pages/enrollments/EnrollmentsPage';
import AnalyticsPage from './pages/feedback/analytics/AnalyticsPage';
import analytics from './utils/analytics.js';
import RoleAccessPro from './pages/system/RoleAccessPro';
import StudentProfilePage from './pages/users/StudentProfilePage';
import StudentDashboardPage from './pages/dashboard/StudentDashboardPage';
import QuizzesPage from './pages/academic/quizzes/QuizzesPage';
import QuizPreviewPage from './pages/academic/quizzes/QuizPreviewPage';
import StudentQuizPage from './pages/academic/quizzes/StudentQuizPage';
import QuestionBankPage from './pages/academic/quizzes/QuestionBankPage';
import QuizResultsPage from './pages/quiz-results/QuizResultsPage';
import ReviewResultsPage from './pages/quiz-results/ReviewResultsPage';
import ProgramsManagementPage from './pages/academic/programs/ProgramsManagementPage';
import SubjectsManagementPage from './pages/academic/subjects/SubjectsManagementPage';
import ScheduledReportsPage from './pages/feedback/reports/ScheduledReportsPage';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import FancyLoading from './components/ui/FancyLoading/FancyLoading';

// Handle MobX State Tree errors globally
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Suppress MobX State Tree errors
    if (args[0] && typeof args[0] === 'string' && args[0].includes('mobx-state-tree')) {
      return;
    }
    if (args[0] && args[0].message && args[0].message.includes('mobx-state-tree')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('mobx-state-tree')) {
      event.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('mobx-state-tree')) {
      event.preventDefault();
      return false;
    }
  });
}

// Lazy loaded heavy components
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const MarksEntryPage = lazy(() => import('./pages/grading/MarksEntryPage'));
import './App.css';
import './styles/colors.css';
import './styles/theme.css';

// Import debugging utilities for browser console access
import './utils/userRoleManager';
import './utils/allowlistManager';

// Track page views
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    logger.log('🔍 PageTracker - Route changed:', {
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
      // logger.log('🔍 PageTracker - PostHog not ready yet');
    }
  }, [location]);
  
  return null;
}

const AppContent = () => {
  const { user } = useAuth();
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isSideDrawerCollapsed, setIsSideDrawerCollapsed] = useState(false);
  
  // useRealTimeUpdates(); // Temporarily disabled to fix notification spam
  
  const toggleSideDrawer = () => {
    if (isSideDrawerCollapsed) {
      setIsSideDrawerCollapsed(false);
    } else {
      setIsSideDrawerOpen(!isSideDrawerOpen);
    }
  };
  
  const closeSideDrawer = () => {
    setIsSideDrawerOpen(false);
  };
  
  const toggleSideDrawerCollapse = () => {
    setIsSideDrawerCollapsed(!isSideDrawerCollapsed);
  };
  
  return (
    <HelpProvider>
      <div className="app">
        <PageTracker />
        {user && (
          <>
            <Navbar 
              onToggleSidebar={toggleSideDrawer}
            />
            <SideDrawer
              isOpen={isSideDrawerOpen}
              onClose={closeSideDrawer}
              isCollapsed={isSideDrawerCollapsed}
              onToggleCollapse={toggleSideDrawerCollapse}
            />
          </>
        )}
        <HelpDrawer />
        <main className="main-content">
        <Suspense fallback={<FancyLoading fullscreen={true} />}>
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path="/qrcode/:studentId" element={<QRCodeDisplayPage />} />
          
          {/* Authenticated routes */}
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
          <Route path="/hr-penalties" element={<PenaltiesPage />} />
          <Route path="/instructor-participation" element={<ParticipationPage />} />
          <Route path="/instructor-behavior" element={<BehaviorPage />} />
          <Route path="/qr-scanner" element={<InstructorQRScannerPage />} />
          <Route path="/class-schedules" element={<ClassSchedulePage />} />
          <Route path="/manage-enrollments" element={<EnrollmentsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
          <Route path="/role-access-pro" element={<RoleAccessPro />} />
          {/* Redirect old student-profile to new unified dashboard */}
          <Route path="/student-profile" element={<StudentProfilePage />} />
          <Route path="/student-dashboard" element={<StudentDashboardPage />} />
          <Route path="/my-enrollments" element={<EnrollmentsPage />} />
          <Route path="/course-progress/:courseId" element={<StudentDashboardPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quiz-management" element={<Navigate to="/quizzes" replace />} />
          <Route path="/quiz-builder" element={<Navigate to="/quizzes?mode=add" replace />} />
          <Route path="/quiz-preview/:quizId" element={<QuizPreviewPage />} />
          <Route path="/quiz/:quizId" element={<StudentQuizPage />} />
          {/* QuizResultsPage route removed - unified in HomePage with ?mode=quizzes */}
          {/* Programs & Subjects Management */}
          <Route path="/programs" element={<ProgramsManagementPage />} />
          <Route path="/subjects" element={<SubjectsManagementPage />} />
          <Route path="/marks-entry" element={<MarksEntryPage />} />
          <Route path="/scheduled-reports" element={<ScheduledReportsPage />} />
          {/* Class Story removed */}
        </Routes>
        </Suspense>
        </main>
      </div>
    </HelpProvider>
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

