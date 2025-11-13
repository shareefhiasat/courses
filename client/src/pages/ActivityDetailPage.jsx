import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLang } from '../contexts/LangContext';
import Loading from '../components/Loading';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { CalendarDays, Repeat, Play, ExternalLink, QrCode } from 'lucide-react';
import { formatDateTime } from '../utils/date';

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

  if (loading) return <Loading/>;
  if (!activity) return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold">{t('not_found') || 'Not found'}</h2>
      </div>
    </div>
  );

  const title = lang === 'ar' ? (activity.title_ar || activity.title_en || activity.id) : (activity.title_en || activity.title_ar || activity.id);
  const shareUrl = `${window.location.origin}/activity/${activityId}`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{title}</h1>
            {activity.description_en || activity.description_ar ? (
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {lang === 'ar' ? (activity.description_ar || activity.description_en) : (activity.description_en || activity.description_ar)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
              {activity.createdAt && (
                <span className="inline-flex items-center gap-1"><CalendarDays size={14}/> {t('created') || 'Created'}: {formatDateTime(activity.createdAt)}</span>
              )}
              {activity.dueDate && (
                <span className="inline-flex items-center gap-1"><CalendarDays size={14}/> {t('due_date_label')}: {formatDateTime(activity.dueDate)}</span>
              )}
              {activity.allowRetake && (
                <span className="inline-flex items-center gap-1"><Repeat size={14}/> {t('retake_allowed') || 'Retake Allowed'}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            >
              <QrCode size={16}/> {t('share') || 'Share'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {activity.quizId ? (
            <button
              onClick={() => navigate(`/quiz/${activity.quizId}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white"
            >
              <Play size={16}/> {t('start_quiz') || 'Start Quiz'}
            </button>
          ) : activity.url ? (
            <a
              href={activity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white"
            >
              <ExternalLink size={16}/> {t('open') || 'Open'}
            </a>
          ) : null}
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-[380px]" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">{t('share_activity') || 'Share Activity'}</h3>
            <QRCodeGenerator url={shareUrl} title={title} />
            <div className="mt-4 text-xs text-gray-500 break-all">{shareUrl}</div>
            <div className="mt-4 text-right">
              <button onClick={() => setShowQR(false)} className="px-3 py-1.5 rounded border">{t('close') || 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
