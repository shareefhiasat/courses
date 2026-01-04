import React, { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../Button/Button';
import styles from './DateRangePicker.module.css';

/**
 * Shadcn-style DateRangePicker Component
 * Clean, beautiful date range picker with proper calendar grid
 */
const DateRangePicker = ({
  fromDate,
  toDate,
  onChange,
  label,
  placeholderFrom = 'From Date',
  placeholderTo = 'To Date',
  error,
  helperText,
  disabled = false,
  required = false,
  min,
  max,
  fullWidth = false,
  className = '',
  clearable = true,
  numberOfMonths = 2,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  
  // Helper to parse date string
  const parseDate = (dateStr) => {
    if (!dateStr) return undefined;
    if (typeof dateStr === 'string') {
      const isoDate = parseISO(dateStr);
      if (isValid(isoDate)) return isoDate;
      const date = new Date(dateStr);
      return isValid(date) ? date : undefined;
    }
    return dateStr instanceof Date && isValid(dateStr) ? dateStr : undefined;
  };

  const [selectedRange, setSelectedRange] = useState({
    from: parseDate(fromDate),
    to: parseDate(toDate),
  });

  // Sync with external props
  useEffect(() => {
    const newFrom = parseDate(fromDate);
    const newTo = parseDate(toDate);
    setSelectedRange(prev => {
      if (newFrom?.getTime() !== prev.from?.getTime() || 
          newTo?.getTime() !== prev.to?.getTime()) {
        return { from: newFrom, to: newTo };
      }
      return prev;
    });
  }, [fromDate, toDate]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) && 
          !event.target.closest(`.${styles.trigger}`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (range) => {
    if (!range) {
      setSelectedRange({ from: undefined, to: undefined });
      if (onChange) {
        onChange({ fromDate: '', toDate: '' });
      }
      return;
    }

    const newRange = {
      from: range.from,
      to: range.to,
    };
    setSelectedRange(newRange);

    if (onChange) {
      onChange({
        fromDate: newRange.from ? format(newRange.from, 'yyyy-MM-dd') : '',
        toDate: newRange.to ? format(newRange.to, 'yyyy-MM-dd') : '',
      });
    }
  };

  const handleClear = () => {
    setSelectedRange({ from: undefined, to: undefined });
    if (onChange) {
      onChange({ fromDate: '', toDate: '' });
    }
  };

  const displayText = () => {
    if (selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, 'MMM dd, yyyy')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`;
    }
    if (selectedRange.from) {
      return `${format(selectedRange.from, 'MMM dd, yyyy')} - ${placeholderTo}`;
    }
    return `${placeholderFrom} - ${placeholderTo}`;
  };

  const wrapperClasses = [
    styles.wrapper,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const hasValue = selectedRange.from || selectedRange.to;

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputContainer}>
        <button
          type="button"
          className={`${styles.trigger} ${isOpen ? styles.open : ''} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <Calendar size={18} className={styles.calendarIcon} />
          <span className={styles.triggerText} data-empty={!hasValue}>
            {displayText()}
          </span>
          {clearable && hasValue && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              disabled={disabled}
              aria-label="Clear dates"
            >
              <X size={14} />
            </button>
          )}
        </button>

        {isOpen && (
          <>
            <div className={styles.overlay} onClick={() => setIsOpen(false)} />
            <div className={styles.popover} ref={popoverRef}>
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={handleSelect}
                numberOfMonths={numberOfMonths}
                disabled={disabled}
                minDate={min ? new Date(min) : undefined}
                maxDate={max ? new Date(max) : undefined}
                className={styles.calendar}
                components={{
                  IconLeft: ({ ...props }) => <ChevronLeft size={16} {...props} />,
                  IconRight: ({ ...props }) => <ChevronRight size={16} {...props} />,
                }}
                classNames={{
                  months: styles.months,
                  month: styles.month,
                  caption: styles.caption,
                  caption_label: styles.captionLabel,
                  nav: styles.nav,
                  nav_button: styles.navButton,
                  nav_button_previous: styles.navButtonPrevious,
                  nav_button_next: styles.navButtonNext,
                  table: styles.table,
                  head_row: styles.headRow,
                  head_cell: styles.headCell,
                  row: styles.row,
                  cell: styles.cell,
                  day: styles.day,
                  day_range_start: styles.dayRangeStart,
                  day_range_end: styles.dayRangeEnd,
                  day_selected: styles.daySelected,
                  day_today: styles.dayToday,
                  day_outside: styles.dayOutside,
                  day_disabled: styles.dayDisabled,
                  day_range_middle: styles.dayRangeMiddle,
                  day_hidden: styles.dayHidden,
                }}
              />
              <div className={styles.footer}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
                {clearable && hasValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};

export default DateRangePicker;
