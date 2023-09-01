import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';

import { useSelect, defaults } from './useSelect';

import styles from './Select.module.scss';

/**
 * @param {{
 *   items: any[];
 *   itemRenderer: (item: any, isActive: boolean) => React.Element;
 *   onItemClick(item: any[]): void;
 *   activeItemIndex: number;
 *   itemToId(item: any): string;
 * }} props
 * @returns {React.Element}
 */
const ItemList = ({ items, itemRenderer, onItemClick, activeItemIndex, itemToId }) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (activeItemIndex === -1) return;

    listRef.current && listRef.current.children[activeItemIndex].scrollIntoViewIfNeeded();
  }, [activeItemIndex]);

  return (
    <div ref={listRef} className={styles.itemList}>
      {items.map((item, i) => (
        <button
          key={itemToId(item)}
          className={classNames(styles.itemWrapper, activeItemIndex === i && styles.active)}
          type="button"
          onClick={() => onItemClick(item)}
        >
          {itemRenderer(item, activeItemIndex === i)}
        </button>
      ))}
    </div>
  );
};

/**
 *
 * @param {{
 *   activeItemIndex: number;
 *   filterStrategy: (searchQuery: boolean) => (item: any) => boolean;
 *   items: any[];
 *   itemRenderer?: (item: any, isActive: boolean) => React.Element;
 *   itemToId?: (item: any) => string
 *   itemToQuery?: (item: any) => string
 *   onChange?: (item: any | null) => void;
 * }} props
 * @returns {React.Element}
 */
export const Select = ({
  placeholder = '',
  items,
  itemRenderer = defaults.defaultItemRenderer,
  itemToId = defaults.defaultItemToId,
  filterStrategy = defaults.defaultFilterStrategy,
  itemToQuery = defaults.defaultItemToQuery,
  onChange,
}) => {
  const {
    handleFocus,
    handleKeyPress,
    handleSearchChange,
    searchQuery,
    shouldShowList,
    wrapperRef,
    inputRef,
    filteredItems,
    activeItemIndex,
    setSelectedItem,
  } = useSelect(items, filterStrategy, itemToQuery, onChange);

  return (
    <div ref={wrapperRef} className={classNames(styles.wrapper, shouldShowList && styles.open)}>
      <input
        placeholder={placeholder}
        ref={inputRef}
        onFocus={handleFocus}
        type="text"
        value={searchQuery}
        onKeyDown={handleKeyPress}
        onChange={handleSearchChange}
      />
      {shouldShowList && filteredItems.current.length !== 0 && (
        <ItemList
          items={filteredItems.current}
          itemRenderer={itemRenderer}
          activeItemIndex={activeItemIndex}
          onItemClick={setSelectedItem}
          itemToId={itemToId}
        />
      )}
    </div>
  );
};
