/**
 * Home page – welcome and import guide.
 */

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-header">
      <h2>Willkommen zu Wenigrente</h2>
    </div>
    
    <div class="panel">
      <h3>Pension Calculator</h3>
      <p>
        Interaktive Datenanalyse für Rentenniveaus, Armutsgefährdung und
        Altersvorsorgesysteme in Deutschland und der EU.
      </p>
      <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
        <strong>Erste Schritte:</strong>
        Gehen Sie zum Reiter "Datentabellen" um Ihre Daten zu importieren oder
        hochgeladene Sessions zu verwalten.
      </p>
    </div>

    <div class="panel">
      <h3>Session importieren</h3>
      <p>Drag & Drop eine <code>.zip</code>-Datei mit <code>manifest.yaml</code> hier ablegen:</p>
      <div id="import-zone" style="
        padding: 40px 20px;
        border: 2px dashed #ccc;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        background: #f9f9f9;
        margin-top: 1rem;
      ">
        <p style="margin: 0; color: #666;">📁 ZIP-Datei hier ablegen oder klicken</p>
        <input id="file-input" type="file" accept=".zip" style="display: none;">
      </div>
    </div>

    <div class="panel">
      <h3>Features</h3>
      <ul style="margin: 0; padding-left: 1.5rem;">
        <li>📊 Datentabellen ansehen und filtern</li>
        <li>📈 Interaktive Charts und Visualisierungen</li>
        <li>💾 Sessions als ZIP exportieren/importieren</li>
        <li>🌍 EU-Vergleiche und nationale Analysen</li>
      </ul>
    </div>
  `;

  const importZone = root.querySelector('#import-zone') as HTMLDivElement;
  const fileInput = root.querySelector('#file-input') as HTMLInputElement;

  if (!importZone || !fileInput) return;

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
    if (file) {
      window.dispatchEvent(new CustomEvent('session-import', { detail: { file } }));
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      window.dispatchEvent(new CustomEvent('session-import', { detail: { file } }));
    }
  });
}
