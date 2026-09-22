import { useState } from 'react';
import { Settings, Bell, Shield, Database, Sparkles, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState('70');
  const [theme, setTheme] = useState('dark');

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Configure DataLens preferences.</p>
      </div>

      <SettingsSection icon={Bell} title="Notifications">
        <ToggleRow
          label="Impact alerts"
          description="Get notified when high-criticality assets are modified."
          value={notifications}
          onChange={(v) => { setNotifications(v); showToast('info', `Impact alerts ${v ? 'enabled' : 'disabled'}`); }}
        />
        <ToggleRow
          label="Auto-refresh lineage"
          description="Automatically refresh the lineage graph every 30 seconds."
          value={autoRefresh}
          onChange={setAutoRefresh}
        />
      </SettingsSection>

      <SettingsSection icon={Shield} title="Data & Security">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-300">Confidence Threshold</label>
            <p className="mb-2 text-xs text-zinc-500">Minimum confidence for edges to be highlighted as high-confidence.</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(e.target.value)}
                className="flex-1 accent-red-600"
              />
              <span className="w-12 text-sm font-semibold text-red-400">{confidenceThreshold}%</span>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={Moon} title="Appearance">
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Theme</label>
            <div className="flex gap-2">
              {['dark', 'midnight', 'charcoal'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); showToast('info', `Theme set to ${t}`); }}
                  className={`rounded-lg border px-4 py-2 text-sm capitalize transition-colors ${theme === t ? 'border-red-600/30 bg-red-600/10 text-red-400' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={Database} title="Data Estate">
        <div className="space-y-3 text-sm">
          <Row label="Synthetic Dataset" value="Loaded (15 assets, 21 relationships)" />
          <Row label="Last Sync" value="Never (offline mode)" />
          <Row label="Mode" value="Hackathon Prototype" />
        </div>
      </SettingsSection>

      <SettingsSection icon={Globe} title="About">
        <div className="space-y-3 text-sm">
          <Row label="Application" value="DakenDevil's DataLens" />
          <Row label="Version" value="1.0.0-hackathon" />
          <Row label="Label" value="Hackathon Prototype · Synthetic Data Estate" />
        </div>
      </SettingsSection>

      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
        <Button variant="ghost" onClick={() => showToast('info', 'Settings reset')}>Reset</Button>
        <Button onClick={() => showToast('success', 'Settings saved')}>Save Changes</Button>
      </div>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-red-500" />
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-red-600' : 'bg-zinc-700'}`}
      >
        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}
