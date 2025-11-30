import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getUsers, getClasses, getEnrollments, getStudentRank } from '../firebase/firestore';
import Loading from '../components/Loading';
import '../styles/military-theme.css';

const LeaderboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLang?.() || { t: (s) => s, lang: 'en' };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  const exportToCSV = () => {
    const csvData = filteredUsers.map((userData, index) => ({
      Position: index + 1,
      Name: userData.displayName || userData.email,
      Email: userData.email,
      Rank: lang === 'ar' ? userData.rank.nameAr : userData.rank.name,
      Points: userData.totalPoints
    }));

    const headers = ['Position', 'Name', 'Email', 'Rank', 'Points'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadLeaderboard = async () => {
    try {
      const [usersResult, classesResult, enrollmentsResult] = await Promise.all([
        getUsers(),
        getClasses(),
        getEnrollments()
      ]);
      
      if (classesResult.success) setClasses(classesResult.data || []);
      if (enrollmentsResult.success) setEnrollments(enrollmentsResult.data || []);
      
      if (usersResult.success) {
        // Deduplicate by email (keep first), then filter students only
        const all = usersResult.data || [];
        const seen = new Set();
        const deduped = all.filter(u => {
          const email = (u.email || '').toLowerCase();
          if (!email || seen.has(email)) return false;
          seen.add(email);
          return true;
        });
        const onlyStudents = deduped.filter(u => (u.role || 'student') === 'student');
        
        // Calculate ranks and sort by points
        const usersWithRanks = onlyStudents.map(userData => {
          const totalPoints = userData.totalPoints || 0;
          const rankInfo = getStudentRank(totalPoints);
          
          return {
            ...userData,
            totalPoints,
            rank: rankInfo.current,
            nextRank: rankInfo.next,
            progress: rankInfo.progress
          };
        }).sort((a, b) => b.totalPoints - a.totalPoints);
        
        setUsers(usersWithRanks);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loading message={t('loading') || 'Loading...'} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <Loading message={t('loading_leaderboard') || 'Loading leaderboard...'} />;
  }

  const currentUserPosition = users.findIndex(u => (u.docId || u.id) === user.uid) + 1;
  const currentUserData = users.find(u => (u.docId || u.id) === user.uid);

  // Filter by class if selected
  const classFiltered = classFilter === 'all' 
    ? users 
    : users.filter(u => {
        const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
        return userEnrollments.some(e => e.classId === classFilter);
      });
  const filteredUsers = rankFilter === 'all'
    ? classFiltered
    : classFiltered.filter(u => (u.rank?.name === rankFilter || u.rank?.nameAr === rankFilter));

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: 'var(--gradient-navy)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontFamily: 'var(--font-primary)', fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>
          🏆 {t('leaderboard') || 'Leaderboard'}
        </h1>
        <p style={{ margin: '0 0 1rem 0', opacity: 0.9 }}>
          {t('see_how_you_rank') || 'See how you rank among your peers'}
        </p>
        {currentUserPosition > 0 && currentUserData && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>
              {t('your_position') || 'Your Position'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              #{currentUserPosition} • {currentUserData.rank.icon} {lang === 'ar' ? currentUserData.rank.nameAr : currentUserData.rank.name}
            </div>
            <div style={{ fontSize: '1.125rem', marginTop: '0.25rem' }}>
              {currentUserData.totalPoints} {t('points') || 'points'}
            </div>
          </div>
        )}
      </div>

      {/* Class Filter & Export */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap:'wrap' }}>
          <label style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>
            {t('filter_by_class') || 'Filter by Class'}:
          </label>
          <select 
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '2px solid var(--military-light-gray)',
              fontSize: '1rem',
              fontFamily: 'var(--font-secondary)'
            }}
          >
            <option value="all">{t('all_classes') || 'All Classes'}</option>
            {classes.map(cls => (
              <option key={cls.docId || cls.id} value={cls.docId || cls.id}>
                {cls.name}{cls.code ? ` (${cls.code})` : ''}
              </option>
            ))}
          </select>

          {/* Rank Filter (based on ranks present in data) */}
          <label style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>
            {t('military_rank') || 'Military Rank'}:
          </label>
          <select
            value={rankFilter}
            onChange={(e)=>setRankFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '2px solid var(--military-light-gray)' }}
          >
            <option value="all">{t('all') || 'All'}</option>
            {[...new Set(users.map(u => (lang==='ar' ? u.rank?.nameAr : u.rank?.name)).filter(Boolean))].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          
          {/* View toggle */}
          <div style={{ display:'inline-flex', gap:8, marginLeft: 8 }}>
            <button onClick={()=>setViewMode('table')} className="btn-military-outline" style={{ padding:'0.4rem 0.75rem' }}>Table</button>
            <button onClick={()=>setViewMode('grid')} className="btn-military-outline" style={{ padding:'0.4rem 0.75rem' }}>Grid</button>
          </div>
        </div>
        
        <button
          onClick={exportToCSV}
          className="btn-military-secondary"
          style={{ padding: '0.5rem 1.5rem' }}
        >
          📊 {t('export_csv') || 'Export CSV'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        {filteredUsers.length > 0 ? (
          viewMode === 'table' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>{t('position') || 'Position'}</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>{t('student') || 'Student'}</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('military_rank') || 'Military Rank'}</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>{t('points') || 'Points'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userData, index) => (
                    <tr key={userData.docId || userData.id || index} style={{ borderBottom: '1px solid #f0f0f0', background: (userData.docId || userData.id) === user.uid ? '#f8f9ff' : 'transparent' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {index < 3 && (<span style={{ fontSize: '1.5rem' }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>)}
                          <strong>#{index + 1}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.25rem', border: '2px solid var(--military-gold)' }}>
                            {(userData.displayName || userData.email)?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                              {userData.displayName || userData.email}
                              {(userData.docId || userData.id) === user.uid && (<span style={{ marginLeft: '0.5rem', color: 'var(--military-gold)', fontSize: '0.875rem', fontWeight: 700 }}>({t('you') || 'You'})</span>)}
                            </div>
                            {userData.email && userData.displayName && (<div style={{ fontSize: '0.875rem', color: '#888' }}>{userData.email}</div>)}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div className="rank-badge-inline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: `${userData.rank.color}15`, border: `2px solid ${userData.rank.color}`, borderRadius: '20px' }}>
                          <span style={{ fontSize: '1.5rem' }}>{userData.rank.icon}</span>
                          <span style={{ fontWeight: 600, color: userData.rank.color }}>{lang === 'ar' ? userData.rank.nameAr : userData.rank.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--military-gold)' }}>{userData.totalPoints}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {filteredUsers.map((u, index) => (
                <div key={u.docId || u.id || index} className="card-military" style={{ padding:'1rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-navy)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:'1.25rem', border:'2px solid var(--military-gold)' }}>
                      {(u.displayName || u.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600 }}>{u.displayName || u.email}</div>
                      <div style={{ fontSize:12, color:'#888' }}>#{index+1}</div>
                    </div>
                  </div>
                  <div style={{ marginTop:8 }}>
                    <div className="rank-badge-inline" style={{ display:'inline-flex', gap:8, padding:'0.25rem 0.75rem', background:`${u.rank.color}15`, border:`2px solid ${u.rank.color}` }}>
                      <span style={{ fontSize:'1.25rem' }}>{u.rank.icon}</span>
                      <span style={{ fontWeight:600, color:u.rank.color }}>{lang==='ar'?u.rank.nameAr:u.rank.name}</span>
                    </div>
                  </div>
                  <div style={{ marginTop:8, fontWeight:700, color:'var(--military-gold)' }}>{u.totalPoints} {t('points')||'points'}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No data available</h3>
            <p>Complete some activities to see the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
