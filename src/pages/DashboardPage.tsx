import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, GitBranch, AlertTriangle, ShieldCheck, Server, Users, Zap, ArrowRight } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, KpiSkeleton } from '@/components/ui/Skeleton';
import { apiService } from '@/services/api';
import { getAssets } from '@/lib/estateStore';
import { calculateImpact, getGraphStats, getMostConnectedAsset } from '@/lib/graph';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid } from 'recharts';

const CRIMSON = '#dc2626';
const PIE_COLORS = ['#dc2626', '#f97316', '#eab308', '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899'];

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState('customer_cleaning_etl');
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof apiService.getAnalytics>> | null>(null);

  useEffect(() => {
    apiService.getAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  const stats = getGraphStats();
  const mostConnected = getMostConnectedAsset();
  const criticalityData = analytics
    ? Object.entries(analytics.byCriticality).map(([name, value]) => ({ name, value }))
    : [];
  const typeData = analytics
    ? Object.entries(analytics.byType).map(([name, value]) => ({ name, value }))
    : [];

  const recentActivity = [
    { action: 'Lineage updated', asset: 'customer_cleaning_etl', time: '2h ago' },
    { action: 'Impact simulated', asset: 'customer_master', time: '5h ago' },
    { action: 'AI overview generated', asset: 'churn_model', time: '1d ago' },
    { action: 'Asset tagged', asset: 'executive_report', time: '2d ago' },
    { action: 'Relationship added', asset: 'analytics_warehouse → churn_model', time: '3d ago' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Data Estate Intelligence</h1>
        <p className="mt-1 text-sm text-zinc-400">Understand what exists, how it connects, and what breaks before you change it.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="Total Assets" value={stats.totalAssets} icon={Database} accent="crimson" />
            <KpiCard label="Relationships" value={stats.totalRelationships} icon={GitBranch} accent="sky" />
            <KpiCard label="High Criticality" value={stats.highCriticality} icon={AlertTriangle} accent="orange" />
            <KpiCard label="High Confidence" value={`${stats.highConfidencePct}%`} icon={ShieldCheck} accent="emerald" />
            <KpiCard label="Systems" value={stats.systems} icon={Server} accent="violet" />
            <KpiCard label="Owners" value={stats.owners} icon={Users} accent="crimson" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Criticality distribution */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-200">Criticality Distribution</h3>
              {loading ? (
                <Skeleton className="mt-4 h-48" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={criticalityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {criticalityData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{ background: '#181b23', border: '1px solid #23262f', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {criticalityData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Asset types */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-200">Asset Types</h3>
              {loading ? (
                <Skeleton className="mt-4 h-48" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={typeData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#23262f" horizontal={false} />
                    <XAxis type="number" stroke="#52525b" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={11} width={70} />
                    <RTooltip
                      contentStyle={{ background: '#181b23', border: '1px solid #23262f', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill={CRIMSON} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-200">Recent Lineage Activity</h3>
            <div className="mt-4 space-y-3">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-sm text-zinc-300">{act.action}</p>
                      <p className="text-xs text-zinc-500">{act.asset}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-600">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Impact + Most Connected */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-zinc-200">Quick Impact Simulation</h3>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Select an asset and instantly see the blast radius.</p>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-red-500 focus:outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <QuickImpactPreview assetId={selectedAssetId} />
            <Button
              className="mt-3 w-full"
              size="sm"
              onClick={() => navigate(`/impact?asset=${selectedAssetId}`)}
            >
              Open Full Simulator
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-200">Most Connected Node</h3>
            <div className="mt-4 rounded-lg border border-red-600/20 bg-red-600/5 p-4">
              <p className="text-sm font-semibold text-zinc-100">{mostConnected.asset?.name}</p>
              <p className="mt-1 text-2xl font-bold text-red-500">{mostConnected.connections}</p>
              <p className="text-xs text-zinc-500">total connections</p>
              {mostConnected.asset && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={mostConnected.asset.type} label={mostConnected.asset.type} />
                  <Badge variant={mostConnected.asset.criticality} label={mostConnected.asset.criticality} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickImpactPreview({ assetId }: { assetId: string }) {
  const impact = calculateImpact(assetId);
  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-center">
          <p className="text-lg font-bold text-red-400">{impact.totalAffected}</p>
          <p className="text-xs text-zinc-500">Affected</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-center">
          <p className="text-lg font-bold text-orange-400">{impact.criticalAffected}</p>
          <p className="text-xs text-zinc-500">Critical</p>
        </div>
      </div>
      {impact.totalAffected > 0 && (
        <div className="space-y-1">
          {impact.directImpact.slice(0, 3).map((n) => (
            <div key={n.asset.id} className="flex items-center justify-between rounded-md bg-zinc-800/30 px-3 py-1.5 text-xs">
              <span className="text-zinc-300">{n.asset.name}</span>
              <Badge variant={n.asset.criticality} label={n.asset.criticality} />
            </div>
          ))}
          {impact.totalAffected > 3 && (
            <p className="text-center text-xs text-zinc-600">+ {impact.totalAffected - 3} more</p>
          )}
        </div>
      )}
    </div>
  );
}
