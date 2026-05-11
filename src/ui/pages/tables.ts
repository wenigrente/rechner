declare global {
  var __session: any;
}

interface SortState {
  tableId: string;
  column: string | null;
  ascending: boolean | null;
}

let sortState: SortState[] = [];

function getSortState(tableId: string): SortState {
  let state = sortState.find(s => s.tableId === tableId);
  if (!state) {
    state = { tableId, column: null, ascending: null };
    sortState.push(state);
  }
  return state;
}

function formatCellValue(v: unknown, columnName?: string): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    // Debug: log first time we see a percentage
    if (v > 0 && v < 1) {
      console.warn(`[FORMAT] Column "${columnName}": value=${v}, isInteger=${Number.isInteger(v)}, v>0=${v > 0}, v<1=${v < 1}`);
    }

    // Only format as percentage if it's STRICTLY between 0 and 1 (not including 1)
    // AND it's NOT an integer (integers should be shown as-is)
    if (v > 0 && v < 1 && !Number.isInteger(v)) {
      return (v * 100).toFixed(1) + '%';
    }
    // For integers, show as-is
    if (Number.isInteger(v)) {
      return String(v);
    }
    // For other decimals, show with 2 decimal places
    return v.toFixed(2);
  }
  return String(v);
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

  // Build table list for dropdown
  const tableList = Array.from(session.tables.values()).map((table: any) => ({
    id: table.id,
    name: table.name || table.id
  }));

  // Add search + dropdown + viewer + export all at once
  container.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <div style="margin-bottom: 1rem;">
        <input id="table-list-search" type="text" placeholder="🔍 Nach Tabelle suchen..." style="
          width: 100%;
          padding: 10px 12px;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        " />
      </div>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <label style="font-weight: 600;">Tabelle auswählen:</label>
        <select id="table-selector" style="
          padding: 8px 12px;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          flex: 1;
        ">
          <option value="">-- Bitte auswählen --</option>
          ${tableList.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="table-viewer"></div>
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

  const selector = container.querySelector('#table-selector') as HTMLSelectElement;
  const viewer = container.querySelector('#table-viewer') as HTMLDivElement;
  const exportBtn = container.querySelector('#btn-export') as HTMLButtonElement;
  const tableListSearch = container.querySelector('#table-list-search') as HTMLInputElement;

  // Filter dropdown options based on search
  tableListSearch.addEventListener('input', () => {
    const searchTerm = tableListSearch.value.toLowerCase();
    const options = Array.from(selector.querySelectorAll('option'));
    
    options.forEach(option => {
      if (option.value === '') return; // Keep placeholder
      const text = option.textContent?.toLowerCase() || '';
      (option as HTMLOptionElement).style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
  });

  // Show table when selected
  selector.addEventListener('change', (e) => {
    const tableId = (e.target as HTMLSelectElement).value;
    if (!tableId) {
      viewer.innerHTML = '';
      return;
    }
    renderTable(viewer, session, tableId);
  });

  // Export handler
  exportBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('session-export'));
  });
}

