import React, { useEffect, useState } from 'react';
import { getStudentRank } from '../firebase/firestore';
import { useLang } from '../contexts/LangContext';
import '../styles/military-theme.css';

const RankDisplay = ({ totalPoints = 0, studentName = '', showProgress = true, compact = false }) => {
  const { lang, t } = useLang();
  const [rankData, setRankData] = useState(null);

  useEffect(() => {
    const data = getStudentRank(totalPoints);
    setRankData(data);
  }, [totalPoints]);

  if (!rankData) return null;

  const { current, next, progress, pointsToNext } = rankData;
  const rankName = lang === 'ar' ? current.nameAr : current.name;
  const nextRankName = next ? (lang === 'ar' ? next.nameAr : next.name) : null;

  if (compact) {
    return (
      <div className="rank-badge-inline">
        <span className="rank-icon">{current.icon}</span>
        <span>{rankName}</span>
        <span className="text-military-gold">{totalPoints.toLocaleString()}</span>
      </div>
    );
  }

  return (
    <div className="rank-hero" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
      <div className="rank-badge" style={{ 
        width: '80px', 
        height: '80px', 
        fontSize: '2.5rem',
        marginBottom: '0.75rem'
      }}>
        {current.icon || '🎖️'}
      </div>
      
      <div className="rank-name" style={{ marginBottom: '0.25rem' }}>
        {rankName}
      </div>
      
      {studentName && (
        <div className="rank-student-name" style={{ marginBottom: '0.5rem' }}>
          {studentName}
        </div>
      )}
      
      <div className="rank-points" style={{ marginBottom: '0.75rem' }}>
        {totalPoints.toLocaleString()} {t('points') || 'Points'}
      </div>

      {showProgress && next && (
        <div className="rank-progress-container" style={{ marginTop: '0.75rem' }}>
          <div className="rank-progress-bar">
            <div 
              className="rank-progress-fill" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {progress >= 20 && `${Math.round(progress)}%`}
            </div>
          </div>
          <div className="rank-progress-text" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {pointsToNext.toLocaleString()} {t('points_to_next_rank') || 'points to'} {nextRankName}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankDisplay;
