import './i18n/i18n';
import './ui/styles.css';
import { initRouter, navigate } from './ui/router';
import { importSessionFromZip, mergeSession } from './core/sessionManager';
import { loadDefaultSession } from './core/defaultData';

declare global {
  var __session: any;
}

if (!globalThis.__session) {
  globalThis.__session = { current: null };
}

// Load default session on startup
(async () => {
  const defaultSession = await loadDefaultSession();
  globalThis.__session.current = defaultSession;
  console.log('Default session loaded with', defaultSession.tables.size, 'tables');
})();

window.addEventListener('session-import', async (event: any) => {
  const { file } = event.detail;
  try {
    console.log('Importing session from file:', file.name);
    const importedSession = await importSessionFromZip(file);
    const currentSession = globalThis.__session.current;
    
    // Merge imported into current (overwriting matching IDs)
    const merged = mergeSession(currentSession, importedSession);
    globalThis.__session.current = merged;
    
    console.log('Session merged:', merged.tables.size, 'total tables');
    navigate('tables');
  } catch (error) {
    console.error('Error importing session:', error);
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
    const { exportSessionAsZip } = await import('./core/sessionManager');
    const zip = await exportSessionAsZip(session);
    const url = URL.createObjectURL(zip);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting session:', error);
    alert('Error exporting session: ' + error);
  }
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

initRouter();
