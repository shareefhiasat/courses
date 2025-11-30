import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLang } from '../contexts/LangContext';
import { Container, Card, CardBody, Button, Badge, Spinner, Modal } from '../components/ui';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { CalendarDays, Repeat, Play, ExternalLink, QrCode } from 'lucide-react';
import { formatDateTime } from '../utils/date';
import styles from './ActivityDetailPage.module.css';

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'activities', activityId));
        if (snap.exists()) {
          setActivity({ id: snap.id, ...snap.data() });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activityId]);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Spinner size="lg" />
      </div>
    );
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

  const title = lang === 'ar' ? (activity.title_ar || activity.title_en || activity.id) : (activity.title_en || activity.title_ar || activity.id);
  const shareUrl = `${window.location.origin}/activity/${activityId}`;

  return (
    <Container maxWidth="xl" className={styles.page}>
      <Card>
        <CardBody>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>{title}</h1>
              {(activity.description_en || activity.description_ar) && (
                <p className={styles.description}>
                  {lang === 'ar' ? (activity.description_ar || activity.description_en) : (activity.description_en || activity.description_ar)}
                </p>
              )}
              <div className={styles.meta}>
                {activity.createdAt && (
                  <Badge variant="subtle" color="default">
                    <CalendarDays size={14} />
                    {t('created') || 'Created'}: {formatDateTime(activity.createdAt)}
                  </Badge>
                )}
                {activity.dueDate && (
                  <Badge variant="subtle" color="warning">
                    <CalendarDays size={14} />
                    {t('due_date_label')}: {formatDateTime(activity.dueDate)}
                  </Badge>
                )}
                {activity.allowRetake && (
                  <Badge variant="subtle" color="info">
                    <Repeat size={14} />
                    {t('retake_allowed') || 'Retake Allowed'}
                  </Badge>
                )}
              </div>
            </div>
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                size="sm"
                icon={<QrCode size={16} />}
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
                icon={<Play size={16} />}
                onClick={() => navigate(`/quiz/${activity.quizId}`)}
              >
                {t('start_quiz') || 'Start Quiz'}
              </Button>
            ) : activity.url ? (
              <Button
                variant="primary"
                icon={<ExternalLink size={16} />}
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
