import React from 'react';
import { Button, Badge, ProgressBar } from '../ui';
import {
  CheckCircle, Clock, AlertCircle, XCircle,
  BookOpen, FileQuestion, FileArchive, Award,
  Eye, RefreshCw, Play
} from 'lucide-react';
import styles from '../../pages/StudentDashboardPage_NEW.module.css';

export default function TaskCard({ task, navigate }) {
  const statusConfig = {
    completed: { color: 'success', icon: CheckCircle, label: 'Completed' },
    pending: { color: 'default', icon: Clock, label: 'Pending' },
    urgent: { color: 'warning', icon: AlertCircle, label: 'Due Soon' },
    overdue: { color: 'danger', icon: XCircle, label: 'Overdue' }
  };

  const typeConfig = {
    quiz: { icon: FileQuestion, label: 'Quiz', color: '#667eea' },
    homework: { icon: BookOpen, label: 'Homework', color: '#f59e0b' },
    resource: { icon: FileArchive, label: 'Resource', color: '#10b981' }
  };

  const status = statusConfig[task.status] || statusConfig.pending;
  const type = typeConfig[task.type] || typeConfig.homework;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div className={styles.taskCard}>
      <div className={styles.taskCardHeader}>
        <div className={styles.taskType}>
          <TypeIcon size={18} style={{ color: type.color }} />
          <span>{type.label}</span>
        </div>
        <Badge variant={status.color} size="sm">
          <StatusIcon size={14} />
          {status.label}
        </Badge>
      </div>

      <h3 className={styles.taskTitle}>{task.title}</h3>
      
      <div className={styles.taskMeta}>
        <span className={styles.className}>{task.className}</span>
        {task.deadline && (
          <span className={styles.deadline}>
            <Clock size={14} />
            {new Date(task.deadline.toDate()).toLocaleDateString('en-GB')}
          </span>
        )}
      </div>

      {task.isGraded && (
        <div className={styles.taskScore}>
          <Award size={16} />
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
              <Eye size={14} /> View Results
            </Button>
            {task.allowRetake && task.score < 70 && (
              <Button 
                size="sm" 
                variant="primary"
                onClick={() => navigate(`/quiz/${task.id}?retake=true`)}
              >
                <RefreshCw size={14} /> Retake
              </Button>
            )}
          </>
        ) : (
          <Button 
            size="sm" 
            variant="primary"
            onClick={() => navigate(task.type === 'quiz' ? `/quiz/${task.id}` : `/activity/${task.id}`)}
          >
            <Play size={14} /> {task.type === 'quiz' ? 'Start Quiz' : 'View Details'}
          </Button>
        )}
      </div>
    </div>
  );
}




