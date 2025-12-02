import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate } from 'react-router-dom';
import { getUsers, getClasses, getEnrollments, getStudentRank } from '../firebase/firestore';
import { Container, Card, CardBody, Button, Select, Loading, Badge, Avatar, EmptyState, Grid } from '../components/ui';
import { Trophy, Download, Table as TableIcon, Grid as GridIcon } from 'lucide-react';
import styles from './LeaderboardPage.module.css';
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

  if (authLoading || loading) {
    return <Loading variant="overlay" message={t('loading') || 'Loading...'} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
    <Container maxWidth="xl" className={styles.page}>
      <Card className={styles.heroCard}>
        <CardBody>
          <div className={styles.heroContent}>
            <Trophy size={48} className={styles.heroIcon} />
            <h1>{t('leaderboard') || 'Leaderboard'}</h1>
            <p>{t('see_how_you_rank') || 'See how you rank among your peers'}</p>
            {currentUserPosition > 0 && currentUserData && (
              <div className={styles.userPosition}>
                <div className={styles.positionLabel}>
                  {t('your_position') || 'Your Position'}
                </div>
                <div className={styles.positionValue}>
                  #{currentUserPosition} • {currentUserData.rank.icon} {lang === 'ar' ? currentUserData.rank.nameAr : currentUserData.rank.name}
                </div>
                <div className={styles.positionPoints}>
                  {currentUserData.totalPoints} {t('points') || 'points'}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Filters & Export */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          <Select
            label={t('filter_by_class') || 'Filter by Class'}
            searchable
            options={[
              { value: 'all', label: t('all_classes') || 'All Classes' },
              ...classes.map(cls => ({ value: cls.id, label: cls.name }))
            ]}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            fullWidth
          />

          <Select
            value={rankFilter}
            onChange={(e)=>setRankFilter(e.target.value)}
            label={t('military_rank') || 'Military Rank'}
            searchable
            options={[
              { value: 'all', label: t('all') || 'All' },
              ...[...new Set(users.map(u => (lang==='ar' ? u.rank?.nameAr : u.rank?.name)).filter(Boolean))].map(r => ({ value: r, label: r }))
            ]}
          />
          
          <div className={styles.viewToggle}>
            <Button
              onClick={()=>setViewMode('table')}
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              icon={<TableIcon size={16} />}
            >
              Table
            </Button>
            <Button
              onClick={()=>setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              icon={<GridIcon size={16} />}
            >
              Grid
            </Button>
          </div>
        </div>
        
        <Button
          onClick={exportToCSV}
          icon={<Download size={18} />}
          variant="secondary"
        >
          {t('export_csv') || 'Export CSV'}
        </Button>
      </div>

      <Card>
        <CardBody>
        {filteredUsers.length > 0 ? (
          viewMode === 'table' ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('position') || 'Position'}</th>
                    <th>{t('student') || 'Student'}</th>
                    <th>{t('military_rank') || 'Military Rank'}</th>
                    <th>{t('points') || 'Points'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userData, index) => (
                    <tr key={userData.docId || userData.id || index} className={(userData.docId || userData.id) === user.uid ? styles.currentUser : ''}>
                      <td>
                        <div className={styles.position}>
                          {index < 3 && (<span className={styles.medal}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>)}
                          <strong>#{index + 1}</strong>
                        </div>
                      </td>
                      <td>
                        <div className={styles.studentInfo}>
                          <Avatar
                            name={(userData.displayName || userData.email)?.charAt(0).toUpperCase()}
                            size="md"
                          />
                          <div>
                            <div className={styles.studentName}>
                              {userData.displayName || userData.email}
                              {(userData.docId || userData.id) === user.uid && (<Badge variant="warning" size="sm" className={styles.youBadge}>({t('you') || 'You'})</Badge>)}
                            </div>
                            {userData.email && userData.displayName && (<div className={styles.studentEmail}>{userData.email}</div>)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.rankBadge} style={{ background: `${userData.rank.color}15`, borderColor: userData.rank.color }}>
                          <span className={styles.rankIcon}>{userData.rank.icon}</span>
                          <span style={{ color: userData.rank.color }}>{lang === 'ar' ? userData.rank.nameAr : userData.rank.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.points}>{userData.totalPoints}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.gridView}>
              {filteredUsers.map((u, index) => (
                <Card key={u.docId || u.id || index} className={styles.gridCard}>
                  <CardBody>
                    <div className={styles.gridHeader}>
                      <Avatar
                        name={(u.displayName || u.email)?.charAt(0).toUpperCase()}
                        size="md"
                      />
                      <div>
                        <div className={styles.gridName}>{u.displayName || u.email}</div>
                        <div className={styles.gridPosition}>#{index+1}</div>
                      </div>
                    </div>
                    <div className={styles.gridRank}>
                      <Badge variant="primary" className={styles.rankBadge} style={{ background:`${u.rank.color}15`, borderColor:u.rank.color, color:u.rank.color }}>
                        <span className={styles.rankIcon}>{u.rank.icon}</span>
                        {lang==='ar'?u.rank.nameAr:u.rank.name}
                      </Badge>
                    </div>
                    <div className={styles.gridPoints}>{u.totalPoints} {t('points')||'points'}</div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )
        ) : (
          <EmptyState
            icon={Trophy}
            title="No data available"
            description="Complete some activities to see the leaderboard!"
          />
        )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default LeaderboardPage;
