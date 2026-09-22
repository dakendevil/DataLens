import { assets, relationships } from '@/data/estate';
import type { Asset, AiOverview, ImpactResult } from '@/types';
import { calculateImpact, getAsset, getGraphStats } from '@/lib/graph';
import { generateAiOverview } from '@/lib/aiService';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const apiService = {
  async getAssets(): Promise<Asset[]> {
    await delay(300);
    return [...assets];
  },

  async getAsset(id: string): Promise<Asset | null> {
    await delay(200);
    return getAsset(id) ?? null;
  },

  async getRelationships() {
    await delay(300);
    return [...relationships];
  },

  async getLineage(id: string) {
    await delay(250);
    const asset = getAsset(id);
    if (!asset) return null;
    return {
      asset,
      upstream: relationships.filter((r) => r.target === id),
      downstream: relationships.filter((r) => r.source === id),
    };
  },

  async calculateImpact(assetId: string, _action?: string): Promise<ImpactResult> {
    await delay(600);
    return calculateImpact(assetId);
  },

  async getAnalytics() {
    await delay(300);
    const stats = getGraphStats();

    const byType: Record<string, number> = {};
    const byCriticality: Record<string, number> = {};
    const byLifecycle: Record<string, number> = {};
    const byModernization: Record<string, number> = {};
    const byRelationship: Record<string, number> = {};

    for (const a of assets) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      byCriticality[a.criticality] = (byCriticality[a.criticality] ?? 0) + 1;
      byLifecycle[a.lifecycle] = (byLifecycle[a.lifecycle] ?? 0) + 1;
      byModernization[a.modernizationStatus] = (byModernization[a.modernizationStatus] ?? 0) + 1;
    }
    for (const r of relationships) {
      byRelationship[r.relationshipType] = (byRelationship[r.relationshipType] ?? 0) + 1;
    }

    return {
      stats,
      byType,
      byCriticality,
      byLifecycle,
      byModernization,
      byRelationship,
    };
  },

  async getAiOverview(assetId: string): Promise<AiOverview> {
    await delay(800);
    const asset = getAsset(assetId);
    if (!asset) throw new Error('Asset not found');
    return generateAiOverview(asset);
  },
};
