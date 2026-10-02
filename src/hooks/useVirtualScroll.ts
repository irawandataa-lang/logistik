import { useState, useEffect, useMemo, useRef, UIEvent } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  overscan = 5,
}: UseVirtualScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateHeight = () => {
      setViewportHeight(el.clientHeight || 600);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = itemCount * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(itemCount, startIndex + visibleCount);
    const offsetY = startIndex * itemHeight;

    return {
      startIndex,
      endIndex,
      totalHeight,
      offsetY,
    };
  }, [itemCount, itemHeight, scrollTop, viewportHeight, overscan]);

  return {
    containerRef,
    onScroll,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  };
}
