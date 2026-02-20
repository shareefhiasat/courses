import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { LangProvider } from '@contexts/LangContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { ColorThemeProvider } from '@contexts/ColorThemeContext';
import { GlobalLoadingProvider, GlobalLoadingFallback } from '@contexts/GlobalLoadingContext';
import { HelpProvider } from '@contexts/HelpContext';
import logger from './utils/logger';
import analytics from './utils/analytics.js';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import './styles/colors.css';
import './styles/theme.css';
import './utils/userRoleManager';
import './utils/allowlistManager';

// Direct imports — always-on shell components (not lazy, no barrel)
import Navbar from '@ui/Navbar/Navbar';
import ErrorBoundary from '@ui/ErrorBoundary.jsx';
import HelpDrawer from '@ui/HelpDrawer.jsx';
import SideDrawer from '@ui/SideDrawer/SideDrawer';
import LoadingProgress from '@ui/LoadingProgress/LoadingProgress';
import ToastProvider from '@ui/ToastProvider.jsx';
import StudentQuickActionModal from '@ui/StudentQuickActionModal.jsx';
import StudentQRCodeDisplay from '@ui/StudentQRCodeDisplay/StudentQRCodeDisplay';

// Lazy-loaded pages — each becomes its own JS chunk
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/system/LoginPage'));
const UnauthorizedPage = lazy(() => import('./pages/system/UnauthorizedPage'));
const ChatPage = lazy(() => import('./pages/communications/chat/ChatPage'));
const ActivityDetailPage = lazy(() => import('./pages/academic/activities/ActivityDetailPage'));
const NotificationsPage = lazy(() => import('./pages/communications/notifications/NotificationsPage'));
const ProfileSettingsPage = lazy(() => import('./pages/users/ProfileSettingsPage'));
const AttendancePage = lazy(() => import('./pages/operations/attendance/AttendancePage'));
const StudentAttendancePage = lazy(() => import('./pages/operations/attendance/StudentAttendancePage'));
const HRAttendancePage = lazy(() => import('./pages/operations/attendance/HRAttendancePage'));
const PenaltiesPage = lazy(() => import('./pages/operations/penalty/PenaltiesPage'));
const ParticipationPage = lazy(() => import('./pages/operations/participation/ParticipationPage'));
const BehaviorPage = lazy(() => import('./pages/operations/behavior/BehaviorPage'));
const InstructorQRScannerPage = lazy(() => import('./pages/operations/attendance/InstructorQRScannerPage'));
const QRCodeDisplayPage = lazy(() => import('./pages/operations/attendance/QRCodeDisplayPage'));
const ClassSchedulePage = lazy(() => import('./pages/academic/classes/ClassSchedulePage'));
const ScheduleOverviewPage = lazy(() => import('./pages/academic/schedules/ScheduleOverviewPage'));
const EnrollmentsPage = lazy(() => import('./pages/academic/enrollments/EnrollmentsPage'));
const AnalyticsPage = lazy(() => import('./pages/feedback/analytics/AnalyticsPage'));
const RoleAccessPro = lazy(() => import('./pages/system/RoleAccessPro'));
const StudentProfilePage = lazy(() => import('./pages/users/StudentProfilePage'));
const StudentDashboardPage = lazy(() => import('./pages/dashboard/StudentDashboardPageModern'));
const QuizzesPage = lazy(() => import('./pages/quizzes/QuizzesPage'));
const QuizPreviewPage = lazy(() => import('./pages/quizzes/QuizPreviewPage'));
const StudentQuizPage = lazy(() => import('./pages/quizzes/StudentQuizPage'));
const QuestionBankPage = lazy(() => import('./pages/quizzes/QuestionBankPage'));
const QuizResultsPage = lazy(() => import('./pages/quizzes/quiz-results/QuizResultsPage'));
const ReviewResultsPage = lazy(() => import('./pages/quizzes/quiz-results/ReviewResultsPage'));
const ProgramsManagementPage = lazy(() => import('./pages/academic/programs/ProgramsManagementPage'));
const SubjectsManagementPage = lazy(() => import('./pages/academic/subjects/SubjectsManagementPage'));
const ScheduledReportsPage = lazy(() => import('./pages/feedback/reports/ScheduledReportsPage'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const MarksPage = lazy(() => import('./pages/academic/enrollments/grading/MarksPage'));

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
  
  const toggleSideDrawer = useCallback(() => {
    if (isSideDrawerCollapsed) {
      setIsSideDrawerCollapsed(false);
    } else {
      setIsSideDrawerOpen((prev) => !prev);
    }
  }, [isSideDrawerCollapsed]);

  const closeSideDrawer = useCallback(() => {
    setIsSideDrawerOpen(false);
  }, []);

  const toggleSideDrawerCollapse = useCallback(() => {
    setIsSideDrawerCollapsed((prev) => !prev);
  }, []);
  
  return (
    <HelpProvider>
      <div className="app">
        <LoadingProgress />
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
        <Suspense fallback={<GlobalLoadingFallback />}>
        <Routes>
          {/* ============================================ */}
          {/* PUBLIC ROUTES (No authentication required) */}
          {/* ============================================ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/qrcode/:studentId" element={<QRCodeDisplayPage />} />
          
          {/* ============================================ */}
          {/* SYSTEM ROUTES */}
          {/* ============================================ */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* ============================================ */}
          {/* MAIN ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute screenId="home" screenName="Home">
                <HomePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute screenId="dashboard" screenName="Dashboard">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <DashboardPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute screenId="studentDashboard" screenName="Student Dashboard">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <StudentDashboardPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student-profile" 
            element={
              <ProtectedRoute screenId="studentProfile" screenName="Student Profile">
                <StudentProfilePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/activity/:activityId" 
            element={
              <ProtectedRoute screenId="activities" screenName="Activity Details">
                <ActivityDetailPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* QUIZ ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/quizzes" 
            element={
              <ProtectedRoute screenId="quizzes" screenName="Quizzes">
                <QuizzesPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/quiz-preview/:quizId" 
            element={
              <ProtectedRoute screenId="quizzes" screenName="Quiz Preview">
                <QuizPreviewPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/quiz/:quizId" 
            element={
              <ProtectedRoute screenId="quizzes" screenName="Take Quiz">
                <StudentQuizPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/review-results" 
            element={
              <ProtectedRoute screenId="reviewResults" screenName="Review Results">
                <ReviewResultsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* ATTENDANCE ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute screenId="attendance" screenName="Attendance">
                <AttendancePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/hr-attendance" 
            element={
              <ProtectedRoute screenId="hrAttendance" screenName="HR Attendance">
                <HRAttendancePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/penalty" 
            element={
              <ProtectedRoute screenId="penalty" screenName="Penalty">
                <PenaltiesPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/participation" 
            element={
              <ProtectedRoute screenId="participation" screenName="Participation">
                <ParticipationPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/behavior" 
            element={
              <ProtectedRoute screenId="behavior" screenName="Behavior">
                <BehaviorPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/qr-scanner" 
            element={
              <ProtectedRoute screenId="attendance" screenName="QR Scanner">
                <InstructorQRScannerPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* ENROLLMENT & CLASS ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/enrollments" 
            element={
              <ProtectedRoute screenId="enrollments" screenName="Enrollments">
                <EnrollmentsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manage-enrollments" 
            element={
              <ProtectedRoute screenId="manageEnrollments" screenName="Manage Enrollments">
                <EnrollmentsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/programs" 
            element={
              <ProtectedRoute screenId="programs" screenName="Programs">
                <ProgramsManagementPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/subjects" 
            element={
              <ProtectedRoute screenId="subjects" screenName="Subjects">
                <SubjectsManagementPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/marks-entry" 
            element={
              <ProtectedRoute screenId="marksEntry" screenName="Marks Entry">
                <MarksPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/schedule-overview" 
            element={
              <ProtectedRoute screenId="classSchedules" screenName="Schedule Overview">
                <ScheduleOverviewPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/class-schedules" 
            element={
              <ProtectedRoute screenId="classSchedules" screenName="Class Schedules">
                <ClassSchedulePage />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* ANALYTICS ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute screenId="analytics" screenName="Analytics">
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/advanced-analytics" 
            element={
              <ProtectedRoute screenId="advancedAnalytics" screenName="Advanced Analytics">
                <AdvancedAnalytics />
              </ProtectedRoute>
            } 
          />
          
                    
          {/* ============================================ */}
          {/* COMMUNICATION ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute screenId="chat" screenName="Chat">
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute screenId="notifications" screenName="Notifications">
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/scheduled-reports" 
            element={
              <ProtectedRoute screenId="scheduledReports" screenName="Scheduled Reports">
                <ScheduledReportsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* SETTINGS ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute screenId="profile" screenName="Profile Settings">
                <ProfileSettingsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/role-access-pro" 
            element={
              <ProtectedRoute screenId="roleAccess" screenName="Role Access Management">
                <RoleAccessPro />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* REDIRECTS */}
          {/* ============================================ */}
          <Route path="/activities" element={<Navigate to="/?mode=activities" replace />} />
          <Route path="/resources" element={<Navigate to="/?mode=resources" replace />} />
          <Route path="/progress" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/my-attendance" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/class-schedules" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/my-enrollments" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/my-progress" element={<Navigate to="/student-dashboard" replace />} />
          <Route path="/quiz-management" element={<Navigate to="/quizzes" replace />} />
          <Route path="/quiz-builder" element={<Navigate to="/quizzes?mode=add" replace />} />
          <Route path="/course-progress/:courseId" element={<Navigate to="/student-dashboard" replace />} />
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
              <GlobalLoadingProvider>
                <Router>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </Router>
              </GlobalLoadingProvider>
            </ColorThemeProvider>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

