/**
 * Business Services Index
 * 
 * Central export point for all business services
 * 
 * PURPOSE:
 * Provides a single import point for all business logic services
 * Each service handles specific business rules and workflows
 * 
 * ARCHITECTURE:
 * Frontend Components → Business Services → Database Services → PostgreSQL
 */

// Authentication and Authorization
const authBusinessService = require('./authBusinessService.js');

// User Management
const userBusinessService = require('./userBusinessService.js');

// Email Services
const emailBusinessService = require('./emailBusinessService.js');

// Academic Structure Services
const categoryBusinessService = require('./categoryBusinessService.js');
const programBusinessService = require('./programBusinessService.js');
const subjectBusinessService = require('./subjectBusinessService.js');
const classBusinessService = require('./classBusinessService.js');

// Content Management Services
const activitiesBusinessService = require('./activitiesBusinessService.js');
const announcementsBusinessService = require('./announcementsBusinessService.js');
const resourcesBusinessService = require('./resourcesBusinessService.js');
const templatesBusinessService = require('./templatesBusinessService.js');

// Assessment Services
const questionBankBusinessService = require('./questionBankBusinessService.js');
const quizzesBusinessService = require('./quizzesBusinessService.js');
const quizResultsBusinessService = require('./quizResultsBusinessService.js');
const quizSubmissionsBusinessService = require('./quizSubmissionsBusinessService.js');

// Student Operations Services
const enrollmentBusinessService = require('./enrollmentBusinessService.js');
const subjectEnrollmentsBusinessService = require('./subjectEnrollmentsBusinessService.js');
const attendanceBusinessService = require('./attendanceBusinessService.js');
const attendanceSessionsBusinessService = require('./attendanceSessionsBusinessService.js');
const participationBusinessService = require('./participationBusinessService.js');
const behaviorBusinessService = require('./behaviorBusinessService.js');
const penaltyBusinessService = require('./penaltyBusinessService.js');

// Communication and Productivity Services
const notificationsBusinessService = require('./notificationsBusinessService.js');
const chatBusinessService = require('./chatBusinessService.js');
const bookmarkBusinessService = require('./bookmarkBusinessService.js');

// Platform Services
const scheduleBusinessService = require('./scheduleBusinessService.js');
const gamificationBusinessService = require('./gamificationBusinessService.js');
const activityLogsBusinessService = require('./activityLogsBusinessService.js');
const dashboardBusinessService = require('./dashboardBusinessService.js');
const healthBusinessService = require('./healthBusinessService.js');

const { info, error, warn, debug } = require('../utils/logger.js');

module.exports = {
  authBusinessService,
  userBusinessService,
  emailBusinessService,
  categoryBusinessService,
  programBusinessService,
  subjectBusinessService,
  classBusinessService,
  activitiesBusinessService,
  announcementsBusinessService,
  resourcesBusinessService,
  templatesBusinessService,
  questionBankBusinessService,
  quizzesBusinessService,
  quizResultsBusinessService,
  quizSubmissionsBusinessService,
  enrollmentBusinessService,
  subjectEnrollmentsBusinessService,
  attendanceBusinessService,
  attendanceSessionsBusinessService,
  participationBusinessService,
  behaviorBusinessService,
  penaltyBusinessService,
  notificationsBusinessService,
  chatBusinessService,
  bookmarkBusinessService,
  scheduleBusinessService,
  gamificationBusinessService,
  activityLogsBusinessService,
  dashboardBusinessService,
  healthBusinessService,

  // Spread individual service exports for convenience
  ...authBusinessService,
  ...userBusinessService,
  ...emailBusinessService,
  ...categoryBusinessService,
  ...programBusinessService,
  ...subjectBusinessService,
  ...classBusinessService,
  ...activitiesBusinessService,
  ...announcementsBusinessService,
  ...resourcesBusinessService,
  ...templatesBusinessService,
  ...questionBankBusinessService,
  ...quizzesBusinessService,
  ...quizResultsBusinessService,
  ...quizSubmissionsBusinessService,
  ...enrollmentBusinessService,
  ...subjectEnrollmentsBusinessService,
  ...attendanceBusinessService,
  ...attendanceSessionsBusinessService,
  ...participationBusinessService,
  ...behaviorBusinessService,
  ...penaltyBusinessService,
  ...notificationsBusinessService,
  ...chatBusinessService,
  ...bookmarkBusinessService,
  ...scheduleBusinessService,
  ...gamificationBusinessService,
  ...activityLogsBusinessService,
  ...dashboardBusinessService,
  ...healthBusinessService,

  version: '2.0.0',
  services: [
    'authBusinessService',
    'userBusinessService',
    'emailBusinessService',
    'categoryBusinessService',
    'programBusinessService',
    'subjectBusinessService',
    'classBusinessService',
    'activitiesBusinessService',
    'announcementsBusinessService',
    'resourcesBusinessService',
    'templatesBusinessService',
    'questionBankBusinessService',
    'quizzesBusinessService',
    'quizResultsBusinessService',
    'quizSubmissionsBusinessService',
    'enrollmentBusinessService',
    'subjectEnrollmentsBusinessService',
    'attendanceBusinessService',
    'attendanceSessionsBusinessService',
    'participationBusinessService',
    'behaviorBusinessService',
    'penaltyBusinessService',
    'notificationsBusinessService',
    'chatBusinessService',
    'bookmarkBusinessService',
    'scheduleBusinessService',
    'gamificationBusinessService',
    'activityLogsBusinessService',
    'dashboardBusinessService',
    'healthBusinessService',
  ],
  descriptions: {
    authBusinessService: 'Authentication, authorization, and Keycloak integration',
    userBusinessService: 'User management and profile operations',
    emailBusinessService: 'Email sending and template management',
    categoryBusinessService: 'Category management operations',
    programBusinessService: 'Program management operations',
    subjectBusinessService: 'Subject management operations',
    classBusinessService: 'Class management operations',
    activitiesBusinessService: 'Activity management and scheduling',
    announcementsBusinessService: 'Announcement creation and distribution',
    resourcesBusinessService: 'Resource management and file handling',
    templatesBusinessService: 'Template management operations',
    questionBankBusinessService: 'Question bank operations',
    quizzesBusinessService: 'Quiz management operations',
    quizResultsBusinessService: 'Quiz results operations',
    quizSubmissionsBusinessService: 'Quiz submissions operations',
    enrollmentBusinessService: 'Enrollment management operations',
    subjectEnrollmentsBusinessService: 'Subject enrollment management operations',
    attendanceBusinessService: 'Attendance management operations',
    attendanceSessionsBusinessService: 'Attendance session operations',
    participationBusinessService: 'Participation tracking operations',
    behaviorBusinessService: 'Behavior tracking operations',
    penaltyBusinessService: 'Penalty management operations',
    notificationsBusinessService: 'Notification management operations',
    chatBusinessService: 'Chat and conversation operations',
    bookmarkBusinessService: 'Bookmark management operations',
    scheduleBusinessService: 'Schedule management operations',
    gamificationBusinessService: 'Gamification operations',
    activityLogsBusinessService: 'Activity log operations',
    dashboardBusinessService: 'Dashboard management operations',
    healthBusinessService: 'Platform health check operations',
  },
};
