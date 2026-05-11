/**
 * Router with navigation sidebar.
 */

import i18next from '../i18n/i18n';

type PageId = 'home' | 'tables';

interface RouterState {
  activePage: PageId;
}

let routerState: RouterState = {
  activePage: 'home',
};

const pages: Record<PageId, () => Promise<{ render: (root: HTMLElement) => void }>> = {
  'home': () => import('./pages/home'),
  'tables': () => import('./pages/tables'),
};

export function navigate(pageId: PageId): void {
  routerState.activePage = pageId;
  renderApp();
}

export async function renderApp(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) return;

  const active = routerState.activePage;
  root.innerHTML = getShellHTML(active);
  attachNavListeners();

  const content = document.getElementById('page-content');
  if (!content) return;

  const pageKey = active in pages ? active : 'home';
  const module = await pages[pageKey as PageId]();
  module.render(content);
}

function getShellHTML(active: PageId): string {
  const navItems = [
    { id: 'home' as PageId, label: i18next.t('nav.home'), icon: '🏠' },
    { id: 'tables' as PageId, label: i18next.t('nav.tables'), icon: '📊' },
  ];

  const navHTML = navItems
    .map(
      item => `
    <button class="nav-btn ${item.id === active ? 'active' : ''}" data-page="${item.id}">
      ${item.icon} ${item.label}
    </button>
  `
    )
    .join('');

  return `
    <div class="shell">
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title">💰 Wenigrente</div>
          <div class="sidebar-subtitle">Rentensimulator</div>
        </div>
        <div class="sidebar-nav">${navHTML}</div>
        <div class="sidebar-footer">
          <button class="lang-btn" id="btn-de" title="Deutsch">🇩🇪</button>
          <button class="lang-btn" id="btn-en" title="English">🇬🇧</button>
        </div>
      </nav>
      <main class="content">
        <div id="page-content"></div>
      </main>
    </div>
  `;
}

function attachNavListeners(): void {
  document.querySelectorAll<HTMLButtonElement>('.nav-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset['page'] as PageId;
      if (pageId) navigate(pageId);
    });
  });

  document.getElementById('btn-de')?.addEventListener('click', () => {
    i18next.changeLanguage('de');
    renderApp();
  });

  document.getElementById('btn-en')?.addEventListener('click', () => {
    i18next.changeLanguage('en');
    renderApp();
  });
}

export function initRouter(): void {
  renderApp();
}
