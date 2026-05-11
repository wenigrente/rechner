import { tableHTML } from '../charts';

declare global {
  var __session: any;
}

export function render(root: HTMLElement): void {
  const session = globalThis.__session?.current;

  if (!session || session.tables.size === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2>Datentabellen</h2>
      </div>
      <div class="panel">
        <p style="color: #999; text-align: center; padding: 40px;">
          Keine Tabellen geladen.
        </p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2>Datentabellen</h2>
      <span class="group-label">${session.tables.size} Tabelle(n) geladen</span>
    </div>
    <div id="tables-container" style="max-width: 1200px;"></div>
  `;

  const container = root.querySelector('#tables-container') as HTMLDivElement;
  if (!container) return;

  let tableIndex = 0;
  for (const [, table] of session.tables) {
    const tid = `table-${tableIndex}`;
    const rows: string[][] = [];
    if (table.data && Array.isArray(table.data)) {
      const headers = table.metadata?.columns.map((c: any) => c.name) || Object.keys(table.data[0]);
      for (const row of table.data) {
        const cells = headers.map((h: any) => {
          const v = row[h];
          if (v === null || v === undefined) return '';
          if (typeof v === 'number') {
            if (v >= 0 && v <= 1) return (v * 100).toFixed(1) + '%';
            return v.toFixed(2);
          }
          return String(v);
        });
        rows.push(cells);
      }
    }

    const headers = table.metadata?.columns.map((c: any) => c.name) || [];
    const dataTableHTML = rows.length > 0
      ? tableHTML(headers, rows)
      : '<p style="color: #999; text-align: center;">Keine Daten</p>';

    const panelHTML = `
      <div class="accordion-panel" style="
        border: 1px solid #ddd;
        border-radius: 6px;
        margin-bottom: 1rem;
        overflow: hidden;
      ">
        <button class="accordion-header" data-table-id="${tid}" style="
          width: 100%;
          padding: 16px;
          background: #f5f5f5;
          border: none;
          text-align: left;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s;
        ">
          <span>
            📊 ${table.name || table.id}
            <span style="font-size: 0.85rem; color: #666; font-weight: normal; margin-left: 0.5rem;">
              (${table.data?.length || 0} Zeilen)
            </span>
          </span>
          <span class="accordion-icon" style="font-size: 1.2rem; transition: transform 0.2s; display: inline-block;">▶</span>
        </button>
        <div class="accordion-content" data-table-id="${tid}" style="
          display: none;
          padding: 20px;
          background: white;
          border-top: 1px solid #ddd;
        ">
          <p style="font-size: 0.85rem; color: #666; margin: 0 0 1rem 0;">
            <strong>Typ:</strong> ${table.type}
            ${table.metadata?.source ? ` | <strong>Quelle:</strong> ${table.metadata.source}` : ''}
          </p>
          ${dataTableHTML}
          <div id="chart-${table.id}" style="margin-top: 1.5rem;"></div>
        </div>
      </div>
    `;
    container.innerHTML += panelHTML;
    tableIndex++;
  }

  // Export button
  container.innerHTML += `
    <div style="text-align: center; margin-top: 2rem;">
      <button id="btn-export" class="btn btn-primary btn-lg" style="
        padding: 12px 24px;
        background: #005DB5;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
      ">
        📥 Session exportieren
      </button>
    </div>
  `;

  // Attach export handler
  root.querySelector('#btn-export')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('session-export'));
  });

  // Event delegation for accordion headers
  container.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.accordion-header') as HTMLButtonElement;

    if (!button) return;

    const tableId = button.dataset['tableId'];
    if (!tableId) return;

    const content = container.querySelector(`.accordion-content[data-table-id="${tableId}"]`) as HTMLElement;
    const icon = button.querySelector('.accordion-icon') as HTMLElement;

    if (!content || !icon) return;

    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  // Add hover effects
  container.addEventListener('mouseover', (e: Event) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.accordion-header') as HTMLButtonElement;
    if (button) {
      button.style.background = '#efefef';
    }
  });

  container.addEventListener('mouseout', (e: Event) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.accordion-header') as HTMLButtonElement;
    if (button) {
      button.style.background = '#f5f5f5';
    }
  });
}
