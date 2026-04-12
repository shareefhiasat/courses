import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getAcademicTermOptions } from '@constants/academicTerms';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * TermSelect - standardized academic term dropdown
 * Uses academicTerms constants for consistent term options
 */
const TermSelect = ({
  value,
  onChange,
  label,
  placeholder,
  includeAll = false,
  allValue = 'all',
  allLabel,
  fullWidth = true,
  searchable = true,
  disabled = false,
  required = false,
  className = '',
  ...rest
}) => {
  const { t, lang } = useLang();

  // Get term options from constants
  const termOptions = getAcademicTermOptions(lang);
  
  // Build final options array
  const options = [];
  
  // Add "All" option if needed
  if (includeAll) {
    options.push({
      value: allValue,
      label: allLabel || (t('all_terms') || 'All Terms')
    });
  }
  
  // Add empty option for placeholder
  if (!required) {
    options.push({
      value: '',
      label: placeholder || (t('select_term') || 'Select Term')
    });
  }
  
  // Add term options
  options.push(...termOptions);

  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      fullWidth={fullWidth}
      searchable={searchable}
      disabled={disabled}
      required={required}
      className={className}
      placeholder={placeholder || (t('select_term') || 'Select Term')}
      {...rest}
    />
  );
};

TermSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  includeAll: PropTypes.bool,
  allValue: PropTypes.string,
  allLabel: PropTypes.string,
  fullWidth: PropTypes.bool,
  searchable: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
};

export default TermSelect;
