import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string | number;
  className?: string;
  id?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  rootMargin = '300px',
  minHeight = '280px',
  className = '',
  id,
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, render immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={{ minHeight: !isIntersecting ? minHeight : undefined }}
    >
      {isIntersecting ? (
        children
      ) : (
        fallback || (
          <div
            className="w-full flex items-center justify-center p-8 text-center"
            style={{ minHeight }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          </div>
        )
      )}
    </div>
  );
};
