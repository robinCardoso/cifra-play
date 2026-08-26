import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_, registration) {
    if (!registration) return

    const checkForUpdates = () => registration.update()
    setInterval(checkForUpdates, 60_000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates()
      }
    })
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline!')
  },
})

window.onerror = function(message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = "padding: 20px; color: red; background: rgba(0,0,0,0.9); font-family: monospace; z-index: 9999; position: fixed; top: 0; left: 0; right: 0; bottom: 0; overflow: auto;";
  errorDiv.innerHTML = `
    <h2>Erro Fatal:</h2>
    <p>${message}</p>
    <p>Source: ${source}:${lineno}:${colno}</p>
    <pre>${error?.stack}</pre>
    <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; color: black;">Fechar</button>
  `;
  document.body.appendChild(errorDiv);
};

window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && String(event.reason).includes('ServiceWorker')) {
    console.warn('Erro no Service Worker (normal em dev):', event.reason);
    return;
  }

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = "padding: 20px; color: red; background: rgba(0,0,0,0.9); font-family: monospace; z-index: 9999; position: fixed; top: 0; left: 0; right: 0; bottom: 0; overflow: auto;";
  errorDiv.innerHTML = `
    <h2>Promise Rejeitada:</h2>
    <p>${event.reason}</p>
    <pre>${event.reason?.stack}</pre>
    <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; color: black;">Fechar</button>
  `;
  document.body.appendChild(errorDiv);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
