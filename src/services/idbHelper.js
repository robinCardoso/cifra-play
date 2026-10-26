/**
 * idbHelper.js
 * 
 * Utilitário nativo de IndexedDB para persistir e recuperar objetos
 * estruturados complexos do navegador, incluindo FileSystemDirectoryHandle.
 * Sem dependências externas.
 */

const DB_NAME = 'cifraplay_backup_idb';
const DB_VERSION = 1;
const STORE_NAME = 'handles';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB não suportado'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva um handle de diretório no IndexedDB
 */
export async function setStoredDirectoryHandle(key, handle) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Falha ao salvar DirectoryHandle no IndexedDB:', err);
    return false;
  }
}

/**
 * Recupera um handle de diretório do IndexedDB
 */
export async function getStoredDirectoryHandle(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falha ao recuperar DirectoryHandle do IndexedDB:', err);
    return null;
  }
}

/**
 * Remove um handle do IndexedDB
 */
export async function removeStoredDirectoryHandle(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Falha ao remover DirectoryHandle do IndexedDB:', err);
    return false;
  }
}
