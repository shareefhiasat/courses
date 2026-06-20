import { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { formatDateTime } from '@utils/dateUtils.js';
import { getUserDisplayName } from '@utils/userDisplayUtils.js';

/**
 * Resolve nested user object for audit display.
 * Model convention: creator/updater are objects; createdBy/updatedBy are int user IDs.
 */
function resolveAuditUser(row, objectField, idField, users) {
  const nested = row?.[objectField];
  if (nested && typeof nested === 'object') {
    return nested;
  }

  const userId = row?.[idField];
  if (userId != null && typeof userId !== 'object') {
    return userId;
  }

  return null;
}

/**
 * Standard MUI DataGrid audit columns (creator, createdAt, updater, updatedAt).
 *
 * @param {object} [options]
 * @param {Array} [options.users] - Optional users list to resolve createdBy/updatedBy int IDs when nested objects are absent
 * @param {boolean} [options.includeCreator=true]
 * @param {boolean} [options.includeCreatedAt=true]
 * @param {boolean} [options.includeUpdater=true]
 * @param {boolean} [options.includeUpdatedAt=true]
 * @param {object} [options.columnOverrides] - Per-field column overrides (creator, createdAt, updater, updatedAt)
 * @param {object} [options.emptyCreatedAtLabel] - Shown when createdAt is missing (default '—')
 * @param {object} [options.emptyUpdatedAtLabel] - Shown when updatedAt is missing (default '—')
 */
export function useAuditGridColumns(options = {}) {
  const { t, lang } = useLang();
  const {
    users = [],
    includeCreator = true,
    includeCreatedAt = true,
    includeUpdater = true,
    includeUpdatedAt = true,
    columnOverrides = {},
    emptyCreatedAtLabel,
    emptyUpdatedAtLabel,
  } = options;

  const createdAtEmpty = emptyCreatedAtLabel ?? '—';
  const updatedAtEmpty = emptyUpdatedAtLabel ?? '—';
  const userColWidth = lang === 'ar' ? 170 : 150;
  const dateColWidth = lang === 'ar' ? 150 : 130;
  const cellAlign = lang === 'ar' ? 'right' : 'left';

  return useMemo(() => {
    const columns = [];

    if (includeCreator) {
      columns.push({
        field: 'creator',
        headerName: t('created_by'),
        width: userColWidth,
        minWidth: userColWidth,
        align: cellAlign,
        headerAlign: cellAlign,
        ...columnOverrides.creator,
        renderCell: (params) => {
          const userRef = resolveAuditUser(params?.row, 'creator', 'createdBy', users);
          if (!userRef) return '—';
          return getUserDisplayName(userRef, users, lang);
        },
      });
    }

    if (includeCreatedAt) {
      columns.push({
        field: 'createdAt',
        headerName: t('created_at'),
        width: dateColWidth,
        minWidth: dateColWidth,
        align: cellAlign,
        headerAlign: cellAlign,
        ...columnOverrides.createdAt,
        renderCell: (params) => {
          const raw = params?.value ?? params?.row?.createdAt;
          return formatDateTime(raw, lang, createdAtEmpty);
        },
      });
    }

    if (includeUpdater) {
      columns.push({
        field: 'updater',
        headerName: t('updated_by'),
        width: userColWidth,
        minWidth: userColWidth,
        align: cellAlign,
        headerAlign: cellAlign,
        ...columnOverrides.updater,
        renderCell: (params) => {
          const userRef = resolveAuditUser(params?.row, 'updater', 'updatedBy', users);
          if (!userRef) return '—';
          return getUserDisplayName(userRef, users, lang);
        },
      });
    }

    if (includeUpdatedAt) {
      columns.push({
        field: 'updatedAt',
        headerName: t('updated_at'),
        width: dateColWidth,
        minWidth: dateColWidth,
        align: cellAlign,
        headerAlign: cellAlign,
        ...columnOverrides.updatedAt,
        renderCell: (params) => {
          const raw = params?.value ?? params?.row?.updatedAt;
          return formatDateTime(raw, lang, updatedAtEmpty);
        },
      });
    }

    return columns;
  }, [
    t,
    lang,
    users,
    includeCreator,
    includeCreatedAt,
    includeUpdater,
    includeUpdatedAt,
    columnOverrides,
    emptyCreatedAtLabel,
    emptyUpdatedAtLabel,
    createdAtEmpty,
    updatedAtEmpty,
    userColWidth,
    dateColWidth,
    cellAlign,
  ]);
}

export default useAuditGridColumns;
