import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { Clock, RotateCcw, Download, User } from 'lucide-react';
import axios from 'axios';

/**
 * VersionsTab - FileVersion list with restore functionality
 */
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
    if (!bytes && bytes !== 0) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[#8d90a0]">
        {t('common.loading')}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-[#ffb4ab]">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[#8d90a0]">
        {t('drive.noVersions')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">
        {t('drive.versionHistory')} ({versions.length})
      </h3>

      {versions.map((version) => (
        <div
          key={version.id}
          className={`p-4 rounded-lg border transition-colors ${
            version.isCurrent
              ? 'bg-[#1d4e1d] border-[#2d6a2d]'
              : 'bg-[#1d1f27] border-[#434655]/30 hover:border-[#434655]/50'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#b4c5ff]" />
                <span className="text-sm font-medium text-white">
                  {t('drive.version')} {version.versionNumber}
                </span>
                {version.isCurrent && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#2d6a2d] text-[#a5d6a7]">
                    {t('drive.current')}
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm text-[#8d90a0]">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  {version.uploadedBy?.displayName || version.uploadedBy?.email || '—'}
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  {formatSize(version.size)}
                </div>
                <div>
                  {formatDate(version.createdAt)}
                </div>
                {version.changeNote && (
                  <div className="mt-2 p-2 bg-[#32343d] rounded text-xs">
                    {version.changeNote}
                  </div>
                )}
              </div>
            </div>

            {!version.isCurrent && (
              <button
                onClick={() => handleRestore(version.id)}
                className="flex-shrink-0 px-3 py-1.5 bg-[#32343d] text-white rounded-lg hover:bg-[#434655] transition-colors text-sm flex items-center gap-2"
                title={t('drive.restoreVersion')}
              >
                <RotateCcw className="w-4 h-4" />
                {t('drive.restore')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
