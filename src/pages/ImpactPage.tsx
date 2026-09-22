import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
  Position,
  Handle,
} from '@xyflow/react';
import { Zap, AlertTriangle, Users, GitBranch, Target, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { AssetTypeIcon } from '@/components/ui/AssetTypeIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { getAssets as assets, getRelationships as relationships } from '@/lib/estateStore';
import { calculateImpact, calculateUpstreamImpact, getDownstreamEdges, getUpstreamEdges } from '@/lib/graph';
import { apiService } from '@/services/api';
import { generateAiOverview } from '@/lib/aiService';
import type { ImpactResult, Asset, AiOverview } from '@/types';
import { clsx } from 'clsx';

const assetMap = new Map(assets.map((a) => [a.id, a]));
const actions = ['Change', 'Migrate', 'Delete', 'Retire', 'Modify Schema'] as const;

export function ImpactPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedAssetId, setSelectedAssetId] = useState('customer_cleaning_etl');
  const [action, setAction] = useState<string>('Change');
  const [direction, setDirection] = useState<'downstream' | 'upstream'>('downstream');
  const [impact, setImpact] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiOverview, setAiOverview] = useState<AiOverview | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const assetParam = searchParams.get('asset');
    if (assetParam) setSelectedAssetId(assetParam);
  }, [searchParams]);

  function runSimulation() {
    setLoading(true);
    setImpact(null);
    setAiOverview(null);
    apiService.calculateImpact(selectedAssetId, action).then((result) => {
      setImpact(result);
      setLoading(false);
      showToast('success', `Impact simulated: ${result.totalAffected} assets affected`);
    });
  }

  function generateAi() {
    const asset = assetMap.get(selectedAssetId);
    if (!asset) return;
    setAiLoading(true);
    setAiOverview(null);
    apiService.getAiOverview(selectedAssetId).then((overview) => {
      setAiOverview(overview);
      setAiLoading(false);
    });
  }

  const selectedAsset = assetMap.get(selectedAssetId);

  const upstreamImpact = useMemo(() => {
    if (!impact || direction !== 'upstream') return null;
    return calculateUpstreamImpact(selectedAssetId);
  }, [impact, direction, selectedAssetId]);

  // Blast radius graph nodes/edges
  const { graphNodes, graphEdges } = useMemo(() => {
    if (!impact) return { graphNodes: [] as Node[], graphEdges: [] as Edge[] };
    const affectedIds = new Set([selectedAssetId, ...impact.directImpact.map((n) => n.asset.id), ...impact.indirectImpact.map((n) => n.asset.id)]);
    const directIds = new Set(impact.directImpact.map((n) => n.asset.id));
    const indirectIds = new Set(impact.indirectImpact.map((n) => n.asset.id));

    // Build subgraph from affected edges
    const relevantEdges = relationships.filter((r) => affectedIds.has(r.source) && affectedIds.has(r.target));
    const connectedIds = new Set<string>();
    relevantEdges.forEach((r) => { connectedIds.add(r.source); connectedIds.add(r.target); });

    const nodes: Node[] = assets
      .filter((a) => connectedIds.has(a.id))
      .map((asset) => {
        let x = 0;
        let y = 0;
        if (asset.id === selectedAssetId) {
          x = 0; y = 0;
        } else if (directIds.has(asset.id)) {
          x = 300;
          const idx = impact.directImpact.findIndex((n) => n.asset.id === asset.id);
          y = idx * 90 - (impact.directImpact.length - 1) * 45;
        } else if (indirectIds.has(asset.id)) {
          x = 600;
          const idx = impact.indirectImpact.findIndex((n) => n.asset.id === asset.id);
          y = idx * 80 - (impact.indirectImpact.length - 1) * 40;
        }
        return {
          id: asset.id,
          type: 'impact',
          position: { x, y },
          data: {
            asset,
            isSource: asset.id === selectedAssetId,
            isDirect: directIds.has(asset.id),
            isIndirect: indirectIds.has(asset.id),
          },
        };
      });

    const edges: Edge[] = relevantEdges.map((r) => ({
      id: r.id,
      source: r.source,
      target: r.target,
      style: { stroke: r.confidence >= 0.8 ? '#dc2626' : '#f97316', strokeWidth: 2 },
      animated: true,
    }));

    return { graphNodes: nodes, graphEdges: edges };
  }, [impact, selectedAssetId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Impact Simulator</h1>
        <p className="mt-1 text-sm text-zinc-400">Know the blast radius before you touch anything.</p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Select Asset</label>
            <select
              value={selectedAssetId}
              onChange={(e) => { setSelectedAssetId(e.target.value); setSearchParams({ asset: e.target.value }); setImpact(null); setAiOverview(null); }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-red-500 focus:outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-red-500 focus:outline-none"
            >
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Direction</label>
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              <button
                onClick={() => setDirection('downstream')}
                className={clsx('flex-1 px-3 py-2 text-xs font-medium transition-colors', direction === 'downstream' ? 'bg-red-600/20 text-red-400' : 'text-zinc-400 hover:text-zinc-200')}
              >
                Downstream
              </button>
              <button
                onClick={() => setDirection('upstream')}
                className={clsx('flex-1 px-3 py-2 text-xs font-medium transition-colors', direction === 'upstream' ? 'bg-red-600/20 text-red-400' : 'text-zinc-400 hover:text-zinc-200')}
              >
                Upstream
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={runSimulation} disabled={loading}>
              <Zap className="h-4 w-4" />
              {loading ? 'Simulating...' : 'Simulate Impact'}
            </Button>
          </div>
        </div>
        {selectedAsset && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500">Selected:</span>
            <span className="font-semibold text-zinc-200">{selectedAsset.name}</span>
            <Badge variant={selectedAsset.type} label={selectedAsset.type} />
            <Badge variant={selectedAsset.criticality} label={selectedAsset.criticality} />
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : impact ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Assets Affected" value={impact.totalAffected} icon={Target} accent="crimson" />
            <KpiCard label="Critical Assets" value={impact.criticalAffected} icon={AlertTriangle} accent="orange" />
            <KpiCard label="Downstream Deps" value={impact.downstreamCount} icon={GitBranch} accent="sky" />
            <KpiCard label="Teams Impacted" value={impact.teamsImpacted} icon={Users} accent="violet" />
          </div>

          {/* Explanation */}
          <div className="rounded-xl border border-red-600/20 bg-red-600/5 p-5">
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Impact Analysis</h3>
                <p className="mt-1 text-sm text-zinc-400">{impact.explanation}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Blast radius graph */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-200">Blast Radius Graph</h3>
                <div className="h-[400px] overflow-hidden rounded-lg border border-zinc-800 bg-[#0d0e13]">
                  <ReactFlow
                    nodes={graphNodes}
                    edges={graphEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable
                  >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2028" />
                    <Controls className="!border-zinc-800 !bg-zinc-900" />
                  </ReactFlow>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-red-500 bg-red-500/20" /> Selected Asset</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-orange-500 bg-orange-500/20" /> Direct Impact</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-yellow-500 bg-yellow-500/20" /> Indirect Impact</div>
                </div>
              </div>
            </div>

            {/* Affected list */}
            <div className="space-y-4">
              <ImpactList title="Direct Impact" items={impact.directImpact} accent="orange" />
              {impact.indirectImpact.length > 0 && (
                <ImpactList title="Indirect Impact" items={impact.indirectImpact} accent="yellow" />
              )}
              {direction === 'upstream' && upstreamImpact && upstreamImpact.length > 0 && (
                <ImpactList title="Upstream Impact" items={upstreamImpact} accent="sky" />
              )}
            </div>
          </div>

          {/* AI Overview */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">AI Impact Explanation</h3>
              <Button variant="primary" size="sm" onClick={generateAi} disabled={aiLoading}>
                {aiLoading ? 'Generating...' : 'Generate AI Overview'}
              </Button>
            </div>
            {aiOverview && (
              <div className="mt-4 rounded-lg border border-violet-600/20 bg-violet-600/5 p-4 animate-slide-up">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-600/15 px-2.5 py-0.5 text-xs text-violet-400">
                  AI-generated insight
                </div>
                <div className="space-y-3 text-sm text-zinc-400">
                  <div><p className="font-medium text-zinc-300">What it is</p><p className="mt-0.5">{aiOverview.whatItIs}</p></div>
                  <div><p className="font-medium text-zinc-300">Risk</p><p className="mt-0.5">{aiOverview.risk}</p></div>
                  <div><p className="font-medium text-zinc-300">Recommended Next Steps</p>
                    <ul className="mt-1 space-y-1">
                      {aiOverview.nextSteps.map((s, i) => <li key={i} className="flex gap-2"><span className="text-violet-400">→</span> {s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <Zap className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-300">Select an asset and run simulation</h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">Choose an asset, select an action, and click Simulate Impact to see the blast radius.</p>
        </div>
      )}
    </div>
  );
}

function ImpactList({ title, items, accent }: { title: string; items: { asset: Asset; hopDistance: number; impactType: string; reason: string }[]; accent: string }) {
  const accentBorder = {
    orange: 'border-orange-600/20',
    yellow: 'border-yellow-600/20',
    sky: 'border-sky-600/20',
  }[accent] ?? 'border-zinc-800';

  return (
    <div className={clsx('rounded-xl border bg-zinc-900/50 p-4', accentBorder)}>
      <h4 className="mb-3 text-sm font-semibold text-zinc-200">{title} ({items.length})</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.asset.id} className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AssetTypeIcon type={item.asset.type} className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-200">{item.asset.name}</span>
              </div>
              <span className="text-xs text-zinc-500">{item.hopDistance} hop{item.hopDistance !== 1 ? 's' : ''}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={item.asset.criticality} label={item.asset.criticality} />
              <Badge variant={item.asset.sensitivity} label={item.asset.sensitivity} />
              <span className="text-xs text-zinc-500">· {item.asset.owner}</span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-600">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Impact node component for React Flow
function ImpactNode({ data }: { data: { asset: Asset; isSource?: boolean; isDirect?: boolean; isIndirect?: boolean } }) {
  const { asset, isSource, isDirect, isIndirect } = data;
  const borderColor = isSource ? '#dc2626' : isDirect ? '#f97316' : isIndirect ? '#eab308' : '#52525b';
  const bgColor = isSource ? 'rgba(220,38,38,0.15)' : isDirect ? 'rgba(249,115,22,0.1)' : isIndirect ? 'rgba(234,179,8,0.1)' : 'rgba(24,27,35,0.9)';

  return (
    <div
      className="rounded-lg border-2 px-3 py-2 shadow-lg"
      style={{ borderColor, background: bgColor, minWidth: 140 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: borderColor, width: 6, height: 6 }} />
      <div className="flex items-center gap-2">
        <AssetTypeIcon type={asset.type} className="h-3.5 w-3.5" style={{ color: borderColor }} />
        <span className="text-xs font-semibold text-zinc-100 truncate">{asset.name}</span>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-[10px] text-zinc-500">{asset.team}</span>
        {isSource && <span className="ml-auto text-[10px] font-bold text-red-400">SOURCE</span>}
        {isDirect && <span className="ml-auto text-[10px] font-bold text-orange-400">DIRECT</span>}
        {isIndirect && <span className="ml-auto text-[10px] font-bold text-yellow-400">INDIRECT</span>}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: borderColor, width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = { impact: ImpactNode };
