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
    <div id="tables-container"></div>
  `;

  const container = root.querySelector('#tables-container') as HTMLDivElement;
  if (!container) return;

  for (const [, table] of session.tables) {
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
      <div class="panel">
        <h3>${table.name || table.id}</h3>
        <p style="font-size: 0.85rem; color: #666; margin: 0.5rem 0;">
          <strong>Typ:</strong> ${table.type} | 
          <strong>Zeilen:</strong> ${table.data?.length || 0}
        </p>
        ${dataTableHTML}
        <div id="chart-${table.id}" style="margin-top: 1rem;"></div>
      </div>
    `;
    container.innerHTML += panelHTML;
  }

  container.innerHTML += `
    <div class="panel" style="text-align: center; margin-top: 2rem;">
      <button id="btn-export" class="btn btn-primary btn-lg">
        📥 Session exportieren
      </button>
    </div>
  `;

  root.querySelector('#btn-export')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('session-export'));
  });
}
