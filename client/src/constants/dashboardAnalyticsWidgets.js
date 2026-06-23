/**
 * Dashboard Analytics Widgets - Drive, Workflow, Activity metrics.
 * These widgets are role-based: HR/Super Admin see all, Admin/Instructor see own.
 * Counts are arranged at the top, followed by charts (pie, bar, line) and lists.
 */

export const DASHBOARD_ANALYTICS_STORAGE_KEY = 'dashboard_analytics';

// ── Count widget helper ────────────────────────────────────────────────────
const cntWidget = (id, dataSource, statKey, titleEn, titleAr, layout) => ({
  id,
  titleEn,
  titleAr,
  title: titleEn,
  chartType: 'count',
  dataSource,
  countMetric: statKey,
  statKey,
  groupBy: '',
  aggregation: 'count',
  dateRange: 'current',
  filters: [],
  layout,
});

// ── Chart widget helper ────────────────────────────────────────────────────
const chartWidget = (id, titleEn, titleAr, chartType, dataSource, groupBy, layout, extra = {}) => ({
  id,
  titleEn,
  titleAr,
  title: titleEn,
  chartType,
  dataSource,
  groupBy,
  aggregation: extra.aggregation || 'count',
  valueField: extra.valueField || 'recordCount',
  dateRange: 'current',
  filters: [],
  ...extra,
  layout,
});

