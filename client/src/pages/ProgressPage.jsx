import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getSubmissions, getResources, getActivities } from '../firebase/firestore';
import { Container, Card, CardBody, Spinner, Badge, Grid, ProgressBar, EmptyState } from '../components/ui';
import { useLang } from '../contexts/LangContext';
import RankDisplay from '../components/RankDisplay';
import RankHistory from '../components/RankHistory';
import RecentMedals from '../components/RecentMedals';
import { Trophy, Target, BookOpen, Award } from 'lucide-react';
import styles from './ProgressPage.module.css';

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

  if (authLoading || loading) {
    return (
      <Container maxWidth="xl" className={styles.loadingWrapper}>
        <Spinner size="lg" />
        <p>Loading your progress...</p>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
    <Container maxWidth="xl" className={styles.page}>
      {/* Rank Display */}
      <div className={styles.rankSection}>
        <RankDisplay 
          totalPoints={userData?.totalPoints || 0}
          studentName={userData?.displayName || user?.displayName || ''}
          showProgress={true}
        />
      </div>
      
      {/* Hero Stats */}
      <Card className={styles.heroCard}>
        <CardBody>
          <h1 className={styles.heroTitle}>{t('progress') || 'Progress'}</h1>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <Target size={32} className={styles.statIcon} />
              <div className={styles.statValue}>{activityCompletedCount}</div>
              <div className={styles.statLabel}>{t('activities_completed') || 'Activities Completed'}</div>
            </div>
            <div className={styles.statItem}>
              <BookOpen size={32} className={styles.statIcon} />
              <div className={styles.statValue}>{resourceCompletedCount}</div>
              <div className={styles.statLabel}>{t('resources_completed') || 'Resources Completed'}</div>
            </div>
            <div className={styles.statItem}>
              <Award size={32} className={styles.statIcon} />
              <div className={styles.statValue}>{totalScore}</div>
              <div className={styles.statLabel}>{t('total_score') || 'Total Score'}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Activity Type Breakdown */}
      {Object.keys(typeBreakdown).length > 0 && (
        <Card>
          <CardBody>
            <h2 className={styles.sectionTitle}>
              📊 {t('activity_breakdown') || 'Activity Breakdown by Type'}
            </h2>
            <div className={styles.breakdownGrid}>
              {Object.entries(typeBreakdown).map(([type, stats]) => (
                <div key={type} className={styles.typeCard}>
                  <div className={styles.typeLabel}>
                    {type === 'quiz' ? '📝 ' + (t('quiz') || 'Quiz') :
                     type === 'training' ? '🎯 ' + (t('training') || 'Training') :
                     type === 'assignment' ? '📋 ' + (t('assignment') || 'Assignment') :
                     type === 'homework' ? '📚 ' + (t('homework') || 'Homework') :
                     '⭐ ' + (t('optional') || 'Optional')}
                  </div>
                  <div className={styles.typeValue}>
                    {stats.completed}/{stats.total}
                  </div>
                  <div className={styles.typePercentage}>
                    {stats.percentage}% {t('completed') || 'Complete'}
                  </div>
                  <ProgressBar
                    value={stats.completed}
                    max={stats.total}
                    color="primary"
                    showLabel={false}
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Show message if no progress */}
      {activityCompletedCount === 0 && resourceCompletedCount === 0 ? (
        <EmptyState
          icon={<Trophy size={64} />}
          title={t('no_progress_yet') || 'No progress yet'}
          description={t('start_completing') || 'Start completing activities to see your progress here'}
        />
      ) : (
        <div className={styles.progressGrid}>
          {/* Activity submissions */}
          {submissions.map(sub => (
            <Card key={sub.docId} className={styles.progressCard}>
              <CardBody>
                <h3>Activity: {sub.activityId}</h3>
                <div className={styles.cardBadge}>
                  <Badge variant={sub.status === 'graded' ? 'primary' : 'success'}>
                    {sub.status === 'graded' ? `Graded: ${sub.score || 0}%` : 'Completed'}
                  </Badge>
                </div>
                {sub.submittedAt && (
                  <p className={styles.cardDate}>
                    {t('submitted_at') || 'Submitted'}: {new Date(sub.submittedAt.seconds * 1000).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
          
          {/* Resource completions */}
          {resources.filter(r => resourceProgress[r.docId || r.id]?.completed).map(resource => {
            const rid = resource.docId || resource.id;
            const rp = resourceProgress[rid];
            return (
              <Card key={rid} className={styles.progressCard}>
                <CardBody>
                  <h3>Resource: {resource.title}</h3>
                  <div className={styles.cardBadge}>
                    <Badge variant="success">✅ Completed</Badge>
                  </div>
                  {rp.completedAt && (
                    <p className={styles.cardDate}>
                      {t('completed') || 'Completed'}: {new Date(rp.completedAt.seconds ? rp.completedAt.seconds * 1000 : rp.completedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
          
          {/* Legacy progress entries if any */}
          {progressEntries.length > 0 && (
            progressEntries.map(([activityId, progressData]) => (
              <Card key={activityId} className={styles.progressCard}>
                <CardBody>
                  <h3>{activityId}</h3>
                  <div className={styles.cardBadge}>
                    <Badge variant={progressData.completed ? 'success' : 'warning'}>
                      {progressData.completed ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className={styles.cardInfo}>
                    <strong>{t('score') || 'Score'}:</strong> {progressData.score || 0}
                  </div>
                  <div className={styles.cardInfo}>
                    <strong>{t('attempts') || 'Attempts'}:</strong> {progressData.attempts || 0}
                  </div>
                  {progressData.completedAt && (
                    <div className={styles.cardInfo}>
                      <strong>{t('completed') || 'Completed'}:</strong> {new Date(progressData.completedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Military Theme Sections */}
      <div className={styles.militaryGrid}>
        <div>
          <RecentMedals studentId={user.uid} limit={10} />
        </div>
        <Card>
          <CardBody>
            <RankHistory studentId={user.uid} />
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default ProgressPage;
