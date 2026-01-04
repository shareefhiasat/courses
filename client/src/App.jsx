import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import useRealTimeUpdates from './hooks/useRealTimeUpdates';
import { ThemeProvider } from './contexts/ThemeContext';
import { ColorThemeProvider } from './contexts/ColorThemeContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProgressPage from './pages/ProgressPage';
import ChatPage from './pages/ChatPage';
import { HelpProvider } from './contexts/HelpContext';
import HelpDrawer from './components/HelpDrawer';
// ActivitiesPage, ResourcesPage, QuizResultsPage - DEPRECATED (unified in HomePage)
import ActivityDetailPage from './pages/ActivityDetailPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import SMTPConfigPage from './pages/SMTPConfigPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AttendancePage from './pages/AttendancePage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import HRAttendancePage from './pages/HRAttendancePage';
import HRPenaltiesPage from './pages/HRPenaltiesPage';
import InstructorParticipationPage from './pages/InstructorParticipationPage';
import InstructorBehaviorPage from './pages/InstructorBehaviorPage';
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
import QuizzesPage from './pages/QuizzesPage';
import QuizPreviewPage from './pages/QuizPreviewPage';
import MyEnrollmentsPage from './pages/MyEnrollmentsPage';
import StudentQuizPage from './pages/StudentQuizPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuizResultsPage from './pages/QuizResultsPage';
import ReviewResultsPage from './pages/ReviewResultsPage';
import ProgramsManagementPage from './pages/ProgramsManagementPage';
import SubjectsManagementPage from './pages/SubjectsManagementPage';
import MarksEntryPage from './pages/MarksEntryPage';
import ScheduledReportsPage from './pages/ScheduledReportsPage';
import './App.css';
import './styles/colors.css';
import './styles/theme.css';

const AppContent = () => {
  // useRealTimeUpdates(); // Temporarily disabled to fix notification spam
  
  return (
    <div className="app">
<HelpProvider>
        <Navbar />
        <HelpDrawer />
        <main className="main-content">
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
          <Route path="/smtp-config" element={<SMTPConfigPage />} />
          <Route path="/enrollments" element={<EnrollmentsPage />} />
          {/* AwardMedalsPage route removed - DEPRECATED */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/manual-attendance" element={<ManualAttendancePage />} />
          <Route path="/my-attendance" element={<StudentAttendancePage />} />
          <Route path="/hr-attendance" element={<HRAttendancePage />} />
          <Route path="/hr-penalties" element={<HRPenaltiesPage />} />
          <Route path="/instructor-participation" element={<InstructorParticipationPage />} />
          <Route path="/instructor-behavior" element={<InstructorBehaviorPage />} />
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
        </main>
      </HelpProvider>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ColorThemeProvider>
          <LangProvider>
            <AuthProvider>
              <Router>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </Router>
            </AuthProvider>
          </LangProvider>
        </ColorThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