// ── Default widgets (20+) ──────────────────────────────────────────────────
export const DASHBOARD_ANALYTICS_DEFAULT_WIDGETS = [
  // ── DRIVE: Count widgets (top row) ───────────────────────────────────────
  cntWidget('da_cnt_files', 'driveOverview', 'totalFiles', 'Total Files', 'إجمالي الملفات', { x: 0, y: 0, w: 3, h: 3 }),
  cntWidget('da_cnt_folders', 'driveOverview', 'totalFolders', 'Total Folders', 'إجمالي المجلدات', { x: 3, y: 0, w: 3, h: 3 }),
  cntWidget('da_cnt_storage', 'driveOverview', 'totalStorageSize', 'Total Storage (MB)', 'إجمالي التخزين (م.ب)', { x: 6, y: 0, w: 3, h: 3 }),
  cntWidget('da_cnt_file_activities', 'driveOverview', 'totalActivities', 'File Activities', 'نشاطات الملفات', { x: 9, y: 0, w: 3, h: 3 }),

  // ── WORKFLOW: Count widgets ──────────────────────────────────────────────
  cntWidget('da_cnt_wf_docs', 'workflowOverview', 'totalDocuments', 'Workflow Documents', 'مستندات سير العمل', { x: 0, y: 3, w: 3, h: 3 }),
  cntWidget('da_cnt_wf_approved', 'workflowOverview', 'approvedCount', 'Approved Workflows', 'المعتمدة', { x: 3, y: 3, w: 3, h: 3 }),
  cntWidget('da_cnt_wf_pending', 'workflowOverview', 'pendingCount', 'Pending Workflows', 'قيد الانتظار', { x: 6, y: 3, w: 3, h: 3 }),
  cntWidget('da_cnt_wf_rejected', 'workflowOverview', 'rejectedCount', 'Rejected Workflows', 'المرفوضة', { x: 9, y: 3, w: 3, h: 3 }),

  // ── ACTIVITY: Count widgets ──────────────────────────────────────────────
  cntWidget('da_cnt_activities', 'activityOverview', 'totalActivities', 'Total Activities', 'إجمالي الأنشطة', { x: 0, y: 6, w: 3, h: 3 }),
  cntWidget('da_cnt_submissions', 'activityOverview', 'totalSubmissions', 'Total Submissions', 'إجمالي التسليمات', { x: 3, y: 6, w: 3, h: 3 }),
  cntWidget('da_cnt_resources', 'activityOverview', 'totalResources', 'Total Resources', 'إجمالي المصادر', { x: 6, y: 6, w: 3, h: 3 }),
  cntWidget('da_cnt_wf_approval_rate', 'workflowOverview', 'approvalRate', 'Approval Rate %', 'نسبة الموافقة', { x: 9, y: 6, w: 3, h: 3 }),

  // ── DRIVE: Charts ────────────────────────────────────────────────────────
  chartWidget('da_files_mime_pie', 'Files by Type', 'الملفات حسب النوع', 'pie', 'driveFilesByMimeType', 'label', { x: 0, y: 9, w: 6, h: 5 }, { valueField: 'fileCount' }),
  chartWidget('da_files_mime_bar', 'Files by Type', 'الملفات حسب النوع', 'bar', 'driveFilesByMimeType', 'label', { x: 6, y: 9, w: 6, h: 5 }, { valueField: 'fileCount' }),
  chartWidget('da_files_bucket_pie', 'Files by Bucket', 'الملفات حسب الدلو', 'pie', 'driveFilesByBucket', 'bucket', { x: 0, y: 14, w: 6, h: 5 }, { valueField: 'fileCount' }),
  chartWidget('da_files_bucket_bar', 'Files by Bucket', 'الملفات حسب الدلو', 'bar', 'driveFilesByBucket', 'bucket', { x: 6, y: 14, w: 6, h: 5 }, { valueField: 'fileCount' }),
  chartWidget('da_file_activity_pie', 'File Activity by Action', 'نشاط الملفات حسب الإجراء', 'pie', 'driveFileActivities', 'action', { x: 0, y: 19, w: 6, h: 5 }, { valueField: 'activityCount' }),
  chartWidget('da_file_activity_bar', 'File Activity by Action', 'نشاط الملفات حسب الإجراء', 'bar', 'driveFileActivities', 'action', { x: 6, y: 19, w: 6, h: 5 }, { valueField: 'activityCount' }),
  chartWidget('da_storage_by_user_bar', 'Storage Usage by User (MB)', 'استخدام التخزين حسب المستخدم (م.ب)', 'bar', 'driveStorageByUser', 'label', { x: 0, y: 24, w: 12, h: 5 }, { valueField: 'storageMB', aggregation: 'sum' }),

  // ── WORKFLOW: Charts ─────────────────────────────────────────────────────
  chartWidget('da_wf_status_pie', 'Workflows by Status', 'سير العمل حسب الحالة', 'pie', 'workflowByStatus', 'status', { x: 0, y: 24, w: 6, h: 5 }, { valueField: 'documentCount' }),
  chartWidget('da_wf_status_bar', 'Workflows by Status', 'سير العمل حسب الحالة', 'bar', 'workflowByStatus', 'status', { x: 6, y: 24, w: 6, h: 5 }, { valueField: 'documentCount' }),
  chartWidget('da_wf_type_pie', 'Workflows by Type', 'سير العمل حسب النوع', 'pie', 'workflowByType', 'workflowType', { x: 0, y: 29, w: 6, h: 5 }, { valueField: 'documentCount' }),
  chartWidget('da_wf_type_bar', 'Workflows by Type', 'سير العمل حسب النوع', 'bar', 'workflowByType', 'workflowType', { x: 6, y: 29, w: 6, h: 5 }, { valueField: 'documentCount' }),
  chartWidget('da_wf_timeline_line', 'Workflow Submissions Timeline', 'الخط الزمني لسير العمل', 'line', 'workflowTimeline', 'date', { x: 0, y: 34, w: 12, h: 4 }, { valueField: 'documentCount' }),
  chartWidget('da_wf_program_bar', 'Workflows by Program', 'سير العمل حسب البرنامج', 'bar', 'workflowByProgram', 'program', { x: 0, y: 38, w: 6, h: 5 }, { valueField: 'documentCount' }),

  // ── ACTIVITY: Charts ─────────────────────────────────────────────────────
  chartWidget('da_act_type_pie', 'Activities by Type', 'الأنشطة حسب النوع', 'pie', 'activitiesByType', 'activityType', { x: 6, y: 38, w: 6, h: 5 }, { valueField: 'activityCount' }),
  chartWidget('da_act_type_bar', 'Activities by Type', 'الأنشطة حسب النوع', 'bar', 'activitiesByType', 'activityType', { x: 0, y: 43, w: 6, h: 5 }, { valueField: 'activityCount' }),
  chartWidget('da_act_timeline_line', 'Activity Creation Timeline', 'الخط الزمني للأنشطة', 'line', 'activityTimeline', 'date', { x: 6, y: 43, w: 6, h: 5 }, { valueField: 'activityCount' }),
  chartWidget('da_sub_status_pie', 'Submissions by Status', 'التسليمات حسب الحالة', 'pie', 'submissionsByStatus', 'status', { x: 0, y: 48, w: 6, h: 5 }, { valueField: 'submissionCount' }),
  chartWidget('da_sub_status_bar', 'Submissions by Status', 'التسليمات حسب الحالة', 'bar', 'submissionsByStatus', 'status', { x: 6, y: 48, w: 6, h: 5 }, { valueField: 'submissionCount' }),
  chartWidget('da_sub_timeline_line', 'Submission Timeline', 'الخط الزمني للتسليمات', 'line', 'submissionTimeline', 'date', { x: 0, y: 53, w: 12, h: 4 }, { valueField: 'submissionCount' }),
  chartWidget('da_res_type_pie', 'Resources by Type', 'المصادر حسب النوع', 'pie', 'resourcesByType', 'resourceType', { x: 0, y: 57, w: 6, h: 5 }, { valueField: 'resourceCount' }),
  chartWidget('da_res_type_bar', 'Resources by Type', 'المصادر حسب النوع', 'bar', 'resourcesByType', 'resourceType', { x: 6, y: 57, w: 6, h: 5 }, { valueField: 'resourceCount' }),

  // ── List widgets ─────────────────────────────────────────────────────────
  chartWidget('da_recent_files_list', 'Recent Files', 'الملفات الأخيرة', 'list', 'driveRecentFiles', '', { x: 0, y: 62, w: 12, h: 6 }, { listLimit: 100 }),
  chartWidget('da_recent_wf_list', 'Recent Workflow Documents', 'مستندات سير العمل الأخيرة', 'list', 'workflowRecentDocuments', '', { x: 0, y: 68, w: 12, h: 6 }, { listLimit: 100 }),
  chartWidget('da_recent_activities_list', 'Recent Activities', 'الأنشطة الأخيرة', 'list', 'activityRecentActivities', '', { x: 0, y: 74, w: 6, h: 6 }, { listLimit: 100 }),
  chartWidget('da_recent_submissions_list', 'Recent Submissions', 'التسليمات الأخيرة', 'list', 'activityRecentSubmissions', '', { x: 6, y: 74, w: 6, h: 6 }, { listLimit: 100 }),
];