function renderTable(viewer: HTMLElement, session: any, tableId: string): void {
  const table = session.tables.get(tableId);
  if (!table) {
    console.error('Table not found:', tableId);
    return;
  }

  const state = getSortState(tableId);

  // Get headers
  const headers = table.metadata?.columns.map((c: any) => c.name) || (table.data && table.data.length > 0 ? Object.keys(table.data[0]) : []);

  // Log the first row for debugging
  console.log(`[TABLE] Loading ${tableId}, first row:`, table.data?.[0]);

  // Sort data if needed (only if state.column is set and state.ascending is not null)
  let sortedData = table.data ? [...table.data] : [];
  if (state.column && state.ascending !== null && sortedData.length > 0) {
    const sortCol = state.column;
    sortedData.sort((a: any, b: any) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return state.ascending ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return state.ascending ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  // Initial render - will be filtered by search input handler
  let filteredData = sortedData;

  // Format rows
  const rows: string[][] = [];
  for (const row of filteredData) {
    const cells = headers.map((h: any) => {
      return formatCellValue((row as any)[h], h);
    });
    rows.push(cells);
  }

  // Build sortable table HTML
  const headerCells = headers.map((h: any) => {
    const isActive = state.column === h;
    let arrow = '';
    if (isActive) {
      arrow = state.ascending === true ? ' ▲' : state.ascending === false ? ' ▼' : '';
    }
    return `<th style="cursor: pointer; user-select: none; white-space: nowrap; padding: 8px; background: #f5f5f5;" class="sortable-header" data-column="${h}" data-table-id="${tableId}">${h}${arrow}</th>`;
  }).join('');

  const dataRows = rows.map(row =>
    `<tr>${row.map(cell => `<td style="padding: 8px;">${cell}</td>`).join('')}</tr>`
  ).join('');

  const dataTableHTML = rows.length > 0
    ? `<table class="tbl striped" style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
         <thead><tr>${headerCells}</tr></thead>
         <tbody>${dataRows}</tbody>
       </table>`
    : '<p style="color: #999; text-align: center;">Keine Daten</p>';

  // Render everything
  viewer.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <p style="font-size: 0.85rem; color: #666; margin: 0 0 0.5rem 0;">
        <strong>ID:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${table.id}</code>
      </p>
      <p style="font-size: 0.85rem; color: #666; margin: 0;">
        <strong>Typ:</strong> ${table.type}
        ${table.metadata?.source ? ` | <strong>Quelle:</strong> ${table.metadata.source}` : ''}
      </p>
    </div>

    <div style="margin-bottom: 1.5rem;">
      <input id="table-data-search" type="text" placeholder="🔍 In dieser Tabelle suchen..." style="
        width: 100%;
        padding: 8px 12px;
        font-size: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      " />
    </div>

    <div style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem;">
      <button class="btn-copy-csv" data-table-id="${table.id}" style="
        padding: 8px 12px;
        background: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
      ">
        📋 In Zwischenablage kopieren
      </button>
      <button class="btn-paste-csv" data-table-id="${table.id}" style="
        padding: 8px 12px;
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
      ">
        📌 Aus Zwischenablage ersetzen
      </button>
    </div>

    <div style="overflow-x: auto;">
      ${dataTableHTML}
    </div>
  `;

  // NOW setup event handlers AFTER rendering
  setupTableHandlers(viewer, session, tableId, sortedData, headers);
}

function setupTableHandlers(
  viewer: HTMLElement,
  session: any,
  _tableId: string,
  sortedData: any[],
  headers: string[]
): void {
  // Search input handler
  const searchInput = viewer.querySelector('#table-data-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      
      // Filter data
      let filteredData = sortedData;
      if (searchTerm) {
        filteredData = sortedData.filter((row: any) =>
          headers.some((h: any) => String(row[h] || '').toLowerCase().includes(searchTerm))
        );
      }

      // Format and render filtered rows
      const rows: string[][] = [];
      for (const row of filteredData) {
        const cells = headers.map((h: any) => {
          return formatCellValue((row as any)[h], h);
        });
        rows.push(cells);
      }

      const dataRows = rows.map(row =>
        `<tr>${row.map(cell => `<td style="padding: 8px;">${cell}</td>`).join('')}</tr>`
      ).join('');

      const tbody = viewer.querySelector('tbody') as HTMLTableSectionElement;
      if (tbody) {
        tbody.innerHTML = dataRows;
      }
    });
  }

  // Sort column header handler - 3-state toggle: none -> ASC -> DESC -> none
  const headers_th = viewer.querySelectorAll('.sortable-header') as NodeListOf<HTMLElement>;
  headers_th.forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset['column'];
      const tid = th.dataset['tableId'];
      if (!column || !tid) return;

      const s = getSortState(tid);
      
      // 3-state toggle
      if (s.column === column) {
        // Same column clicked again
        if (s.ascending === true) {
          // Was ascending, switch to descending
          s.ascending = false;
        } else if (s.ascending === false) {
          // Was descending, switch to no sort
          s.column = null;
          s.ascending = null;
        }
      } else {
        // Different column clicked, start with ascending
        s.column = column;
        s.ascending = true;
      }

      // Re-render the full table
      renderTable(viewer, session, tid);
    });
  });

  // Copy button
  const copyBtn = viewer.querySelector('.btn-copy-csv') as HTMLButtonElement;
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const tid = copyBtn.dataset['tableId'];
      if (!tid) return;

      const t = session.tables.get(tid);
      if (!t || !t.data) return;

      const csv = convertToCSV(t.data);
      navigator.clipboard.writeText(csv).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Kopiert!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      });
    });
  }

  // Paste button
  const pasteBtn = viewer.querySelector('.btn-paste-csv') as HTMLButtonElement;
  if (pasteBtn) {
    pasteBtn.addEventListener('click', () => {
      const tid = pasteBtn.dataset['tableId'];
      if (!tid) return;

      const t = session.tables.get(tid);
      if (!t) return;

      navigator.clipboard.readText().then(async (csv: string) => {
        try {
          const newData = parseCSV(csv);
          const currentHeaders = t.metadata?.columns.map((c: any) => c.name) || [];
          const newHeaders = Object.keys(newData[0] || {});

          if (JSON.stringify(currentHeaders.sort()) !== JSON.stringify(newHeaders.sort())) {
            alert(`Schema mismatch!\n\nErwartet: ${currentHeaders.join(', ')}\nErhalten: ${newHeaders.join(', ')}`);
            return;
          }

          t.data = newData;
          t.metadata = t.metadata || {};
          t.metadata.updated_at = new Date().toISOString();

          const tableRef = session.manifest.tables.find((tr: any) => tr.id === tid);
          if (tableRef) {
            tableRef.name = tableRef.name || 'Updated Table';
          }

          sortState = sortState.filter(s => s.tableId !== tid);
          renderTable(viewer, session, tid);
        } catch (error) {
          alert('Error parsing CSV: ' + error);
        }
      });
    });
  }
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

function parseCSV(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, unknown> = {};

    for (let j = 0; j < headers.length; j++) {
      let value: unknown = values[j] || '';

      if (typeof value === 'string' && value !== '') {
        const num = parseFloat(value);
        if (!isNaN(num) && value === String(num)) {
          value = num;
        }
      }

      row[headers[j]] = value;
    }

    data.push(row);
  }

  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
