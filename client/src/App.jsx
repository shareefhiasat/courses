import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/ui/Navbar/Navbar';
import { ErrorBoundary, HelpDrawer, CollapsibleSideWindow, NotificationDrawer, RankDisplay, RankHistory, VariableHelper, StudentQRCodeDisplay, StudentQuickActionModal, ToastProvider, useToast, SideDrawer } from '@ui';
import { ThemeProvider } from './contexts/ThemeContext';
import { ColorThemeProvider } from './contexts/ColorThemeContext';
import logger from './utils/logger';
import HomePage from './pages/HomePage';
import LoginPage from './pages/system/LoginPage';
import ChatPage from './pages/communications/chat/ChatPage';
import { HelpProvider } from './contexts/HelpContext';
import ActivityDetailPage from './pages/academic/activities/ActivityDetailPage';
import NotificationsPage from './pages/communications/notifications/NotificationsPage';
import ProfileSettingsPage from './pages/users/ProfileSettingsPage';
import AttendancePage from './pages/operations/attendance/AttendancePage';
import StudentAttendancePage from './pages/operations/attendance/StudentAttendancePage';
import HRAttendancePage from './pages/operations/attendance/HRAttendancePage';
import PenaltiesPage from './pages/operations/penalty/PenaltiesPage';
import ParticipationPage from './pages/operations/participation/ParticipationPage';
import BehaviorPage from './pages/operations/behavior/BehaviorPage';
import InstructorQRScannerPage from './pages/operations/attendance/InstructorQRScannerPage';
import QRCodeDisplayPage from './pages/operations/attendance/QRCodeDisplayPage';
import ClassSchedulePage from './pages/academic/classes/ClassSchedulePage';
import ScheduleOverviewPage from './pages/academic/schedules/ScheduleOverviewPage';
import EnrollmentsPage from './pages/academic/enrollments/EnrollmentsPage';
import AnalyticsPage from './pages/feedback/analytics/AnalyticsPage';
import analytics from './utils/analytics.js';
import RoleAccessPro from './pages/system/RoleAccessPro';
import StudentProfilePage from './pages/users/StudentProfilePage';
import StudentDashboardPage from './pages/dashboard/StudentDashboardPageModern';
import QuizzesPage from './pages/quizzes/QuizzesPage';
import QuizPreviewPage from './pages/quizzes/QuizPreviewPage';
import StudentQuizPage from './pages/quizzes/StudentQuizPage';
import QuestionBankPage from './pages/quizzes/QuestionBankPage';
import QuizResultsPage from './pages/quizzes/quiz-results/QuizResultsPage';
import ReviewResultsPage from './pages/quizzes/quiz-results/ReviewResultsPage';
import ProgramsManagementPage from './pages/academic/programs/ProgramsManagementPage';
import SubjectsManagementPage from './pages/academic/subjects/SubjectsManagementPage';
import ScheduledReportsPage from './pages/feedback/reports/ScheduledReportsPage';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import FancyLoading from './components/ui/FancyLoading/FancyLoading';

// 🚀 ADD THESE IMPORTS FOR AUTHENTICATION GUARDS
import ProtectedRoute from './components/ProtectedRoute';
import UnauthorizedPage from './pages/system/UnauthorizedPage';

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
const EnrollmentsMarksPage = lazy(() => import('./pages/academic/enrollments/grading/EnrollmentsMarksPage'));
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
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute screenId="studentDashboard" screenName="Student Dashboard">
                <StudentDashboardPage />
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
            path="/hr-penalties" 
            element={
              <ProtectedRoute screenId="hrPenalties" screenName="HR Penalties">
                <PenaltiesPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/instructor-participation" 
            element={
              <ProtectedRoute screenId="instructorParticipation" screenName="Instructor Participation">
                <ParticipationPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/instructor-behavior" 
            element={
              <ProtectedRoute screenId="instructorBehavior" screenName="Instructor Behavior">
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
                <EnrollmentsMarksPage />
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

