import React, { useEffect, useRef, useState } from 'react';

import styles from './Select.module.scss';

export function useSelect(items, filterStrategy, itemToQuery, onChange) {
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldShowList, setShouldShowList] = useState(false);
  const filteredItems = useRef(items);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (shouldShowList && wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShouldShowList(false);
      }
    };

    document.addEventListener('click', handleClick);

    return () => document.removeEventListener('click', handleClick);
  }, [shouldShowList]);

  const handleKeyPress = (ev) => {
    switch (ev.key) {
      case 'ArrowDown': {
        if (activeItemIndex < filteredItems.current.length - 1) {
          setActiveItemIndex((idx) => idx + 1);
        }
        break;
      }
      case 'ArrowUp': {
        if (activeItemIndex > -1) {
          setActiveItemIndex((idx) => idx - 1);
        }
        break;
      }
      case 'Enter': {
        if (activeItemIndex !== -1) {
          setSelectedItem(filteredItems.current[activeItemIndex]);
        }
        break;
      }
      default:
        return;
    }

    ev.preventDefault();
  };

  const setQuery = (newQuery) => {
    const filter = filterStrategy(newQuery);
    filteredItems.current = items.filter(filter);
    if (filteredItems.current.length === 1) {
      setActiveItemIndex(0);
    }
    setSearchQuery(newQuery);
    onChange(null);
  };

  const setSelectedItem = (item) => {
    setActiveItemIndex(-1);
    setQuery(itemToQuery(item));
    inputRef.current.blur();
    setShouldShowList(false);
    onChange(item);
  };

  const handleSearchChange = (ev) => {
    setActiveItemIndex(-1);
    setQuery(ev.target.value);
  };

  const handleFocus = (ev) => {
    ev.target.select();
    setShouldShowList(true);
  };

  return {
    handleSearchChange,
    handleFocus,
    handleKeyPress,
    setSelectedItem,
    searchQuery,
    shouldShowList,
    wrapperRef,
    inputRef,
    filteredItems,
    activeItemIndex,
  };
}

export const defaults = {
  defaultItemRenderer: (item, isActive) => (
    <div className={[styles.item, isActive && styles.active].filter(Boolean).join(' ')}>{item.label}</div>
  ),

  defaultItemToId: ({ id }) => id,

  defaultItemToQuery: ({ label }) => label,

  defaultFilterStrategy: (searchQuery) => {
    const normalizedSearchQuery = searchQuery.toLowerCase();

    return ({ label }) => label.toLowerCase().includes(normalizedSearchQuery);
  },
};
