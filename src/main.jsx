import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão do Cifra&Play disponível. Atualizar agora?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline!')
  },
})

window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace; z-index: 9999; position: relative;">
      <h2>Erro Fatal:</h2>
      <p>${message}</p>
      <p>Source: ${source}:${lineno}:${colno}</p>
      <pre>${error?.stack}</pre>
    </div>
  `;
};

window.addEventListener('unhandledrejection', function(event) {
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace; z-index: 9999; position: relative;">
      <h2>Promise Rejeitada:</h2>
      <p>${event.reason}</p>
      <pre>${event.reason?.stack}</pre>
    </div>
  `;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
