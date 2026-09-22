import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, GitBranch, Zap, Sparkles, Filter, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { AssetTypeIcon } from '@/components/ui/AssetTypeIcon';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { assets as allAssets, relationships } from '@/data/estate';
import { getDirectDownstream, getDirectUpstream, getConnectionCount } from '@/lib/graph';
import { apiService } from '@/services/api';
import { generateAiOverview } from '@/lib/aiService';
import type { Asset, AiOverview, AssetType, Criticality, Sensitivity } from '@/types';

const assetTypes: AssetType[] = ['File', 'Pipeline', 'Table', 'Database', 'API', 'Report', 'Model'];
const criticalities: Criticality[] = ['Critical', 'High', 'Medium', 'Low'];
const sensitivities: Sensitivity[] = ['Public', 'Internal', 'Confidential', 'Restricted'];
const owners = [...new Set(allAssets.map((a) => a.owner))];

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [critFilter, setCritFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const [sensFilter, setSensFilter] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiOverview, setAiOverview] = useState<AiOverview | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    apiService.getAssets().then(() => setLoading(false));
    const assetParam = searchParams.get('asset');
    const ownerParam = searchParams.get('owner');
    const teamParam = searchParams.get('team');
    if (ownerParam) setOwnerFilter(ownerParam);
    if (teamParam) setSearch(teamParam);
    if (assetParam) {
      const asset = allAssets.find((a) => a.id === assetParam);
      if (asset) {
        setSelectedAsset(asset);
        setDrawerOpen(true);
      }
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return allAssets.filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.team.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (critFilter && a.criticality !== critFilter) return false;
      if (ownerFilter && a.owner !== ownerFilter) return false;
      if (sensFilter && a.sensitivity !== sensFilter) return false;
      return true;
    });
  }, [search, typeFilter, critFilter, ownerFilter, sensFilter]);

  const hasFilters = typeFilter || critFilter || ownerFilter || sensFilter || search;

  function clearFilters() {
    setSearch('');
    setTypeFilter('');
    setCritFilter('');
    setOwnerFilter('');
    setSensFilter('');
    setSearchParams({});
  }

  function openAsset(asset: Asset) {
    setSelectedAsset(asset);
    setDrawerOpen(true);
    setAiOverview(null);
    setSearchParams({ ...Object.fromEntries(searchParams), asset: asset.id });
  }

  function handleAiOverview() {
    if (!selectedAsset) return;
    setAiLoading(true);
    setAiOverview(null);
    apiService.getAiOverview(selectedAsset.id).then((overview) => {
      setAiOverview(overview);
      setAiLoading(false);
      showToast('success', 'AI overview generated');
    }).catch(() => {
      setAiLoading(false);
      showToast('error', 'Failed to generate AI overview');
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Discover</h1>
        <p className="mt-1 text-sm text-zinc-400">Search and filter the complete data asset registry.</p>
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or team..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Type" value={typeFilter} options={assetTypes} onChange={setTypeFilter} />
          <FilterSelect label="Criticality" value={critFilter} options={criticalities} onChange={setCritFilter} />
          <FilterSelect label="Owner" value={ownerFilter} options={owners} onChange={setOwnerFilter} />
          <FilterSelect label="Sensitivity" value={sensFilter} options={sensitivities} onChange={setSensFilter} />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">{filtered.length} of {allAssets.length} assets</p>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Filter} title="No assets found" description="Try adjusting your filters or search query." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-zinc-800/80 lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 text-left font-medium">Asset</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Env</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">Criticality</th>
                  <th className="px-4 py-3 text-left font-medium">Sensitivity</th>
                  <th className="px-4 py-3 text-left font-medium">Lifecycle</th>
                  <th className="px-4 py-3 text-left font-medium">Modernization</th>
                  <th className="px-4 py-3 text-left font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => openAsset(asset)}
                    className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AssetTypeIcon type={asset.type} className="h-4 w-4 text-zinc-500" />
                        <span className="font-medium text-zinc-200">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant={asset.type} label={asset.type} /></td>
                    <td className="px-4 py-3"><Badge variant={asset.environment} label={asset.environment} /></td>
                    <td className="px-4 py-3 text-zinc-400">{asset.owner}</td>
                    <td className="px-4 py-3"><Badge variant={asset.criticality} label={asset.criticality} /></td>
                    <td className="px-4 py-3"><Badge variant={asset.sensitivity} label={asset.sensitivity} /></td>
                    <td className="px-4 py-3"><Badge variant={asset.lifecycle} label={asset.lifecycle} /></td>
                    <td className="px-4 py-3"><Badge variant={asset.modernizationStatus} label={asset.modernizationStatus} /></td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{asset.lastUpdated}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <ActionBtn icon={GitBranch} label="Lineage" onClick={() => navigate(`/lineage?asset=${asset.id}`)} />
                        <ActionBtn icon={Zap} label="Impact" onClick={() => navigate(`/impact?asset=${asset.id}`)} />
                        <ActionBtn icon={Sparkles} label="AI" onClick={() => { openAsset(asset); setTimeout(handleAiOverview, 300); }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                onClick={() => openAsset(asset)}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-colors active:bg-zinc-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AssetTypeIcon type={asset.type} className="h-4 w-4 text-zinc-500" />
                    <span className="font-medium text-zinc-200">{asset.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant={asset.type} label={asset.type} />
                  <Badge variant={asset.criticality} label={asset.criticality} />
                  <Badge variant={asset.sensitivity} label={asset.sensitivity} />
                  <Badge variant={asset.lifecycle} label={asset.lifecycle} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">{asset.owner} · {asset.team}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail drawer */}
      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSearchParams({}); }} title="Asset Details">
        {selectedAsset && (
          <AssetDetail
            asset={selectedAsset}
            aiOverview={aiOverview}
            aiLoading={aiLoading}
            onGenerateAi={handleAiOverview}
            onViewLineage={() => navigate(`/lineage?asset=${selectedAsset.id}`)}
            onSimulateImpact={() => navigate(`/impact?asset=${selectedAsset.id}`)}
          />
        )}
      </Drawer>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 focus:border-red-500 focus:outline-none"
    >
      <option value="">{label}: All</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="rounded-md border border-zinc-700/50 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-red-600/30 hover:bg-red-600/10 hover:text-red-400"
    >
      {label}
    </button>
  );
}

function AssetDetail({ asset, aiOverview, aiLoading, onGenerateAi, onViewLineage, onSimulateImpact }: {
  asset: Asset;
  aiOverview: AiOverview | null;
  aiLoading: boolean;
  onGenerateAi: () => void;
  onViewLineage: () => void;
  onSimulateImpact: () => void;
}) {
  const upstream = getDirectUpstream(asset.id);
  const downstream = getDirectDownstream(asset.id);
  const connections = getConnectionCount(asset.id);

  const riskIndicators = [
    { label: 'Criticality', value: asset.criticality, level: asset.criticality === 'Critical' ? 'high' : asset.criticality === 'High' ? 'medium' : 'low' },
    { label: 'Dependents', value: String(downstream.length), level: downstream.length > 3 ? 'high' : downstream.length > 1 ? 'medium' : 'low' },
    { label: 'Upstream Sources', value: String(upstream.length), level: 'low' },
    { label: 'Data Sensitivity', value: asset.sensitivity, level: asset.sensitivity === 'Restricted' ? 'high' : asset.sensitivity === 'Confidential' ? 'medium' : 'low' },
    { label: 'Legacy Status', value: asset.lifecycle === 'Legacy' ? 'Yes' : 'No', level: asset.lifecycle === 'Legacy' ? 'high' : 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <AssetTypeIcon type={asset.type} className="h-5 w-5 text-zinc-400" />
          <h3 className="text-lg font-bold text-zinc-100">{asset.name}</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant={asset.type} label={asset.type} />
          <Badge variant={asset.environment} label={asset.environment} />
          <Badge variant={asset.criticality} label={asset.criticality} />
          <Badge variant={asset.sensitivity} label={asset.sensitivity} />
          <Badge variant={asset.lifecycle} label={asset.lifecycle} />
          <Badge variant={asset.modernizationStatus} label={asset.modernizationStatus} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-zinc-500">Owner:</span> <span className="text-zinc-300">{asset.owner}</span></div>
          <div><span className="text-zinc-500">Team:</span> <span className="text-zinc-300">{asset.team}</span></div>
          <div><span className="text-zinc-500">Last Updated:</span> <span className="text-zinc-300">{asset.lastUpdated}</span></div>
          <div><span className="text-zinc-500">Connections:</span> <span className="text-zinc-300">{connections}</span></div>
        </div>
      </div>

      {/* What it does */}
      <Section title="What it does">
        <p className="text-sm text-zinc-400">{asset.description}</p>
      </Section>

      {/* Dependencies */}
      <Section title="Upstream Dependencies">
        {upstream.length === 0 ? (
          <p className="text-sm text-zinc-600">No upstream sources — this is a root data origin.</p>
        ) : (
          <div className="space-y-2">
            {upstream.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2">
                <AssetTypeIcon type={a.type} className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-300">{a.name}</span>
                <Badge variant={a.criticality} label={a.criticality} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Downstream Dependencies">
        {downstream.length === 0 ? (
          <p className="text-sm text-zinc-600">No downstream consumers — this is a terminal asset.</p>
        ) : (
          <div className="space-y-2">
            {downstream.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2">
                <AssetTypeIcon type={a.type} className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-300">{a.name}</span>
                <Badge variant={a.criticality} label={a.criticality} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Risk */}
      <Section title="Risk Indicators">
        <div className="space-y-2">
          {riskIndicators.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-400">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-200">{r.value}</span>
                <span className={`h-2 w-2 rounded-full ${r.level === 'high' ? 'bg-red-400' : r.level === 'medium' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Recommended action */}
      <Section title="Recommended Action">
        <div className="rounded-lg border border-red-600/20 bg-red-600/5 p-4">
          <p className="text-sm text-zinc-300">
            {asset.modernizationStatus === 'Retain'
              ? 'Retain as-is. Monitor downstream consumers for changes.'
              : asset.modernizationStatus === 'Remediate'
              ? 'Review downstream dependencies before remediation. Schedule technical debt cleanup.'
              : asset.modernizationStatus === 'Migrate'
              ? 'Plan migration with downstream teams. Validate all consumers post-migration.'
              : asset.modernizationStatus === 'Redesign'
              ? 'Redesign requires full impact assessment. Coordinate with all dependent teams.'
              : 'Prepare retirement plan. Ensure all downstream consumers have alternative sources.'}
          </p>
        </div>
      </Section>

      {/* AI Overview */}
      {aiOverview && (
        <Section title="AI-Generated Insight">
          <div className="rounded-lg border border-violet-600/20 bg-violet-600/5 p-4">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-600/15 px-2.5 py-0.5 text-xs text-violet-400">
              <Sparkles className="h-3 w-3" /> AI-generated insight
            </div>
            <div className="space-y-3 text-sm text-zinc-400">
              <div><p className="font-medium text-zinc-300">What it is</p><p className="mt-0.5">{aiOverview.whatItIs}</p></div>
              <div><p className="font-medium text-zinc-300">Risk</p><p className="mt-0.5">{aiOverview.risk}</p></div>
              <div><p className="font-medium text-zinc-300">Sensitivity</p><p className="mt-0.5">{aiOverview.sensitivity}</p></div>
              <div><p className="font-medium text-zinc-300">Dependencies</p><p className="mt-0.5">{aiOverview.dependencies}</p></div>
              <div>
                <p className="font-medium text-zinc-300">Recommended Next Steps</p>
                <ul className="mt-1 space-y-1">
                  {aiOverview.nextSteps.map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-violet-400">→</span> {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
        <Button variant="outline" size="sm" onClick={onViewLineage}><GitBranch className="h-3.5 w-3.5" /> View Lineage</Button>
        <Button variant="secondary" size="sm" onClick={onSimulateImpact}><Zap className="h-3.5 w-3.5" /> Simulate Impact</Button>
        <Button variant="primary" size="sm" onClick={onGenerateAi} disabled={aiLoading}>
          <Sparkles className="h-3.5 w-3.5" /> {aiLoading ? 'Generating...' : 'Generate AI Overview'}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h4>
      {children}
    </div>
  );
}
