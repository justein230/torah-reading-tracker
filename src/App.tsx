import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppShell, Tabs, Box, ActionIcon, Text, Indicator } from '@mantine/core';
import { useApp } from './context/AppContext.js';
import { useTabIndicator } from './hooks/useTabIndicator.js';
import { TABS, TAB_LABELS } from './constants.js';
import SettingsDrawer from './components/SettingsDrawer.js';
import BottomNav from './components/BottomNav.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import Overview   from './components/Overview.js';
import GridsTab   from './components/GridsTab.js';
import ReadingLog from './components/ReadingLog.js';
import Details    from './components/Details.js';
import Manage      from './components/Manage.js';
import Calendar    from './components/Calendar.js';
import type { Filters } from './types/index.js';

function filterCount(filters: Filters): number {
  let n = 0;
  if (filters.sefarim?.length)    n++;
  if (filters.years?.length)      n++;
  if (!filters.includeFutureDates) n++;
  if (filters.pctMode !== 'pseukim') n++;
  return n;
}

export default function App() {
  const { activeTab, setActiveTab, filters, setFilters, setSortMode, ready } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { tabListRef, indicatorRef } = useTabIndicator(activeTab);
  const headerRef     = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(106);

  // The tabs row is hidden below 768px (see .app-tabs-bar in global.css), so the header's
  // natural height shrinks on mobile. Measure it directly instead of hardcoding two heights.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeaderHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setFilters(f => ({
      ...f,
      sefarim:            p.get('sefarim')?.split(',') ?? [],
      years:              p.get('years')?.split(',').map(Number) ?? [],
      includeFutureDates: p.get('rereads') !== '0',
      pctMode:            p.get('pctby') === 'aliyot' ? 'aliyot' : 'pseukim',
    }));
    const sort = p.get('sort');
    if (sort) setSortMode(sort);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.querySelector('.mantine-AppShell-main')?.scrollTo({ top: 0 });
  }, [activeTab]);

  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (activeTab !== 'overview')         p.set('tab',    activeTab);
    if (filters.sefarim?.length)          p.set('sefarim', filters.sefarim.join(','));
    if (filters.years?.length)            p.set('years',  filters.years.join(','));
    if (!filters.includeFutureDates)      p.set('rereads', '0');
    if (filters.pctMode !== 'pseukim')    p.set('pctby',  filters.pctMode);
    const qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }, [activeTab, filters, ready]);

  const count = filterCount(filters);

  const tabPanel = () => {
    switch (activeTab) {
      case 'overview':  return <Overview />;
      case 'grid':      return <GridsTab />;
      case 'log':       return <ReadingLog />;
      case 'details':   return <Details />;
      case 'calendar':  return <Calendar />;
      case 'manage':    return <Manage />;
      default:          return null;
    }
  };

  return (
    <AppShell
      header={{ height: `calc(${headerHeight}px + env(safe-area-inset-top))` }}
      footer={{ height: { base: 60, sm: 0 } }}
      padding={0}
    >
      <AppShell.Header withBorder={false} className="app-header">
        <div ref={headerRef}>
          <div className="app-header-inner">
            <Box>
              <Text fw={700} size="lg" className="app-title">מעקב תורה</Text>
              <Text size="xs" c="dimmed">Torah Reading Tracker</Text>
            </Box>
            <Indicator label={count || undefined} size={16} disabled={count === 0} color="cyan">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open filters"
                style={{ color: 'var(--muted)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </ActionIcon>
            </Indicator>
          </div>

          <div className="app-tabs-bar">
            <Tabs value={activeTab} onChange={v => { if (v) setActiveTab(v); }} className="app-tabs-inner">
              <div ref={tabListRef} className="tab-list-wrap">
                <Tabs.List className="app-tabs-list">
                  {TABS.map(t => (
                    <Tabs.Tab key={t} value={t} data-value={t} className="app-tab">
                      {TAB_LABELS[t]}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
                <div ref={indicatorRef} className="indicator-line" />
              </div>
            </Tabs>
          </div>
        </div>
      </AppShell.Header>

      <AppShell.Main className="app-main" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="app-main-inner">
          <ErrorBoundary>
            {ready ? tabPanel() : (
              <Text c="dimmed" ta="center" mt="xl">Loading…</Text>
            )}
          </ErrorBoundary>
        </div>
      </AppShell.Main>

      <AppShell.Footer withBorder>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </AppShell.Footer>

      <SettingsDrawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onManageReadings={() => { setActiveTab('manage'); setDrawerOpen(false); }}
      />
    </AppShell>
  );
}
