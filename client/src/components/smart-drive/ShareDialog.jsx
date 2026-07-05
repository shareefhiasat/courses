import { useState, useEffect, useCallback, useMemo } from 'react';
import Joyride from 'react-joyride';
import { getModalJoyrideProps, modalTourStep } from '@utils/tourConfig';
import { useModalTour } from '@hooks/useModalTour';
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
  const tourSeenKey = `shareDialogTourSeen_${lang}`;

  const buildTourSteps = useCallback(() => {
    const steps = [
      modalTourStep('[data-tour="share-file-name"]', t('tour.share_file_name')),
      modalTourStep('[data-tour="share-tabs"]', t('tour.share_tabs')),
    ];

    if (canShare) {
      steps.push(
        modalTourStep('[data-tour="share-people-user-select"]', t('tour.share_people_user_select'), { tab: 'people' }),
        modalTourStep('[data-tour="share-people-permission"]', t('tour.share_people_permission'), { tab: 'people' }),
        modalTourStep('[data-tour="share-people-expiry"]', t('tour.share_people_expiry'), { tab: 'people' }),
        modalTourStep('[data-tour="share-people-button"]', t('tour.share_people_button'), { tab: 'people', placement: 'top' }),
        modalTourStep('[data-tour="share-shares-list"]', t('tour.share_shares_list'), { tab: 'people', placement: 'top' }),
        modalTourStep('[data-tour="share-roles-select"]', t('tour.share_roles_select'), { tab: 'roles' }),
        modalTourStep('[data-tour="share-roles-permission"]', t('tour.share_roles_permission'), { tab: 'roles' }),
        modalTourStep('[data-tour="share-roles-expiry"]', t('tour.share_roles_expiry'), { tab: 'roles' }),
        modalTourStep('[data-tour="share-roles-button"]', t('tour.share_roles_button'), { tab: 'roles', placement: 'top' }),
        modalTourStep('[data-tour="share-shares-list"]', t('tour.share_shares_list'), { tab: 'roles', placement: 'top' }),
      );
    } else {
      steps.push(modalTourStep('[data-tour="share-tabs"]', t('tour.share_people_hidden')));
    }

    if (canPublicLink) {
      steps.push(
        modalTourStep('[data-tour="share-public-expiry"]', t('tour.share_public_expiry'), { tab: 'public' }),
        modalTourStep('[data-tour="share-public-generate"]', t('tour.share_public_generate'), { tab: 'public', placement: 'top' }),
        modalTourStep('[data-tour="share-public-link"]', t('tour.share_public_link'), { tab: 'public', placement: 'top' }),
      );
    } else {
      steps.push(modalTourStep('[data-tour="share-tabs"]', t('tour.share_public_hidden')));
    }

    return steps;
  }, [t, canShare, canPublicLink]);

  const {
    run: runTour,
    stepIndex,
    steps: tourSteps,
    startTour,
    callback: handleTourCallback,
    TourTooltipComponent,
    tourActive,
  } = useModalTour({
    id: 'share-dialog',
    tourSeenKey,
    buildSteps: buildTourSteps,
    onStepPrepare: (step) => {
      if (step?.tab) setShareType(step.tab);
    },
  });
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
      tourActive={tourActive}
      draggable={!tourActive}
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
            title={t('tour.replay')}
            aria-label={t('tour.replay')}
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
                    placeholder={t('select_roles')}
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
        {...getModalJoyrideProps({ theme, t })}
        run={runTour}
        stepIndex={stepIndex}
        steps={tourSteps}
        callback={handleTourCallback}
        tooltipComponent={TourTooltipComponent}
      />
    </>
  );
}
