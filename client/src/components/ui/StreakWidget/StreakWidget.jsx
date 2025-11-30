import React from 'react';
import { Flame, Calendar, Target } from 'lucide-react';
import styles from './StreakWidget.module.css';

export default function StreakWidget({
  currentStreak = 0,
  longestStreak = 0,
  weeklyGoal = 5,
  weeklyProgress = 0,
  size = 'medium',
  loading = false,
  className = ''
}) {
  const getStreakMessage = () => {
    if (currentStreak === 0) return 'Start your learning streak!';
    if (currentStreak < 3) return 'Keep going!';
    if (currentStreak < 7) return 'Great momentum!';
    if (currentStreak < 14) return 'On fire! 🔥';
    if (currentStreak < 30) return 'Amazing consistency!';
    return 'Legendary streak! 🏆';
  };

  const getWeeklyProgressPercentage = () => {
    return Math.min((weeklyProgress / weeklyGoal) * 100, 100);
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return '#94a3b8';
    if (currentStreak < 3) return '#f59e0b';
    if (currentStreak < 7) return '#fb923c';
    if (currentStreak < 14) return '#ef4444';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div className={`${styles.streakWidget} ${styles[size]} ${className}`}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonFlame} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonStreak} />
            <div className={styles.skeletonMessage} />
            <div className={styles.skeletonProgress} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.streakWidget} ${styles[size]} ${className}`}>
      <div className={styles.streakContent}>
        <div className={styles.streakHeader}>
          <div 
            className={styles.streakFlame}
            style={{ color: getStreakColor() }}
          >
            <Flame size={size === 'small' ? 24 : size === 'large' ? 48 : 36} />
          </div>
          <div className={styles.streakInfo}>
            <div className={styles.streakNumbers}>
              <span className={styles.currentStreak}>{currentStreak}</span>
              <span className={styles.streakLabel}>day streak</span>
            </div>
            <p className={styles.streakMessage}>{getStreakMessage()}</p>
          </div>
        </div>

        <div className={styles.streakDetails}>
          <div className={styles.streakStat}>
            <Calendar size={16} style={{ color: '#64748b' }} />
            <span>Longest: {longestStreak} days</span>
          </div>
          
          <div className={styles.weeklyGoal}>
            <div className={styles.goalHeader}>
              <Target size={16} style={{ color: '#64748b' }} />
              <span>Weekly Goal</span>
              <span className={styles.goalProgress}>
                {weeklyProgress}/{weeklyGoal}
              </span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${getWeeklyProgressPercentage()}%`,
                  backgroundColor: getWeeklyProgressPercentage() >= 100 ? '#10b981' : '#8b5cf6'
                }}
              />
            </div>
          </div>
        </div>

        {currentStreak > 0 && (
          <div className={styles.streakAchievements}>
            {currentStreak >= 3 && (
              <div className={styles.achievement}>
                <span>🔥</span>
                <span>3 Day Streak</span>
              </div>
            )}
            {currentStreak >= 7 && (
              <div className={styles.achievement}>
                <span>💪</span>
                <span>Week Warrior</span>
              </div>
            )}
            {currentStreak >= 14 && (
              <div className={styles.achievement}>
                <span>⭐</span>
                <span>2 Week Champion</span>
              </div>
            )}
            {currentStreak >= 30 && (
              <div className={styles.achievement}>
                <span>🏆</span>
                <span>Month Master</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
