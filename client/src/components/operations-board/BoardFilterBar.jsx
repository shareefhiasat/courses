import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { Button } from '@/components/kibo/ui/button';
import { Input } from '@/components/kibo/ui/input';
import { Label } from '@/components/kibo/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/kibo/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/kibo/ui/popover';
import {
  MiniCalendar,
  MiniCalendarNavigation,
  MiniCalendarDays,
  MiniCalendarDay,
} from '@/components/kibo-ui/mini-calendar';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { getAllPrograms, getProgramTerms } from '@services/business/attendanceWorkspaceService.js';
import { getClassesByProgram } from '@services/business/classService.js';
import { WORKFLOW_COLUMNS } from '@services/business/operationsBoardService.js';

const FILTER_KEYS = {
  status: 'operations_board_status',
  workflowType: 'operations_board_filter_type',
  programId: 'operations_board_program',
  subjectId: 'operations_board_subject',
  termId: 'operations_board_term',
  classId: 'operations_board_class',
  search: 'operations_board_search',
};

const HIDDEN_FILTER_KEYS = new Set(['classIds', 'workflowId']);

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function localizedName(entity, lang) {
  if (!entity) return '';
  if (lang === 'ar') return entity.nameAr || entity.nameEn || entity.code || entity.name || '';
  return entity.nameEn || entity.nameAr || entity.code || entity.name || '';
}

