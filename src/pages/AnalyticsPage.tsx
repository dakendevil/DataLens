import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Network, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { getAssets as assets } from '@/lib/estateStore';
import { getGraphStats, getMostConnectedAsset, getConnectionCount, calculateImpact, getConnectionsByType } from '@/lib/graph';

const COLORS = ['#dc2626', '#f97316', '#eab308', '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899'];
const CRIMSON = '#dc2626';

export function AnalyticsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const stats = getGraphStats();
  const mostConnected = getMostConnectedAsset();
  const connectionsByType = getConnectionsByType();

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach((a) => { map[a.type] = (map[a.type] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const byCriticality = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach((a) => { map[a.criticality] = (map[a.criticality] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const byLifecycle = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach((a) => { map[a.lifecycle] = (map[a.lifecycle] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const byModernization = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach((a) => { map[a.modernizationStatus] = (map[a.modernizationStatus] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const byRelationship = useMemo(() => {
    return Object.entries(connectionsByType).map(([name, value]) => ({ name, value }));
  }, []);

  // High-risk assets: critical + high downstream
  const highRiskAssets = useMemo(() => {
    return assets
      .map((a) => ({ asset: a, impact: calculateImpact(a.id), connections: getConnectionCount(a.id) }))
      .filter((x) => x.asset.criticality === 'Critical' || x.impact.totalAffected >= 3)
      .sort((a, b) => b.impact.totalAffected - a.impact.totalAffected)
      .slice(0, 8);
  }, []);

  // Most connected
  const mostConnectedList = useMemo(() => {
    return assets
      .map((a) => ({ asset: a, connections: getConnectionCount(a.id) }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 8);
  }, []);

  // Highest downstream impact
  const highestImpact = useMemo(() => {
    return assets
      .map((a) => ({ asset: a, impact: calculateImpact(a.id) }))
      .sort((a, b) => b.impact.totalAffected - a.impact.totalAffected)
      .slice(0, 8);
  }, []);

  const tooltipStyle = { background: '#181b23', border: '1px solid #23262f', borderRadius: 8, fontSize: 12 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-400">Deep-dive analytics across the data estate.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Assets" value={stats.totalAssets} icon={BarChart3} accent="crimson" />
        <KpiCard label="Most Connected" value={mostConnected.asset?.name ?? '—'} icon={Network} accent="sky" subtext={`${mostConnected.connections} connections`} />
        <KpiCard label="High-Risk Assets" value={highRiskAssets.length} icon={AlertTriangle} accent="orange" />
        <KpiCard label="Relationships" value={stats.totalRelationships} icon={TrendingUp} accent="violet" />
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Charts grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Assets by Type">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byType} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23262f" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} />
                  <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill={CRIMSON} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Assets by Criticality">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byCriticality} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {byCriticality.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-3">
                {byCriticality.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Assets by Lifecycle">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byLifecycle} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23262f" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} />
                  <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Modernization Status">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byModernization} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23262f" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={11} />
                  <YAxis stroke="#52525b" fontSize={11} allowDecimals={false} />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Relationship types + most connected */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard title="Relationships by Type">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byRelationship} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {byRelationship.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-2">
                {byRelationship.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Most connected node highlight */}
            <div className="lg:col-span-2 rounded-xl border border-red-600/20 bg-red-600/5 p-5">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold text-zinc-200">Most Connected Node</h3>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-zinc-100">{mostConnected.asset?.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{mostConnected.asset?.team}</p>
                  <div className="mt-3 flex gap-2">
                    {mostConnected.asset && <Badge variant={mostConnected.asset.type} label={mostConnected.asset.type} />}
                    {mostConnected.asset && <Badge variant={mostConnected.asset.criticality} label={mostConnected.asset.criticality} />}
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: mostConnected.connections, fill: CRIMSON }]} startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#23262f' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-red-500">{mostConnected.connections}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">connections</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Most connected list */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-200">Most Connected Assets</h3>
              <div className="space-y-2">
                {mostConnectedList.map((item, i) => (
                  <div key={item.asset.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/20 px-3 py-2">
                    <span className="text-xs font-bold text-zinc-600 w-4">#{i + 1}</span>
                    <span className="text-sm text-zinc-200 flex-1 truncate">{item.asset.name}</span>
                    <span className="text-sm font-bold text-red-400">{item.connections}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Highest impact list */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-200">Highest Downstream Impact</h3>
              <div className="space-y-2">
                {highestImpact.map((item, i) => (
                  <div key={item.asset.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/20 px-3 py-2">
                    <Zap className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-sm text-zinc-200 flex-1 truncate">{item.asset.name}</span>
                    <Badge variant={item.asset.criticality} label={item.asset.criticality} />
                    <span className="text-sm font-bold text-orange-400">{item.impact.totalAffected}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* High-risk assets */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-zinc-200">High-Risk Assets</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2 text-left font-medium">Asset</th>
                    <th className="px-3 py-2 text-left font-medium">Criticality</th>
                    <th className="px-3 py-2 text-left font-medium">Connections</th>
                    <th className="px-3 py-2 text-left font-medium">Downstream Impact</th>
                    <th className="px-3 py-2 text-left font-medium">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskAssets.map((item) => (
                    <tr key={item.asset.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-3 py-2.5 text-zinc-200">{item.asset.name}</td>
                      <td className="px-3 py-2.5"><Badge variant={item.asset.criticality} label={item.asset.criticality} /></td>
                      <td className="px-3 py-2.5 text-zinc-400">{item.connections}</td>
                      <td className="px-3 py-2.5"><span className="font-bold text-orange-400">{item.impact.totalAffected}</span></td>
                      <td className="px-3 py-2.5 text-zinc-400">{item.asset.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">{title}</h3>
      {children}
    </div>
  );
}
