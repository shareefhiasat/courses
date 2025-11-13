import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLang } from '../contexts/LangContext';
import { getStudentRank } from '../firebase/firestore';
import '../styles/military-theme.css';
import { Medal, ArrowUpRight } from 'lucide-react';
import { formatDate } from '../utils/date';

const RankHistory = ({ studentId }) => {
  const { t, lang } = useLang();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankHistory();
  }, [studentId]);

  const loadRankHistory = async () => {
    if (!studentId) return;
    
    try {
      // Get all point records for this student
      const q = query(
        collection(db, 'points'),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const records = [];
      let cumulativePoints = 0;
      let lastRank = null;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        cumulativePoints += data.points;
        const rankInfo = getStudentRank(cumulativePoints);
        
        // Only add to history if rank changed
        if (!lastRank || lastRank.name !== rankInfo.current.name) {
          records.push({
            id: doc.id,
            timestamp: data.timestamp,
            totalPoints: cumulativePoints,
            rank: rankInfo.current,
            pointsAwarded: data.points,
            category: data.category,
            reason: data.reason
          });
          lastRank = rankInfo.current;
        }
      });
      
      setHistory(records);
    } catch (error) {
      console.error('Error loading rank history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Using global formatDate from utils/date

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center', 
        background: '#f8f9fa', 
        borderRadius: '12px',
        color: '#666'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--military-gold)' }}><Medal size={48} /></div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>
          {t('no_rank_history') || 'No Rank History Yet'}
        </h3>
        <p style={{ margin: 0 }}>
          {t('earn_points_to_rank_up') || 'Earn points to start your military career!'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <h3 style={{ 
        fontFamily: 'var(--font-primary)', 
        color: 'var(--navy-dark)',
        marginBottom: '1.5rem',
        fontSize: '1.5rem'
      }}>
        {t('rank_history') || 'Rank History'}
      </h3>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute',
          left: '0.75rem',
          top: '1rem',
          bottom: '1rem',
          width: '3px',
          background: 'linear-gradient(to bottom, var(--military-gold), var(--military-green))'
        }} />

        {history.map((record, index) => (
          <div 
            key={record.id}
            style={{
              position: 'relative',
              marginBottom: '2rem',
              paddingLeft: '1.5rem'
            }}
          >
            {/* Timeline dot */}
            <div style={{
              position: 'absolute',
              left: '-0.5rem',
              top: '0.5rem',
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: record.rank.color,
              border: '4px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              zIndex: 1
            }}>
              {record.rank.icon}
            </div>

            {/* Content card */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: `2px solid ${record.rank.color}15`
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: record.rank.color,
                    marginBottom: '0.25rem'
                  }}>
                    {record.rank.icon} {lang === 'ar' ? record.rank.nameAr : record.rank.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {formatDate(record.timestamp)}
                  </div>
                </div>
                
                <div style={{
                  background: 'var(--gradient-gold)',
                  color: 'var(--navy-dark)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {record.totalPoints} {t('points') || 'pts'}
                </div>
              </div>

              {index === 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#e8f5e9',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#2e7d32',
                  fontWeight: 600
                }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Medal size={16} /> {t('first_rank') || 'Starting Rank'}</span>
                </div>
              )}

              {index > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#fff3e0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#f57c00'
                }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><ArrowUpRight size={16} /> {t('promoted_from') || 'Promoted from'} {history[index - 1].rank.icon} {lang === 'ar' ? history[index - 1].rank.nameAr : history[index - 1].rank.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankHistory;
