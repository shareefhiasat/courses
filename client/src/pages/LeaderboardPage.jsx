import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getUsers } from '../firebase/firestore';
import Loading from '../components/Loading';

const LeaderboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang?.() || { t: (s) => s };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      const result = await getUsers();
      if (result.success) {
        // Deduplicate by email (keep first), then filter students only
        const all = result.data || [];
        const seen = new Set();
        const deduped = all.filter(u => {
          const email = (u.email || '').toLowerCase();
          if (!email || seen.has(email)) return false;
          seen.add(email);
          return true;
        });
        const onlyStudents = deduped.filter(u => (u.role || 'student') === 'student');
        // Calculate total scores and sort users
        const usersWithScores = onlyStudents.map(user => {
          const progress = user.progress || {};
          const totalScore = Object.values(progress).reduce((sum, p) => sum + (p.score || 0), 0);
          const completedActivities = Object.values(progress).filter(p => p.completed).length;
          
          return {
            ...user,
            totalScore,
            completedActivities
          };
        }).sort((a, b) => b.totalScore - a.totalScore);
        
        setUsers(usersWithScores);
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

  const currentUserRank = users.findIndex(u => (u.docId || u.id) === user.uid) + 1;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #800020 0%, #600018 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1>🏆 Leaderboard</h1>
        <p>See how you rank among your peers</p>
        {currentUserRank > 0 && (
          <div style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
            Your Rank: <strong>#{currentUserRank}</strong>
          </div>
        )}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        {users.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Student</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Total Score</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Completed Activities</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData, index) => (
                  <tr 
                    key={userData.docId || userData.id || index}
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      background: (userData.docId || userData.id) === user.uid ? '#f8f9ff' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {index < 3 && (
                          <span style={{ fontSize: '1.5rem' }}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <strong>#{index + 1}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {userData.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {userData.email}
                            {(userData.docId || userData.id) === user.uid && (
                              <span style={{ 
                                marginLeft: '0.5rem', 
                                color: '#800020', 
                                fontSize: '0.9rem' 
                              }}>
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 'bold',
                        color: '#800020'
                      }}>
                        {userData.totalScore}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem' }}>
                        {userData.completedActivities}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
