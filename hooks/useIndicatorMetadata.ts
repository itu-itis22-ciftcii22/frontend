import { useState, useCallback, useEffect } from 'react';
import { apiMetadataIndicatorsMetadataGet as fetchMetadata } from '../lib/api/generated';

/**
 * Fetches indicator metadata on mount and groups it into categories.
 * Replaces the duplicated `loadMeta` pattern across chart, strategies, and backtest pages.
 */
export function useIndicatorMetadata() {
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<Record<string, any[]>>({});

  const loadMeta = useCallback(async () => {
    try {
      const res = (await fetchMetadata()) as any;
      setMetadata(res || {});

      const cats: Record<string, any[]> = {};
      if (res) {
        for (const [name, info] of Object.entries<any>(res)) {
          const cat = info.category.toLowerCase();
          const catCap = cat.charAt(0).toUpperCase() + cat.slice(1);
          if (!cats[catCap]) cats[catCap] = [];
          cats[catCap].push({ name, ...info });
        }
      }
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load indicator metadata:', e);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  return { metadata, categories, reloadMetadata: loadMeta };
}
