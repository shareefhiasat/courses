import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useHelpArticles } from '../../hooks/useHelpArticles';
import { usePermissions } from '../../hooks/usePermissions';
import { useLang } from '../../contexts/LangContext';
import { BASE_PERMISSION_SCREEN_DEFINITIONS, PERMISSION_SCREEN_DEFINITIONS, resolveMatrixScreenId } from '../../config/navigationRegistry';

export default function HelpCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { search, articles } = useHelpArticles();
  const { canAccessScreen, loading: permLoading } = usePermissions();
  const { lang, t } = useLang();
  const isAr = lang === 'ar';

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const showPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  useEffect(() => {
    const openHandler = () => showPalette();
    window.addEventListener('help:open-palette', openHandler);
    return () => window.removeEventListener('help:open-palette', openHandler);
  }, [showPalette]);

  const navItems = useMemo(() => {
    if (permLoading) return [];
    const allDefs = [...BASE_PERMISSION_SCREEN_DEFINITIONS, ...PERMISSION_SCREEN_DEFINITIONS];
    const seen = new Set();
    const items = [];
    for (const def of allDefs) {
      if (seen.has(def.screenId)) continue;
      seen.add(def.screenId);
      const screenId = resolveMatrixScreenId(def.screenId);
      if (!canAccessScreen(screenId)) continue;
      const route = screenToRoute(def.screenId);
      if (!route) continue;
      items.push({
        screenId: def.screenId,
        label: isAr ? def.nameAr : def.nameEn,
        route,
      });
    }
    return items;
  }, [permLoading, canAccessScreen, isAr]);

  const articleResults = useMemo(() => {
    if (!query || query.trim().length < 2) return articles.slice(0, 5);
    return search(query).slice(0, 8);
  }, [query, search, articles]);

  const navResults = useMemo(() => {
    if (!query || query.trim().length < 1) return navItems.slice(0, 6);
    const q = query.toLowerCase();
    return navItems.filter((n) => n.label.toLowerCase().includes(q) || n.screenId.toLowerCase().includes(q)).slice(0, 8);
  }, [query, navItems]);

  const openArticle = useCallback((slug) => {
    navigate(`/help#${slug}`);
    setOpen(false);
    setQuery('');
  }, [navigate]);

  const goToRoute = useCallback((route) => {
    navigate(route);
    setOpen(false);
    setQuery('');
  }, [navigate]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={() => setOpen(false)}
    >
      <Command
        loop
        label={isAr ? 'مركز المساعدة' : 'Help Command Palette'}
        style={{
          width: '90%',
          maxWidth: 620,
          maxHeight: '70vh',
          background: 'var(--bg-color, #fff)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          direction: isAr ? 'rtl' : 'ltr',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          placeholder={isAr ? 'ابحث عن مساعدة أو انتقل إلى صفحة...' : 'Search help or navigate to a page...'}
          value={query}
          onValueChange={setQuery}
          autoFocus
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            padding: '16px 20px',
            fontSize: 'var(--font-size-md)',
            background: 'transparent',
            color: 'var(--text-color, #333)',
            borderBottom: '1px solid var(--border-color, #e0e0e0)',
          }}
        />
        <Command.List
          style={{
            overflow: 'auto',
            padding: '8px',
            flex: 1,
          }}
        >
          {articleResults.length > 0 && (
            <Command.Group
              heading={isAr ? 'مقالات المساعدة' : 'Help Articles'}
              style={{ padding: '4px 0' }}
            >
              {articleResults.map((article) => (
                <Command.Item
                  key={`article-${article.slug}`}
                  value={`help-${article.title}-${article.slug}`}
                  onSelect={() => openArticle(article.slug)}
                  style={itemStyle}
                >
                  <span style={{ fontSize: 'var(--font-size-lg)', marginInlineEnd: 10 }}>📖</span>
                  {article.title}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {navResults.length > 0 && (
            <Command.Group
              heading={isAr ? 'التنقل السريع' : 'Quick Navigation'}
              style={{ padding: '4px 0' }}
            >
              {navResults.map((nav) => (
                <Command.Item
                  key={`nav-${nav.screenId}`}
                  value={`nav-${nav.label}-${nav.screenId}`}
                  onSelect={() => goToRoute(nav.route)}
                  style={itemStyle}
                >
                  <span style={{ fontSize: 'var(--font-size-lg)', marginInlineEnd: 10 }}>🔗</span>
                  {nav.label}
                  <span style={{ marginInlineStart: 'auto', opacity: 0.5, fontSize: 'var(--font-size-sm)' }}>{nav.route}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {articleResults.length === 0 && navResults.length === 0 && (
            <Command.Empty style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>
              {isAr ? 'لا توجد نتائج' : 'No results found.'}
            </Command.Empty>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-color, #333)',
};

function screenToRoute(screenId) {
  const map = {
    home: '/',
    dashboard: '/dashboard',
    'student-dashboard': '/student-dashboard',
    'student-profile': '/student-profile',
    activities: '/dashboard?tab=activities',
    announcements: '/dashboard?tab=announcements',
    resources: '/dashboard?tab=resources',
    quizzes: '/quizzes',
    attendance: '/attendance',
    'hr-attendance': '/hr-attendance',
    'qr-scanner': '/qr-scanner',
    penalty: '/dashboard?tab=penalty',
    participation: '/dashboard?tab=participation',
    behavior: '/dashboard?tab=behavior',
    enrollments: '/enrollments',
    'manage-enrollments': '/manage-enrollments',
    programs: '/dashboard#programs',
    subjects: '/dashboard#subjects',
    classes: '/dashboard#classes',
    'marks-entry': '/marks-entry',
    'quiz-results': '/review-results',
    analytics: '/analytics',
    'advanced-analytics': '/advanced-analytics',
    chat: '/chat',
    notifications: '/notifications',
    'scheduled-reports': '/scheduled-reports',
    workflow: '/workflow/inbox',
    drive: '/smart-drive',
    profile: '/profile',
    'permission-matrix': '/permission-matrix',
    timer: '/timer',
    'summary-dashboard': '/summary-dashboard',
    'scheduling-calendar': '/scheduling-calendar',
    'classes-availability': '/scheduling-calendar?tab=classes',
    'instructor-availability-view': '/scheduling-calendar?tab=availability',
    'room-availability-view': '/scheduling-calendar?tab=availability&scope=room',
    'instructor-availability-setup': '/dashboard#instructor-availability',
    'room-availability-setup': '/dashboard#classroom-availability',
    'rooms-management': '/dashboard#classrooms-management',
    'user-category-access': '/dashboard#user-category-access',
    'email-templates': '/dashboard?tab=emailTemplates',
    'notification-logs': '/dashboard?tab=notificationLogs',
    users: '/dashboard?tab=users',
    categories: '/dashboard?tab=categories',
    'activity-types': '/dashboard?tab=activity-types',
    'behavior-types': '/dashboard?tab=behavior-types',
    'participation-types': '/dashboard?tab=participation-types',
    'penalty-types': '/dashboard?tab=penalty-types',
    'resource-types': '/dashboard?tab=resource-types',
    'priority-types': '/dashboard?tab=priority-types',
    'user-roles': '/dashboard?tab=user-roles',
    'subject-types': '/dashboard?tab=subject-types',
    'assessment-types': '/dashboard?tab=assessment-types',
    'question-types': '/dashboard?tab=question-types',
    'attendance-status-types': '/dashboard?tab=attendance-status-types',
    'enrollment-status-types': '/dashboard?tab=enrollment-status-types',
  };
  return map[screenId] || null;
}