export default function BoardFilterBar({ filters, onFilterChange, lane }) {
  const { t, lang, isRTL } = useLang();
  const theme = useTheme();
  const [filterOpen, setFilterOpen] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [pendingFilter, setPendingFilter] = useState({ key: 'classId', value: '' });

  const selectedDate = filters.date ? new Date(filters.date) : new Date();

  useEffect(() => {
    getAllPrograms().then((r) => setPrograms(r.data || []));
  }, []);

  useEffect(() => {
    const programId = filters.programId;
    if (programId) {
      getProgramTerms(programId, { all: true }).then((r) => setTerms(r.data || []));
      getClassesByProgram(programId, { termId: filters.termId || undefined }).then((r) => {
        setClasses(r.data || []);
      });
    } else {
      setTerms([]);
      setClasses([]);
    }
  }, [filters.programId, filters.termId]);

  const handleFilterUpdate = useCallback(
    (key, value) => {
      const newFilters = { ...filters, date: filters.date || todayIso() };
      if (value) newFilters[key] = value;
      else delete newFilters[key];
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  const handleDateSelect = useCallback(
    (date) => {
      if (!date) return;
      handleFilterUpdate('date', date.toISOString().slice(0, 10));
    },
    [handleFilterUpdate]
  );

  const handleClearAll = useCallback(() => {
    const preserved = { date: filters.date || todayIso() };
    if (filters.programId) preserved.programId = filters.programId;
    if (filters.termId) preserved.termId = filters.termId;
    if (filters.classIds?.length) preserved.classIds = filters.classIds;
    onFilterChange(preserved);
  }, [filters, onFilterChange]);

  const handleAddFilter = useCallback(() => {
    if (pendingFilter.key && pendingFilter.value) {
      handleFilterUpdate(pendingFilter.key, pendingFilter.value);
      setPendingFilter({ key: 'classId', value: '' });
      setFilterOpen(false);
    }
  }, [pendingFilter, handleFilterUpdate]);

  const resolveFilterLabel = useCallback((key, value) => {
    if (key === 'programId') {
      const program = programs.find((p) => String(p.id) === String(value));
      return localizedName(program, lang) || value;
    }
    if (key === 'termId') {
      const term = terms.find((item) => String(item.id) === String(value));
      return localizedName(term, lang) || value;
    }
    if (key === 'classId') {
      const cls = classes.find((c) => String(c.id) === String(value));
      return localizedName(cls, lang) || value;
    }
    if (key === 'status') {
      const col = WORKFLOW_COLUMNS.find((c) => c.id === value);
      return col ? t(col.i18nKey) || col.name : value;
    }
    return value;
  }, [programs, terms, classes, lang, t]);

  const activeEntries = useMemo(
    () => Object.entries(filters).filter(([k, v]) => v && k !== 'date' && !HIDDEN_FILTER_KEYS.has(k)),
    [filters]
  );

  const removableEntries = activeEntries.filter(([k]) => !['programId', 'termId'].includes(k) || lane === 'status');

  return (
    <Box
      className="operations-board-filters"
      data-testid="operations-board-filters"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        p: 1.5,
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', lg: 'center' }}
        >
          <MiniCalendar
            value={selectedDate}
            onValueChange={handleDateSelect}
            days={5}
            data-testid="operations-board-mini-calendar"
          >
            <MiniCalendarNavigation direction="prev" />
            <MiniCalendarDays>
              {(date) => <MiniCalendarDay date={date} key={date.toISOString()} />}
            </MiniCalendarDays>
            <MiniCalendarNavigation direction="next" />
          </MiniCalendar>

          <Box sx={{ position: 'relative', flex: 1, minWidth: { xs: '100%', lg: 200 }, maxWidth: { lg: 360 } }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                [isRTL ? 'right' : 'left']: 12,
                color: theme.palette.text.secondary,
                pointerEvents: 'none',
              }}
            />
            <Input
              type="text"
              placeholder={t('operations_board_search')}
              value={filters.search || ''}
              onChange={(e) => handleFilterUpdate('search', e.target.value)}
              className={isRTL ? 'pr-9' : 'pl-9'}
              data-testid="operations-board-search"
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="operations-board-add-filter">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('operations_board_filters')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align={isRTL ? 'start' : 'end'}>
                <div className="flex flex-col gap-3">
                  <Label className="text-xs">{t('operations_board_filter_field')}</Label>
                  <Select
                    value={pendingFilter.key}
                    onValueChange={(v) => setPendingFilter((p) => ({ ...p, key: v, value: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classId">{t('operations_board_class')}</SelectItem>
                      <SelectItem value="programId">{t('operations_board_program')}</SelectItem>
                      <SelectItem value="termId">{t('operations_board_term')}</SelectItem>
                      {lane === 'status' && (
                        <>
                          <SelectItem value="status">{t('operations_board_status')}</SelectItem>
                          <SelectItem value="workflowType">{t('operations_board_filter_type')}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  {pendingFilter.key === 'programId' && (
                    <Select value={pendingFilter.value} onValueChange={(v) => setPendingFilter((p) => ({ ...p, value: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('operations_board_program')} /></SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {localizedName(p, lang)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {pendingFilter.key === 'termId' && (
                    <Select value={pendingFilter.value} onValueChange={(v) => setPendingFilter((p) => ({ ...p, value: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('operations_board_term')} /></SelectTrigger>
                      <SelectContent>
                        {terms.map((term) => (
                          <SelectItem key={term.id} value={String(term.id)}>
                            {localizedName(term, lang)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {pendingFilter.key === 'classId' && (
                    <Select value={pendingFilter.value} onValueChange={(v) => setPendingFilter((p) => ({ ...p, value: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('operations_board_select_class')} /></SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {localizedName(cls, lang)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {pendingFilter.key === 'status' && (
                    <Select value={pendingFilter.value} onValueChange={(v) => setPendingFilter((p) => ({ ...p, value: v }))}>
                      <SelectTrigger><SelectValue placeholder={t('operations_board_status')} /></SelectTrigger>
                      <SelectContent>
                        {WORKFLOW_COLUMNS.map((col) => (
                          <SelectItem key={col.id} value={col.id}>{t(col.i18nKey) || col.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {!['programId', 'termId', 'status', 'classId'].includes(pendingFilter.key) && (
                    <Input
                      value={pendingFilter.value}
                      onChange={(e) => setPendingFilter((p) => ({ ...p, value: e.target.value }))}
                      placeholder={t(FILTER_KEYS[pendingFilter.key] || pendingFilter.key)}
                    />
                  )}

                  <Button size="sm" onClick={handleAddFilter} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('operations_board_apply_filter')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {removableEntries.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} data-testid="operations-board-clear-filters">
                {t('operations_board_clear_filters')}
              </Button>
            )}
          </Stack>
        </Stack>

        {activeEntries.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {t('operations_board_active_filters')}:
            </Typography>
            {activeEntries.map(([key, value]) => {
              const canRemove = !HIDDEN_FILTER_KEYS.has(key)
                && (lane === 'status' || !['programId', 'termId'].includes(key));
              return (
                <Chip
                  key={key}
                  size="small"
                  label={`${t(FILTER_KEYS[key] || key)}: ${resolveFilterLabel(key, value)}`}
                  onDelete={canRemove ? () => handleFilterUpdate(key, null) : undefined}
                  variant="outlined"
                  data-testid={`operations-board-pill-${key}`}
                  sx={{ maxWidth: 280 }}
                />
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
