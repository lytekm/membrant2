import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  ChartLineUp,
  CloudCheck,
  Compass,
  GearSix,
  House,
  Moon,
  Notebook,
  SidebarSimple,
  Sun,
  Target,
  X,
} from '@phosphor-icons/react';
import { useMembrant } from '@membrant/client';
import { stats, type Goal, type GoalTemplate } from '@membrant/core';
import { Overview } from '../features/dashboard/Overview';
import { GoalsPage } from '../features/goals/GoalsPage';
const GoalWizard = lazy(() =>
  import('../features/goals/GoalWizard').then((module) => ({ default: module.GoalWizard })),
);
const GoalDetail = lazy(() =>
  import('../features/goals/GoalDetail').then((module) => ({ default: module.GoalDetail })),
);
import { CheckInModal } from '../features/checkins/CheckInModal';
import { ProgressPage } from '../features/progress/ProgressPage';
import { ReflectionsPage } from '../features/reflections/ReflectionsPage';
import { TemplatesPage } from '../features/templates/TemplatesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { EmptyState } from '../components/ui';
import { applyAppearance, storedAppearance } from '../design/theme';

const navigation = [
  { path: '/', label: 'Overview', icon: House },
  { path: '/goals', label: 'My goals', icon: Target },
  { path: '/progress', label: 'Progress', icon: ChartLineUp },
  { path: '/reflections', label: 'Reflections', icon: Notebook },
  { path: '/templates', label: 'Templates', icon: Compass },
];

export function App() {
  const { state, loading, error, busy, mode, refresh, clearError, signOut, resetDemo } =
    useMembrant();
  const location = useLocation();
  const [wizard, setWizard] = useState<{ template?: GoalTemplate } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(storedAppearance);
  const [resolvedTheme, setResolvedTheme] = useState(() => applyAppearance(theme));
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      setResolvedTheme(applyAppearance(theme));
    };
    apply();
    media.addEventListener('change', apply);
    try {
      localStorage.setItem('membrant.theme', theme);
    } catch {
      /* Preference is nonessential. */
    }
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', update);
    window.addEventListener('storage', update);
    const timer = window.setInterval(update, 30_000);
    return () => {
      window.removeEventListener('focus', update);
      window.removeEventListener('storage', update);
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    setSelectedId(null);
    setLoggingId(null);
    setWizard(null);
  }, [mode]);
  const actions = {
    onCreate: (template?: GoalTemplate) => setWizard({ template }),
    onOpen: (goal: Goal) => setSelectedId(goal.id),
    onLog: (goal: Goal) => setLoggingId(goal.id),
  };
  const selected = state?.goals.find((goal) => goal.id === selectedId);
  const logging = state?.goals.find((goal) => goal.id === loggingId);
  const title = navigation.find((item) => item.path === location.pathname)?.label ?? 'Settings';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            m<span />
          </span>
          membrant<span className="brand-period">.</span>
        </Link>
        <nav aria-label="Main navigation">
          {navigation.map(({ path, label, icon: Icon }) => (
            <NavLink to={path} key={path} end={path === '/'}>
              <Icon size={21} weight={location.pathname === path ? 'duotone' : 'regular'} />
              {label}
              {path === '/goals' && state && (
                <span className="nav-count">{stats(state).active}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className="settings-link">
            <GearSix size={21} />
            Settings
            <ArrowUpRight size={15} />
          </NavLink>
          <div className="profile">
            <span className="avatar">{state?.profile.name.slice(0, 1).toUpperCase() ?? 'M'}</span>
            <div>
              <strong>{state?.profile.name ?? 'Your workspace'}</strong>
              <small>{mode === 'demo' ? 'Demo workspace' : 'Personal account'}</small>
            </div>
            <button
              className="icon-button theme-toggle"
              aria-label="Toggle color theme"
              title="Toggle color theme"
              onClick={() =>
                setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
              }
            >
              {resolvedTheme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <SidebarSimple size={21} />
            </button>
            <span className="muted">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{title}</strong>
          </div>
          <div className="row">
            <span className="save-indicator" role="status">
              {busy ? (
                'Saving…'
              ) : mode === 'demo' ? (
                'Saved on this device'
              ) : (
                <>
                  <CloudCheck size={17} />
                  Connected workspace
                </>
              )}
            </span>
            <span className="top-avatar">
              {state?.profile.name.slice(0, 1).toUpperCase() ?? 'M'}
            </span>
          </div>
        </header>
        <main id="main" className="main-content">
          {error && (
            <div className="global-error" role="alert">
              <span>{error}</span>
              <button className="icon-button" aria-label="Dismiss error" onClick={clearError}>
                <X size={18} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading-skeleton" aria-label="Loading your workspace" role="status">
              <div />
              <div />
              <section>
                <i />
                <i />
                <i />
              </section>
              <div />
            </div>
          ) : !state ? (
            <>
              <EmptyState
                title="Workspace unavailable"
                text="Your workspace could not be loaded. Check the connection and try again."
                action={() => void refresh()}
                label="Try again"
              />
              <div className="row center">
                <button
                  className="button secondary"
                  onClick={() => {
                    if (mode === 'demo') void resetDemo();
                    else void signOut().catch(() => {});
                  }}
                >
                  {mode === 'demo' ? 'Reset demo data' : 'Sign out'}
                </button>
              </div>
            </>
          ) : (
            <Routes>
              <Route path="/" element={<Overview {...actions} />} />
              <Route path="/goals" element={<GoalsPage {...actions} />} />
              <Route path="/progress" element={<ProgressPage {...actions} />} />
              <Route path="/reflections" element={<ReflectionsPage key={mode} />} />
              <Route path="/templates" element={<TemplatesPage {...actions} />} />
              <Route path="/settings" element={<SettingsPage key={mode} />} />
              <Route
                path="*"
                element={
                  <EmptyState
                    title="Page not found"
                    text="Use the navigation to return to your goals."
                  />
                }
              />
            </Routes>
          )}
        </main>
      </div>
      <Suspense
        fallback={
          <div className="loading-notice" role="status">
            Opening your workspace…
          </div>
        }
      >
        {wizard && <GoalWizard template={wizard.template} onClose={() => setWizard(null)} />}
        {selected && (
          <GoalDetail goal={selected} onClose={() => setSelectedId(null)} onLog={actions.onLog} />
        )}
      </Suspense>
      {logging && <CheckInModal goal={logging} onClose={() => setLoggingId(null)} />}
    </div>
  );
}
