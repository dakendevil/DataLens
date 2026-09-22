import type { AssetType } from '@/types';
import { FileText, Workflow, Table2, Database, Plug, BarChart3, BrainCircuit, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<AssetType, LucideIcon> = {
  File: FileText,
  Pipeline: Workflow,
  Table: Table2,
  Database: Database,
  API: Plug,
  Report: BarChart3,
  Model: BrainCircuit,
};

export function AssetTypeIcon({ type, className, style }: { type: AssetType; className?: string; style?: React.CSSProperties }) {
  const Icon = iconMap[type] ?? HelpCircle;
  return <Icon className={className ?? 'h-4 w-4'} style={style} />;
}

export const assetTypeIcons = iconMap;
