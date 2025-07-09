import React from 'react';

/**
 * Performance utilities for React components
 */

// Comparação profunda para props de objetos
export const deepCompare = (prevProps, nextProps) => {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    const val1 = prevProps[key];
    const val2 = nextProps[key];
    
    const areObjects = isObject(val1) && isObject(val2);
    if (areObjects && !deepEqual(val1, val2) || !areObjects && val1 !== val2) {
      return false;
    }
  }
  
  return true;
};

const isObject = (obj) => obj != null && typeof obj === 'object';

const deepEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    if (val1 !== val2) return false;
  }
  
  return true;
};

// HOC para memoização com comparação customizada
export const withMemo = (Component, compareFunction = null) => {
  return React.memo(Component, compareFunction);
};

// Comparadores específicos
export const itemsCompare = (prev, next) => {
  return prev.items === next.items && 
         prev.loading === next.loading &&
         prev.error === next.error;
};

export const hubCompare = (prev, next) => {
  return prev.hubData === next.hubData &&
         prev.hubUrl === next.hubUrl &&
         prev.loading === next.loading;
};
