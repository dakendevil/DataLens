import { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { LineagePage } from '@/pages/LineagePage';
import { ImpactPage } from '@/pages/ImpactPage';
import { AiInsightsPage } from '@/pages/AiInsightsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ModernizationPage } from '@/pages/ModernizationPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { assets } from '@/data/estate';

function AppRoutes({ onOpenSearch, demoMode, onToggleDemo }: { onOpenSearch: () => void; demoMode: boolean; onToggleDemo: () => void }) {
  return (
    <Layout onOpenSearch={onOpenSearch} demoMode={demoMode} onToggleDemo={onToggleDemo}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/lineage" element={<LineagePage />} />
        <Route path="/impact" element={<ImpactPage />} />
        <Route path="/ai-insights" element={<AiInsightsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/modernization" element={<ModernizationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

function LandingRoute() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}

function AppInner() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleDemo = useCallback(() => {
    setDemoMode((v) => {
      const next = !v;
      if (next) {
        showToast('success', 'Demo Mode enabled — synthetic estate loaded');
      } else {
        showToast('info', 'Demo Mode disabled');
      }
      return next;
    });
  }, []);

  const runDemo = useCallback(() => {
    const asset = assets.find((a) => a.id === 'customer_cleaning_etl');
    if (!asset) return;
    showToast('info', `Demo: Opening ${asset.name}...`);
    setTimeout(() => {
      navigate(`/discover?asset=customer_cleaning_etl`);
      setTimeout(() => {
        showToast('info', 'Demo: Showing lineage graph...');
        navigate(`/lineage?asset=customer_cleaning_etl`);
        setTimeout(() => {
          showToast('info', 'Demo: Running impact simulation...');
          navigate(`/impact?asset=customer_cleaning_etl`);
          setTimeout(() => {
            showToast('success', 'Demo: Generating AI overview...');
            navigate(`/ai-insights`);
          }, 2500);
        }, 2500);
      }, 2500);
    }, 1000);
  }, [navigate]);

  const isLanding = location.pathname === '/';

  // Expose runDemo globally for the demo button
  useEffect(() => {
    (window as unknown as { __runDemo?: () => void }).__runDemo = runDemo;
  }, [runDemo]);

  if (isLanding) {
    return (
      <>
        <LandingRoute />
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <AppRoutes onOpenSearch={() => setSearchOpen(true)} demoMode={demoMode} onToggleDemo={toggleDemo} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  );
}
