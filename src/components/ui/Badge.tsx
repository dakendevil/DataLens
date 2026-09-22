import { clsx } from 'clsx';
import type { Criticality, Sensitivity, Lifecycle, ModernizationStatus, AssetType, Environment } from '@/types';

type BadgeVariant = Criticality | Sensitivity | Lifecycle | ModernizationStatus | AssetType | Environment;

const styles: Record<string, string> = {
  // Criticality
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Low: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  // Sensitivity
  Public: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Internal: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Confidential: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Restricted: 'bg-red-500/15 text-red-400 border-red-500/30',
  // Lifecycle
  Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Legacy: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Deprecated: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Archived: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  // Modernization
  Retain: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Remediate: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Migrate: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Redesign: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Retire: 'bg-red-500/15 text-red-400 border-red-500/30',
  // Asset types
  File: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  Pipeline: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  Table: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  Database: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  API: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Report: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  Model: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  // Environments
  Production: 'bg-red-500/15 text-red-400 border-red-500/30',
  Staging: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Development: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export function Badge({ label, variant }: { label?: string; variant?: BadgeVariant }) {
  const v = (variant ?? label) as string | undefined;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        v ? (styles[v] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30') : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
      )}
    >
      {label ?? variant}
    </span>
  );
}

export function StatusDot({ status }: { status: 'active' | 'warning' | 'error' }) {
  const colors = {
    active: 'bg-emerald-400',
    warning: 'bg-orange-400',
    error: 'bg-red-400',
  };
  return (
    <span className={clsx('inline-block h-2 w-2 rounded-full', colors[status])} />
  );
}
