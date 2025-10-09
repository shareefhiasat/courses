import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getSubmissions, getResources } from '../firebase/firestore';
import Loading from '../components/Loading';
import { useLang } from '../contexts/LangContext';

const ProgressPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const [progress, setProgress] = useState({});
  const [resourceProgress, setResourceProgress] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProgress(data.progress || {});
        setResourceProgress(data.resourceProgress || {});
      }
      // Load submissions for activity count
      const subsResult = await getSubmissions();
      const mySubs = (subsResult.data || []).filter(s => s.userId === user.uid && s.status === 'completed');
      setSubmissions(mySubs);
      
      // Load resources for resource count
      const resResult = await getResources();
      setResources(resResult.data || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loading message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins should not see their own progress page; redirect to student overview
  if (isAdmin) {
    return <Navigate to="/student-progress" replace />;
  }

  if (loading) {
    return <Loading message="Loading your progress..." />;
  }

  const progressEntries = Object.entries(progress);
  const activityCompletedCount = submissions.length;
  const resourceCompletedCount = Object.values(resourceProgress).filter(r => r.completed).length;
  const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1>{t('progress') || 'Progress'}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{activityCompletedCount}</div>
            <div>{t('activities_completed') || 'Activities Completed'}</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{resourceCompletedCount}</div>
            <div>{t('resources_completed') || 'Resources Completed'}</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalScore}</div>
            <div>{t('total_score') || 'Total Score'}</div>
          </div>
        </div>
      </div>

      {/* Show message if no progress */}
      {activityCompletedCount === 0 && resourceCompletedCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
          <h2>{t('no_progress_yet') || 'No progress yet'}</h2>
          <p>{t('start_completing') || 'Start completing activities to see your progress here'}</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          {/* Activity submissions */}
          {submissions.map(sub => (
            <div key={sub.docId} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #28a745'
            }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Activity: {sub.activityId}</h3>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  background: sub.status === 'graded' ? '#667eea' : '#28a745',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>
                  {sub.status === 'graded' ? `Graded: ${sub.score || 0}%` : 'Completed'}
                </span>
              </div>
              {sub.submittedAt && (
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {t('submitted_at') || 'Submitted'}: {new Date(sub.submittedAt.seconds * 1000).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                </p>
              )}
            </div>
          ))}
          
          {/* Resource completions */}
          {resources.filter(r => resourceProgress[r.docId || r.id]?.completed).map(resource => {
            const rid = resource.docId || resource.id;
            const rp = resourceProgress[rid];
            return (
              <div key={rid} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid #4caf50'
              }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Resource: {resource.title}</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    ✅ Completed
                  </span>
                </div>
                {rp.completedAt && (
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    {t('completed') || 'Completed'}: {new Date(rp.completedAt.seconds ? rp.completedAt.seconds * 1000 : rp.completedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                  </p>
                )}
              </div>
            );
          })}
          
          {/* Legacy progress entries if any */}
          {progressEntries.length > 0 && (
          progressEntries.map(([activityId, progressData]) => (
            <div key={activityId} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: progressData.completed ? '2px solid #28a745' : '1px solid #eee'
            }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{activityId}</h3>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  background: progressData.completed ? '#28a745' : '#ffc107',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>
                  {progressData.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div>
                <strong>{t('score') || 'Score'}:</strong> {progressData.score || 0}
              </div>
              <div>
                <strong>{t('attempts') || 'Attempts'}:</strong> {progressData.attempts || 0}
              </div>
              {progressData.completedAt && (
                <div>
                  <strong>{t('completed') || 'Completed'}:</strong> {new Date(progressData.completedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                </div>
              )}
            </div>
          ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
