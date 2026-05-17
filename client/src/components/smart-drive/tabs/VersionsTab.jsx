import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { Clock, RotateCcw, Download, User } from 'lucide-react';
import axios from 'axios';

export default function VersionsTab({ fileId }) {
  const { t } = useLang();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVersions = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/drive/files/${fileId}/versions`);
      if (response.data.success) {
        setVersions(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch versions');
      }
    } catch (err) {
      console.error('[VersionsTab] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (versionId) => {
    try {
      const response = await axios.post(`/api/v1/drive/versions/${versionId}/restore`);
      if (response.data.success) {
        fetchVersions();
      }
    } catch (err) {
      console.error('[VersionsTab] restore failed:', err);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '\u2014';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-500 dark:text-gray-400" role="status">
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-sm text-gray-500 dark:text-gray-400">
        <Clock className="w-10 h-10 mb-3 opacity-50" aria-hidden="true" />
        {t('drive.noVersions')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('drive.versionHistory')} ({versions.length})
      </h3>

      {versions.map((version) => (
        <div
          key={version.id}
          className={`p-4 rounded-xl border transition-colors ${
            version.isCurrent
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('drive.version')} {version.versionNumber}
                </span>
                {version.isCurrent && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                    {t('drive.current')}
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  {version.uploadedBy?.displayName || version.uploadedBy?.email || '\u2014'}
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatSize(version.size)}
                </div>
                <div>{formatDate(version.createdAt)}</div>
                {version.changeNote && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
                    {version.changeNote}
                  </div>
                )}
              </div>
            </div>

            {!version.isCurrent && (
              <button
                onClick={() => handleRestore(version.id)}
                className="flex-shrink-0 px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center gap-2 border border-gray-200 shadow-sm"
                title={t('drive.restoreVersion')}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                {t('drive.restore')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
