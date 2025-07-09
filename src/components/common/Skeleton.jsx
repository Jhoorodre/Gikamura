import React from 'react';
import './Skeleton.css';

/**
 * Skeleton component for loading states
 * Prevents content flickering and improves perceived performance
 */
export const Skeleton = ({ 
  width, 
  height, 
  className = '', 
  variant = 'rectangular',
  animation = 'pulse' 
}) => {
  const styles = {
    width: width || '100%',
    height: height || '20px'
  };

  return (
    <div 
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={styles}
      aria-label="Loading..."
    />
  );
};

// Pre-built skeleton components
export const SkeletonText = ({ lines = 3, width = '100%' }) => (
  <div className="skeleton-text">
    {[...Array(lines)].map((_, i) => (
      <Skeleton 
        key={i} 
        height="16px" 
        width={i === lines - 1 ? '60%' : width}
        className="skeleton-text-line"
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton height="200px" className="skeleton-card-image" />
    <div className="skeleton-card-content">
      <Skeleton height="24px" width="80%" className="skeleton-card-title" />
      <SkeletonText lines={2} />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="skeleton-grid">
    {[...Array(count)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonItemGrid = () => (
  <div className="skeleton-item-grid">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="skeleton-item">
        <Skeleton variant="rectangular" height="300px" className="skeleton-item-cover" />
        <Skeleton height="18px" width="90%" className="skeleton-item-title" />
        <Skeleton height="14px" width="60%" className="skeleton-item-meta" />
      </div>
    ))}
  </div>
);

export const SkeletonChapterList = () => (
  <div className="skeleton-chapter-list">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="skeleton-chapter">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="skeleton-chapter-info">
          <Skeleton height="20px" width="70%" />
          <Skeleton height="14px" width="40%" />
        </div>
      </div>
    ))}
  </div>
);
