import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { X, User, Shield, Calendar, Eye, Download, MessageSquare, Edit } from 'lucide-react';
import axios from 'axios';

/**
 * SharesList - Display and manage existing FileShare rows
 * Shows user shares and role shares with revoke option
 */
export default function SharesList({ fileId, onRevoke }) {
  const { t } = useLang();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShares = useCallback(async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/drive/files/${fileId}/shares`);
      if (response.data.success) {
        setShares(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch shares');
      }
    } catch (err) {
      console.error('[SharesList] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleRevoke = async (shareId) => {
    try {
      const response = await axios.delete(`/api/v1/drive/shares/${shareId}`);
      if (response.data.success) {
        setShares(prev => prev.filter(s => s.id !== shareId));
        onRevoke?.(shareId);
      }
    } catch (err) {
      console.error('[SharesList] revoke failed:', err);
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'VIEW': return Eye;
      case 'DOWNLOAD': return Download;
      case 'COMMENT': return MessageSquare;
      case 'EDIT': return Edit;
      default: return Eye;
    }
  };

  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return t('drive.expired');
    if (diffDays === 0) return t('drive.expirestoday');
    if (diffDays === 1) return t('drive.expirestomorrow');
    return t('drive.expiresindays', { days: diffDays });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-[#8d90a0]">
        {t('common.loading')}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-[#ffb4ab]">
        {error}
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-[#8d90a0]">
        {t('drive.noShares')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-[#e1e2ed] mb-3">
        {t('drive.existingShares')} ({shares.length})
      </h3>
      
      {shares.map(share => {
        const PermIcon = getPermissionIcon(share.permission);
        const isUser = share.subjectType === 'USER';
        const displayName = isUser 
          ? (share.subjectUser?.displayName || share.subjectUser?.email || t('drive.unknownUser'))
          : share.subjectRole;
        const expiryText = formatExpiry(share.expiresAt);
        
        return (
          <div
            key={share.id}
            className="flex items-center justify-between p-3 bg-[#1d1f27] rounded-lg border border-[#434655]/30 hover:border-[#434655]/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Subject Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#32343d] flex items-center justify-center">
                {isUser ? (
                  <User className="w-4 h-4 text-[#b4c5ff]" />
                ) : (
                  <Shield className="w-4 h-4 text-[#ffd699]" />
                )}
              </div>
              
              {/* Subject Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {displayName}
                  </p>
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs rounded-full bg-[#32343d] text-[#8d90a0]">
                    {isUser ? t('drive.user') : t('drive.role')}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1">
                  {/* Permission */}
                  <div className="flex items-center gap-1 text-xs text-[#8d90a0]">
                    <PermIcon className="w-3 h-3" />
                    {t(`drive.permission.${share.permission.toLowerCase()}`)}
                  </div>
                  
                  {/* Expiry */}
                  {expiryText && (
                    <div className="flex items-center gap-1 text-xs text-[#8d90a0]">
                      <Calendar className="w-3 h-3" />
                      {expiryText}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Revoke Button */}
            <button
              onClick={() => handleRevoke(share.id)}
              className="flex-shrink-0 p-1.5 text-[#8d90a0] hover:text-[#ffb4ab] hover:bg-[#32343d] rounded transition-colors"
              title={t('drive.revokeShare')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
