import i18next from '../i18n/i18n';
import { exportSessionAsZip, importSessionFromZip } from '../core/sessionManager';
import type { Session } from '../types/session';

class App {
  private root: HTMLElement;
  private currentSession: Session | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.root.innerHTML = `
      <div style="
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <header style="
          margin-bottom: 30px;
          border-bottom: 2px solid #ddd;
          padding-bottom: 20px;
        ">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">${i18next.t('app_title')}</h1>
          <p style="margin: 0; color: #666; font-size: 14px;">${i18next.t('app_subtitle')}</p>
        </header>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <button id="export-btn" style="
            padding: 12px 24px;
            font-size: 16px;
            cursor: pointer;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
          ">
            📥 ${i18next.t('export_session')}
          </button>
          
          <div id="import-zone" style="
            padding: 20px;
            border: 2px dashed #ccc;
            border-radius: 4px;
            text-align: center;
            cursor: pointer;
            background: #f9f9f9;
          ">
            <p style="margin: 0; color: #666;">${i18next.t('drag_drop_hint')}</p>
            <input id="file-input" type="file" accept=".zip" style="display: none;">
          </div>
        </div>

        <section id="status" style="
          padding: 15px;
          margin-bottom: 20px;
          background: #e3f2fd;
          border-radius: 4px;
          display: none;
        ">
          <p id="status-text" style="margin: 0; color: #1565c0;"></p>
        </section>

        <section id="tables-section" style="display: none;">
          <h2 style="margin-top: 0;">${i18next.t('tables_section')}</h2>
          <div id="tables-list"></div>
        </section>

        <div id="empty-state" style="
          text-align: center;
          padding: 40px;
          color: #999;
        ">
          <p>${i18next.t('empty_tables')}</p>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const exportBtn = this.root.querySelector('#export-btn') as HTMLButtonElement;
    const importZone = this.root.querySelector('#import-zone') as HTMLDivElement;
    const fileInput = this.root.querySelector('#file-input') as HTMLInputElement;

    exportBtn.addEventListener('click', () => this.handleExport());
    
    importZone.addEventListener('click', () => fileInput.click());
    importZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      importZone.style.background = '#e8f5e9';
    });
    importZone.addEventListener('dragleave', () => {
      importZone.style.background = '#f9f9f9';
    });
    importZone.addEventListener('drop', (e) => {
      e.preventDefault();
      importZone.style.background = '#f9f9f9';
      const file = e.dataTransfer?.files[0];
      if (file) this.handleImport(file);
    });

    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.handleImport(file);
    });
  }

  private async handleExport(): Promise<void> {
    if (!this.currentSession) {
      this.showStatus('No session to export', 'error');
      return;
    }

    try {
      const zip = await exportSessionAsZip(this.currentSession);
      const url = URL.createObjectURL(zip);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      this.showStatus('Session exported successfully', 'success');
    } catch (error) {
      this.showStatus(`Export failed: ${error}`, 'error');
    }
  }

  private async handleImport(file: File): Promise<void> {
    try {
      const session = await importSessionFromZip(file);
      this.currentSession = session;
      this.renderSession();
      this.showStatus(`Session imported: v${session.manifest.version}`, 'success');
    } catch (error) {
      this.showStatus(`Import failed: ${error}`, 'error');
    }
  }

  private renderSession(): void {
    const emptyState = this.root.querySelector('#empty-state') as HTMLDivElement;
    const tablesSection = this.root.querySelector('#tables-section') as HTMLDivElement;
    const tablesList = this.root.querySelector('#tables-list') as HTMLDivElement;

    if (!this.currentSession || this.currentSession.tables.size === 0) {
      emptyState.style.display = 'block';
      tablesSection.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    tablesSection.style.display = 'block';

    let html = '';
    for (const [, table] of this.currentSession.tables) {
      html += `
        <div style="
          padding: 15px;
          margin-bottom: 10px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
        ">
          <h3 style="margin: 0 0 10px 0;">${table.name || table.id}</h3>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">
            <strong>Type:</strong> ${table.type} | 
            <strong>Rows:</strong> ${table.data?.length || 0}
          </p>
          ${table.metadata ? `<p style="margin: 5px 0; font-size: 12px; color: #999;">Source: ${table.metadata.source}</p>` : ''}
        </div>
      `;
    }

    tablesList.innerHTML = html;
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    const statusEl = this.root.querySelector('#status') as HTMLDivElement;
    const statusText = this.root.querySelector('#status-text') as HTMLParagraphElement;

    statusText.textContent = message;
    statusEl.style.background = type === 'success' ? '#e8f5e9' : '#ffebee';
    statusEl.style.color = type === 'success' ? '#2e7d32' : '#c62828';
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 4000);
  }
}

export default App;
