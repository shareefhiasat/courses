import {
  BookOpen, GraduationCap, Calendar as CalendarIcon, CalendarDays, Clock, Save,
  CheckCircle2, XCircle, DoorOpen, Users, BarChart3,
} from 'lucide-react';

const STATUS_COLORS = {
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export function buildSchedulingOverviewCards(stats, t) {
  const card = (value, label, Icon, iconColor, iconBg) => ({ value, label, Icon, iconColor, iconBg });

  return [
    card(stats.totalPrograms ?? 0, t('stats_total_programs') || t('programs'), BookOpen, '#6366f1', '#e0e7ff'),
    card(stats.totalSubjects ?? 0, t('stats_total_subjects') || t('subjects'), BookOpen, '#6366f1', '#e0e7ff'),
    card(stats.totalClasses ?? 0, t('stats_total_classes') || t('classes'), GraduationCap, '#8b5cf6', '#ede9fe'),
    card(stats.thisWeekSessions ?? 0, t('this_week'), CalendarIcon, STATUS_COLORS.scheduled, '#dbeafe'),
    card(stats.todaySessionCount ?? 0, t('stats_today_sessions'), CalendarDays, '#0ea5e9', '#e0f2fe'),
    card(stats.totalSessions ?? 0, t('total_sessions'), Clock, STATUS_COLORS.scheduled, '#dbeafe'),
    card(stats.scheduledCount ?? 0, t('scheduled'), Save, STATUS_COLORS.scheduled, '#dbeafe'),
    card(stats.inProgressCount ?? 0, t('in_progress'), Clock, STATUS_COLORS.in_progress, '#fef3c7'),
    card(stats.completedCount ?? 0, t('completed'), CheckCircle2, STATUS_COLORS.completed, '#d1fae5'),
    card(stats.cancelledCount ?? 0, t('cancelled'), XCircle, STATUS_COLORS.cancelled, '#fee2e2'),
    card(
      `${stats.uniqueClassrooms ?? 0}/${stats.totalClassrooms ?? 0}`,
      t('rooms_used'),
      DoorOpen,
      '#10b981',
      '#d1fae5',
    ),
    card(stats.unusedRooms ?? 0, t('stats_rooms_unused'), DoorOpen, '#6b7280', '#f3f4f6'),
    card(
      `${stats.uniqueInstructors ?? 0}/${stats.totalInstructors ?? 0}`,
      t('stats_instructors_active'),
      Users,
      '#f59e0b',
      '#fef3c7',
    ),
    card(stats.unusedInstructors ?? 0, t('stats_instructors_unused'), Users, '#6b7280', '#f3f4f6'),
    card(`${stats.avgDuration ?? 0}h`, t('avg_duration'), BarChart3, '#ec4899', '#fce7f3'),
  ];
}

export function buildOverviewSummary(stats, t) {
  return [
    `${stats.totalPrograms ?? 0} ${t('programs')}`,
    `${stats.totalSubjects ?? 0} ${t('subjects')}`,
    `${stats.totalClasses ?? 0} ${t('classes')}`,
    `${stats.thisWeekSessions ?? 0} ${t('this_week')}`,
    `${stats.cancelledCount ?? 0} ${t('cancelled')}`,
    `${stats.unusedRooms ?? 0} ${t('stats_rooms_unused')}`,
  ].join(' · ');
}

export function buildInstructorOverviewCards(stats, t, instructorName) {
  const card = (value, label, Icon, iconColor, iconBg) => ({ value, label, Icon, iconColor, iconBg });
  return [
    card(instructorName || '—', t('instructor') || 'Instructor', Users, '#3b82f6', '#dbeafe'),
    card(stats.totalSessions ?? 0, t('total_sessions'), Clock, STATUS_COLORS.scheduled, '#dbeafe'),
    card(stats.teachingHours ?? 0, t('teaching_hours'), BarChart3, '#10b981', '#d1fae5'),
    card(stats.subjectCount ?? 0, t('subjects'), BookOpen, '#6366f1', '#e0e7ff'),
    card(stats.classCount ?? 0, t('classes'), GraduationCap, '#8b5cf6', '#ede9fe'),
    card(stats.scheduledCount ?? 0, t('scheduled'), Save, STATUS_COLORS.scheduled, '#dbeafe'),
    card(stats.completedCount ?? 0, t('completed'), CheckCircle2, STATUS_COLORS.completed, '#d1fae5'),
    card(stats.cancelledCount ?? 0, t('cancelled'), XCircle, STATUS_COLORS.cancelled, '#fee2e2'),
  ];
}
