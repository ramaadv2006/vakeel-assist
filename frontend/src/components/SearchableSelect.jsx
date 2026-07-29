import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

export default function SearchableSelect({ options, value, onChange, placeholder = '-- Select Type --' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
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
    <div className="searchable-select-container" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={`searchable-select-trigger${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{value || placeholder}</span>
        <Icon name="chevronDown" className="chevron" />
      </button>

      {isOpen && (
        <div className="searchable-select-dropdown" role="listbox">
          <div className="searchable-select-search-wrapper">
            <Icon name="search" className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="searchable-select-options-list">
            {placeholder && (
              <button
                type="button"
                className={`searchable-select-option${!value ? ' selected' : ''}`}
                onClick={() => handleSelect('')}
                role="option"
                aria-selected={!value}
              >
                <span>{placeholder}</span>
                {!value && <Icon name="check" className="check-icon" />}
              </button>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`searchable-select-option${value === option ? ' selected' : ''}`}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={value === option}
                >
                  <span>{option}</span>
                  {value === option && <Icon name="check" className="check-icon" />}
                </button>
              ))
            ) : (
              <div className="searchable-select-no-results">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
