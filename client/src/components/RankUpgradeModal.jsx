import React, { useEffect } from 'react';
import { useLang } from '../contexts/LangContext';
import '../styles/military-theme.css';

const RankUpgradeModal = ({ newRank, onClose }) => {
  const { lang, t } = useLang();

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!newRank) return null;

  return (
    <div className="rank-upgrade-modal" onClick={onClose}>
      <div className="rank-upgrade-content" onClick={(e) => e.stopPropagation()}>
        {/* Animated stars */}
        <div className="rank-upgrade-stars">
          <div className="rank-upgrade-star">⭐</div>
          <div className="rank-upgrade-star">⭐</div>
          <div className="rank-upgrade-star">⭐</div>
          <div className="rank-upgrade-star">⭐</div>
          <div className="rank-upgrade-star">⭐</div>
        </div>

        {/* Content */}
        <div className="rank-upgrade-title">
          {t('rank_upgraded') || 'RANK UPGRADED!'}
        </div>

        <div className="rank-upgrade-icon">
          {newRank.icon}
        </div>

        <div className="rank-upgrade-name">
          {lang === 'ar' ? newRank.nameAr : newRank.name}
        </div>

        <div className="rank-upgrade-message">
          {t('congratulations_promotion') || 'Congratulations on your promotion!'}
        </div>

        <button className="rank-upgrade-close" onClick={onClose}>
          {t('continue') || 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default RankUpgradeModal;
