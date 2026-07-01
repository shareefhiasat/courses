import { useState, useEffect, useCallback, useMemo } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getThemedIcon, getIconWithColor } from '@constants/iconTypes';
import Modal from '@ui/Modal/Modal';
import Tabs from '@ui/Tabs/Tabs';
import Select from '@ui/Select/Select';
import Button from '@ui/Button/Button';
import RoleMultiSelect, { DRIVE_SHARE_ROLES } from '@ui/RoleMultiSelect';
import ShareUserSelect from '@ui/ShareUserSelect';
import SharesList from './SharesList';

export default function ShareDialog({ file, onShare, onGenerateLink, onClose }) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { hasPermission, roleCode } = usePermissions();
  const [shareType, setShareType] = useState('people');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [permission, setPermission] = useState('VIEW');
  const [expiryDays, setExpiryDays] = useState(null);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [sharesListKey, setSharesListKey] = useState(0);

  const isSuperAdmin = roleCode === ROLE_STRINGS.SUPER_ADMIN;
  const canShare = isSuperAdmin || hasPermission('drive.share');
  const canPublicLink = isSuperAdmin || hasPermission('drive.public-link');

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `shareDialogTourSeen_${lang}`;

  const buildTourSteps = useCallback(() => {
    const steps = [
      { target: '[data-tour="share-file-name"]', content: t('tour.share_file_name'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="share-tabs"]', content: t('tour.share_tabs'), disableBeacon: true, placement: 'bottom' },
    ];

    if (canShare) {
      steps.push(
        { target: '[data-tour="share-people-user-select"]', content: t('tour.share_people_user_select'), disableBeacon: true, placement: 'bottom', tab: 'people' },
        { target: '[data-tour="share-people-permission"]', content: t('tour.share_people_permission'), disableBeacon: true, placement: 'bottom', tab: 'people' },
        { target: '[data-tour="share-people-expiry"]', content: t('tour.share_people_expiry'), disableBeacon: true, placement: 'bottom', tab: 'people' },
        { target: '[data-tour="share-people-button"]', content: t('tour.share_people_button'), disableBeacon: true, placement: 'top', tab: 'people' },
        { target: '[data-tour="share-shares-list"]', content: t('tour.share_shares_list'), disableBeacon: true, placement: 'top', tab: 'people' },
        { target: '[data-tour="share-roles-select"]', content: t('tour.share_roles_select'), disableBeacon: true, placement: 'bottom', tab: 'roles' },
        { target: '[data-tour="share-roles-permission"]', content: t('tour.share_roles_permission'), disableBeacon: true, placement: 'bottom', tab: 'roles' },
        { target: '[data-tour="share-roles-expiry"]', content: t('tour.share_roles_expiry'), disableBeacon: true, placement: 'bottom', tab: 'roles' },
        { target: '[data-tour="share-roles-button"]', content: t('tour.share_roles_button'), disableBeacon: true, placement: 'top', tab: 'roles' },
        { target: '[data-tour="share-shares-list"]', content: t('tour.share_shares_list'), disableBeacon: true, placement: 'top', tab: 'roles' },
      );
    } else {
      steps.push(
        { target: '[data-tour="share-tabs"]', content: t('tour.share_people_hidden'), disableBeacon: true, placement: 'bottom' },
      );
    }

    if (canPublicLink) {
      steps.push(
        { target: '[data-tour="share-public-expiry"]', content: t('tour.share_public_expiry'), disableBeacon: true, placement: 'bottom', tab: 'public' },
        { target: '[data-tour="share-public-generate"]', content: t('tour.share_public_generate'), disableBeacon: true, placement: 'top', tab: 'public' },
        { target: '[data-tour="share-public-link"]', content: t('tour.share_public_link'), disableBeacon: true, placement: 'top', tab: 'public' },
      );
    } else {
      steps.push(
        { target: '[data-tour="share-tabs"]', content: t('tour.share_public_hidden'), disableBeacon: true, placement: 'bottom' },
      );
    }

    return steps;
  }, [t, canShare, canPublicLink]);

  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (steps.length === 0) return;
    setTourSteps(steps);
    setRunTour(true);
  }, [buildTourSteps]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!localStorage.getItem(tourSeenKey)) startTour();
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [tourSeenKey, startTour]);

  useEffect(() => {
    const handler = () => startTour();
    window.addEventListener('app:joyride', handler);
    window.addEventListener('app:help', handler);
    return () => {
      window.removeEventListener('app:joyride', handler);
      window.removeEventListener('app:help', handler);
    };
  }, [startTour]);

  const handleTourCallback = useCallback((data) => {
    const { status, action, index, step, lifecycle } = data || {};

    // Pre-switch tab for the upcoming step when navigating forward
    if (action === 'next') {
      const nextStep = tourSteps[index + 1];
      if (nextStep?.tab) {
        setShareType(nextStep.tab);
      }
    }

    // Pre-switch tab when navigating backward
    if (action === 'prev') {
      const prevStep = tourSteps[index - 1];
      if (prevStep?.tab) {
        setShareType(prevStep.tab);
      }
    }

    // Switch tab when tour starts on a tab step
    if (action === 'start' && step?.tab) {
      setShareType(step.tab);
    }

    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    }
  }, [tourSteps, tourSeenKey]);

  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleShareWithUser = async () => {
    if (selectedUserIds.length === 0 || !canShare) return;
    setLoading(true);
    setShareSuccess(false);
    try {
      const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null;
      for (const userId of selectedUserIds) {
        await onShare?.({
          fileId: file.id, subjectType: 'USER', subjectId: userId,
          permission, expiresAt,
        });
      }
      setShareSuccess(true);
      setSelectedUserIds([]);
      setExpiryDays(null);
      setSharesListKey((prev) => prev + 1);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithRole = async () => {
    if (selectedRoles.length === 0 || !canShare) return;
    setLoading(true);
    setShareSuccess(false);
    try {
      const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null;
      for (const roleCodeValue of selectedRoles) {
        await onShare?.({
          fileId: file.id, subjectType: 'ROLE', subjectId: roleCodeValue,
          permission, expiresAt,
        });
      }
      setShareSuccess(true);
      setSelectedRoles([]);
      setExpiryDays(null);
      setSharesListKey((prev) => prev + 1);
    } catch (error) {
      console.error('Share role error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePublicLink = async () => {
    if (!canPublicLink) return;
    setLoading(true);
    try {
      const result = await onGenerateLink?.(file.id, expiryDays);
      if (result?.token) {
        const token = result.token;
        const apiUrl = window.location.origin;
        setPublicLink(`${apiUrl}/public/links/${token}/download`);
      }
    } catch (error) {
      console.error('Generate link error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink);
  };

  if (!canShare && !canPublicLink) {
    return (
      <Modal isOpen={true} onClose={onClose} title={t('drive.shareFile')} size="large" zIndex={10001}>
        <Button variant="primary" fullWidth onClick={onClose}>
          {t('common.close')}
        </Button>
      </Modal>
    );
  }

  return (
    <>
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('drive.shareFile')}
      size="large"
      zIndex={10001}
      draggable={false}
      aria-describedby="share-dialog-description"
    >
      <div className="space-y-6">
        <div
          data-tour="share-file-name"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--background-secondary, #f9fafb)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border, #e5e7eb)',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text, #111827)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </p>
        </div>

        <div data-tour="share-tabs" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tabs
            tabs={[
              ...(canShare ? [
                { value: 'people', label: t('drive.people'), icon: getThemedIcon('ui', 'users', 16, 'light') },
                { value: 'roles', label: t('drive.roles'), icon: getThemedIcon('ui', 'shield', 16, 'light') },
              ] : []),
              ...(canPublicLink ? [
                { value: 'public', label: t('drive.publicLink'), icon: getThemedIcon('ui', 'link', 16, 'light') },
              ] : []),
            ]}
            activeTab={shareType}
            onTabChange={setShareType}
            variant="default"
            size="md"
          />
          <button
            data-tour="share-help-btn"
            onClick={startTour}
            title={t('tour.replay') || 'Start guided tour'}
            aria-label={t('tour.replay') || 'Start guided tour'}
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border, #e5e7eb)',
              background: 'var(--background-secondary, #f9fafb)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary, #800020)',
            }}
          >
            {getIconWithColor('ui', 'help', 18, 'currentColor')}
          </button>
        </div>

        <div style={{ minHeight: 'min(70vh, 600px)', overflowY: 'auto' }}>
          {shareType === 'people' && canShare && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {shareSuccess && (
                <div style={{ padding: '1rem', background: 'var(--color-success-bg, #ecfdf5)', border: '1px solid var(--color-success-border, #a7f3d0)', borderRadius: '0.75rem', color: 'var(--color-success-text, #065f46)' }} role="status" aria-live="polite">
                  {t('drive.shareSuccess')}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div data-tour="share-people-user-select">
                  <ShareUserSelect
                    value={selectedUserIds}
                    onChange={setSelectedUserIds}
                    multiple
                    disabled={loading}
                    excludeStudents
                  />
                </div>

                <div data-tour="share-people-permission">
                  <Select
                    options={[
                      { value: 'VIEW', label: t('drive.permission.view') },
                      { value: 'DOWNLOAD', label: t('drive.permission.download') },
                      { value: 'COMMENT', label: t('drive.permission.comment') },
                      { value: 'EDIT', label: t('drive.permission.edit') },
                    ]}
                    value={permission}
                    onChange={(e) => setPermission(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div data-tour="share-people-expiry">
                  <Select
                    options={[
                      { value: '', label: t('drive.noExpiry') },
                      { value: 1, label: `1 ${t('common.day')}` },
                      { value: 7, label: `7 ${t('common.days')}` },
                      { value: 30, label: `30 ${t('common.days')}` },
                      { value: 90, label: `90 ${t('common.days')}` },
                    ]}
                    value={expiryDays || ''}
                    onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value, 10) : null)}
                    disabled={loading}
                    placeholder={t('drive.selectExpiry')}
                  />
                </div>
              </div>

              <Button
                data-tour="share-people-button"
                onClick={handleShareWithUser}
                disabled={selectedUserIds.length === 0 || loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.sharing') : t('drive.share')}
              </Button>

              <div data-tour="share-shares-list" style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                <SharesList fileId={file.id} refreshKey={sharesListKey} />
              </div>
            </div>
          )}

          {shareType === 'roles' && canShare && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {shareSuccess && (
                <div style={{ padding: '1rem', background: 'var(--color-success-bg, #ecfdf5)', border: '1px solid var(--color-success-border, #a7f3d0)', borderRadius: '0.75rem', color: 'var(--color-success-text, #065f46)' }} role="status" aria-live="polite">
                  {t('drive.shareSuccess')}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div data-tour="share-roles-select">
                  <RoleMultiSelect
                    value={selectedRoles}
                    onChange={setSelectedRoles}
                    includeRoles={DRIVE_SHARE_ROLES}
                    placeholder={t('select_roles') || t('drive.selectRole')}
                    disabled={loading}
                  />
                </div>

                <div data-tour="share-roles-permission">
                  <Select
                    options={[
                      { value: 'VIEW', label: t('drive.permission.view') },
                      { value: 'DOWNLOAD', label: t('drive.permission.download') },
                      { value: 'COMMENT', label: t('drive.permission.comment') },
                      { value: 'EDIT', label: t('drive.permission.edit') },
                    ]}
                    value={permission}
                    onChange={(e) => setPermission(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div data-tour="share-roles-expiry">
                  <Select
                    options={[
                      { value: '', label: t('drive.noExpiry') },
                      { value: 1, label: `1 ${t('common.day')}` },
                      { value: 7, label: `7 ${t('common.days')}` },
                      { value: 30, label: `30 ${t('common.days')}` },
                      { value: 90, label: `90 ${t('common.days')}` },
                    ]}
                    value={expiryDays || ''}
                    onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value, 10) : null)}
                    disabled={loading}
                    placeholder={t('drive.selectExpiry')}
                  />
                </div>
              </div>

              <Button
                data-tour="share-roles-button"
                onClick={handleShareWithRole}
                disabled={selectedRoles.length === 0 || loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.sharing') : t('drive.shareWithRole')}
              </Button>

              <div data-tour="share-shares-list" style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                <SharesList fileId={file.id} refreshKey={sharesListKey} />
              </div>
            </div>
          )}

          {shareType === 'public' && canPublicLink && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div data-tour="share-public-expiry">
                <Select
                  options={[
                    { value: '', label: t('drive.noExpiry') },
                    { value: 1, label: `1 ${t('common.day')}` },
                    { value: 7, label: `7 ${t('common.days')}` },
                    { value: 30, label: `30 ${t('common.days')}` },
                    { value: 90, label: `90 ${t('common.days')}` },
                  ]}
                  value={expiryDays || ''}
                  onChange={(e) => {
                    setExpiryDays(e.target.value ? parseInt(e.target.value, 10) : null);
                    setPublicLink('');
                  }}
                  fullWidth
                  placeholder={t('drive.selectExpiry')}
                />
              </div>

              <Button
                data-tour="share-public-generate"
                onClick={handleGeneratePublicLink}
                disabled={loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.generating') : t('drive.generateLink')}
              </Button>

              {publicLink && (
                <div data-tour="share-public-link" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--background-secondary, #f9fafb)', borderRadius: '0.75rem', border: '1px solid var(--border, #e5e7eb)' }} role="status" aria-live="polite">
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted, #6b7280)', margin: '0 0 0.375rem 0' }}>
                      {t('drive.publicLinkGenerated')}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-family-mono)', color: 'var(--text, #111827)', wordBreak: 'break-all', margin: 0 }}>
                      {publicLink}
                    </p>
                  </div>
                  <Button variant="outline" onClick={copyToClipboard} fullWidth>
                    {t('common.copyLink')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
      <Joyride
        continuous
        run={runTour && tourSteps.length > 0}
        steps={tourSteps}
        callback={handleTourCallback}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        locale={{
          back: t('tour_back'),
          close: t('tour_close'),
          last: t('tour_finish'),
          next: t('tour_next'),
          skip: t('tour_skip'),
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #800020)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#111',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            zIndex: 10002,
          },
        }}
      />
    </>
  );
}
