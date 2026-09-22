import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  Position,
  Handle,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, GitBranch, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AssetTypeIcon } from '@/components/ui/AssetTypeIcon';
import { getAssets, getAssetById, getRelationships } from '@/lib/estateStore';
import { getGraphStats, getDownstreamEdges, getUpstreamEdges } from '@/lib/graph';
import type { AssetType, Criticality, Asset } from '@/types';
import { clsx } from 'clsx';

const typeColors: Record<AssetType, string> = {
  File: '#6366f1',
  Pipeline: '#06b6d4',
  Table: '#14b8a6',
  Database: '#3b82f6',
  API: '#a855f7',
  Report: '#ec4899',
  Model: '#8b5cf6',
};

function computeLayout(assets: Asset[], relationships: ReturnType<typeof getRelationships>) {
  const layers: string[][] = [];
  const assigned = new Set<string>();

  const roots = assets.filter((a) => !relationships.some((r) => r.target === a.id));
  let current = roots.map((a) => a.id);
  if (current.length === 0) current = [assets[0]?.id].filter(Boolean) as string[];

  while (current.length > 0) {
    layers.push(current);
    current.forEach((id) => assigned.add(id));
    const next: string[] = [];
    for (const id of current) {
      for (const edge of getDownstreamEdges(id)) {
        if (!assigned.has(edge.target) && !next.includes(edge.target)) {
          const upstream = getUpstreamEdges(edge.target);
          if (upstream.every((u) => assigned.has(u.source))) {
            next.push(edge.target);
          }
        }
      }
    }
    for (const asset of assets) {
      if (assigned.has(asset.id) || next.includes(asset.id)) continue;
      const upstream = getUpstreamEdges(asset.id);
      if (upstream.length > 0 && upstream.every((u) => assigned.has(u.source))) {
        next.push(asset.id);
      }
    }
    current = [...new Set(next)];
  }

  for (const a of assets) {
    if (!assigned.has(a.id)) {
      layers.push([a.id]);
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  const LAYER_WIDTH = 280;
  const NODE_HEIGHT = 100;
  const VERTICAL_GAP = 40;

  layers.forEach((layer, layerIdx) => {
    const totalHeight = layer.length * NODE_HEIGHT + (layer.length - 1) * VERTICAL_GAP;
    const startY = -totalHeight / 2;
    layer.forEach((id, nodeIdx) => {
      positions.set(id, {
        x: layerIdx * LAYER_WIDTH,
        y: startY + nodeIdx * (NODE_HEIGHT + VERTICAL_GAP),
      });
    });
  });

  return positions;
}

function AssetNode({ data, selected }: { data: { asset: Asset; highlighted?: boolean; dimmed?: boolean }; selected: boolean }) {
  const { asset, highlighted, dimmed } = data;
  const color = typeColors[asset.type];
  return (
    <div
      className={clsx(
        'rounded-lg border bg-zinc-900/90 px-3 py-2.5 shadow-lg transition-all',
        selected ? 'border-red-500 shadow-red-500/20 ring-2 ring-red-500/30' : 'border-zinc-700',
        highlighted ? 'border-red-500/50 shadow-red-500/10' : '',
        dimmed ? 'opacity-30' : ''
      )}
      style={{ minWidth: 180 }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#52525b', width: 6, height: 6 }} />
      <div className="flex items-center gap-2">
        <div className="rounded-md p-1" style={{ background: `${color}20` }}>
          <AssetTypeIcon type={asset.type} className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-xs font-semibold text-zinc-100 truncate">{asset.name}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[10px] text-zinc-500">{asset.type}</span>
        <span className={clsx('ml-auto h-1.5 w-1.5 rounded-full', asset.criticality === 'Critical' ? 'bg-red-400' : asset.criticality === 'High' ? 'bg-orange-400' : 'bg-zinc-600')} />
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#52525b', width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = { asset: AssetNode };

export function LineagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [critFilter, setCritFilter] = useState('');
  const [showConfidence, setShowConfidence] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<'none' | 'upstream' | 'downstream'>('none');

  const allAssets = getAssets();
  const allRelationships = getRelationships();

  const layoutPositions = useMemo(
    () => computeLayout(allAssets, allRelationships),
    [allAssets, allRelationships]
  );

  const initialNodes: Node[] = useMemo(() => {
    return allAssets.map((asset) => ({
      id: asset.id,
      type: 'asset',
      position: layoutPositions.get(asset.id) ?? { x: 0, y: 0 },
      data: { asset },
    }));
  }, [allAssets, layoutPositions]);

  const initialEdges: Edge[] = useMemo(() => {
    return allRelationships.map((r) => ({
      id: r.id,
      source: r.source,
      target: r.target,
      animated: r.confidence < 0.7,
      label: showConfidence ? `${Math.round(r.confidence * 100)}%` : '',
      labelStyle: { fill: '#71717a', fontSize: 10 },
      style: {
        stroke: r.confidence >= 0.85 ? '#dc2626' : r.confidence >= 0.7 ? '#f97316' : '#52525b',
        strokeWidth: 1.5,
      },
    }));
  }, [allRelationships, showConfidence]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const assetParam = searchParams.get('asset');
    if (assetParam) {
      setSelectedId(assetParam);
      setHighlightMode('downstream');
    }
  }, [searchParams]);

  const { upstreamSet, downstreamSet } = useMemo(() => {
    if (!selectedId) return { upstreamSet: new Set<string>(), downstreamSet: new Set<string>() };
    const up = new Set<string>();
    const down = new Set<string>();
    const upQueue = [selectedId];
    while (upQueue.length) {
      const id = upQueue.shift()!;
      for (const edge of getUpstreamEdges(id)) {
        if (!up.has(edge.source)) {
          up.add(edge.source);
          upQueue.push(edge.source);
        }
      }
    }
    const downQueue = [selectedId];
    while (downQueue.length) {
      const id = downQueue.shift()!;
      for (const edge of getDownstreamEdges(id)) {
        if (!down.has(edge.target)) {
          down.add(edge.target);
          downQueue.push(edge.target);
        }
      }
    }
    return { upstreamSet: up, downstreamSet: down };
  }, [selectedId]);

  useEffect(() => {
    const updatedNodes = initialNodes.map((node) => {
      const asset = node.data.asset as Asset;
      let dimmed = false;
      let highlighted = false;

      if (search && !asset.name.toLowerCase().includes(search.toLowerCase())) dimmed = true;
      if (typeFilter && asset.type !== typeFilter) dimmed = true;
      if (critFilter && asset.criticality !== critFilter) dimmed = true;

      if (selectedId) {
        if (highlightMode === 'upstream') {
          if (node.id === selectedId) highlighted = true;
          else if (upstreamSet.has(node.id)) highlighted = true;
          else dimmed = true;
        } else if (highlightMode === 'downstream') {
          if (node.id === selectedId) highlighted = true;
          else if (downstreamSet.has(node.id)) highlighted = true;
          else dimmed = true;
        }
      }

      return {
        ...node,
        data: { ...node.data, highlighted, dimmed },
        selected: node.id === selectedId,
      };
    });
    setNodes(updatedNodes);
  }, [search, typeFilter, critFilter, selectedId, highlightMode, upstreamSet, downstreamSet, initialNodes, setNodes]);

  const onNodeClick: NodeMouseHandler = useCallback((_evt, node) => {
    setSelectedId(node.id);
    setSearchParams({ asset: node.id });
  }, [setSearchParams]);

  function resetGraph() {
    setSelectedId(null);
    setHighlightMode('none');
    setSearch('');
    setTypeFilter('');
    setCritFilter('');
    setSearchParams({});
  }

  const stats = getGraphStats();
  const selectedAsset = selectedId ? getAssetById(selectedId) : null;
  const types: AssetType[] = ['File', 'Pipeline', 'Table', 'Database', 'API', 'Report', 'Model'];
  const crits: Criticality[] = ['Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Lineage Graph</h1>
          <p className="mt-1 text-sm text-zinc-400">Interactive data lineage — click any node to trace dependencies.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <GitBranch className="h-3.5 w-3.5 text-red-500" />
          <span className="font-semibold text-zinc-300">{stats.totalRelationships}</span> relationships
          <span className="text-zinc-700">·</span>
          <span className="font-semibold text-emerald-400">{stats.highConfidencePct}%</span> high-confidence
          <span className="text-zinc-700">·</span>
          <span className="font-semibold text-zinc-300">{stats.totalAssets}</span> assets
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 focus:border-red-500 focus:outline-none">
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={critFilter} onChange={(e) => setCritFilter(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 focus:border-red-500 focus:outline-none">
          <option value="">All Criticality</option>
          {crits.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setShowConfidence(!showConfidence)}
          className={clsx('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors', showConfidence ? 'border-red-600/30 bg-red-600/10 text-red-400' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200')}
        >
          <Eye className="h-3 w-3" /> Confidence
        </button>
        <div className="h-5 w-px bg-zinc-700" />
        <Button variant="ghost" size="sm" onClick={() => selectedId && setHighlightMode(highlightMode === 'upstream' ? 'none' : 'upstream')} disabled={!selectedId}>
          <ArrowUp className="h-3.5 w-3.5" /> Upstream
        </Button>
        <Button variant="ghost" size="sm" onClick={() => selectedId && setHighlightMode(highlightMode === 'downstream' ? 'none' : 'downstream')} disabled={!selectedId}>
          <ArrowDown className="h-3.5 w-3.5" /> Downstream
        </Button>
        <Button variant="ghost" size="sm" onClick={resetGraph}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      {selectedAsset && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-600/20 bg-red-600/5 px-4 py-2.5 animate-slide-up">
          <AssetTypeIcon type={selectedAsset.type} className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-zinc-100">{selectedAsset.name}</span>
          <Badge variant={selectedAsset.type} label={selectedAsset.type} />
          <Badge variant={selectedAsset.criticality} label={selectedAsset.criticality} />
          <span className="text-xs text-zinc-500">·</span>
          <span className="text-xs text-zinc-400">Owner: {selectedAsset.owner}</span>
          <span className="text-xs text-zinc-500">·</span>
          <span className="text-xs text-zinc-400">
            {highlightMode === 'upstream' && `${upstreamSet.size} upstream`}
            {highlightMode === 'downstream' && `${downstreamSet.size} downstream`}
          </span>
        </div>
      )}

      <div className="relative h-[600px] overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0d0e13]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2028" />
          <Controls className="!border-zinc-800 !bg-zinc-900 !text-zinc-400" />
          <MiniMap
            className="!bg-zinc-900 !border-zinc-800"
            nodeColor={(node) => {
              const asset = node.data?.asset as Asset | undefined;
              return asset ? typeColors[asset.type] : '#52525b';
            }}
            maskColor="rgba(10, 11, 15, 0.7)"
          />
        </ReactFlow>

        <div className="absolute bottom-3 left-3 rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 backdrop-blur">
          <p className="mb-2 text-xs font-semibold text-zinc-400">Asset Types</p>
          <div className="grid grid-cols-2 gap-1.5">
            {types.map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ background: typeColors[t] }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
