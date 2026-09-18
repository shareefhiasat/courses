/**
 * AI Tool Registry
 */

import attendanceTool from './attendanceTool.js';
import warningTool from './warningTool.js';
import lateTool from './lateTool.js';
import humanCaseTool from './humanCaseTool.js';
import studentTool from './studentTool.js';
import marksTool from './marksTool.js';
import scheduleTool from './scheduleTool.js';
import workflowTool from './workflowTool.js';
import notesCommentsTool from './notesCommentsTool.js';
import topAbsenceTool from './topAbsenceTool.js';

import classCountTool from './classCountTool.js';
import attendanceTypesTool from './attendanceTypesTool.js';
import programInfoTool from './programInfoTool.js';
import subjectInfoTool from './subjectInfoTool.js';
import enrollmentInfoTool from './enrollmentInfoTool.js';
import penaltySummaryTool from './penaltySummaryTool.js';
import behaviorSummaryTool from './behaviorSummaryTool.js';
import marksDistributionTool from './marksDistributionTool.js';
import participationSummaryTool from './participationSummaryTool.js';
import activityInfoTool from './activityInfoTool.js';
import announcementInfoTool from './announcementInfoTool.js';
import quizSummaryTool from './quizSummaryTool.js';
import standupAttendanceTool from './standupAttendanceTool.js';
import classroomInfoTool from './classroomInfoTool.js';
import submissionSummaryTool from './submissionSummaryTool.js';
import holidayInfoTool from './holidayInfoTool.js';
import breakSessionSummaryTool from './breakSessionSummaryTool.js';
import sessionSummaryTool from './sessionSummaryTool.js';
import academicClosureInfoTool from './academicClosureInfoTool.js';
import exportHistoryTool from './exportHistoryTool.js';

export const toolRegistry = {
  // Existing tools
  attendanceSummary: attendanceTool,
  absenceWarningCounts: warningTool,
  lateCount: lateTool,
  humanCaseCount: humanCaseTool,
  studentCount: studentTool,
  marksSummary: marksTool,
  scheduleSummary: scheduleTool,
  workflowSummary: workflowTool,
  notesAndComments: notesCommentsTool,
  topAbsenceStudent: topAbsenceTool,

  // New tools
  classCount: classCountTool,
  attendanceTypes: attendanceTypesTool,
  programInfo: programInfoTool,
  subjectInfo: subjectInfoTool,
  enrollmentInfo: enrollmentInfoTool,
  penaltySummary: penaltySummaryTool,
  behaviorSummary: behaviorSummaryTool,
  marksDistribution: marksDistributionTool,
  participationSummary: participationSummaryTool,
  activityInfo: activityInfoTool,
  announcementInfo: announcementInfoTool,
  quizSummary: quizSummaryTool,
  standupAttendance: standupAttendanceTool,
  classroomInfo: classroomInfoTool,
  submissionSummary: submissionSummaryTool,
  holidayInfo: holidayInfoTool,
  breakSessionSummary: breakSessionSummaryTool,
  sessionSummary: sessionSummaryTool,
  academicClosureInfo: academicClosureInfoTool,
  exportHistory: exportHistoryTool,
};

export function getTool(name) {
  return toolRegistry[name] || null;
}

export default {
  toolRegistry,
  getTool,
};
