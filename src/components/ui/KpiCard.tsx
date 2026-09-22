import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: 'crimson' | 'emerald' | 'orange' | 'sky' | 'violet';
  subtext?: string;
}

const accentMap = {
  crimson: 'text-red-400 bg-red-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  orange: 'text-orange-400 bg-orange-500/10',
  sky: 'text-sky-400 bg-sky-500/10',
  violet: 'text-violet-400 bg-violet-500/10',
};

export function KpiCard({ label, value, icon: Icon, accent = 'crimson', subtext }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
          {subtext && <p className="mt-1 text-xs text-zinc-500">{subtext}</p>}
        </div>
        {Icon && (
          <div className={clsx('rounded-lg p-2', accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
