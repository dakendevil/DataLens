import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Zap, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { AssetTypeIcon } from '@/components/ui/AssetTypeIcon';
import { assets } from '@/data/estate';
import { apiService } from '@/services/api';
import { calculateImpact } from '@/lib/graph';
import type { AiOverview } from '@/types';

export function AiInsightsPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('customer_cleaning_etl');
  const [overview, setOverview] = useState<AiOverview | null>(null);
  const [loading, setLoading] = useState(false);

  function generate() {
    setLoading(true);
    setOverview(null);
    apiService.getAiOverview(selectedId).then((data) => {
      setOverview(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    generate();
  }, []);

  const selectedAsset = assets.find((a) => a.id === selectedId)!;
  const impact = calculateImpact(selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">AI Insights</h1>
        <p className="mt-1 text-sm text-zinc-400">Generate AI-powered explanations for any asset in your data estate.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Asset selector */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Select Asset</h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => { setSelectedId(asset.id); }}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${selectedId === asset.id ? 'border-red-600/30 bg-red-600/10' : 'border-zinc-800 hover:bg-zinc-800/30'}`}
                >
                  <AssetTypeIcon type={asset.type} className="h-4 w-4 text-zinc-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{asset.name}</p>
                    <p className="text-xs text-zinc-500">{asset.team}</p>
                  </div>
                  {selectedId === asset.id && <ChevronRight className="h-3.5 w-3.5 text-red-400" />}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={generate} disabled={loading}>
            <Sparkles className="h-4 w-4" />
            {loading ? 'Generating...' : 'Generate AI Overview'}
          </Button>
        </div>

        {/* AI Output */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : overview ? (
            <div className="rounded-xl border border-violet-600/20 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-600/10 p-2">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">{selectedAsset.name}</h3>
                    <p className="text-xs text-zinc-500">AI-generated insight</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={selectedAsset.criticality} label={selectedAsset.criticality} />
                  <Badge variant={selectedAsset.type} label={selectedAsset.type} />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <AiSection title="What it is" content={overview.whatItIs} />
                <AiSection title="Risk" content={overview.risk} icon="warning" />
                <AiSection title="Sensitivity" content={overview.sensitivity} icon="shield" />
                <AiSection title="Dependencies" content={overview.dependencies} icon="link" />
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">Recommended Next Steps</h4>
                  <div className="space-y-2">
                    {overview.nextSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-violet-600/10 bg-violet-600/5 px-3 py-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-xs font-bold text-violet-400">{i + 1}</span>
                        <p className="text-sm text-zinc-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-zinc-800 pt-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">{impact.totalAffected}</p>
                  <p className="text-xs text-zinc-500">Affected</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-400">{impact.criticalAffected}</p>
                  <p className="text-xs text-zinc-500">Critical</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-sky-400">{impact.teamsImpacted}</p>
                  <p className="text-xs text-zinc-500">Teams</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/lineage?asset=${selectedId}`)}>
                  <GitBranch className="h-3.5 w-3.5" /> View Lineage
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/impact?asset=${selectedId}`)}>
                  <Zap className="h-3.5 w-3.5" /> Simulate Impact
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="h-8 w-8 text-zinc-600" />
              <p className="mt-4 text-sm text-zinc-500">Click "Generate AI Overview" to get insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AiSection({ title, content, icon }: { title: string; content: string; icon?: string }) {
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-violet-400">{title}</h4>
      <p className="text-sm leading-relaxed text-zinc-400">{content}</p>
    </div>
  );
}
