import React from 'react';
import { Avatar, Badge } from '../index';
import { Trophy, Medal, Award } from 'lucide-react';
import styles from './Leaderboard.module.css';

export default function Leaderboard({
  data = [],
  title = 'Leaderboard',
  showRank = true,
  showScore = true,
  showProgress = false,
  maxItems = 10,
  loading = false,
  className = ''
}) {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} style={{ color: '#fbbf24' }} />;
      case 2:
        return <Medal size={20} style={{ color: '#9ca3af' }} />;
      case 3:
        return <Award size={20} style={{ color: '#cd7f32' }} />;
      default:
        return <span className={styles.rankNumber}>{rank}</span>;
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { variant: 'warning', text: '1st' };
    if (rank === 2) return { variant: 'secondary', text: '2nd' };
    if (rank === 3) return { variant: 'outline', text: '3rd' };
    return { variant: 'ghost', text: `${rank}th` };
  };

  if (loading) {
    return (
      <div className={`${styles.leaderboard} ${className}`}>
        <h3 className={styles.leaderboardTitle}>{title}</h3>
        <div className={styles.leaderboardList}>
          {[...Array(maxItems)].map((_, index) => (
            <div key={index} className={styles.leaderboardItem}>
              <div className={styles.skeletonRank} />
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonName} />
                <div className={styles.skeletonScore} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayData = data.slice(0, maxItems);

  return (
    <div className={`${styles.leaderboard} ${className}`}>
      <h3 className={styles.leaderboardTitle}>{title}</h3>
      <div className={styles.leaderboardList}>
        {displayData.length === 0 ? (
          <div className={styles.emptyState}>
            <Trophy size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
            <p>No data available</p>
          </div>
        ) : (
          displayData.map((item, index) => {
            const rank = index + 1;
            const rankBadge = getRankBadge(rank);
            
            return (
              <div
                key={item.id || index}
                className={`${styles.leaderboardItem} ${rank <= 3 ? styles.topRank : ''}`}
              >
                {showRank && (
                  <div className={styles.rank}>
                    {getRankIcon(rank)}
                  </div>
                )}
                
                <div className={styles.userInfo}>
                  <Avatar
                    src={item.avatar}
                    name={item.name}
                    size="sm"
                    className={styles.userAvatar}
                  />
                  <div className={styles.userDetails}>
                    <h4 className={styles.userName}>{item.name}</h4>
                    {item.subtitle && (
                      <p className={styles.userSubtitle}>{item.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className={styles.userStats}>
                  {showScore && (
                    <div className={styles.score}>
                      <span className={styles.scoreValue}>{item.score}</span>
                      <span className={styles.scoreLabel}>points</span>
                    </div>
                  )}
                  
                  {showProgress && item.progress !== undefined && (
                    <div className={styles.progress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>{item.progress}%</span>
                    </div>
                  )}

                  <Badge
                    variant={rankBadge.variant}
                    size="sm"
                    className={styles.rankBadge}
                  >
                    {rankBadge.text}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
