import './i18n/i18n';
import App from './ui/App';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

new App(root);
