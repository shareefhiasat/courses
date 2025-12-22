import React, { useEffect, useState, useRef } from 'react';
import Joyride from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate, useLocation } from 'react-router-dom';
import { getActivities, getStudentPoints } from '../firebase/firestore';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { submitActivity, getUserSubmissions, canRetakeActivity } from '../firebase/submissions';
import { Loading, useToast, Button } from '../components/ui';
import UnifiedCard from '../components/UnifiedCard';
import './HomePage.css';
import { CheckCircle, Hourglass, CalendarDays, Repeat, Star, StarOff, Pin, Award, MessageSquareText, Play, Info, Filter, BookOpen, ClipboardList, HelpCircle, Leaf, TrendingUp, Flame, Gamepad2, Edit, Clock } from 'lucide-react';
import { addNotification } from '../firebase/notifications';
import { sendEmail } from '../firebase/firestore';
import { formatDateTime } from '../utils/date';
import { useTimeTracking } from '../hooks/useTimeTracking';

const ActivitiesPage = () => {
  const { user, isAdmin, isSuperAdmin, isInstructor } = useAuth();
  const { t, lang } = useLang();
  const location = useLocation();
  const toast = useToast();
  
  // Track time spent on activities page
  useTimeTracking('activities_page', !isAdmin && !isSuperAdmin && !isInstructor);
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  // Multi-select levels (empty means all)
  const [levelFilters, setLevelFilters] = useState([]);
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [retakeFilter, setRetakeFilter] = useState(false);
  const [gradedFilter, setGradedFilter] = useState('all'); // 'all', 'graded', 'not_graded'
  const [completedFilter, setCompletedFilter] = useState(false);
  const [bookmarks, setBookmarks] = useState({}); // { [activityId]: true }
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [activityMedals, setActivityMedals] = useState({}); // { [activityId]: [{medal, points}] }
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [spotlight, setSpotlight] = useState(null); // {top,left,width,height}
  const filtersRef = useRef(null);
  const gridRef = useRef(null);
  const tourSeenKey = 'activitiesHelpSeen';

  const tourSteps = [
    {
      target: '[data-tour="search"]',
      content: lang === 'ar' ? 'ابحث عن الأنشطة بعنوانها أو وصفها هنا.' : 'Search activities by title or description here.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="type-chips"]',
      content: lang === 'ar' ? 'صنّف حسب النوع: تدريب، واجب، اختبار. زر "جميع الأنواع" يعيد التعيين.' : 'Filter by type: Training, Homework, Quiz. "All Types" resets.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="level-chips"]',
      content: lang === 'ar' ? 'اختر مستوى واحد أو أكثر: مبتدئ، متوسط، متقدم.' : 'Select one or more levels: Beginner, Intermediate, Advanced.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="status-toggles"]',
      content: lang === 'ar' ? 'بدّل أيقونات الحالة: مفضلة، مميّزة، إعادة، مصححة.' : 'Toggle status icons: Bookmarked, Featured, Retake, Graded.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="grid"]',
      content: lang === 'ar' ? 'شبكة الأنشطة. استخدم زر البدء أو التفاصيل لكل بطاقة.' : 'Activities grid. Use Start or Details on each card.',
      placement: 'top'
    }
  ];

  useEffect(() => {
    fetchActivities();
    if (user) {
      fetchUserSubmissions();
      loadBookmarks();
      loadActivityMedals();
    }
  }, [user]);

  // Global help trigger from Navbar
  useEffect(() => {
    const onGlobalHelp = () => setShowHelp(true);
    window.addEventListener('app:help', onGlobalHelp);
    return () => window.removeEventListener('app:help', onGlobalHelp);
  }, []);

  // Auto-open tour on first visit
  useEffect(() => {
    try {
      const seen = localStorage.getItem(tourSeenKey);
      if (seen !== 'true') {
        setShowHelp(true);
        console.log('[Activities] Auto-opening help tour');
      }
    } catch { }
  }, []);

  const loadActivityMedals = async () => {
    if (!user) return;
    try {
      // If not privileged, use student-safe API to avoid permission-denied errors
      if (!(isAdmin || isSuperAdmin || isInstructor)) {
        const points = await getStudentPoints(user.uid);
        const medalsByActivity = {};
        (points || []).forEach((p) => {
          const aid = p.activityId || p.activity || p.aid;
          if (!aid) return;
          if (!medalsByActivity[aid]) medalsByActivity[aid] = [];
          medalsByActivity[aid].push({
            category: p.category || p.type || 'points',
            points: p.points || p.value || 0,
            timestamp: p.timestamp || p.at || null,
          });
        });
        setActivityMedals(medalsByActivity);
        return;
      }
      // Get all points for this student
      const q = query(
        collection(db, 'points'),
        where('studentId', '==', user.uid)
      );
      const snapshot = await getDocs(q);

      const medalsByActivity = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.activityId) {
          if (!medalsByActivity[data.activityId]) {
            medalsByActivity[data.activityId] = [];
          }
          medalsByActivity[data.activityId].push({
            category: data.category,
            points: data.points,
            timestamp: data.timestamp
          });
        }
      });

      setActivityMedals(medalsByActivity);
    } catch (error) {
      // Suppress permission noise for non-privileged users
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('insufficient permissions') || msg.includes('missing or insufficient permissions')) {
        setActivityMedals({});
      } else {
        console.error('Error loading activity medals:', error);
      }
    }
  };

  // Deep-link: tab=bookmarks sets bookmark filter initially
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if ((params.get('tab') || '').toLowerCase() === 'bookmarks') {
        setBookmarkFilter(true);
      }
    } catch { }
  }, [location.search]);

  // Load enrolled classes for filtering
  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        setEnrolledClasses(Array.isArray(data.enrolledClasses) ? data.enrolledClasses : []);
      } catch { }
    };
    loadEnrollments();
  }, [user]);

  // Add loading spinner when filters change
  useEffect(() => {
    setFilterLoading(true);
    const timer = setTimeout(() => setFilterLoading(false), 300);
    return () => clearTimeout(timer);
  }, [typeFilter, levelFilters]);

  const fetchActivities = async () => {
    setLoading(true);
    const result = await getActivities();
    if (result.success) {
      setActivities(result.data || []);
    }
    setLoading(false);
  };

  const loadBookmarks = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data() || {};
      setBookmarks((data.bookmarks && data.bookmarks.activities) || {});
    } catch { }
  };

  const fetchUserSubmissions = async () => {
    const result = await getUserSubmissions(user.uid);
    if (result.success) {
      const submissionMap = {};
      result.data.forEach(sub => {
        submissionMap[sub.activityId] = sub;
      });
      setSubmissions(submissionMap);
    }
  };

  const handleMarkComplete = async (activity) => {
    try {
      const activityId = activity.docId || activity.id;

      if (!activityId) {
        toast?.showError('Activity ID not found');
        return;
      }

      // Check if can retake
      if (submissions[activityId]) {
        const retakeCheck = await canRetakeActivity(user.uid, activityId, activity);
        if (!retakeCheck.canRetake) {
          toast?.showError(retakeCheck.reason);
          return;
        }
      }

      // Submit activity
      const result = await submitActivity(user.uid, activityId, activity.classId || 'general', {
        answers: {}, // This would be filled from a quiz form
        timeSpent: 0
      });

      if (result.success) {
        toast?.showSuccess(result.message || 'Activity marked as complete!');
        // In-app notification to the student
        try {
          await addNotification({
            userId: user.uid,
            title: (t('activity_completed') || 'Activity completed'),
            message: `${activity.title_en || activity.title_ar || activity.id}`,
            type: 'activity_complete',
            data: { activityId }
          });
        } catch { }
        // Email confirmation to the student
        try {
          if (user.email) {
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #800020;">✅ ${(t('activity_completed') || 'Activity completed')}</h2>
                <p style="margin:0.5rem 0 0.25rem 0;"><strong>${t('activity') || 'Activity'}:</strong> ${activity.title_en || activity.title_ar || activity.id}</p>
                <p style="margin:0.25rem 0;"><strong>${t('submitted_at') || 'Submitted'}:</strong> ${formatDateTime(new Date())}</p>
              </div>`;
            await sendEmail({
              to: [user.email],
              subject: `Completed: ${activity.title_en || activity.title_ar || activity.id}`,
              html,
              type: 'activity_complete'
            });
          }
        } catch { }
        await fetchUserSubmissions();
      } else {
        toast?.showError(result.error || 'Failed to submit activity');
      }
    } catch (error) {
      console.error('Error marking complete:', error);
      toast?.showError('Failed to submit activity: ' + error.message);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const activityId = activity.docId || activity.id;
    const submission = submissions[activityId];

    const typeMatch = typeFilter === 'all' || activity.type === typeFilter;
    const levelMatch = (levelFilters || []).length === 0 || levelFilters.includes(activity.level || 'beginner');
    const bookmarkMatch = !bookmarkFilter || !!bookmarks[activityId];
    const featuredMatch = !featuredFilter || !!activity.featured;
    const enrolledGate = !activity.classId || (enrolledClasses || []).includes(activity.classId);

    // New filters
    const retakeMatch = !retakeFilter || activity.allowRetake;
    const gradedMatch = gradedFilter === 'all' ||
      (gradedFilter === 'graded' && submission?.status === 'graded') ||
      (gradedFilter === 'not_graded' && (!submission || submission?.status !== 'graded'));
    const completedMatch = !completedFilter || submission?.status === 'graded';

    const baseMatch = typeMatch && levelMatch && bookmarkMatch && featuredMatch && retakeMatch && gradedMatch && completedMatch && (activity.show || false) && enrolledGate;
    if (!baseMatch) return false;
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return true;
    const title = (activity.title_en || activity.title_ar || '').toLowerCase();
    const desc = (activity.description_en || activity.description_ar || '').toLowerCase();
    return title.includes(q) || desc.includes(q);
  }).sort((a, b) => {
    const ad = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const bd = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return (bd || 0) - (ad || 0);
  });

  if (!user) return <Navigate to="/login" />;

  if (loading) return <Loading variant="overlay" fullscreen message={t('loading') || 'Loading activities...'} />;

  return (
    <div className="content-section" style={{ padding: '1rem 0' }}>

      {/* Filters */}
      <div className="filters-section" ref={filtersRef} style={{
        background: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {/* Row: Help + Search */}
        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <input
              type="search"
              placeholder={t('search') || 'Search activities'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}
              data-tour="search"
            />
          </div>
        </div>

        {/* Type chips */}
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', marginRight: 12 }} data-tour="type-chips">
          <button className="type-all" onClick={() => setTypeFilter('all')} title={t('all_types') || 'All Types'} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.06)', background: typeFilter === 'all' ? '#800020' : '#fff', color: typeFilter === 'all' ? '#fff' : '#800020', fontWeight: 700 }}> {t('all_types') || 'All Types'} </button>
          <button onClick={() => setTypeFilter('training')} title={t('training') || 'Training'} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #bbdefb', background: typeFilter === 'training' ? '#1976d2' : '#e3f2fd', color: typeFilter === 'training' ? '#fff' : '#1976d2', display: 'inline-flex', alignItems: 'center', gap: 6 }}><BookOpen size={14} /> {t('training') || 'Training'}</button>
          <button onClick={() => setTypeFilter('homework')} title={t('homework') || 'Homework'} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #ffe0b2', background: typeFilter === 'homework' ? '#f57c00' : '#fff3e0', color: typeFilter === 'homework' ? '#fff' : '#b45309', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ClipboardList size={14} /> {t('homework') || 'Homework'}</button>
          <button onClick={() => setTypeFilter('quiz')} title={t('quiz') || 'Quiz'} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #e0e7ff', background: typeFilter === 'quiz' ? '#6366f1' : '#eef2ff', color: typeFilter === 'quiz' ? '#fff' : '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: 6 }}><HelpCircle size={14} /> {t('quiz') || 'Quiz'}</button>
        </div>

        {/* Level chips (multi-select) */}
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', marginRight: 12 }} data-tour="level-chips">
          {[
            { id: 'beginner', label: t('beginner') || 'Beginner', bg: '#e8f5e9', fg: '#2e7d32' },
            { id: 'intermediate', label: t('intermediate') || 'Intermediate', bg: '#fff7ed', fg: '#b45309' },
            { id: 'advanced', label: t('advanced') || 'Advanced', bg: '#fee2e2', fg: '#b91c1c' }
          ].map(lv => {
            const active = (levelFilters || []).includes(lv.id);
            return (
              <button key={lv.id} onClick={() => setLevelFilters(prev => active ? prev.filter(x => x !== lv.id) : [...prev, lv.id])} title={lv.label}
                style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid transparent', background: active ? lv.fg : lv.bg, color: active ? '#fff' : lv.fg, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Award size={14} /> {lv.label}
              </button>
            );
          })}
        </div>

        {/* Status toggles: bookmark, featured, retake, graded, not graded */}
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }} data-tour="status-toggles">
          <button onClick={() => setBookmarkFilter(v => !v)} title={t('bookmarked') || 'Bookmarked'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #f5c518', background: bookmarkFilter ? '#f5c518' : '#fff', color: bookmarkFilter ? '#1f2937' : '#b45309', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{bookmarkFilter ? <Star size={16} /> : <StarOff size={16} />}</button>
          <button onClick={() => setFeaturedFilter(v => !v)} title={t('featured') || 'Featured'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #c7d2fe', background: featuredFilter ? '#4f46e5' : '#eef2ff', color: featuredFilter ? '#fff' : '#4f46e5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Pin size={16} /></button>
          <button onClick={() => setRetakeFilter(v => !v)} title={t('retake_allowed') || 'Retake'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #bae6fd', background: retakeFilter ? '#0ea5e9' : '#ecfeff', color: retakeFilter ? '#fff' : '#0ea5e9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Repeat size={16} /></button>
          <button onClick={() => setGradedFilter(p => p === 'graded' ? 'all' : 'graded')} title={t('graded') || 'Graded'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #bbf7d0', background: gradedFilter === 'graded' ? '#16a34a' : '#ecfdf5', color: gradedFilter === 'graded' ? '#fff' : '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={16} /></button>
          <button onClick={() => setGradedFilter(p => p === 'not_graded' ? 'all' : 'not_graded')} title={t('pending') || 'Pending'} style={{ width: 32, height: 32, borderRadius: 999, border: '1px solid #fde68a', background: gradedFilter === 'not_graded' ? '#f59e0b' : '#fffbeb', color: gradedFilter === 'not_graded' ? '#fff' : '#b45309', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Hourglass size={16} /></button>
        </div>
      </div>

      {/* Joyride */}
      <Joyride
        steps={tourSteps}
        run={showHelp}
        continuous
        showSkipButton
        disableBeacon
        disableScrollParentFix
        styles={{ options: { zIndex: 20000, arrowColor: '#fff' }, overlay: { backgroundColor: 'rgba(0,0,0,0.45)' }, spotlight: { padding: 8, borderRadius: 12 } }}
        locale={{ next: t('next') || 'Next', back: t('back') || 'Back', skip: t('skip') || 'Skip', last: t('done') || 'Done' }}
        callback={(data) => {
          const { status } = data || {};
          if (status === 'finished' || status === 'skipped') {
            try { localStorage.setItem(tourSeenKey, 'true'); } catch { }
            setShowHelp(false);
            console.log('[Activities] Joyride finished/skipped');
          }
        }}
      />

      {/* Activities Grid */}
      <div data-tour="grid" ref={gridRef} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {filteredActivities.map((activity) => {
          const aid = activity.docId || activity.id;
          const isQuiz = activity.type === 'quiz' || !!activity.internalQuizId;
          const submission = submissions[aid];
          const isCompleted = submission?.status === 'graded';
          const completedAt = submission?.completedAt || submission?.submittedAt;
          const isBookmarked = !!bookmarks[aid];
          const dueDate = activity.dueDate;

          return (
            <UnifiedCard
              key={aid}
              flavor="activity"
              item={activity}
              lang={lang}
              t={t}
              isCompleted={isCompleted}
              completedAt={completedAt}
              isBookmarked={isBookmarked}
              dueDate={dueDate}
              onStart={() => {
                if (isQuiz) {
                  window.location.href = `/student-quiz/${activity.internalQuizId || aid}`;
                } else {
                  window.open(activity.url, '_blank');
                }
              }}
              onBookmark={async () => {
                try {
                  const next = { ...bookmarks };
                  const isAdding = !next[aid];
                  if (next[aid]) delete next[aid]; else next[aid] = true;
                  setBookmarks(next);
                  await setDoc(doc(db, 'users', user.uid), { bookmarks: { activities: next } }, { merge: true });
                } catch (e) {
                  toast?.showError(e.message || 'Failed to update bookmark');
                }
              }}
            />
          );
        })}
      </div>

      {filteredActivities.length === 0 && !filterLoading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>No activities found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
