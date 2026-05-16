import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { KeycloakProvider } from './providers/KeycloakProvider';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { LangProvider } from '@contexts/LangContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import { ColorThemeProvider } from '@contexts/ColorThemeContext';
import { GlobalLoadingProvider, GlobalLoadingFallback } from '@contexts/GlobalLoadingContext';
import { HelpProvider } from '@contexts/HelpContext';
import { info, error, warn, debug } from './services/utils/logger.js';
import { ROLE_STRINGS } from './utils/userUtils.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import './App.css';
import './styles/colors.css';
import './styles/tokens.css';
import './styles/theme.css';
import './utils/userRoleManager';
// allowlistManager removed - now using Keycloak for user management

// Direct imports — always-on shell components (not lazy, no barrel)
import Navbar from '@ui/Navbar/Navbar';
import HelpDrawer from '@ui/HelpDrawer.jsx';
import SideDrawer from '@ui/SideDrawer/SideDrawer';
import LoadingProgress from '@ui/LoadingProgress/LoadingProgress';
import ToastProvider from '@ui/ToastProvider.jsx';
import StudentQuickActionModal from '@ui/StudentQuickActionModal.jsx';
import StudentQRCodeDisplay from '@ui/StudentQRCodeDisplay/StudentQRCodeDisplay';
import SilentCheckSso from './components/auth/SilentCheckSso.jsx';

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
const QRScannerPage = lazy(() => import('./pages/operations/attendance/QRScannerPage'));
const QRCodeDisplayPage = lazy(() => import('./pages/operations/attendance/QRCodeDisplayPage'));
const ClassSchedulePage = lazy(() => import('./pages/academic/classes/ClassSchedulePage'));
const ScheduleOverviewPage = lazy(() => import('./pages/academic/schedules/ScheduleOverviewPage'));
const EnrollmentsPage = lazy(() => import('./pages/academic/enrollments/EnrollmentsPage'));
const AnalyticsPage = lazy(() => import('./pages/feedback/analytics/AnalyticsPage'));
const PermissionMatrixPage = lazy(() => import('./pages/system/PermissionMatrixPage'));
// RoleAccessPro removed - now using Keycloak roles for RBAC
const StudentProfilePage = lazy(() => import('./pages/users/StudentProfilePage'));
const StudentDashboardPage = lazy(() => import('./pages/dashboard/StudentDashboardPage'));
const QuizzesPage = lazy(() => import('./pages/quizzes/QuizzesPage'));
const QuizPreviewPage = lazy(() => import('./pages/quizzes/QuizPreviewPage'));
const StudentQuizPage = lazy(() => import('./pages/quizzes/StudentQuizPage'));
const QuestionBankPage = lazy(() => import('./pages/quizzes/QuestionBankPage'));
const QuizResultsPage = lazy(() => import('./pages/quizzes/quiz-results/QuizResultsPage'));
const ProgramsManagementPage = lazy(() => import('./pages/academic/programs/ProgramsPage'));
const SubjectsManagementPage = lazy(() => import('./pages/academic/subjects/SubjectsPage'));
const ScheduledReportsPage = lazy(() => import('./pages/feedback/reports/ScheduledReportsPage'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.jsx'));
const SummaryDashboardPage = lazy(() => import('./pages/SummaryDashboardPage'));
const SchedulingMastersPage = lazy(() => import('./pages/SchedulingMastersPage'));
const ScheduleSessionEditorPage = lazy(() => import('./pages/ScheduleSessionEditorPage'));
const BulkSchedulingPage = lazy(() => import('./pages/BulkSchedulingPage'));
const AdminScopeAssignmentPage = lazy(() => import('./pages/AdminScopeAssignmentPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const MarksPage = lazy(() => import('./pages/academic/enrollments/grading/MarksPage'));
const WorkflowInboxPage = lazy(() => import('./pages/workflow/WorkflowInboxPage'));
const WorkflowDetailPage = lazy(() => import('./pages/workflow/WorkflowDetailPage'));
const WorkflowCreatePage = lazy(() => import('./pages/workflow/WorkflowCreatePage'));
const WorkflowWorkspacePage = lazy(() => import('./pages/workflow/WorkflowWorkspacePage'));
const SmartDrivePage = lazy(() => import('./pages/SmartDrivePage'));

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
    info('🔍 PageTracker - Route changed:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: new Date().toISOString()
    });
    
    // Analytics removed - PostHog disabled
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
          <Route path="/silent-check-sso.html" element={<SilentCheckSso />} />
          
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
            path="/summary-dashboard" 
            element={
              <ProtectedRoute screenId="summaryDashboard" screenName="Summary Dashboard">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <SummaryDashboardPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/categories" 
            element={
              <ProtectedRoute screenId="categories" screenName="Categories">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <CategoriesPage />
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
            element={<Navigate to="/home?mode=review" replace />}
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
              <ProtectedRoute screenId="qrScanner" screenName="QR Scanner">
                <QRScannerPage />
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
            path="/scheduling-masters" 
            element={
              <ProtectedRoute screenId="schedulingMasters" screenName="Scheduling Masters">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <SchedulingMastersPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/schedule-session-editor" 
            element={
              <ProtectedRoute screenId="scheduleSessionEditor" screenName="Schedule Session Editor">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <ScheduleSessionEditorPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/bulk-scheduling" 
            element={
              <ProtectedRoute screenId="bulkScheduling" screenName="Bulk Scheduling">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <BulkSchedulingPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin-scope-assignment" 
            element={
              <ProtectedRoute screenId="adminScopeAssignment" screenName="Admin Scope Assignment">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <AdminScopeAssignmentPage />
                </Suspense>
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
          {/* WORKFLOW ROUTES (Auth + Role Guard) */}
          {/* ============================================ */}
          <Route 
            path="/workflow/inbox" 
            element={
              <ProtectedRoute screenId="workflow" screenName="Workflow Inbox">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <WorkflowInboxPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/workflow/create" 
            element={
              <ProtectedRoute screenId="workflow" screenName="Workflow Create">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <WorkflowCreatePage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/workflow/workspace" 
            element={
              <ProtectedRoute screenId="workflow" screenName="Workflow Workspace">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <WorkflowWorkspacePage />
                </Suspense>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/smart-drive"
            element={
              <ProtectedRoute screenId="drive" screenName="Smart Drive">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <SmartDrivePage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/workflow/:documentId" 
            element={
              <ProtectedRoute screenId="workflow" screenName="Workflow Detail">
                <Suspense fallback={<GlobalLoadingFallback />}>
                  <WorkflowDetailPage />
                </Suspense>
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
          
          {/* Permission Matrix - Super Admin only */}
          <Route
            path="/permission-matrix"
            element={
              <ProtectedRoute allowedRoles={[ROLE_STRINGS.SUPER_ADMIN]}>
                <PermissionMatrixPage />
              </ProtectedRoute>
            }
          />
          
          {/* RoleAccessPro route removed - now using Keycloak roles for RBAC */}
          
          {/* ============================================ */}
          {/* REDIRECTS */}
          {/* ============================================ */}
          <Route path="/home" element={<Navigate to="/" replace />} />
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
      <KeycloakProvider>
        <AuthProvider>
          <ThemeProvider>
            <LangProvider>
              <ColorThemeProvider>
                <GlobalLoadingProvider>
                  <Router>
                    <ErrorBoundary>
                      <Routes>
                        <Route path="*" element={<AppContent />} />
                      </Routes>
                    </ErrorBoundary>
                  </Router>
                </GlobalLoadingProvider>
              </ColorThemeProvider>
            </LangProvider>
          </ThemeProvider>
        </AuthProvider>
      </KeycloakProvider>
    </ErrorBoundary>
  );
}

export default App;

