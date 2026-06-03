import i18next from '../i18n/i18n';

type PageId = 'home' | 'tables' | 'charts' | 'calculator' | 'bescheid' | 'planung' | 'demography';

interface RouterState {
  activePage: PageId;
}

let routerState: RouterState = {
  activePage: 'home',
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

  try {
    let module: any;
    if (active === 'home') {
      module = await import('./pages/home');
    } else if (active === 'tables') {
      module = await import('./pages/tables');
    } else if (active === 'charts') {
      module = await import('./pages/charts');
    } else if (active === 'calculator') {
      module = await import('./pages/calculator');
    } else if (active === 'bescheid') {
      module = await import('./pages/bescheid');
    } else if (active === 'planung') {
      module = await import('./pages/planung');
    } else if (active === 'demography') {
      module = await import('./pages/demography');
    } else {
      module = await import('./pages/home');
    }
    
    if (!module.render || typeof module.render !== 'function') {
      console.error(`Module for page '${active}' does not export a render function`);
      content.innerHTML = `<p>Error: Module for page '${active}' does not export a render function</p>`;
      return;
    }
    
    module.render(content);
  } catch (err) {
    console.error('Error loading page:', active, err);
    content.innerHTML = `<p>Error loading page '${active}': ${err instanceof Error ? err.message : String(err)}</p>`;
  }
}

function getShellHTML(active: PageId): string {
  const navItems = [
    { id: 'home' as PageId, label: i18next.t('nav.home'), icon: '🏠' },
    { id: 'tables' as PageId, label: i18next.t('nav.tables'), icon: '📊' },
    { id: 'charts' as PageId, label: 'Charts', icon: '📈' },
    { id: 'calculator' as PageId, label: 'Rechner', icon: '🧮' },
    { id: 'bescheid' as PageId, label: 'Bescheid', icon: '📋' },
    { id: 'planung' as PageId, label: 'Planung', icon: '🔮' },
    { id: 'demography' as PageId, label: 'Demography', icon: '👥' },
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
