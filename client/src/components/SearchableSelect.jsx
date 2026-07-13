import React, { useState, useRef } from 'react';

export default function SearchableSelect({ value, onChange, options, placeholder = "🔍 Search...", noOptionsText = "No matching items", showSearch = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedItem = options.find(o => o.value === value);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  // Prevent key presses from leaking into background inputs when no search input is shown
  const handleDropdownKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    // Swallow all keypresses so they don't reach inputs behind the dropdown
    e.stopPropagation();
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(o => !o);
      if (!isOpen) setSearchQuery('');
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="searchable-select-wrapper" style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        ref={triggerRef}
      >
        <span>{selectedItem ? selectedItem.label : placeholder}</span>
        <span className="arrow">▼</span>
      </div>
      {isOpen && (
        <div className="custom-select-dropdown" onKeyDown={handleDropdownKeyDown}>
          {showSearch && (
            <input 
              type="text" 
              placeholder={placeholder} 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="select-search"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          )}
          <div className="custom-select-options">
            {filteredOptions.length === 0 ? (
              <div className="custom-select-option empty">{noOptionsText}</div>
            ) : (
              filteredOptions.map(o => (
                <div 
                  key={o.value} 
                  className={`custom-select-option ${o.value === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
