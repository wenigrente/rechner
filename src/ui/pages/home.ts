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
      <div id="status" style="
        padding: 15px;
        margin-top: 1rem;
        background: #e3f2fd;
        border-radius: 4px;
        display: none;
      ">
        <p id="status-text" style="margin: 0; color: #1565c0;"></p>
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
  const statusEl = root.querySelector('#status') as HTMLDivElement;
  const statusText = root.querySelector('#status-text') as HTMLParagraphElement;

  if (!importZone || !fileInput) return;

  function handleFile(file: File): void {
    if (!statusEl || !statusText) return;
    statusText.textContent = '📥 Importiere...';
    statusEl.style.display = 'block';
    statusEl.style.background = '#e3f2fd';
    statusEl.style.color = '#1565c0';

    window.dispatchEvent(new CustomEvent('session-import', { detail: { file } }));

    setTimeout(() => {
      statusText.textContent = '✅ Session importiert!';
      statusEl.style.background = '#e8f5e9';
      statusEl.style.color = '#2e7d32';
    }, 500);
  }

  importZone.addEventListener('click', () => fileInput.click());

  importZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    importZone.style.background = '#e8f5e9';
    importZone.style.borderColor = '#4caf50';
  });

  importZone.addEventListener('dragleave', () => {
    importZone.style.background = '#f9f9f9';
    importZone.style.borderColor = '#ccc';
  });

  importZone.addEventListener('drop', (e) => {
    e.preventDefault();
    importZone.style.background = '#f9f9f9';
    importZone.style.borderColor = '#ccc';
    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.zip')) {
      handleFile(file);
    } else {
      alert('Bitte eine .zip-Datei ablegen');
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      handleFile(file);
    }
  });
}
