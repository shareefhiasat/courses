import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './StatCard.module.css';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'primary',
  size = 'medium',
  loading = false,
  className = ''
}) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} />;
      case 'down':
        return <TrendingDown size={16} />;
      case 'neutral':
        return <Minus size={16} />;
      default:
        return null;
    }
  };

  const getTrendClass = () => {
    switch (trend) {
      case 'up':
        return styles.trendUp;
      case 'down':
        return styles.trendDown;
      case 'neutral':
        return styles.trendNeutral;
      default:
        return '';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return styles.colorPrimary;
      case 'success':
        return styles.colorSuccess;
      case 'warning':
        return styles.colorWarning;
      case 'danger':
        return styles.colorDanger;
      case 'info':
        return styles.colorInfo;
      default:
        return styles.colorPrimary;
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return styles.sizeSmall;
      case 'medium':
        return styles.sizeMedium;
      case 'large':
        return styles.sizeLarge;
      default:
        return styles.sizeMedium;
    }
  };

  if (loading) {
    return (
      <div className={`${styles.statCard} ${getSizeClass()} ${className}`}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonValue} />
            <div className={styles.skeletonSubtitle} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.statCard} ${getSizeClass()} ${getColorClass()} ${className}`}>
      <div className={styles.statContent}>
        <div className={styles.statHeader}>
          <div className={styles.statIcon}>
            {icon}
          </div>
          {trend && (
            <div className={`${styles.trend} ${getTrendClass()}`}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <div className={styles.statBody}>
          <h3 className={styles.statTitle}>{title}</h3>
          <p className={styles.statValue}>{value}</p>
          {subtitle && <p className={styles.statSubtitle}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
