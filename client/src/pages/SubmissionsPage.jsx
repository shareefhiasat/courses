import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { Button, Select, UserSelect, AdvancedDataGrid } from '@ui';
import { USER_ROLES, SUBMISSION_STATUS } from '@constants';
import { SUBMISSION_STATUS as SUBMISSION_STATUS_TYPES } from '@utils/sharedTypes';

const SubmissionsPage = ({
  submissions,
  activities,
  users,
  enrollments,
  activityFilter,
  setActivityFilter,
  submissionStudentFilter,
  setSubmissionStudentFilter,
  submissionStatusFilter,
  setSubmissionStatusFilter,
  submissionScoreFilter,
  setSubmissionScoreFilter,
  gradingSubmission,
  setGradingSubmission,
  gradingScore,
  setGradingScore,
  gradingModalOpen,
  setGradingModalOpen,
  theme,
  formatDateTime
}) => {
  const { t } = useLang();
  const toast = useToast();

  const filteredSubmissions = submissions.filter((s) => {
    if (activityFilter !== 'all' && s.activityId !== activityFilter) return false;
    if (submissionStudentFilter !== 'all' && s.userId !== submissionStudentFilter) return false;
    if (submissionStatusFilter !== 'all') {
      const status = s.status || SUBMISSION_STATUS_TYPES.SUBMITTED;
      if (submissionStatusFilter === 'pending') {
        if (!(status === SUBMISSION_STATUS_TYPES.PENDING || status === SUBMISSION_STATUS_TYPES.SUBMITTED)) return false;
      } else if (submissionStatusFilter === 'graded') {
        if (status !== SUBMISSION_STATUS_TYPES.GRADED) return false;
      } else if (submissionStatusFilter === 'late') {
        if (status !== 'late') return false;
      }
    }
    if (submissionScoreFilter !== 'all') {
      if (submissionScoreFilter === 'graded') {
        if (s.score === null || s.score === undefined) return false;
      } else if (submissionScoreFilter === 'not_graded') {
        if (s.score !== null && s.score !== undefined) return false;
      }
    }
    return true;
  });

  return (
    <div className="submissions-tab">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: '0.75rem',
          alignItems: 'center'
        }}
      >
        <Select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          options={[
            { value: 'all', label: t('all_activities') || 'All Activities', icon: getThemedIcon('ui', 'filter', 16, theme) },
            ...activities.map(a => ({ value: a.id || a.docId, label: a.title_en || a.title_ar || a.id }))
          ]}
          searchable
          fullWidth
        />
        <UserSelect
          users={users}
          enrollments={enrollments}
          value={submissionStudentFilter}
          onChange={(e) => setSubmissionStudentFilter(e.target.value)}
          placeholder={t('all_students') || 'All Students'}
          roleFilter={[USER_ROLES.STUDENT]}
          includeAll={true}
          showEnrollments={true}
          showStatus={true}
          fullWidth
        />
        <Select
          value={submissionStatusFilter}
          onChange={(e) => setSubmissionStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: t('all_statuses') || 'All Status', icon: getThemedIcon('ui', 'filter', 16, theme) },
            { value: SUBMISSION_STATUS_TYPES.PENDING, label: t('pending') || 'Pending' },
            { value: 'graded', label: t('graded') || 'Graded' },
            { value: 'late', label: t('late') || 'Late' }
          ]}
          searchable
          fullWidth
        />
        <Select
          value={submissionScoreFilter}
          onChange={(e) => setSubmissionScoreFilter(e.target.value)}
          options={[
            { value: 'all', label: t('all_scores') || 'All Scores', icon: getThemedIcon('ui', 'filter', 16, theme) },
            { value: 'graded', label: t('graded_only') || 'Graded only' },
            { value: 'not_graded', label: t('not_graded_only') || 'Not graded yet' }
          ]}
          searchable
          fullWidth
        />
      </div>
      <AdvancedDataGrid
        rows={filteredSubmissions}
        getRowId={(row) => row.id || row.docId}
        columns={[
          {
            field: 'activityId', headerName: t('activity_col'), flex: 1, minWidth: 200,
            renderCell: (params) => {
              const activity = activities.find(a => (a.id === params.value) || (a.docId === params.value));
              return activity ? (activity.title_en || activity.title_ar || activity.id) : params.value;
            }
          },
          {
            field: 'userId', headerName: t('student_col'), flex: 1.5, minWidth: 260,
            renderCell: (params) => {
              const user = users.find(u => (u.docId || u.id) === params.value);
              if (!user) return params.value;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>{user.displayName || user.realName || user.email || params.value}</span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{user.email}</span>
                  {user.studentNumber && (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>#{user.studentNumber}</span>
                  )}
                </div>
              );
            }
          },
          {
            field: 'status', headerName: t('status_col'), width: 140,
            renderCell: (params) => {
              const statusMap = {
                [SUBMISSION_STATUS_TYPES.SUBMITTED]: { icon: getThemedIcon('ui', 'file_text', 16, theme), text: 'Submitted' },
                [SUBMISSION_STATUS_TYPES.GRADED]: { icon: getThemedIcon('ui', 'check_circle', 16, theme), text: 'Graded' },
                'late': { icon: getThemedIcon('ui', 'clock', 16, theme), text: 'Late' },
                [SUBMISSION_STATUS_TYPES.PENDING]: { icon: getThemedIcon('ui', 'clock', 16, theme), text: 'Pending' }
              };
              const status = statusMap[params.value] || statusMap[SUBMISSION_STATUS_TYPES.SUBMITTED];
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  {status.icon} {status.text}
                </span>
              );
            }
          },
          {
            field: 'score', headerName: t('score_col'), width: 140,
            renderCell: (params) => {
              const act = activities.find(a => a.id === params.row.activityId || a.docId === params.row.activityId);
              const maxScore = act?.maxScore || 100;
              return params.value !== null && params.value !== undefined ? `${params.value} / ${maxScore}` : 'Not graded yet';
            }
          },
          {
            field: 'submittedAt', headerName: t('submitted_at_col'), width: 180,
            valueGetter: (params) => params.value,
            renderCell: (params) => params.value ? formatDateTime(params.value) : (t('unknown') || 'Unknown')
          },
          {
            field: 'files', headerName: t('files_col'), width: 150,
            renderCell: (params) => {
              if (!params.value || params.value.length === 0) return t('no_files') || 'No files';
              return (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {params.value.map((file, i) => (
                    <a
                      key={i}
                      href={file}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#e3f2fd',
                        color: '#1976d2',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '0.8rem'
                      }}
                    >
                      File {i + 1}
                    </a>
                  ))}
                </div>
              );
            }
          },
          {
            field: 'actions', headerName: t('actions') || 'Actions', width: 120, sortable: false, filterable: false,
            renderCell: (params) => (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const submission = params.row;
                  const currentScore = (submission.score !== null && submission.score !== undefined)
                    ? String(submission.score)
                    : '';
                  setGradingSubmission(submission);
                  setGradingScore(currentScore);
                  setGradingModalOpen(true);
                }}
              >
                {t('grade') || 'Grade'}
              </Button>
            )
          }
        ]}
        pageSize={15}
        pageSizeOptions={[5, 10, 15, 20, 50]}
        checkboxSelection
        exportFileName="submissions"
        showExportButton
        exportLabel={t('export') || 'Export'}
      />
    </div>
  );
};

export default SubmissionsPage;
