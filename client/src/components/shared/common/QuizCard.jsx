import React from 'react';
import { Card, CardBody, Button, Spinner } from '../../ui';
import { Users, CheckCircle, Play, Edit, Trash2, Clock, BookOpen, Award } from 'lucide-react';

const QuizCard = ({
  quiz,
  lang = 'en',
  onPreview,
  onEdit,
  onDelete,
  onCopy,
  deleting = false,
  compact = false,
  showActions = true,
  className = ''
}) => {
  // Get localized title
  const getTitle = () => {
    if (lang === 'ar') {
      return quiz.title_ar || quiz.title_en || quiz.title || 'Untitled Quiz';
    }
    return quiz.title_en || quiz.title_ar || quiz.title || 'Untitled Quiz';
  };

  // Get localized description
  const getDescription = () => {
    if (lang === 'ar') {
      return quiz.description_ar || quiz.description_en || quiz.description || '';
    }
    return quiz.description_en || quiz.description_ar || quiz.description || '';
  };

  // Format creation info
  const formatCreatedInfo = () => {
    if (!quiz.createdAt) return '';
    
    const createdDate = quiz.createdAt.toDate ? quiz.createdAt.toDate() : new Date(quiz.createdAt);
    const formattedDate = createdDate.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return `Created ${formattedDate}`;
  };

  // Render meta chips
  const renderMetaChips = () => {
    const chips = [];
    
    if (quiz.duration) {
      chips.push({
        icon: <Clock size={12} />,
        label: `${quiz.duration} min`,
        color: '#3b82f6'
      });
    }
    
    if (quiz.questions?.length) {
      chips.push({
        icon: <BookOpen size={12} />,
        label: `${quiz.questions.length} questions`,
        color: '#10b981'
      });
    }
    
    if (quiz.difficulty) {
      const difficultyColors = {
        easy: '#10b981',
        medium: '#f59e0b',
        hard: '#ef4444'
      };
      
      chips.push({
        icon: <Award size={12} />,
        label: quiz.difficulty,
        color: difficultyColors[quiz.difficulty] || '#6b7280'
      });
    }
    
    return chips;
  };

  const metaChips = renderMetaChips();
  const title = getTitle();
  const description = getDescription();

  return (
    <Card className={`quiz-card ${compact ? 'compact' : ''} ${className}`}>
      <CardBody>
        {/* Header with title and actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1, marginRight: '0.5rem' }}>
            {/* Meta chips */}
            {metaChips.length > 0 && (
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {metaChips.map((chip, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.125rem 0.5rem',
                      backgroundColor: chip.color + '20',
                      color: chip.color,
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    {chip.icon}
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
            
            {/* Title */}
            <h3 style={{ 
              margin: 0, 
              fontSize: compact ? '1rem' : '1.125rem', 
              fontWeight: '600',
              color: 'var(--text)',
              lineHeight: 1.3
            }}>
              {title}
            </h3>
          </div>

          {/* Actions */}
          {showActions && (
            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview?.(quiz.id)}
                title="Preview quiz"
                aria-label="Preview quiz"
              >
                <Play size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(quiz)}
                title="Edit quiz"
                aria-label="Edit quiz"
              >
                <Edit size={16} />
              </Button>
              {onCopy && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(quiz)}
                  title="Copy quiz"
                  aria-label="Copy quiz"
                >
                  <Copy size={16} />
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete?.(quiz.id)}
                disabled={deleting}
                title="Delete quiz"
                aria-label="Delete quiz"
              >
                {deleting ? <Spinner size="sm" /> : <Trash2 size={16} />}
              </Button>
            </div>
          )}
        </div>

        {/* Description */}
        {!compact && description && (
          <p style={{ 
            margin: '0 0 0.75rem 0', 
            color: 'var(--muted)', 
            fontSize: '0.875rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {description}
          </p>
        )}

        {/* Stats */}
        {!compact && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '0.75rem',
            fontSize: '0.875rem',
            color: 'var(--muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={14} />
              <span>{quiz.totalAttempts || 0} attempts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={14} />
              <span>{quiz.averageScore || 0}% avg score</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--muted)'
        }}>
          <span>
            {formatCreatedInfo()}
          </span>
          {quiz.status && (
            <span style={{
              padding: '0.125rem 0.5rem',
              backgroundColor: quiz.status === 'published' ? '#10b98120' : '#6b728020',
              color: quiz.status === 'published' ? '#10b981' : '#6b7280',
              borderRadius: '0.25rem',
              fontWeight: '500'
            }}>
              {quiz.status}
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default QuizCard;
