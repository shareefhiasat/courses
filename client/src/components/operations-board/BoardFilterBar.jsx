import React, { useState, useCallback } from 'react';
import { Button } from '@/components/kibo/ui/button';
import { Badge } from '@/components/kibo/ui/badge';
import { Input } from '@/components/kibo/ui/input';
import { Label } from '@/components/kibo/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/kibo/ui/select';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { cn } from '@/lib/utils';

export default function BoardFilterBar({ filters, onFilterChange, mode }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  const handleFilterUpdate = useCallback(
    (key, value) => {
      const newFilters = { ...filters };
      if (value) {
        newFilters[key] = value;
      } else {
        delete newFilters[key];
      }
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  const handleClearAll = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  const activeFilterCount = Object.keys(filters).filter((k) => filters[k]).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Primary filter row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('operations_board_search')}
            value={filters.search || ''}
            onChange={(e) => handleFilterUpdate('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter toggle */}
        <Button
          variant={expanded ? 'default' : 'outline'}
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {t('operations_board_filters')}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground"
          >
            {t('operations_board_clear_filters')}
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(filters).map(([key, value]) =>
            value ? (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <span className="text-xs font-medium">{key}:</span>
                <span className="text-xs">{value}</span>
                <button
                  onClick={() => handleFilterUpdate(key, null)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null
          )}
        </div>
      )}

      {/* Expanded filter options */}
      {expanded && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
          {mode === 'workflow' && (
            <>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">{t('operations_board_status')}</Label>
                <Select value={filters.status || ''} onValueChange={(value) => handleFilterUpdate('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="UNDER_HR_REVIEW">In HR Review</SelectItem>
                    <SelectItem value="UNDER_ADMIN_REVIEW">In Admin Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Type</Label>
                <Select value={filters.workflowType || ''} onValueChange={(value) => handleFilterUpdate('workflowType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="ATTENDANCE_DAILY">Daily Attendance</SelectItem>
                    <SelectItem value="WEEKLY_SUMMARY">Weekly Summary</SelectItem>
                    <SelectItem value="GENERAL_HR">General HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {mode === 'attendance' && (
            <>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={filters.date || ''}
                  onChange={(e) => handleFilterUpdate('date', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs">{t('operations_board_class')}</Label>
                <Input
                  type="text"
                  placeholder={t('operations_board_class')}
                  value={filters.classId || ''}
                  onChange={(e) => handleFilterUpdate('classId', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-xs">{t('operations_board_program')}</Label>
            <Input
              type="text"
              placeholder={t('operations_board_program')}
              value={filters.programId || ''}
              onChange={(e) => handleFilterUpdate('programId', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs">{t('operations_board_subject')}</Label>
            <Input
              type="text"
              placeholder={t('operations_board_subject')}
              value={filters.subjectId || ''}
              onChange={(e) => handleFilterUpdate('subjectId', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
