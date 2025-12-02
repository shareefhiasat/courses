import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEnrollments } from '../firebase/firestore';
import { addNotification } from '../firebase/notifications';
import { awardManualMedal, getBadgeDefinitions } from '../firebase/badges';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Container, Card, CardBody, Button, Spinner, Badge, useToast } from '../components/ui';
import RankUpgradeModal from '../components/RankUpgradeModal';
import '../styles/military-theme.css';
import styles from './AwardMedalsPage.module.css';
import { seedBadges } from '../firebase/seedBadges';

// Default medals - will be replaced by Firestore badges
const DEFAULT_MEDALS = [
  { id: 'teamwork', icon: '🤝', name: 'Teamwork', points: 1 },
  { id: 'focus', icon: '🎯', name: 'Focus', points: 1 },
  { id: 'leadership', icon: '📣', name: 'Leadership', points: 1 },
  { id: 'resilience', icon: '🛡️', name: 'Resilience', points: 1 },
  { id: 'collaboration', icon: '⚔️', name: 'Collaboration', points: 1 },
  { id: 'dedication', icon: '🎖️', name: 'Dedication', points: 1 },
  { id: 'excellence', icon: '🏆', name: 'Excellence', points: 2 },
  { id: 'quick_response', icon: '⚡', name: 'Quick Response', points: 1 },
  { id: 'participation', icon: '📢', name: 'Participation', points: 1 },
  { id: 'helping_others', icon: '❤️', name: 'Helping Others', points: 1 },
  { id: 'on_task', icon: '✅', name: 'On Task', points: 1 },
  { id: 'working_hard', icon: '💪', name: 'Working Hard', points: 1 }
];

const AwardMedalsPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t } = useLang();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedMedal, setSelectedMedal] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rankUpgrade, setRankUpgrade] = useState(null);
  const [medals, setMedals] = useState(DEFAULT_MEDALS);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadStudents();
    loadBadges();
  }, [classId]);

  const loadBadges = async () => {
    try {
      const result = await getBadgeDefinitions();
      if (result.success && result.data.length > 0) {
        // Use Firestore badges
        setMedals(result.data.filter(b => b.category === 'manual' || !b.trigger));
      }
    } catch (error) {
      console.error('Error loading badges:', error);
      // Keep default medals
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const result = await getEnrollments(classId);
      if (result.success) {
        // Fetch user details for each enrollment
        const studentsWithDetails = await Promise.all(
          result.data.map(async (enrollment) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', enrollment.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...enrollment,
                  displayName: userData.displayName || userData.email || 'Unknown',
                  email: userData.email,
                  totalPoints: userData.totalPoints || 0
                };
              }
            } catch (err) {
              console.error('Error fetching user:', err);
            }
            return {
              ...enrollment,
              displayName: enrollment.userEmail || enrollment.email || 'Unknown',
              email: enrollment.userEmail || enrollment.email,
              totalPoints: 0
            };
          })
        );
        setStudents(studentsWithDetails);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error(t('error_loading_data') || 'Error loading students');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = () => {
    setSelectedStudents(students.map(s => s.userId));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const handleSeedBadges = async () => {
    setSeeding(true);
    try {
      const res = await seedBadges();
      if (res?.success) {
        toast.success(`${res.count} badges seeded`);
        await loadBadges();
      } else {
        toast.error(res?.error || 'Failed to seed badges');
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to seed badges');
    } finally {
      setSeeding(false);
    }
  };

  const handleAwardMedals = async () => {
    if (selectedStudents.length === 0) {
      toast.info(t('select_at_least_one_student') || 'Please select at least one student');
      return;
    }

    if (!selectedMedal) {
      toast.info(t('select_medal') || 'Please select a medal');
      return;
    }

    setSubmitting(true);
    try {
      const result = await awardManualMedal(
        selectedStudents,
        selectedMedal,
        reason.trim(),
        user.uid
      );

      if (result.success) {
        // Check for rank upgrades
        const rankUpgrades = result.results.filter(r => r.rankChanged);
        
        if (rankUpgrades.length > 0) {
          // Show rank upgrade modal for first student (or show toast for multiple)
          if (rankUpgrades.length === 1) {
            setRankUpgrade(rankUpgrades[0].newRank);
          } else {
            // Show toasts for multiple upgrades
            rankUpgrades.forEach(upgrade => {
              const student = students.find(s => s.userId === upgrade.studentId);
              toast.success(`🎖️ ${student?.displayName || 'Student'} promoted to ${upgrade.newRank.icon} ${upgrade.newRank.name}!`);
            });
          }
        }
        
        // Show general success message
        toast.success(`${selectedMedal.icon} Medals awarded to ${selectedStudents.length} student(s)!`);
        
        // Reset form
        setSelectedStudents([]);
        setSelectedMedal(null);
        setReason('');
        
        // Reload students to show updated points
        await loadStudents();
      } else {
        toast.error(result.error || 'Error awarding medals');
      }
    } catch (error) {
      console.error('Error awarding medals:', error);
      toast.error(t('error_occurred') || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Container className={styles.loadingWrapper}>
      <Spinner size="lg" />
      <p>Loading students...</p>
    </Container>
  );

  return (
    <div style={{ padding: '1rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate(-1)}
            className="btn-military-outline"
            style={{ padding: '8px 16px' }}
          >
            ← {t('back') || 'Back'}
          </button>
          <h1 style={{ 
            fontFamily: 'var(--font-primary)', 
            fontSize: '2rem',
            color: 'var(--navy-dark)',
            margin: 0
          }}>
            🎖️ {t('award_medals') || 'Award Medals'}
          </h1>
        </div>
      </div>

      {/* Student Selection */}
      <div className="card-military" style={{ marginBottom: '1rem', padding:'1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h3 style={{ 
            fontFamily: 'var(--font-primary)', 
            color: 'var(--navy-dark)',
            margin: 0
          }}>
            {t('select_students') || 'Select Students'}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={selectAll} className="btn-military-outline" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
              {t('select_all') || 'Select All'}
            </button>
            <button onClick={clearSelection} className="btn-military-outline" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
              {t('clear') || 'Clear'}
            </button>
            <button onClick={handleSeedBadges} disabled={seeding} className="btn-military-outline" style={{ padding: '6px 12px', fontSize: '0.875rem' }}>
              {seeding ? (t('seeding') || 'Seeding...') : (t('seed_badges') || 'Seed Default Badges')}
            </button>
            <span style={{ 
              padding: '6px 12px', 
              background: 'var(--military-gold)', 
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              {selectedStudents.length} {t('selected') || 'selected'}
            </span>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem'
        }}>
          {students.map(student => (
            <div
              key={student.userId}
              onClick={() => toggleStudent(student.userId)}
              style={{
                padding: '0.75rem',
                background: selectedStudents.includes(student.userId) ? 'var(--military-green)' : 'white',
                color: selectedStudents.includes(student.userId) ? 'white' : 'var(--military-gray)',
                border: `2px solid ${selectedStudents.includes(student.userId) ? 'var(--military-dark-green)' : 'var(--military-light-gray)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                if (!selectedStudents.includes(student.userId)) {
                  e.currentTarget.style.borderColor = 'var(--military-green)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedStudents.includes(student.userId)) {
                  e.currentTarget.style.borderColor = 'var(--military-light-gray)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
                {selectedStudents.includes(student.userId) ? '✅' : '👤'}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {student.displayName || student.email}
              </div>
              {student.totalPoints !== undefined && (
                <div style={{ 
                  fontSize: '0.7rem', 
                  marginTop: '0.2rem',
                  opacity: 0.8
                }}>
                  {student.totalPoints} {t('points') || 'pts'}
                </div>
              )}
            </div>
          ))}
        </div>

        {students.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', padding: '2rem 0' }}>
            {t('no_students_enrolled') || 'No students enrolled in this class'}
          </p>
        )}
      </div>

      {/* Medal Selection */}
      <div className="card-military" style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontFamily: 'var(--font-primary)', 
          color: 'var(--navy-dark)',
          marginBottom: '1rem'
        }}>
          {t('choose_medal') || 'Choose Medal'}
        </h3>

        <div className="medal-grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:'0.75rem' }}>
          {medals.map(medal => (
            <div
              key={medal.id}
              onClick={() => setSelectedMedal(medal)}
              className={`medal-card ${selectedMedal?.id === medal.id ? 'selected' : ''}`}
              style={{ padding:'0.75rem' }}
            >
              <div className="medal-card-icon" style={{ fontSize:'2rem' }}>{medal.icon}</div>
              <div className="medal-card-name" style={{ fontSize:'0.8rem' }}>
                {medal.name || medal.nameEn || medal.id}
              </div>
              <div className="medal-card-points" style={{ fontSize:'1rem' }}>+{medal.points}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="card-military" style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontFamily: 'var(--font-primary)', 
          color: 'var(--navy-dark)',
          marginBottom: '1rem'
        }}>
          {t('reason_optional') || 'Reason (Optional)'}
        </h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('enter_reason') || 'Enter reason for awarding this medal...'}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '2px solid var(--military-light-gray)',
            fontFamily: 'var(--font-secondary)',
            fontSize: '0.95rem',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Award Button */}
      <button
        onClick={handleAwardMedals}
        disabled={submitting || selectedStudents.length === 0 || !selectedMedal}
        className="btn-military-gold"
        style={{
          width: '100%',
          padding: '0.85rem 1.25rem',
          fontSize: '1rem',
          opacity: (submitting || selectedStudents.length === 0 || !selectedMedal) ? 0.5 : 1,
          cursor: (submitting || selectedStudents.length === 0 || !selectedMedal) ? 'not-allowed' : 'pointer'
        }}
      >
        {submitting ? (t('awarding') || 'Awarding...') : (t('award_medals_btn') || 'AWARD MEDALS')}
      </button>

      {/* Summary */}
      {selectedStudents.length > 0 && selectedMedal && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#E3F2FD',
          borderRadius: '8px',
          border: '2px solid var(--navy-blue)',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--navy-dark)' }}>
            {t('you_are_about_to_award') || 'You are about to award'}{' '}
            <span style={{ color: 'var(--military-gold)' }}>
              {selectedMedal.icon} {selectedMedal.name || selectedMedal.nameEn} (+{selectedMedal.points})
            </span>{' '}
            {t('to') || 'to'}{' '}
            <span style={{ color: 'var(--military-green)' }}>
              {selectedStudents.length} {selectedStudents.length === 1 ? (t('student') || 'student') : (t('students') || 'students')}
            </span>
          </p>
        </div>
      )}

      {/* Rank Upgrade Modal */}
      {rankUpgrade && (
        <RankUpgradeModal 
          newRank={rankUpgrade} 
          onClose={() => setRankUpgrade(null)} 
        />
      )}
    </div>
  );
};

export default AwardMedalsPage;
