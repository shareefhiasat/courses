import React from 'react';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import ProgressBar from '../ProgressBar';
import styles from './ProgressWidget.module.css';

export default function ProgressWidget({
  title,
  value = 0,
  max = 100,
  label,
  subtitle,
  icon,
  color = 'primary',
  size = 'medium',
  showPercentage = true,
  showTrend = false,
  trend,
  loading = false,
  className = ''
}) {
  const getPercentage = () => {
    return Math.min(Math.max((value / max) * 100, 0), 100);
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

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} style={{ color: '#10b981' }} />;
      case 'down':
        return <TrendingUp size={14} style={{ color: '#ef4444', transform: 'rotate(180deg)' }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`${styles.progressWidget} ${getSizeClass()} ${className}`}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonProgress} />
            <div className={styles.skeletonSubtitle} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.progressWidget} ${getSizeClass()} ${getColorClass()} ${className}`}>
      <div className={styles.progressContent}>
        <div className={styles.progressHeader}>
          {icon && (
            <div className={styles.progressIcon}>
              {icon}
            </div>
          )}
          <div className={styles.progressInfo}>
            <h3 className={styles.progressTitle}>{title}</h3>
            {subtitle && <p className={styles.progressSubtitle}>{subtitle}</p>}
          </div>
          {showTrend && trend && (
            <div className={styles.progressTrend}>
              {getTrendIcon()}
            </div>
          )}
        </div>

        <div className={styles.progressBody}>
          <div className={styles.progressMain}>
            <ProgressBar
              value={value}
              max={max}
              variant={color}
              size={size}
              className={styles.progressBar}
            />
            <div className={styles.progressStats}>
              {showPercentage && (
                <span className={styles.progressPercentage}>
                  {Math.round(getPercentage())}%
                </span>
              )}
              <span className={styles.progressValue}>
                {value} / {max}
              </span>
            </div>
          </div>
          
          {label && (
            <div className={styles.progressLabel}>
              <span>{label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
