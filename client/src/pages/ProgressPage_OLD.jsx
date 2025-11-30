import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getSubmissions, getResources, getActivities } from '../firebase/firestore';
import Loading from '../components/Loading';
import { useLang } from '../contexts/LangContext';
import RankDisplay from '../components/RankDisplay';
import RankHistory from '../components/RankHistory';
import RecentMedals from '../components/RecentMedals';

const ProgressPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const [progress, setProgress] = useState({});
  const [resourceProgress, setResourceProgress] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

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
        setUserData(data);
      }
      // Load submissions for activity count
      const subsResult = await getSubmissions();
      const mySubs = (subsResult.data || []).filter(s => s.userId === user.uid);
      setSubmissions(mySubs);
      
      // Load activities to get type breakdown
      const actResult = await getActivities();
      setActivities(actResult.data || []);
      
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
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const activityCompletedCount = gradedSubmissions.length;
  const resourceCompletedCount = Object.values(resourceProgress).filter(r => r.completed).length;
  const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
  
  // Calculate type breakdown
  const typeBreakdown = {};
  ['quiz', 'training', 'assignment', 'homework', 'optional'].forEach(type => {
    const typeActivities = activities.filter(a => a.type === type);
    const typeSubmissions = gradedSubmissions.filter(s => {
      const activity = activities.find(a => (a.docId || a.id) === s.activityId);
      return activity?.type === type;
    });
    if (typeActivities.length > 0) {
      typeBreakdown[type] = {
        total: typeActivities.length,
        completed: typeSubmissions.length,
        percentage: typeActivities.length > 0 ? Math.round((typeSubmissions.length / typeActivities.length) * 100) : 0
      };
    }
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Rank Display - Compact */}
      <div style={{ marginBottom: '1rem' }}>
        <RankDisplay 
        totalPoints={userData?.totalPoints || 0}
        studentName={userData?.displayName || user?.displayName || ''}
        showProgress={true}
      />

      </div>
      
      <div style={{ 
        background: 'linear-gradient(135deg, #800020 0%, #600018 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        marginTop: '2rem',
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

      {/* Activity Type Breakdown */}
      {Object.keys(typeBreakdown).length > 0 && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', color: '#800020' }}>
            📊 {t('activity_breakdown') || 'Activity Breakdown by Type'}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {Object.entries(typeBreakdown).map(([type, stats]) => (
              <div key={type} style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                  {type === 'quiz' ? '📝 ' + (t('quiz') || 'Quiz') :
                   type === 'training' ? '🎯 ' + (t('training') || 'Training') :
                   type === 'assignment' ? '📋 ' + (t('assignment') || 'Assignment') :
                   type === 'homework' ? '📚 ' + (t('homework') || 'Homework') :
                   '⭐ ' + (t('optional') || 'Optional')}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#800020', marginBottom: '0.25rem' }}>
                  {stats.completed}/{stats.total}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {stats.percentage}% {t('completed') || 'Complete'}
                </div>
                {/* Progress bar */}
                <div style={{
                  marginTop: '0.5rem',
                  height: '6px',
                  background: '#e0e0e0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #800020, #a00028)',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  background: sub.status === 'graded' ? '#800020' : '#28a745',
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

      {/* Military Theme Sections - Always show */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {/* Recent Medals */}
        <div>
          <RecentMedals studentId={user.uid} limit={10} />
        </div>

        {/* Rank History */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <RankHistory studentId={user.uid} />
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
