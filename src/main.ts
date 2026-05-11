import './i18n/i18n';
import './ui/styles.css';
import { initRouter } from './ui/router';
import { importSessionFromZip, exportSessionAsZip } from './core/sessionManager';

declare global {
  var __session: any;
}

if (!globalThis.__session) {
  globalThis.__session = { current: null };
}

window.addEventListener('session-import', async (event: any) => {
  const { file } = event.detail;
  try {
    const session = await importSessionFromZip(file);
    globalThis.__session.current = session;
    window.location.href = '#/tables';
    // Re-render
    const { renderApp } = await import('./ui/router');
    setTimeout(() => renderApp(), 100);
  } catch (error) {
    alert('Error importing session: ' + error);
  }
});

window.addEventListener('session-export', async () => {
  const session = globalThis.__session.current;
  if (!session) {
    alert('No session to export');
    return;
  }
  try {
    const zip = await exportSessionAsZip(session);
    const url = URL.createObjectURL(zip);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('Error exporting session: ' + error);
  }
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

initRouter();