export const DASHBOARD_ANALYTICS_MAX_WIDGETS = DASHBOARD_ANALYTICS_DEFAULT_WIDGETS.length;

/**
 * Infer widget category from data source for category filtering.
 */
export function inferAnalyticsWidgetCategory(widget) {
  const ds = widget.dataSource || '';
  return ANALYTICS_SOURCE_FILTER_MAP[ds] || 'all';
}

// ── Categories for the widget builder ──────────────────────────────────────
export const ANALYTICS_WIDGET_CATEGORIES = [
  { id: 'all', label: 'All', labelAr: 'الكل' },
  { id: 'drive', label: 'Drive', labelAr: 'القرص' },
  { id: 'workflow', label: 'Workflow', labelAr: 'سير العمل' },
  { id: 'activity', label: 'Activity', labelAr: 'الأنشطة' },
];

// ── Source filter map for categories ───────────────────────────────────────
export const ANALYTICS_SOURCE_FILTER_MAP = {
  driveOverview: 'drive',
  driveFilesByMimeType: 'drive',
  driveFilesByBucket: 'drive',
  driveFileActivities: 'drive',
  driveStorageByUser: 'drive',
  driveRecentFiles: 'drive',
  workflowOverview: 'workflow',
  workflowByStatus: 'workflow',
  workflowByType: 'workflow',
  workflowByProgram: 'workflow',
  workflowTimeline: 'workflow',
  workflowRecentDocuments: 'workflow',
  activityOverview: 'activity',
  activitiesByType: 'activity',
  activityTimeline: 'activity',
  activityRecentActivities: 'activity',
  submissionsByStatus: 'activity',
  submissionTimeline: 'activity',
  activityRecentSubmissions: 'activity',
  resourcesByType: 'activity',
  activityRecentResources: 'activity',
};

/**
 * Build rawData for DashboardEngine from useDashboardAnalytics output.
 * Maps the API response into the format expected by processWidgetData.
 */
export function buildAnalyticsRawData(analyticsData) {
  if (!analyticsData) return {};

  const { drive = {}, workflow = {}, activity = {} } = analyticsData;

  return {
    // Drive overview stats (for count widgets)
    driveOverview: drive.overview || {},

    // Drive chart data arrays
    driveFilesByMimeType: drive.filesByMimeType || [],
    driveFilesByBucket: drive.filesByBucket || [],
    driveFileActivities: drive.fileActivities || [],
    driveStorageByUser: drive.storageByUser || [],
    driveRecentFiles: drive.recentFiles || [],

    // Workflow overview stats (for count widgets)
    workflowOverview: workflow.overview || {},

    // Workflow chart data arrays
    workflowByStatus: workflow.workflowByStatus || [],
    workflowByType: workflow.workflowByType || [],
    workflowByProgram: workflow.workflowByProgram || [],
    workflowTimeline: workflow.workflowTimeline || [],
    workflowRecentDocuments: workflow.recentDocuments || [],

    // Activity overview stats (for count widgets)
    activityOverview: activity.overview || {},

    // Activity chart data arrays
    activitiesByType: activity.activitiesByType || [],
    activityTimeline: activity.activityTimeline || [],
    activityRecentActivities: activity.recentActivities || [],
    submissionsByStatus: activity.submissionsByStatus || [],
    submissionTimeline: activity.submissionTimeline || [],
    activityRecentSubmissions: activity.recentSubmissions || [],
    resourcesByType: activity.resourcesByType || [],
  };
}
