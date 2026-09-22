import type { Asset, ImpactResult, ImpactNode, Relationship } from '@/types';
import { getAssets, getRelationships, getAssetById } from '@/lib/estateStore';

function assetMap(): Map<string, Asset> {
  return new Map(getAssets().map((a) => [a.id, a]));
}

export function getAsset(id: string): Asset | undefined {
  return getAssetById(id);
}

export function getDownstreamEdges(id: string): Relationship[] {
  return getRelationships().filter((r) => r.source === id);
}

export function getUpstreamEdges(id: string): Relationship[] {
  return getRelationships().filter((r) => r.target === id);
}

export function getDirectDownstream(id: string): Asset[] {
  const am = assetMap();
  return getDownstreamEdges(id)
    .map((r) => am.get(r.target))
    .filter((a): a is Asset => !!a);
}

export function getDirectUpstream(id: string): Asset[] {
  const am = assetMap();
  return getUpstreamEdges(id)
    .map((r) => am.get(r.source))
    .filter((a): a is Asset => !!a);
}

interface TraversalEntry {
  assetId: string;
  hopDistance: number;
  path: string[];
  reason: string;
}

function traverseDownstream(startId: string): Map<string, TraversalEntry> {
  const visited = new Map<string, TraversalEntry>();
  const queue: TraversalEntry[] = [
    { assetId: startId, hopDistance: 0, path: [startId], reason: 'Selected asset' },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const edges = getDownstreamEdges(current.assetId);
    for (const edge of edges) {
      if (visited.has(edge.target)) continue;
      const entry: TraversalEntry = {
        assetId: edge.target,
        hopDistance: current.hopDistance + 1,
        path: [...current.path, edge.target],
        reason: `Depends on ${getAsset(current.assetId)?.name ?? current.assetId} via ${edge.relationshipType}`,
      };
      visited.set(edge.target, entry);
      queue.push(entry);
    }
  }
  visited.delete(startId);
  return visited;
}

function traverseUpstream(startId: string): Map<string, TraversalEntry> {
  const visited = new Map<string, TraversalEntry>();
  const queue: TraversalEntry[] = [
    { assetId: startId, hopDistance: 0, path: [startId], reason: 'Selected asset' },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const edges = getUpstreamEdges(current.assetId);
    for (const edge of edges) {
      if (visited.has(edge.source)) continue;
      const entry: TraversalEntry = {
        assetId: edge.source,
        hopDistance: current.hopDistance + 1,
        path: [...current.path, edge.source],
        reason: `Feeds ${getAsset(current.assetId)?.name ?? current.assetId} via ${edge.relationshipType}`,
      };
      visited.set(edge.source, entry);
      queue.push(entry);
    }
  }
  visited.delete(startId);
  return visited;
}

export function calculateImpact(assetId: string): ImpactResult {
  const downstream = traverseDownstream(assetId);
  const allNodes: ImpactNode[] = [];

  for (const [, entry] of downstream) {
    const asset = getAsset(entry.assetId);
    if (!asset) continue;
    allNodes.push({
      asset,
      hopDistance: entry.hopDistance,
      impactType: entry.hopDistance === 1 ? 'DIRECT' : 'INDIRECT',
      reason: entry.reason,
    });
  }

  allNodes.sort((a, b) => a.hopDistance - b.hopDistance);

  const directImpact = allNodes.filter((n) => n.impactType === 'DIRECT');
  const indirectImpact = allNodes.filter((n) => n.impactType === 'INDIRECT');

  const criticalAffected = allNodes.filter(
    (n) => n.asset.criticality === 'Critical' || n.asset.criticality === 'High'
  ).length;

  const teamsSet = new Set(allNodes.map((n) => n.asset.team));

  const selectedAsset = getAsset(assetId);
  const explanation = buildExplanation(
    selectedAsset,
    directImpact.length,
    indirectImpact.length,
    criticalAffected,
    teamsSet.size,
    allNodes
  );

  return {
    assetId,
    directImpact,
    indirectImpact,
    totalAffected: allNodes.length,
    criticalAffected,
    teamsImpacted: teamsSet.size,
    downstreamCount: directImpact.length,
    explanation,
  };
}

export function calculateUpstreamImpact(assetId: string) {
  const upstream = traverseUpstream(assetId);
  const nodes: ImpactNode[] = [];
  for (const [, entry] of upstream) {
    const asset = getAsset(entry.assetId);
    if (!asset) continue;
    nodes.push({
      asset,
      hopDistance: entry.hopDistance,
      impactType: entry.hopDistance === 1 ? 'DIRECT' : 'INDIRECT',
      reason: entry.reason,
    });
  }
  nodes.sort((a, b) => a.hopDistance - b.hopDistance);
  return nodes;
}

function buildExplanation(
  asset: Asset | undefined,
  direct: number,
  indirect: number,
  critical: number,
  teams: number,
  nodes: ImpactNode[]
): string {
  if (!asset) return 'Unable to generate explanation.';
  const criticalNames = nodes
    .filter((n) => n.asset.criticality === 'Critical')
    .slice(0, 3)
    .map((n) => n.asset.name);
  const critList = criticalNames.length > 0 ? ` Affected critical assets include: ${criticalNames.join(', ')}.` : '';
  return `Changing "${asset.name}" would directly impact ${direct} asset${direct !== 1 ? 's' : ''} and indirectly affect ${indirect} more through downstream dependency chains. ${critical} high-criticality asset${critical !== 1 ? 's' : ''} and ${teams} team${teams !== 1 ? 's' : ''} would be impacted.${critList} Recommend coordinating with downstream owners before proceeding.`;
}

export function getGraphStats() {
  const assets = getAssets();
  const relationships = getRelationships();
  const highConfidence = relationships.filter((r) => r.confidence >= 0.8).length;
  return {
    totalAssets: assets.length,
    totalRelationships: relationships.length,
    highConfidencePct: Math.round((highConfidence / relationships.length) * 100),
    systems: new Set(assets.filter((a) => a.type === 'Database').map((a) => a.name)).size,
    owners: new Set(assets.map((a) => a.owner)).size,
    highCriticality: assets.filter((a) => a.criticality === 'Critical').length,
  };
}

export function getMostConnectedAsset() {
  const relationships = getRelationships();
  const counts = new Map<string, number>();
  for (const r of relationships) {
    counts.set(r.source, (counts.get(r.source) ?? 0) + 1);
    counts.set(r.target, (counts.get(r.target) ?? 0) + 1);
  }
  let maxId = '';
  let maxCount = 0;
  for (const [id, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxId = id;
    }
  }
  return { asset: getAsset(maxId), connections: maxCount };
}

export function getConnectionsByType(): Record<string, number> {
  const relationships = getRelationships();
  const counts: Record<string, number> = {};
  for (const r of relationships) {
    counts[r.relationshipType] = (counts[r.relationshipType] ?? 0) + 1;
  }
  return counts;
}

export function getConnectionCount(assetId: string): number {
  const relationships = getRelationships();
  let count = 0;
  for (const r of relationships) {
    if (r.source === assetId || r.target === assetId) count++;
  }
  return count;
}
