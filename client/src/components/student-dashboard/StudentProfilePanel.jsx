import React, { memo, useState } from 'react';
import { User, Mail, Phone, IdCard, GraduationCap, FileImage, Hash } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import styles from './StudentProfilePanel.module.css';

const FieldRow = ({ icon: Icon, label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldIcon}>
        <Icon size={16} />
      </div>
      <div className={styles.fieldContent}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldValue}>{value}</span>
      </div>
    </div>
  );
};

const ImageField = ({ icon: Icon, label, src, alt }) => {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) return null;
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldIcon}>
        <Icon size={16} />
      </div>
      <div className={styles.fieldContent}>
        <span className={styles.fieldLabel}>{label}</span>
        <img
          src={src}
          alt={alt || label}
          className={styles.fieldImage}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    </div>
  );
};

const StudentProfilePanel = memo(({ student, t, lang }) => {
  const { theme } = useTheme();

  if (!student) return null;

  const displayName = student.displayName || student.name || '';
  const displayNameAr = student.displayNameAr || '';
  const studentNumber = student.studentNumber || '';
  const sequence = student.sequence || '';
  const phoneNumber = student.phoneNumber || '';
  const email = student.email || '';
  const profileImageUrl = student.profileImageUrl || null;
  const roles = student.roles || student.role || [];

  // Build proxy URLs for ID images (backend may return raw keys or proxy URLs)
  const keycloakId = student.keycloakId || student.docId || student.id || '';
  const toProxyUrl = (val, type) => {
    if (!val) return null;
    if (val.startsWith('http') || val.startsWith('/api/')) return val;
    return `/api/v1/user-images/proxy/${keycloakId}/${type}`;
  };
  const qidImageUrl = toProxyUrl(student.qidImageUrl, 'qid');
  const militaryIdImageUrl = toProxyUrl(student.militaryIdImageUrl, 'military');
  const additionalImageUrl = toProxyUrl(student.additionalImageUrl, 'additional');

  // Filter out Keycloak/system roles that aren't meaningful for display
  const SYSTEM_ROLES = new Set([
    'CREATE_REALM', 'DEFAULT_ROLES_MASTER', 'OFFLINE_ACCESS', 'UMA_AUTHORIZATION',
    'default-roles-master', 'offline_access', 'uma_authorization', 'create_realm',
  ]);

  const meaningfulRoles = Array.isArray(roles)
    ? roles.filter(r => !SYSTEM_ROLES.has(r))
    : typeof roles === 'string' && !SYSTEM_ROLES.has(roles) ? [roles] : [];

  const roleLabel = meaningfulRoles.length > 0
    ? meaningfulRoles.map(r => t(`roles.${r}`) || r).join(', ')
    : '';

  const summary = [
    displayName,
    studentNumber ? `#${studentNumber}` : '',
  ].filter(Boolean).join(' · ') || t('student_profile');

  return (
    <CollapsibleSection
      title={t('student_profile')}
      summary={summary}
      icon={User}
      defaultOpen={false}
      testId="student-profile-section"
      storageKey="student-profile-panel"
    >
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={displayName}
                className={styles.avatarImg}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {displayName
                  ? displayName.charAt(0).toUpperCase()
                  : <User size={32} />}
              </div>
            )}
          </div>
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{displayName}</span>
            {displayNameAr && displayNameAr !== displayName && (
              <span className={styles.headerNameAr}>{displayNameAr}</span>
            )}
            {roleLabel && (
              <span className={styles.headerRole}>{roleLabel}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldsGrid}>
          <FieldRow icon={IdCard} label={t('student_number')} value={studentNumber} />
          <FieldRow icon={Hash} label={t('sequence')} value={sequence || ''} />
          <FieldRow icon={Mail} label={t('email')} value={email} />
          <FieldRow icon={Phone} label={t('phone_number')} value={phoneNumber} />
          <ImageField icon={FileImage} label={t('qid_image')} src={qidImageUrl} alt={`${displayName} QID`} />
          <ImageField icon={FileImage} label={t('military_id_image')} src={militaryIdImageUrl} alt={`${displayName} Military ID`} />
          <ImageField icon={FileImage} label={t('additional_image')} src={additionalImageUrl} alt={`${displayName} Additional`} />
        </div>
      </div>
    </CollapsibleSection>
  );
});

StudentProfilePanel.displayName = 'StudentProfilePanel';
export default StudentProfilePanel;
