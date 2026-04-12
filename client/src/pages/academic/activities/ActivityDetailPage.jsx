import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getActivityById } from '@services/business/activitiesService';
import { Container, Card, CardBody, Button, Badge, Modal, SimpleLoading } from '@ui';
import { QRCodeGenerator } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import styles from './ActivityDetailPage.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const activityData = await getActivityById(activityId);
        if (activityData) {
          setActivity({ id: activityData.id || activityId, ...activityData });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activityId]);

  if (loading) {
    return <SimpleLoading loading type="spinner" size="lg" />;
  }
  
  if (!activity) {
    return (
      <Container maxWidth="lg">
        <Card>
          <CardBody>
            <h2 className={styles.notFound}>{t('not_found') || 'Not found'}</h2>
          </CardBody>
        </Card>
      </Container>
    );
  }

  const title = lang === 'ar' ? (activity.titleAr || activity.titleEn || activity.id) : (activity.titleEn || activity.titleAr || activity.id);
  const shareUrl = `${window.location.origin}/activity/${activityId}`;

  return (
    <Container maxWidth="xl" className={styles.page}>
      <Card>
        <CardBody>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>{title}</h1>
              {(activity.descriptionEn || activity.descriptionAr) && (
                <p className={styles.description}>
                  {lang === 'ar' ? (activity.descriptionAr || activity.descriptionEn) : (activity.descriptionEn || activity.descriptionAr)}
                </p>
              )}
              <div className={styles.meta}>
                {activity.createdAt && (
                  <Badge variant="subtle" color="default">
                    {getThemedIcon('ui', 'calendar', 14, theme)}
                    {t('created') || 'Created'}: {formatDateTime(activity.createdAt)}
                  </Badge>
                )}
                {activity.dueDate && (
                  <Badge variant="subtle" color="warning">
                    {getThemedIcon('ui', 'calendar', 14, theme)}
                    {t('due_date_label')}: {formatDateTime(activity.dueDate)}
                  </Badge>
                )}
                {activity.allowRetake && (
                  <Badge variant="subtle" color="info">
                    {getThemedIcon('ui', 'repeat', 14, theme)}
                    {t('retake_allowed') || 'Retakable'}
                  </Badge>
                )}
              </div>
            </div>
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                size="sm"
                icon={getThemedIcon('ui', 'qr_code', 16, theme)}
                onClick={() => setShowQR(true)}
              >
                {t('share') || 'Share'}
              </Button>
            </div>
          </div>

          <div className={styles.actions}>
            {activity.quizId ? (
              <Button
                variant="primary"
                icon={getThemedIcon('ui', 'play', 16, theme)}
                onClick={() => navigate(`/quiz/${activity.quizId}`)}
              >
                {t('start_quiz') || 'Start Quiz'}
              </Button>
            ) : activity.url ? (
              <Button
                variant="primary"
                icon={getThemedIcon('ui', 'external_link', 16, theme)}
                onClick={() => window.open(activity.url, '_blank')}
              >
                {t('open') || 'Open'}
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        title={t('share_activity') || 'Share Activity'}
        size="sm"
      >
        <QRCodeGenerator url={shareUrl} title={title} />
        <div className={styles.shareUrl}>{shareUrl}</div>
      </Modal>
    </Container>
  );
}
