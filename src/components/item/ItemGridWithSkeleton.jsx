import React from 'react';
import ItemGrid from './ItemGrid';
import { SkeletonItemGrid } from '../common/Skeleton';

/**
 * ItemGrid with skeleton loading
 */
const ItemGridWithSkeleton = ({ items, loading, ...props }) => {
  if (loading) {
    return <SkeletonItemGrid />;
  }

  return <ItemGrid items={items} {...props} />;
};

export default ItemGridWithSkeleton;
