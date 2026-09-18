/**
 * AiQueryDialog
 *
 * Quick-question picker for Admin and HR users.
 * Offers a curated, bilingual catalog of predefined questions and
 * returns instant answers scoped to the user's permissions.
 */

import React, { useSyncExternalStore, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Paper,
  LinearProgress,
  Autocomplete,
} from '@mui/material';
import {
  Sparkles,
  X,
  Trash2,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import {
  subscribe,
  getSnapshot,
  setOpen,
  startQuickQuestion,
  clearHistory,
  copyMessage,
} from './aiQueryStore';
import {
  AI_QUESTIONS,
  filterAiQuestions,
  getQuestionLabel,
} from '@constants/aiQuestions';

const KNOWN_TOOLS = {
  // Existing
  attendanceSummary: { ar: 'الحضور والغياب', en: 'Attendance' },
  absenceWarningCounts: { ar: 'إنذارات الغياب', en: 'Warnings' },
  lateCount: { ar: 'التأخير', en: 'Late records' },
  humanCaseCount: { ar: 'الحالات الإنسانية', en: 'Human cases' },
  studentCount: { ar: 'أعداد الطلاب', en: 'Students' },
  marksSummary: { ar: 'الدرجات', en: 'Marks' },
  scheduleSummary: { ar: 'الجدول', en: 'Schedule' },
  workflowSummary: { ar: 'سير العمل', en: 'Workflows' },
  notesAndComments: { ar: 'الملاحظات', en: 'Notes' },
  topAbsenceStudent: { ar: 'أكثر غياباً', en: 'Top absences' },
  // New
  classCount: { ar: 'عدد الفصول', en: 'Classes' },
  attendanceTypes: { ar: 'أنواع الحضور', en: 'Attendance Types' },
  programInfo: { ar: 'البرامج', en: 'Programs' },
  subjectInfo: { ar: 'المواد', en: 'Subjects' },
  enrollmentInfo: { ar: 'التسجيل', en: 'Enrollment' },
  penaltySummary: { ar: 'العقوبات', en: 'Penalties' },
  behaviorSummary: { ar: 'السلوك', en: 'Behaviors' },
  marksDistribution: { ar: 'توزيع الدرجات', en: 'Marks Distribution' },
  participationSummary: { ar: 'المشاركة', en: 'Participation' },
  activityInfo: { ar: 'الأنشطة', en: 'Activities' },
  announcementInfo: { ar: 'الإعلانات', en: 'Announcements' },
  quizSummary: { ar: 'الاختبارات', en: 'Quizzes' },
  standupAttendance: { ar: 'الطابور', en: 'Standup' },
  classroomInfo: { ar: 'القاعات', en: 'Classrooms' },
  submissionSummary: { ar: 'التسليمات', en: 'Submissions' },
  holidayInfo: { ar: 'الإجازات', en: 'Holidays' },
  breakSessionSummary: { ar: 'الاستراحات', en: 'Break Sessions' },
  sessionSummary: { ar: 'الجلسات', en: 'Sessions' },
  academicClosureInfo: { ar: 'الإغلاقات', en: 'Closures' },
  exportHistory: { ar: 'سجل التصدير', en: 'Exports' },
  // Meta
  greeting: { ar: 'ترحيب', en: 'Welcome' },
  direct: { ar: 'رد مباشر', en: 'Direct answer' },
};

function getToolLabel(tool, lang) {
  if (!tool) return null;
  if (tool === 'unknown') return null;
  return KNOWN_TOOLS[tool]?.[lang] || tool;
}

export const AiQueryDialog = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';

  const state = useSyncExternalStore(subscribe, getSnapshot);
  const { open, messages: history, loading, copiedId, timeLeft } = state;

  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, history, loading]);

  const handleQuickSelect = (question) => {
    if (!question || loading) return;
    startQuickQuestion(question.id, lang);
  };

  const handleCopy = (id, text) => {
    copyMessage(id, text);
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  const userForFilter = useMemo(() => ({ isAdmin, isSuperAdmin }), [isAdmin, isSuperAdmin]);
  const filteredQuestions = useMemo(() => filterAiQuestions(AI_QUESTIONS, userForFilter), [userForFilter]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="md"
      fullWidth
      dir={isRTL ? 'rtl' : 'ltr'}
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? '#0f172a' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
          background: isDark
            ? 'linear-gradient(90deg, #1e293b, #0f172a)'
            : 'linear-gradient(90deg, #f8fafc, #edf2f7)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Sparkles size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              {isRTL ? 'المساعد الذكي للاستعلامات' : 'AI Quick Questions'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isRTL
                ? 'إجابات فورية عن الغيابات، الإنذارات، الجداول وسير العمل'
                : 'Instant answers for attendance, warnings, schedule & workflows'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {history.length > 0 && (
            <ColoredTooltip title={isRTL ? 'مسح المحادثة' : 'Clear history'}>
              <IconButton size="small" onClick={handleClearHistory} sx={{ color: 'text.secondary' }}>
                <Trash2 size={18} />
              </IconButton>
            </ColoredTooltip>
          )}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'warning.main' }}>
              <CircularProgress size={14} color="warning" />
              <Typography variant="caption" fontWeight={600}>
                {(() => {
                  if (timeLeft <= 0) return isRTL ? 'جارٍ الانتهاء…' : 'Almost ready…';
                  const m = Math.floor(timeLeft / 60);
                  const s = String(timeLeft % 60).padStart(2, '0');
                  return isRTL ? `~${m}:${s} متبقية` : `~${m}:${s} left`;
                })()}
              </Typography>
            </Box>
          )}
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content / Message Flow */}
      <DialogContent
        ref={scrollRef}
        sx={{
          p: 2.5,
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {loading && <LinearProgress sx={{ width: '100%' }} color="warning" />}
        {history.length === 0 ? (
          <Box
            sx={{
              py: 5,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={32} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {isRTL ? 'كيف يمكنني مساعدتك اليوم؟' : 'How can I assist you today?'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
              {isRTL
                ? 'اختر أحد الأسئلة السريعة أدناه للحصول على إجابة فورية من البيانات المسموحة لك.'
                : 'Pick a quick question below for an instant answer drawn from your scoped data.'}
            </Typography>
          </Box>
        ) : (
          history.map((msg) => (
            <Box
              key={msg.id}
              data-testid={`${msg.role}-message`}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : (isDark ? '#334155' : '#e2e8f0'),
                    color: msg.role === 'user' ? '#fff' : 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {msg.role === 'user' ? (isRTL ? 'أنت' : 'You') : (isRTL ? 'المساعد الذكي' : 'Assistant')} • {msg.timestamp}
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxWidth: '85%',
                  borderRadius: 2.5,
                  bgcolor: msg.role === 'user'
                    ? 'primary.main'
                    : isDark ? '#1e293b' : '#f1f5f9',
                  color: msg.role === 'user'
                    ? '#ffffff'
                    : isDark ? '#f8fafc' : '#0f172a',
                  border: msg.role === 'user' ? 'none' : isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                  position: 'relative',
                  '&:hover .copy-btn': { opacity: 1 },
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </Typography>

                {msg.role === 'ai' && (
                  <Box
                    sx={{
                      mt: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      pt: 1,
                      borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {msg.tool && getToolLabel(msg.tool, lang) && (
                        <Chip
                          label={getToolLabel(msg.tool, lang)}
                          size="small"
                          color={msg.tool === 'greeting' ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                      {msg.fromCache !== undefined && (
                        <Chip
                          label={
                            msg.fromCache
                              ? (isRTL
                                ? `مخزن ${msg.cachedAt ? new Date(msg.cachedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}`
                                : `Cached ${msg.cachedAt ? new Date(msg.cachedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}`)
                              : (isRTL ? 'مباشر' : 'Live')
                          }
                          size="small"
                          color={msg.fromCache ? 'info' : 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                    <ColoredTooltip title={isRTL ? 'نسخ الإجابة' : 'Copy answer'}>
                      <IconButton
                        size="small"
                        className="copy-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        sx={{ opacity: 0.7, p: 0.5 }}
                      >
                        {copiedId === msg.id ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                      </IconButton>
                    </ColoredTooltip>
                  </Box>
                )}
              </Paper>
            </Box>
          ))
        )}

        {loading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: isDark ? '#1e293b' : '#f1f5f9',
              width: 'fit-content',
              maxWidth: '85%',
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    opacity: 0.4,
                    animation: 'dotPulse 1.2s infinite ease-in-out',
                    animationDelay: `${i * 0.15}s`,
                    '@keyframes dotPulse': {
                      '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: 0.4 },
                      '40%': { transform: 'scale(1.1)', opacity: 1 },
                    },
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {isRTL ? 'جارٍ البحث والاستعلام...' : 'Querying database and preparing answer...'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Quick-Question Autocomplete */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
          background: isDark ? '#0b1120' : '#f8fafc',
        }}
      >
        <Autocomplete
          options={filteredQuestions}
          getOptionLabel={(option) => getQuestionLabel(option, lang)}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          filterOptions={(options, state) => {
            const value = state.inputValue.toLowerCase().trim();
            if (!value) return options.slice(0, 50);
            return options.filter((q) =>
              getQuestionLabel(q, lang).toLowerCase().includes(value) ||
              (q.arQuery || '').toLowerCase().includes(value) ||
              (q.enQuery || '').toLowerCase().includes(value)
            );
          }}
          onChange={(e, value) => handleQuickSelect(value)}
          value={null}
          disabled={loading}
          clearOnBlur
          clearOnEscape
          openOnFocus
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder={isRTL ? 'ابحث عن سؤال سريع...' : 'Search a quick question...'}
              InputProps={{
                ...params.InputProps,
                sx: {
                  borderRadius: 2,
                  bgcolor: isDark ? '#1e293b' : '#ffffff',
                },
              }}
            />
          )}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5, mb: 0.5 }}
        >
          {isRTL
            ? 'اختر سؤالاً سريعاً للحصول على إجابة فورية.'
            : 'Pick a quick question for an instant answer.'}
        </Typography>
      </Box>

    </Dialog>
  );
};

export default AiQueryDialog;
