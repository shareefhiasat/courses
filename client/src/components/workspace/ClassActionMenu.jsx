import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ControlledMenu,
  MenuItem,
  SubMenu,
  MenuDivider,
  MenuHeader,
} from '@szhsin/react-menu';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialTemplate,
  exportDailyOfficialForDate,
} from '@services/business/accessScopeExportService.js';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import useQRPermissions from '@hooks/useQRPermissions';
import styles from './classActionMenu.module.css';

function MenuRow({ icon, label, hint, iconClass }) {
  return (
    <span className={styles.menuItemContent}>
      <span className={iconClass}>{icon}</span>
      <span className={styles.menuItemLabel}>
        {label}
        {hint && <div className={styles.menuItemHint}>{hint}</div>}
      </span>
    </span>
  );
}

function ExportFilter({ value, onChange, placeholder }) {
  return (
    <div className={styles.filterWrap}>
      <input
        type="text"
        className={styles.filterInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        data-testid="class-action-export-filter"
      />
    </div>
  );
}

const ClassActionMenu = ({
  session,
  anchorPoint,
  isOpen,
  onClose,
  selectedDate,
  program,
  onOpenInbox,
  onOpenHistory,
}) => {
  const navigate = useNavigate();
  const { user, isHR, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { canExport, canSeeStandupMode } = useQRPermissions();
  const hrOnly = isHR && !isAdmin && !isSuperAdmin;

  const [exporting, setExporting] = useState(null);
  const [exportFilter, setExportFilter] = useState('');

  const cls = session?.class;
  const subject = cls?.subject;
  const dateStr = selectedDate
    ? selectedDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const classLabel = useMemo(() => {
    if (!cls) return '';
    return lang === 'ar' && cls.nameAr ? cls.nameAr : cls.nameEn || cls.code || '';
  }, [cls, lang]);

  const runExport = useCallback(async (key, fn) => {
    setExporting(key);
    try {
      await fn();
      onClose();
    } catch (err) {
      console.error('[ClassActionMenu] export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [onClose]);

  const exportItems = useMemo(() => {
    if (!canExport || !cls) return [];

    const items = [
      {
        id: 'weekly-pdf',
        group: 'schedule',
        groupLabel: t('weekly_schedule'),
        label: t('export_pdf'),
        format: EXPORT_FORMAT.PDF,
        icon: 'file_signature',
        colorClass: styles.exportGroupSchedule,
        action: () => exportWeeklyScheduleForScope({
          cls, program, subject, lang, t, user, format: EXPORT_FORMAT.PDF,
        }),
      },
      {
        id: 'weekly-excel',
        group: 'schedule',
        groupLabel: t('weekly_schedule'),
        label: t('export_excel'),
        format: EXPORT_FORMAT.EXCEL,
        icon: 'file_text',
        colorClass: styles.exportGroupSchedule,
        action: () => exportWeeklyScheduleForScope({
          cls, program, subject, lang, t, user, format: EXPORT_FORMAT.EXCEL,
        }),
      },
      {
        id: 'daily-pdf',
        group: 'daily',
        groupLabel: t('daily_official'),
        label: t('export_pdf'),
        hint: dateStr,
        format: EXPORT_FORMAT.PDF,
        icon: 'file_signature',
        colorClass: styles.exportGroupDaily,
        action: () => exportDailyOfficialForDate({
          cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.PDF,
        }),
      },
      {
        id: 'daily-excel',
        group: 'daily',
        groupLabel: t('daily_official'),
        label: t('export_excel'),
        hint: dateStr,
        format: EXPORT_FORMAT.EXCEL,
        icon: 'file_text',
        colorClass: styles.exportGroupDaily,
        action: () => exportDailyOfficialForDate({
          cls, program, subject, lang, user, date: dateStr, format: EXPORT_FORMAT.EXCEL,
        }),
      },
      {
        id: 'template-pdf',
        group: 'template',
        groupLabel: t('daily_official_template'),
        label: t('export_pdf'),
        format: EXPORT_FORMAT.PDF,
        icon: 'file_signature',
        colorClass: styles.exportGroupTemplate,
        action: () => exportDailyOfficialTemplate({
          cls, program, subject, lang, user, format: EXPORT_FORMAT.PDF,
        }),
      },
      {
        id: 'template-excel',
        group: 'template',
        groupLabel: t('daily_official_template'),
        label: t('export_excel'),
        format: EXPORT_FORMAT.EXCEL,
        icon: 'file_text',
        colorClass: styles.exportGroupTemplate,
        action: () => exportDailyOfficialTemplate({
          cls, program, subject, lang, user, format: EXPORT_FORMAT.EXCEL,
        }),
      },
    ];

    const q = exportFilter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => (
      item.label.toLowerCase().includes(q)
      || item.groupLabel.toLowerCase().includes(q)
      || (item.hint && item.hint.includes(q))
    ));
  }, [canExport, cls, program, subject, lang, t, user, dateStr, exportFilter]);

  const exportGroups = useMemo(() => {
    const groups = new Map();
    exportItems.forEach((item) => {
      if (!groups.has(item.group)) groups.set(item.group, { ...item, items: [] });
      groups.get(item.group).items.push(item);
    });
    return Array.from(groups.values());
  }, [exportItems]);

  const handleScan = useCallback((mode) => {
    if (!cls) return;
    const params = new URLSearchParams({
      classId: cls.id,
      classCode: cls.code || '',
      date: dateStr,
    });
    if (mode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      params.set('mode', ATTENDANCE_TYPE_CATEGORY.STANDUP);
    }
    navigate(`/qr-scanner?${params.toString()}`);
    onClose();
  }, [cls, dateStr, navigate, onClose]);

  const handleInbox = useCallback((tab) => {
    onOpenInbox?.(tab, cls?.id);
    onClose();
  }, [onOpenInbox, cls?.id, onClose]);

  const handleHistory = useCallback(() => {
    onOpenHistory?.(cls, selectedDate);
    onClose();
  }, [onOpenHistory, cls, selectedDate, onClose]);

  if (!session || !anchorPoint) return null;

  return (
    <ControlledMenu
      anchorPoint={anchorPoint}
      state={isOpen ? 'open' : 'closed'}
      onClose={onClose}
      portal
      transition
      menuClassName="classActionMenuRoot"
      direction={lang === 'ar' ? 'left' : 'right'}
      data-testid="class-action-menu"
    >
        <div className={styles.classTitle}>
          {classLabel}
        </div>

        {canExport && (
          <SubMenu
            label={(
              <MenuRow
                icon={getThemedIcon('ui', 'download', 18, isDark ? 'inverse' : 'primary')}
                label={t('export')}
              />
            )}
          >
            <ExportFilter
              value={exportFilter}
              onChange={setExportFilter}
              placeholder={t('workspace_export_filter')}
            />
            {exportGroups.length === 0 && (
              <MenuItem disabled>{t('no_results')}</MenuItem>
            )}
            {exportGroups.map((group, groupIndex) => (
              <React.Fragment key={group.group}>
                {groupIndex > 0 && <MenuDivider />}
                <MenuHeader>{group.groupLabel}</MenuHeader>
                {group.items.map((item) => (
                  <MenuItem
                    key={item.id}
                    disabled={exporting === item.id}
                    onClick={() => runExport(item.id, item.action)}
                    data-testid={`class-export-${item.id}`}
                  >
                    <MenuRow
                      icon={(
                        <span className={`${styles.exportGroupIcon} ${item.colorClass}`}>
                          {getThemedIcon('ui', item.icon, 14, 'currentColor')}
                        </span>
                      )}
                      label={item.label}
                      hint={item.hint}
                    />
                  </MenuItem>
                ))}
              </React.Fragment>
            ))}
          </SubMenu>
        )}

        <SubMenu
          label={(
            <MenuRow
              icon={getThemedIcon('ui', 'qr_code', 18, isDark ? 'inverse' : 'primary')}
              label={t('workspace_scan')}
            />
          )}
        >
          {hrOnly ? (
            <MenuItem onClick={() => handleScan(ATTENDANCE_TYPE_CATEGORY.REGULAR)} data-testid="class-scan-manual">
              <MenuRow
                icon={getThemedIcon('ui', 'edit', 18, 'currentColor')}
                iconClass={styles.scanAttendance}
                label={t('manual_input') || 'Manual'}
              />
            </MenuItem>
          ) : (
            <>
              <MenuItem onClick={() => handleScan(ATTENDANCE_TYPE_CATEGORY.REGULAR)} data-testid="class-scan-attendance">
                <MenuRow
                  icon={getThemedIcon('ui', 'check_circle', 18, 'currentColor')}
                  iconClass={styles.scanAttendance}
                  label={t('workspace_take_attendance')}
                />
              </MenuItem>
              {canSeeStandupMode && (
                <MenuItem onClick={() => handleScan(ATTENDANCE_TYPE_CATEGORY.STANDUP)} data-testid="class-scan-standup">
                  <MenuRow
                    icon={getThemedIcon('ui', 'users', 18, 'currentColor')}
                    iconClass={styles.scanStandup}
                    label={t('standup_attendance')}
                  />
                </MenuItem>
              )}
            </>
          )}
        </SubMenu>

        <SubMenu
          label={(
            <MenuRow
              icon={getThemedIcon('ui', 'mailbox', 18, isDark ? 'inverse' : 'primary')}
              label={t('inbox_outbox_button')}
            />
          )}
        >
          <MenuItem onClick={() => handleInbox('inbox')} data-testid="class-open-inbox">
            <MenuRow
              icon={getThemedIcon('ui', 'mailbox', 18, 'currentColor')}
              iconClass={styles.inboxIcon}
              label={t('inbox_tab')}
            />
          </MenuItem>
          <MenuItem onClick={() => handleInbox('outbox')} data-testid="class-open-outbox">
            <MenuRow
              icon={getThemedIcon('ui', 'send', 18, 'currentColor')}
              iconClass={styles.outboxIcon}
              label={t('outbox_tab')}
            />
          </MenuItem>
        </SubMenu>

        <MenuDivider />

        <MenuItem onClick={handleHistory} data-testid="class-open-history">
          <MenuRow
            icon={getThemedIcon('ui', 'history', 18, 'currentColor')}
            iconClass={styles.historyIcon}
            label={t('workspace_class_history')}
          />
        </MenuItem>
      </ControlledMenu>
  );
};

export default ClassActionMenu;
