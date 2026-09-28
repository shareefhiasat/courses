import React, { memo, useState } from 'react';
import { User, Mail, Phone, IdCard, GraduationCap, FileImage, Hash, Award } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import { getLocalizedUserName } from '@utils/localizedUserName';
import styles from './StudentProfilePanel.module.css';

const FieldRow = ({ icon: Icon, label, value, alwaysShow = false, rtl = false }) => {
  if (!alwaysShow && !value && value !== 0) return null;
  return (
    <div className={`${styles.fieldRow} ${rtl ? styles.fieldRowRtl : ''}`}>
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

const ImageField = ({ icon: Icon, label, src, alt, rtl = false }) => {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) return null;
  return (
    <div className={`${styles.fieldRow} ${rtl ? styles.fieldRowRtl : ''}`}>
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
  const firstName = student.firstName || '';
  const lastName = student.lastName || '';
  const studentNumber = student.studentNumber || '';
  const sequence = student.sequence || '';
  const phoneNumber = student.phoneNumber || '';
  const email = student.email || '';
  const rawProfileImageUrl = student.profileImageUrl || null;
  const roles = student.roles || student.role || [];
  const rank = lang === 'ar' ? (student.rankAr || student.rankEn || '') : (student.rankEn || student.rankAr || '');

  // Build proxy URLs for ID images (backend may return raw keys or proxy URLs)
  const keycloakId = student.keycloakId || student.docId || student.id || '';
  const toProxyUrl = (val, type) => {
    if (!val) return null;
    if (val.startsWith('http') || val.startsWith('/api/')) return val;
    return `/api/v1/user-images/proxy/${keycloakId}/${type}`;
  };
  const profileImageUrl = toProxyUrl(rawProfileImageUrl, 'profile');
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

  const localizedName = getLocalizedUserName(student, lang, displayName);
  const summary = [
    localizedName,
    studentNumber ? `#${studentNumber}` : '',
  ].filter(Boolean).join(' · ') || t('student_profile');

  return (
    <CollapsibleSection
      title={t('student_profile')}
      summary={summary}
      icon={User}
      defaultOpen={false}
      testId="student-profile-section"
    >
      <div className={`${styles.profileContainer} ${lang === 'ar' ? styles.rtl : ''}`}>
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
            <span className={styles.headerName}>{localizedName}</span>
            {lang === 'ar' && displayName && displayName !== localizedName && (
              <span className={styles.headerNameAr}>{displayName}</span>
            )}
            {lang !== 'ar' && displayNameAr && displayNameAr !== localizedName && (
              <span className={styles.headerNameAr}>{displayNameAr}</span>
            )}
            {rank && (
              <span className={styles.headerRole}>{rank}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldsGrid}>
          <FieldRow icon={User} label={t('first_name')} value={firstName} rtl={lang === 'ar'} />
          <FieldRow icon={User} label={t('last_name')} value={lastName} rtl={lang === 'ar'} />
          <FieldRow icon={Award} label={t('military_rank')} value={rank} rtl={lang === 'ar'} />
          <FieldRow icon={IdCard} label={t('student_number')} value={studentNumber} rtl={lang === 'ar'} />
          <FieldRow icon={Hash} label={t('sequence')} value={sequence || ''} rtl={lang === 'ar'} />
          <FieldRow icon={Mail} label={t('email')} value={email} rtl={lang === 'ar'} />
          <FieldRow icon={Phone} label={t('phone_number')} value={phoneNumber} alwaysShow rtl={lang === 'ar'} />
          <ImageField icon={FileImage} label={t('qid_image')} src={qidImageUrl} alt={`${displayName} QID`} rtl={lang === 'ar'} />
          <ImageField icon={FileImage} label={t('military_id_image')} src={militaryIdImageUrl} alt={`${displayName} Military ID`} rtl={lang === 'ar'} />
          <ImageField icon={FileImage} label={t('additional_image')} src={additionalImageUrl} alt={`${displayName} Additional`} rtl={lang === 'ar'} />
        </div>
      </div>
    </CollapsibleSection>
  );
});

StudentProfilePanel.displayName = 'StudentProfilePanel';
export default StudentProfilePanel;
