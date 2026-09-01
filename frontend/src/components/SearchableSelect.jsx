import { useState, useRef, useEffect, useMemo } from 'react';
import Icon from './Icon';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = '-- Select Option --',
  id,
  name,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to uniform { value, label } items
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      if (opt && typeof opt === 'object') {
        const val = opt.value !== undefined ? opt.value : (opt.code !== undefined ? opt.code : opt.name);
        const lbl = opt.label !== undefined ? opt.label : (opt.name !== undefined ? opt.name : opt.value);
        return { value: val, label: lbl };
      }
      return { value: String(opt), label: String(opt) };
    });
  }, [options]);

  // Find label of active selected item
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = normalizedOptions.filter((opt) =>
    (opt.label || '').toLowerCase().includes(search.toLowerCase()) ||
    (opt.value || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`searchable-select-container ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ position: 'relative', width: '100%' }}
    >
      <button
        id={id}
        name={name}
        type="button"
        className={`searchable-select-trigger${isOpen ? ' open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
          {displayLabel}
        </span>
        <Icon name="chevronDown" className="chevron" />
      </button>

      {isOpen && (
        <div
          className="searchable-select-dropdown"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            bottom: 'auto',
            left: 0,
            right: 0,
            zIndex: 1050,
            maxHeight: '280px',
            overflowY: 'auto',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
          }}
        >
          <div className="searchable-select-search-wrapper" style={{ padding: '8px 10px' }}>
            <Icon name="search" className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Search or filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>

          <div className="searchable-select-options-list" style={{ maxHeight: '210px', overflowY: 'auto' }}>
            {placeholder && (
              <button
                type="button"
                className={`searchable-select-option${!value ? ' selected' : ''}`}
                onClick={() => handleSelect('')}
                role="option"
                aria-selected={!value}
                style={{ fontSize: 13 }}
              >
                <span>{placeholder}</span>
                {!value && <Icon name="check" className="check-icon" />}
              </button>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(value) === String(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`searchable-select-option${isSelected ? ' selected' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Icon name="check" className="check-icon" />}
                  </button>
                );
              })
            ) : (
              <div className="searchable-select-no-results" style={{ padding: 12, fontSize: 12.5, textAlign: 'center', color: 'var(--text-muted)' }}>
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

