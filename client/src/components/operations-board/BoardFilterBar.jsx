import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/kibo/ui/button';
import { Input } from '@/components/kibo/ui/input';
import { Label } from '@/components/kibo/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/kibo/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/kibo/ui/popover';
import { Pill, PillButton } from '@/components/kibo-ui/pill';
import {
  MiniCalendar,
  MiniCalendarNavigation,
  MiniCalendarDays,
  MiniCalendarDay,
} from '@/components/kibo-ui/mini-calendar';
import { Search, Plus, X } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { getAllPrograms, getProgramTerms } from '@services/business/attendanceWorkspaceService.js';
import { WORKFLOW_COLUMNS } from '@services/business/operationsBoardService.js';

const FILTER_LABELS = {
  status: 'operations_board_status',
  workflowType: 'Type',
  programId: 'operations_board_program',
  subjectId: 'operations_board_subject',
  termId: 'operations_board_term',
  classId: 'operations_board_class',
  search: 'operations_board_search',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function BoardFilterBar({ filters, onFilterChange, lane }) {
  const { t } = useLang();
  const [filterOpen, setFilterOpen] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [pendingFilter, setPendingFilter] = useState({ key: 'programId', value: '' });

  const selectedDate = filters.date ? new Date(filters.date) : new Date();

  useEffect(() => {
    getAllPrograms().then((r) => setPrograms(r.data || []));
  }, []);

  useEffect(() => {
    if (filters.programId) {
      getProgramTerms(filters.programId, { all: true }).then((r) => setTerms(r.data || []));
    } else {
      setTerms([]);
    }
  }, [filters.programId]);

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
    onFilterChange({ date: filters.date || todayIso() });
  }, [filters.date, onFilterChange]);

  const handleAddFilter = useCallback(() => {
    if (pendingFilter.key && pendingFilter.value) {
      handleFilterUpdate(pendingFilter.key, pendingFilter.value);
      setPendingFilter({ key: 'programId', value: '' });
      setFilterOpen(false);
    }
  }, [pendingFilter, handleFilterUpdate]);

  const activeEntries = Object.entries(filters).filter(([k, v]) => v && k !== 'date');

  return (
    <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-lg border border-border bg-background/95 p-3 backdrop-blur" data-testid="operations-board-filters">
      <div className="flex flex-wrap items-center gap-3">
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

        <div className="relative min-w-[12rem] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('operations_board_search')}
            value={filters.search || ''}
            onChange={(e) => handleFilterUpdate('search', e.target.value)}
            className="pl-9"
            data-testid="operations-board-search"
          />
        </div>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" data-testid="operations-board-add-filter">
              <Plus className="h-4 w-4" />
              {t('operations_board_filters')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="flex flex-col gap-3">
              <Label className="text-xs">{t('operations_board_filter_field') || 'Field'}</Label>
              <Select
                value={pendingFilter.key}
                onValueChange={(v) => setPendingFilter((p) => ({ ...p, key: v, value: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programId">{t('operations_board_program')}</SelectItem>
                  <SelectItem value="termId">{t('operations_board_term') || 'Term'}</SelectItem>
                  <SelectItem value="classId">{t('operations_board_class')}</SelectItem>
                  {lane === 'status' && (
                    <>
                      <SelectItem value="status">{t('operations_board_status')}</SelectItem>
                      <SelectItem value="workflowType">Type</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {pendingFilter.key === 'programId' && (
                <Select value={pendingFilter.value} onValueChange={(v) => setPendingFilter((p) => ({ ...p, value: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('operations_board_program')} /></SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nameEn || p.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {pendingFilter.key === 'termId' && (
                <Select value={pendingFilter.value} onValueChange={(v) => setPendingFilter((p) => ({ ...p, value: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('operations_board_term') || 'Term'} /></SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={String(term.id)}>{term.nameEn || term.code}</SelectItem>
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

              {!['programId', 'termId', 'status'].includes(pendingFilter.key) && (
                <Input
                  value={pendingFilter.value}
                  onChange={(e) => setPendingFilter((p) => ({ ...p, value: e.target.value }))}
                  placeholder={t(FILTER_LABELS[pendingFilter.key] || pendingFilter.key)}
                />
              )}

              <Button size="sm" onClick={handleAddFilter}>{t('operations_board_apply_filter') || 'Apply'}</Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeEntries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll} data-testid="operations-board-clear-filters">
            {t('operations_board_clear_filters')}
          </Button>
        )}
      </div>

      {activeEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeEntries.map(([key, value]) => (
            <Pill key={key} variant="secondary" className="gap-1" data-testid={`operations-board-pill-${key}`}>
              <span className="text-xs">{t(FILTER_LABELS[key] || key)}: {value}</span>
              <PillButton onClick={() => handleFilterUpdate(key, null)}>
                <X className="h-3 w-3" />
              </PillButton>
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}
