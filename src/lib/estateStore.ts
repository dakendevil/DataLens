import type { Asset, Relationship } from '@/types';
import { fetchAssets, fetchRelationships } from '@/lib/supabase';
import { assets as seedAssets, relationships as seedRelationships } from '@/data/estate';

// Cache populated from Supabase, with local seed fallback
let cachedAssets: Asset[] = [...seedAssets];
let cachedRelationships: Relationship[] = [...seedRelationships];
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export function getAssets(): Asset[] {
  return cachedAssets;
}

export function getRelationships(): Relationship[] {
  return cachedRelationships;
}

export function getAssetById(id: string): Asset | undefined {
  return cachedAssets.find((a) => a.id === id);
}

export function isLoaded(): boolean {
  return loaded;
}

export async function loadEstate(): Promise<void> {
  if (loaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const [assetsData, relationshipsData] = await Promise.all([
        fetchAssets(),
        fetchRelationships(),
      ]);
      if (assetsData.length > 0) {
        cachedAssets = assetsData;
        cachedRelationships = relationshipsData;
      }
    } catch {
      // Fall back to seed data if Supabase is unreachable
    }
    loaded = true;
  })();

  return loadingPromise;
}
