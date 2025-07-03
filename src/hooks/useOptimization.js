/**
 * Hook para otimizações de listas, queries e dependências
 * AIDEV-NOTE: Provides memoization, filtering, sorting and debug helpers
 */

import { useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Hook para detectar valor anterior
// AIDEV-NOTE: Used for debugging and dependency change tracking
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

// Hook para gerenciar queries de forma otimizada
// AIDEV-NOTE: Centraliza query optimization para react-query
export const useOptimizedQuery = (key, queryFn, options = {}) => {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });
};

// Hook para memoização de valores complexos
export const useMemoizedValue = (factory, deps) => {
  return useMemo(factory, deps);
};

// Hook para filtrar listas grandes de forma otimizada
export const useFilteredList = (items, searchTerm, filterFn) => {
  return useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    
    const lowerSearchTerm = searchTerm?.toLowerCase() || '';
    
    if (!lowerSearchTerm && !filterFn) return items;
    
    return items.filter(item => {
      // Filtro por termo de busca
      const matchesSearch = !lowerSearchTerm || 
        item.title?.toLowerCase().includes(lowerSearchTerm) ||
        item.subtitle?.toLowerCase().includes(lowerSearchTerm);
      
      // Filtro customizado
      const matchesCustomFilter = !filterFn || filterFn(item);
      
      return matchesSearch && matchesCustomFilter;
    });
  }, [items, searchTerm, filterFn]);
};

// Hook para ordenação otimizada
export const useSortedList = (items, sortBy, sortOrder = 'asc') => {
  return useMemo(() => {
    if (!items || !Array.isArray(items) || !sortBy) return items;
    
    return [...items].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? result : -result;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return sortOrder === 'asc' ? result : -result;
      }
      
      return 0;
    });
  }, [items, sortBy, sortOrder]);
};

// Hook para paginação simples
export const usePagination = (items, pageSize = 20) => {
  return useMemo(() => {
    if (!items || !Array.isArray(items)) return { pages: [], totalPages: 0 };
    
    const totalPages = Math.ceil(items.length / pageSize);
    const pages = [];
    
    for (let i = 0; i < totalPages; i++) {
      const start = i * pageSize;
      const end = start + pageSize;
      pages.push(items.slice(start, end));
    }
    
    return { pages, totalPages };
  }, [items, pageSize]);
};

// Hook para detectar mudanças de dependências (útil para debugging)
export const useDependencyChange = (deps, name = 'dependencies') => {
  const previous = usePrevious(deps);
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && previous) {
    const changes = deps.reduce((acc, dep, index) => {
      if (dep !== previous[index]) {
        acc.push({ index, old: previous[index], new: dep });
      }
      return acc;
    }, []);
    
    if (changes.length > 0) {
      console.warn(`${name} changed:`, changes);
    }
  }
};

// Hook para agrupar itens
export const useGroupedItems = (items, groupBy) => {
  return useMemo(() => {
    if (!items || !Array.isArray(items) || !groupBy) return {};
    
    return items.reduce((groups, item) => {
      const key = item[groupBy] || 'Outros';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }, [items, groupBy]);
};

// Re-export do usePrevious para facilitar uso
export { usePrevious, useDebounce, useThrottle } from './useUtils';
