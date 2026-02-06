import React from 'react';
import { Button, Badge, ProgressBar } from '@ui';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import styles from '../../pages/StudentDashboardPage.module.css';

export default function TaskCard({ task, navigate }) {
  const { theme } = useTheme();
  
  const statusConfig = {
    completed: { color: 'success', icon: getThemedIcon('ui', 'check_circle', 14, theme), label: 'Completed' },
    pending: { color: 'default', icon: getThemedIcon('ui', 'clock', 14, theme), label: 'Pending' },
    urgent: { color: 'warning', icon: getThemedIcon('ui', 'alert_triangle', 14, theme), label: 'Due Soon' },
    overdue: { color: 'danger', icon: getThemedIcon('ui', 'x_circle', 14, theme), label: 'Overdue' }
  };

  const typeConfig = {
    quiz: { icon: getThemedIcon('ui', 'file_text', 18, theme), label: 'Quiz', color: '#667eea' },
    homework: { icon: getThemedIcon('ui', 'book_open', 18, theme), label: 'Homework', color: '#f59e0b' },
    resource: { icon: getThemedIcon('ui', 'archive', 18, theme), label: 'Resource', color: '#10b981' }
  };

  const status = statusConfig[task.status] || statusConfig.pending;
  const type = typeConfig[task.type] || typeConfig.homework;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div className={styles.taskCard}>
      <div className={styles.taskCardHeader}>
        <div className={styles.taskType}>
          {TypeIcon}
          <span>{type.label}</span>
        </div>
        <Badge variant={status.color} size="sm">
          {StatusIcon}
          {status.label}
        </Badge>
      </div>

      <h3 className={styles.taskTitle}>{task.title}</h3>
      
      <div className={styles.taskMeta}>
        <span className={styles.className}>{task.className}</span>
        {task.deadline && (
          <span className={styles.deadline}>
            {getThemedIcon('ui', 'clock', 14, theme)}
            {new Date(task.deadline.toDate()).toLocaleDateString('en-GB')}
          </span>
        )}
      </div>

      {task.isGraded && (
        <div className={styles.taskScore}>
          {getThemedIcon('ui', 'award', 16, theme)}
          <span className={styles.score}>{task.score}%</span>
          <ProgressBar 
            value={task.score} 
            max={100}
            variant={task.score >= 70 ? 'success' : 'danger'}
            size="sm"
          />
        </div>
      )}

      <div className={styles.taskActions}>
        {task.status === 'completed' ? (
          <>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/quiz-results?id=${task.id}`)}
            >
              {getThemedIcon('ui', 'eye', 14, theme)} View Results
            </Button>
            {task.allowRetake && task.score < 70 && (
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => navigate(`/quiz/${task.id}?retake=true`)}
              >
                {getThemedIcon('ui', 'refresh', 14, theme)} Retake
              </Button>
            )}
          </>
        ) : (
          <Button 
            size="sm" 
            variant="primary"
            onClick={() => navigate(task.type === 'quiz' ? `/quiz/${task.id}` : `/activity/${task.id}`)}
          >
            {getThemedIcon('ui', 'play', 14, theme)} {task.type === 'quiz' ? 'Start Quiz' : 'View Details'}
          </Button>
        )}
      </div>
    </div>
  );
}




