import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, Search, Zap, Sparkles, Shield, Database, Network, TrendingDown } from 'lucide-react';
import { DevilLogo } from '@/components/layout/Layout';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-zinc-800/60 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <DevilLogo className="h-8 w-8" />
            <div>
              <p className="text-sm font-bold leading-tight">DakenDevil's</p>
              <p className="text-xs leading-tight text-red-500">DataLens</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Dashboard</Link>
            <Link to="/discover" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:inline">Discover</Link>
            <Link to="/lineage" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:inline">Lineage</Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              Launch DataLens
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs font-medium text-zinc-400">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              HACKATHON PROTOTYPE · SYNTHETIC DATA ESTATE
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              DakenDevil's <span className="text-red-500">DataLens</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
              See your data. Trace its dependencies. Predict the impact.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-zinc-500 sm:text-base">
              An intelligent data-estate platform that discovers assets, maps relationships, explains dependencies and simulates change impact before it becomes a production incident.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/30"
              >
                Launch DataLens
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/impact"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-zinc-600 hover:bg-zinc-800"
              >
                Explore Demo
                <Zap className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Workflow */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold tracking-wider sm:gap-4">
            {['DISCOVER', 'MAP', 'ANALYZE', 'ACT'].map((step, i) => (
              <div key={step} className="flex items-center gap-2 sm:gap-4">
                <span className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-300">{step}</span>
                {i < 3 && <ArrowRight className="h-4 w-4 text-red-500" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800/60 bg-zinc-900/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-12 lg:grid-cols-4">
          {[
            { label: 'Data Assets', value: '15' },
            { label: 'Relationships Mapped', value: '21' },
            { label: 'Critical Assets', value: '9' },
            { label: 'Teams Covered', value: '6' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-red-500">{s.value}</p>
              <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-8 text-center lg:p-12">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-red-600/10 blur-[80px]" />
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to see your data estate?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Explore the full interactive lineage graph, run impact simulations, and let AI explain your dependencies.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/30"
          >
            Launch DataLens
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-800/80 px-6 py-6 text-center">
        <p className="text-xs text-zinc-600">DakenDevil's DataLens · Hackathon Prototype · Synthetic Data Estate</p>
      </footer>
    </div>
  );
}

const features = [
  { icon: Search, title: 'Discover & Tag', description: 'Find every asset and understand the metadata that matters.' },
  { icon: GitBranch, title: 'Map Lineage', description: 'See how files, pipelines, tables, reports and models actually connect.' },
  { icon: Zap, title: 'Simulate Impact', description: 'Understand the blast radius before changing a critical asset.' },
  { icon: Sparkles, title: 'AI Insights', description: 'Turn complex dependencies into plain-language explanations.' },
];

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="group rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 transition-all hover:border-red-600/30 hover:shadow-lg hover:shadow-black/20">
      <div className="rounded-lg bg-red-600/10 p-3 w-fit transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5 text-red-500" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </div>
  );
}
