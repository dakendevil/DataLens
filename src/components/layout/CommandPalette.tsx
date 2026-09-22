import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, Layers, GitBranch } from 'lucide-react';
import { getAssets, getRelationships } from '@/lib/estateStore';
import { AssetTypeIcon } from '@/components/ui/AssetTypeIcon';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type SearchResult = {
  id: string;
  label: string;
  sublabel: string;
  type: 'asset' | 'owner' | 'team' | 'relationship';
  navigateTo?: string;
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const assets = getAssets();
    const relationships = getRelationships();

    const assetResults: SearchResult[] = assets
      .filter((a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q))
      .slice(0, 8)
      .map((a) => ({
        id: `asset-${a.id}`,
        label: a.name,
        sublabel: `${a.type} · ${a.team}`,
        type: 'asset',
        navigateTo: `/discover?asset=${a.id}`,
      }));

    const ownerResults: SearchResult[] = [...new Set(assets.map((a) => a.owner))]
      .filter((o) => o.toLowerCase().includes(q))
      .slice(0, 4)
      .map((o) => {
        const ownedAssets = assets.filter((a) => a.owner === o);
        return {
          id: `owner-${o}`,
          label: o,
          sublabel: `Owner · ${ownedAssets.length} asset${ownedAssets.length !== 1 ? 's' : ''}`,
          type: 'owner',
          navigateTo: `/discover?owner=${encodeURIComponent(o)}`,
        };
      });

    const teamResults: SearchResult[] = [...new Set(assets.map((a) => a.team))]
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 4)
      .map((t) => {
        const teamAssets = assets.filter((a) => a.team === t);
        return {
          id: `team-${t}`,
          label: t,
          sublabel: `Team · ${teamAssets.length} asset${teamAssets.length !== 1 ? 's' : ''}`,
          type: 'team',
          navigateTo: `/discover?team=${encodeURIComponent(t)}`,
        };
      });

    const relResults: SearchResult[] = relationships
      .filter((r) => r.relationshipType.toLowerCase().includes(q))
      .slice(0, 3)
      .map((r) => ({
        id: `rel-${r.id}`,
        label: r.relationshipType,
        sublabel: `Relationship type`,
        type: 'relationship',
        navigateTo: `/lineage`,
      }));

    return [...assetResults, ...ownerResults, ...teamResults, ...relResults];
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        const r = results[selectedIndex];
        if (r.navigateTo) navigate(r.navigateTo);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, navigate, onClose]);

  if (!open) return null;

  const icons = {
    asset: FileText,
    owner: User,
    team: Layers,
    relationship: GitBranch,
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[15vh] animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, owners, teams, relationships..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-600">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          )}
          {results.map((r, i) => {
            const Icon = icons[r.type];
            return (
              <button
                key={r.id}
                onClick={() => {
                  if (r.navigateTo) navigate(r.navigateTo);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selectedIndex ? 'bg-red-600/10' : 'hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${i === selectedIndex ? 'text-red-400' : 'text-zinc-500'}`} />
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{r.label}</p>
                  <p className="text-xs text-zinc-500">{r.sublabel}</p>
                </div>
                {r.type === 'asset' && (
                  <AssetTypeIcon type={getAssets().find((a) => `asset-${a.id}` === r.id)?.type ?? 'File'} className="h-4 w-4 text-zinc-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
