import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { getResources } from '../firebase/firestore';
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { addActivityLog } from '../firebase/firestore';
import { Container, Card, CardBody, Button, Input, Spinner, Badge, EmptyState, useToast, Loading } from '../components/ui';
import FilterChips from '../components/FilterChips';
import UnifiedCard from '../components/UnifiedCard';
import './ResourcesPage.css';
import { formatDateTime } from '../utils/date';
import { FileText, Link2, Video, Star, X, BookOpen, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './ResourcesPage.module.css';

const ResourcesPage = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { t, lang } = useLang();
  const toast = useToast();
  const [resources, setResources] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [bookmarks, setBookmarks] = useState({}); // { [resourceId]: true }
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bmWidth, setBmWidth] = useState(() => {
    try { return parseInt(localStorage.getItem('bm_width')||'360',10); } catch { return 360; }
  });
  const [bmQuery, setBmQuery] = useState('');
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (user) {
      loadResources();
      loadUserProgress();
    }
  }, [user]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const result = await getResources();
      if (result.success) {
        setResources(result.data);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Error loading resources');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProgress(userData.resourceProgress || {});
        setBookmarks((userData.bookmarks && userData.bookmarks.resources) || {});
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const toggleResourceCompletion = async (resourceIdRaw) => {
    const resourceId = resourceIdRaw?.docId || resourceIdRaw;
    if (!user) return;

    const isCompleted = userProgress[resourceId]?.completed || false;
    const resource = resources.find(r => (r.docId || r.id) === resourceId) || {};

    // Prevent students from unmarking once completed
    if (isCompleted && !isAdmin) {
      toast.info('This resource is already completed. Contact admin to reopen.');
      return;
    }
    const newProgress = {
      ...userProgress,
      [resourceId]: {
        completed: !isCompleted,
        completedAt: !isCompleted ? new Date() : null
      }
    };

    setUserProgress(newProgress);

    try {
      // Use setDoc with merge to create the user doc if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        resourceProgress: newProgress
      }, { merge: true });
      
      // Process badge trigger for resource completion
      if (!isCompleted) {
        try {
          await processBadgeTrigger(user.uid, 'resource_completed', {
            resourceId: resourceId,
            resourceTitle: resource.title_en || resource.title || 'Untitled Resource',
            resourceType: resource.type || 'unknown',
            bookmarked: !!bookmarks[resourceId],
            completedAt: new Date()
          });
        } catch (badgeError) {
          console.warn('Badge processing failed:', badgeError);
          // Don't fail the resource completion if badge processing fails
        }
      }
      
      if (!isCompleted) {
        toast.success('Resource marked as complete!');
      } else {
        toast.info('Resource marked as incomplete');
      }
    } catch (error) {
      // Revert on error
      setUserProgress(userProgress);
      toast.error('Error updating progress');
    }
  };

  const filteredResources = resources.filter(resource => {
    const rid = resource.docId || resource.id;
    switch (filter) {
      case 'completed':
        return userProgress[rid]?.completed;
      case 'pending':
        return !userProgress[rid]?.completed;
      case 'bookmarked':
        return !!bookmarks[rid];
      case 'required':
        return !resource.optional;
      case 'optional':
        return resource.optional;
      case 'overdue':
        if (!resource.dueDate) return false;
        const dueDate = new Date(resource.dueDate);
        const now = new Date();
        return dueDate < now && !userProgress[rid]?.completed;
      default:
        return true;
    }
  });

  const getResourceIcon = (type) => {
    const common = { size: 16 };
    const icons = {
      'document': <FileText {...common} title="Document" />,
      'link': <Link2 {...common} title="Link" />,
      'video': <Video {...common} title="Video" />
    };
    return icons[type] || <Link2 {...common} title="Link" />;
  };

  const isOverdue = (resource) => {
    if (!resource.dueDate) return false;
    const dueDate = new Date(resource.dueDate);
    const now = new Date();
    const rid = resource.docId || resource.id;
    return dueDate < now && !userProgress[rid]?.completed;
  };

  if (authLoading || loading) {
    return (
      <Loading
        variant="overlay"
        fullscreen
        message={t('loading_resources') || t('loading') || 'Loading resources...'}
      />
    );
  }

  if (!user) {
    return (
      <div className="resources-page">
        <div className="auth-required">
          <h2>{t('auth_required')}</h2>
          <p>{t('login_to_view_resources')}</p>
        </div>
      </div>
    );
  }

  // Calculate progress stats
  const completedCount = Object.values(userProgress).filter(p => p.completed).length;
  const requiredTotal = resources.filter(r => !r.optional).length;
  const requiredCompleted = resources.filter(r => !r.optional).filter(r => {
    const rid = r.docId || r.id;
    return userProgress[rid]?.completed;
  }).length;
  const requiredRemaining = Math.max(0, requiredTotal - requiredCompleted);
  const overdueCount = resources.filter(r => isOverdue(r)).length;

  return (
    <div className="resources-page" style={{ padding: '1rem 1.25rem' }}>
      {/* Progress Summary - Compact with Icons Only (at top) */}
      <div style={{
        background: 'white',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={20} style={{ color: '#16a34a' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>{completedCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={20} style={{ color: '#dc2626' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>{requiredRemaining}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={20} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{overdueCount}</span>
        </div>
      </div>

      {/* Unified Filters Section (same style as ActivitiesPage) */}
      <div className="filters-section" style={{
        background: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {/* Search */}
        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <input
              type="search"
              placeholder={t('search_resources') || 'Search resources...'}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}
            />
          </div>
        </div>

        {/* Filter Chips */}
        <FilterChips
          variant="custom"
          filters={[
            { id: 'all', label: t('all_resources') || 'All Resources', active: filter === 'all', onClick: () => setFilter('all') },
            { id: 'pending', label: t('pending') || 'Pending', icon: <Clock size={14} />, bg: '#fffbeb', fg: '#b45309', active: filter === 'pending', onClick: () => setFilter('pending') },
            { id: 'completed', label: t('completed') || 'Completed', icon: <CheckCircle size={14} />, bg: '#ecfdf5', fg: '#16a34a', active: filter === 'completed', onClick: () => setFilter('completed') },
            { id: 'required', label: t('required') || 'Required', icon: <AlertCircle size={14} />, bg: '#fee2e2', fg: '#b91c1c', active: filter === 'required', onClick: () => setFilter('required') },
            { id: 'optional', label: t('optional') || 'Optional', bg: '#fff3e0', fg: '#f57c00', active: filter === 'optional', onClick: () => setFilter('optional') },
            { id: 'overdue', label: t('overdue') || 'Overdue', icon: <AlertCircle size={14} />, bg: '#fee2e2', fg: '#dc2626', active: filter === 'overdue', onClick: () => setFilter('overdue') },
            { id: 'bookmarked', label: t('bookmarked') || 'Bookmarked', icon: <Star size={14} />, bg: '#fffbeb', fg: '#f59e0b', active: filter === 'bookmarked', onClick: () => setFilter('bookmarked') }
          ]}
          t={t}
        />
      </div>

      {loading ? (
        <Loading message={t('loading_resources')} />
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filteredResources.length === 0 ? (
            <div className="no-resources">
              <h3>{t('no_resources_found')}</h3>
              <p>{t('no_resources_match')}</p>
            </div>
          ) : (
            filteredResources.map(resource => {
              const rid = resource.docId || resource.id;
              const isCompleted = userProgress[rid]?.completed || false;
              const completedAt = userProgress[rid]?.completedAt;
              const overdue = isOverdue(resource);
              const isBookmarked = !!bookmarks[rid];
              const dueDate = resource.dueDate;

              return (
                <UnifiedCard
                  key={rid}
                  flavor="resource"
                  item={resource}
                  lang={lang}
                  t={t}
                  isCompleted={isCompleted}
                  completedAt={completedAt}
                  isBookmarked={isBookmarked}
                  dueDate={dueDate}
                  onStart={() => {
                    if (resource.url) {
                      window.open(resource.url, '_blank');
                    }
                  }}
                  onComplete={async () => {
                    await toggleResourceCompletion(rid);
                  }}
                  onBookmark={async () => {
                    try {
                      const next = { ...bookmarks };
                      const isAdding = !next[rid];
                      if (next[rid]) delete next[rid]; else next[rid] = true;
                      setBookmarks(next);
                      await setDoc(doc(db, 'users', user.uid), { bookmarks: { resources: next } }, { merge: true });
                      if (isAdding) {
                        try {
                          await addActivityLog({
                            type: 'resource_bookmarked',
                            userId: user.uid,
                            email: user.email,
                            displayName: user.displayName || user.email,
                            userAgent: navigator.userAgent,
                            metadata: { resourceId: rid, resourceTitle: resource.title_en || resource.title || 'Untitled', resourceType: resource.type || 'unknown' }
                          });
                        } catch (e) { console.warn('Failed to log bookmark:', e); }
                      }
                    } catch (e) {
                      toast?.showError(e.message || 'Failed to update bookmark');
                    }
                  }}
                />
              );
            })
          )}
        </div>
      )}

      {/* Bookmarks Drawer */}
      {showBookmarks && (
        <div className="bm-overlay" onClick={()=>setShowBookmarks(false)}>
          <div className="bm-drawer" onClick={(e)=>e.stopPropagation()} style={{ width: Math.max(280, Math.min(600, bmWidth)) }}>
            <div
              className="bm-resize"
              onMouseDown={(e)=>{
                e.preventDefault();
                setResizing(true);
                const startX = e.clientX; const startW = Math.max(280, Math.min(600, bmWidth));
                const onMove = (ev)=>{ const delta = (startX - ev.clientX); const w = startW + delta; setBmWidth(w); };
                const onUp = ()=>{ setResizing(false); try { localStorage.setItem('bm_width', String(Math.max(280, Math.min(600, bmWidth)))); } catch {}
                  window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            />
            <div className="bm-header">
              <h3 style={{ margin: 0 }}>{t('bookmarked')}</h3>
              <button className="bm-close" onClick={()=>setShowBookmarks(false)} aria-label="Close"><X size={16} /></button>
            </div>
            <div style={{ padding: '0 1rem 0.5rem' }}>
              <input
                value={bmQuery}
                onChange={(e)=>setBmQuery(e.target.value)}
                placeholder={t('search_resources')}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', borderRadius: 8 }}
              />
            </div>
            <div className="bm-list">
              {Object.keys(bookmarks || {}).length === 0 ? (
                <div className="bm-empty">{t('no_resources_found')}</div>
              ) : (
                Object.keys(bookmarks)
                  .filter((rid)=>{
                    const r = resources.find(x => (x.docId || x.id) === rid);
                    const title = lang==='ar' ? (r?.title_ar || r?.title || r?.title_en) : (r?.title_en || r?.title || r?.title_ar);
                    return (title||'').toLowerCase().includes(bmQuery.toLowerCase());
                  })
                  .map((rid) => {
                  const r = resources.find(x => (x.docId || x.id) === rid);
                  if (!r) return null;
                  return (
                    <div key={rid} className="bm-item">
                      <div className="bm-title">{getResourceIcon(r.type)}&nbsp;{lang==='ar' ? (r.title_ar || r.title || r.title_en) : (r.title_en || r.title || r.title_ar)}</div>
                      <div className="bm-actions">
                        <a href={(r.url||'').startsWith('http')? r.url : `https://${r.url}`} target="_blank" rel="noopener noreferrer">{t('open')}</a>
                        <button onClick={async()=>{
                          try {
                            const next = { ...bookmarks }; delete next[rid]; setBookmarks(next);
                            await setDoc(doc(db,'users',user.uid), { bookmarks: { resources: next } }, { merge: true });
                          } catch(e){ toast?.showError(e.message||''); }
                        }}>{t('remove_bookmark')}</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ResourcesPage;
