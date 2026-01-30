import React, { useEffect, useState } from 'react';
import { getStudentPoints } from '@firebaseServices/firestore';
import { useLang } from '@contexts/LangContext';

const MEDAL_ICONS = {
  teamwork: '🤝',
  focus: '🎯',
  leadership: '📣',
  resilience: '🛡️',
  collaboration: '⚔️',
  dedication: '🎖️',
  excellence: '🏆',
  quick_response: '⚡',
  participation: '📢',
  helping_others: '❤️',
  on_task: '✅',
  working_hard: '💪'
};

const MEDAL_NAMES = {
  teamwork: { en: 'Teamwork Medal', ar: 'ميدالية العمل الجماعي' },
  focus: { en: 'Focus Badge', ar: 'شارة التركيز' },
  leadership: { en: 'Leadership Star', ar: 'نجمة القيادة' },
  resilience: { en: 'Resilience Shield', ar: 'درع المثابرة' },
  collaboration: { en: 'Collaboration Cross', ar: 'صليب التعاون' },
  dedication: { en: 'Dedication Medal', ar: 'ميدالية التفاني' },
  excellence: { en: 'Excellence Trophy', ar: 'كأس التميز' },
  quick_response: { en: 'Quick Response', ar: 'الاستجابة السريعة' },
  participation: { en: 'Participation', ar: 'المشاركة' },
  helping_others: { en: 'Helping Others', ar: 'مساعدة الآخرين' },
  on_task: { en: 'On Task', ar: 'على المسار' },
  working_hard: { en: 'Working Hard', ar: 'العمل الجاد' }
};

const RecentMedals = ({ studentId, limit = 5 }) => {
  const { lang, t } = useLang();
  const [medals, setMedals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedals();
  }, [studentId]);

  const loadMedals = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const result = await getStudentPoints(studentId);
      if (result.success) {
        setMedals(result.data.slice(0, limit));
      }
    } catch (error) {
      console.error('Error loading medals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('just_now') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('minutes_ago') || 'minutes ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('hours_ago') || 'hours ago'}`;
    if (diffDays === 1) return t('yesterday') || 'Yesterday';
    return `${diffDays} ${t('days_ago') || 'days ago'}`;
  };

  const getMedalName = (category) => {
    const names = MEDAL_NAMES[category] || { en: category, ar: category };
    return lang === 'ar' ? names.ar : names.en;
  };

  if (loading) {
    return (
      <div className="card-military">
        <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-primary)', color: 'var(--navy-dark)' }}>
          🏅 {t('recent_medals') || 'Recent Medals Earned'}
        </h3>
        <p style={{ color: '#888' }}>{t('loading') || 'Loading'}...</p>
      </div>
    );
  }

  if (medals.length === 0) {
    return (
      <div className="card-military">
        <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-primary)', color: 'var(--navy-dark)' }}>
          🏅 {t('recent_medals') || 'Recent Medals Earned'}
        </h3>
        <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>
          {t('no_medals_yet') || 'No medals earned yet. Keep up the good work!'}
        </p>
      </div>
    );
  }

  return (
    <div className="card-military">
      <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-primary)', color: 'var(--navy-dark)' }}>
        🏅 {t('recent_medals') || 'Recent Medals Earned'}
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {medals.map((medal, index) => (
          <div 
            key={medal.docId || index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '8px',
              border: '2px solid #E0E0E0',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <span style={{ fontSize: '2rem' }}>
                {MEDAL_ICONS[medal.category] || '🎖️'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#2C5530' }}>
                  {getMedalName(medal.category)}
                </div>
                {medal.reason && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    {medal.reason}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                fontWeight: 700, 
                fontSize: '1.125rem', 
                color: '#D4AF37',
                fontFamily: 'var(--font-primary)'
              }}>
                +{medal.points}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
                {getTimeAgo(medal.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentMedals;
