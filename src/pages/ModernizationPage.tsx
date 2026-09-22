import { useState, useMemo } from 'react';
import { Wrench, AlertTriangle, Archive, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';
import { getAssets as initialAssets } from '@/lib/estateStore';
import { calculateImpact } from '@/lib/graph';
import type { ModernizationStatus, Asset } from '@/types';

const statuses: ModernizationStatus[] = ['Retain', 'Remediate', 'Migrate', 'Redesign', 'Retire'];

export function ModernizationPage() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [legacyOnly, setLegacyOnly] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (legacyOnly && a.lifecycle === 'Active') return false;
      if (criticalOnly && a.criticality !== 'Critical' && a.criticality !== 'High') return false;
      if (statusFilter && a.modernizationStatus !== statusFilter) return false;
      return true;
    });
  }, [assets, legacyOnly, criticalOnly, statusFilter]);

  const summary = useMemo(() => {
    return {
      migrate: assets.filter((a) => a.modernizationStatus === 'Migrate').length,
      remediate: assets.filter((a) => a.modernizationStatus === 'Remediate').length,
      retire: assets.filter((a) => a.modernizationStatus === 'Retire').length,
      criticalLegacy: assets.filter((a) => a.lifecycle === 'Legacy' && (a.criticality === 'Critical' || a.criticality === 'High')).length,
    };
  }, [assets]);

  function updateStatus(assetId: string, newStatus: ModernizationStatus) {
    setAssets((prev) => prev.map((a) => a.id === assetId ? { ...a, modernizationStatus: newStatus } : a));
    const asset = assets.find((a) => a.id === assetId);
    showToast('success', `${asset?.name} marked for ${newStatus}`);
  }

  function recommendedAction(asset: Asset): string {
    const impact = calculateImpact(asset.id);
    if (asset.lifecycle === 'Legacy' && asset.criticality === 'Critical') return 'Prioritize redesign — high blast radius';
    if (asset.modernizationStatus === 'Retire') return 'Plan retirement with downstream migration';
    if (asset.modernizationStatus === 'Migrate') return `Migrate with ${impact.totalAffected} downstream validations`;
    if (asset.modernizationStatus === 'Remediate') return 'Schedule technical debt remediation';
    if (asset.modernizationStatus === 'Redesign') return 'Full architecture review required';
    return 'Retain and monitor';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Modernization Planner</h1>
        <p className="mt-1 text-sm text-zinc-400">Plan and track modernization actions across your data estate.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Ready for Migration" value={summary.migrate} icon={Zap} color="text-sky-400" />
        <SummaryCard label="Require Remediation" value={summary.remediate} icon={Wrench} color="text-yellow-400" />
        <SummaryCard label="Recommended for Retirement" value={summary.retire} icon={Archive} color="text-red-400" />
        <SummaryCard label="Critical Legacy Assets" value={summary.criticalLegacy} icon={AlertTriangle} color="text-orange-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
        <button
          onClick={() => setLegacyOnly(!legacyOnly)}
          className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${legacyOnly ? 'border-yellow-600/30 bg-yellow-600/10 text-yellow-400' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
        >
          Legacy Only
        </button>
        <button
          onClick={() => setCriticalOnly(!criticalOnly)}
          className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${criticalOnly ? 'border-red-600/30 bg-red-600/10 text-red-400' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
        >
          High Criticality Only
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 focus:border-red-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-zinc-500">{filtered.length} assets</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 text-left font-medium">Asset</th>
              <th className="px-4 py-3 text-left font-medium">Criticality</th>
              <th className="px-4 py-3 text-left font-medium">Lifecycle</th>
              <th className="px-4 py-3 text-left font-medium">Current Status</th>
              <th className="px-4 py-3 text-left font-medium">Impact</th>
              <th className="px-4 py-3 text-left font-medium">Recommended Action</th>
              <th className="px-4 py-3 text-left font-medium">Change To</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((asset) => {
              const impact = calculateImpact(asset.id);
              return (
                <tr key={asset.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{asset.name}</p>
                    <p className="text-xs text-zinc-500">{asset.team}</p>
                  </td>
                  <td className="px-4 py-3"><Badge variant={asset.criticality} label={asset.criticality} /></td>
                  <td className="px-4 py-3"><Badge variant={asset.lifecycle} label={asset.lifecycle} /></td>
                  <td className="px-4 py-3"><Badge variant={asset.modernizationStatus} label={asset.modernizationStatus} /></td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${impact.totalAffected > 3 ? 'text-red-400' : impact.totalAffected > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {impact.totalAffected} affected
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px]">{recommendedAction(asset)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={asset.modernizationStatus}
                      onChange={(e) => updateStatus(asset.id, e.target.value as ModernizationStatus)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-red-500 focus:outline-none"
                    >
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-2xl font-bold text-zinc-100">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
