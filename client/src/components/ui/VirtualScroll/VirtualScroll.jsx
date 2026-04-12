import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Virtual scrolling component for large lists
 * Renders only visible items for optimal performance
 */

const VirtualScroll = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScrollEnd,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerSize.height) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerSize.height, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  // Total height of all items
  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);

    // Check if scrolled to bottom
    if (onScrollEnd && 
        newScrollTop + containerSize.height >= totalHeight - itemHeight * 2) {
      onScrollEnd();
    }
  }, [onScrollEnd, containerSize.height, totalHeight, itemHeight]);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Log performance metrics in development
  useEffect(() => {
    if (import.meta.env.DEV && items.length > 1000) {
      debug(`VirtualScroll: Rendering ${visibleItems.length} of ${items.length} items`);
    }
  }, [visibleItems.length, items.length]);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{ height: containerHeight, overflow: 'auto', position: 'relative' }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items */}
        {visibleItems.map((item, index) => {
          const actualIndex = visibleRange.startIndex + index;
          const translateY = actualIndex * itemHeight;
          
          return (
            <div
              key={typeof item === 'object' ? item.id || actualIndex : actualIndex}
              style={{
                position: 'absolute',
                top: translateY,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(VirtualScroll);
