import React from 'react';
import Select from '../Select/Select';

/**
 * YearSelect - standardized year dropdown
 * - default range: 2024 .. 2029 (5 years ahead)
 * - props: value, onChange, startYear=2024, yearsAhead=5, label='Year', placeholder='Year', fullWidth, searchable
 */
const YearSelect = ({
  value,
  onChange,
  startYear = 2024,
  yearsAhead = 5,
  label = 'Year',
  placeholder = 'Year',
  includeAll = false,
  allValue = 'all',
  allLabel = 'All Years',
  fullWidth = true,
  searchable = true,
  ...rest
}) => {
  const end = Number(startYear) + Number(yearsAhead);
  const options = [];
  if (includeAll) options.push({ value: allValue, label: allLabel });
  options.push({ value: '', label: placeholder });
  for (let y = Number(startYear); y <= end; y++) {
    options.push({ value: String(y), label: String(y) });
  }

  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      fullWidth={fullWidth}
      searchable={searchable}
      {...rest}
    />
  );
};

export default YearSelect;
