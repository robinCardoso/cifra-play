import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  setStoredDirectoryHandle, 
  getStoredDirectoryHandle, 
  removeStoredDirectoryHandle 
} from '../services/idbHelper';

const STORAGE_KEY_AUTO_BACKUP = 'autoBackupEnabled';
const IDB_HANDLE_KEY = 'cifraplay_auto_backup_dir';
const BACKUP_FILE_NAME = 'CifraPlay_AutoBackup.json';
const BACKUP_BAK_FILE_NAME = 'CifraPlay_AutoBackup.bak.json';

/**
 * useAutoBackup
 * 
 * Gerencia backup automático robusto em pasta do computador:
 * 1. Persistência real de pasta via IndexedDB (sobrevive ao fechar navegador).
 * 2. Reconexão em 1 clique quando o navegador pede confirmação de permissão.
 * 3. Detecção e proteção contra sobrescrita de backup existente na pasta.
 * 4. Rotação de segurança automática (.bak) antes de sobrescrever.
 * 5. Trava de segurança contra gravação vazia acidental.
 * 6. Teste de gravação imediato para validar pastas protegidas do SO.
 */
export const useAutoBackup = () => {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(
    () => localStorage.getItem(STORAGE_KEY_AUTO_BACKUP) === 'true'
  );

  const dirHandleRef = useRef(null);

  // Status visual: 'idle' | 'saving' | 'ok' | 'error' | 'no_permission' | 'needs_permission'
  const [backupStatus, setBackupStatus] = useState('idle');
  const [lastBackupTime, setLastBackupTime] = useState(null);
  const [backupDirName, setBackupDirName] = useState(
    () => localStorage.getItem('autoBackupDirName') || null
  );

  // Estado para gerenciar conflitos ao selecionar uma pasta que já tem backup
  const [backupConflict, setBackupConflict] = useState(null);

  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Persiste a flag de ativação no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTO_BACKUP, String(autoBackupEnabled));
  }, [autoBackupEnabled]);

  /**
   * Re-hidratação ao carregar o app:
   * Tenta recuperar o handle da pasta salvo no IndexedDB
   */
  useEffect(() => {
    if (!isSupported || !autoBackupEnabled) return;

    let isMounted = true;

    async function rehydrateHandle() {
      try {
        const storedHandle = await getStoredDirectoryHandle(IDB_HANDLE_KEY);
        if (!storedHandle || !isMounted) return;

        dirHandleRef.current = storedHandle;
        setBackupDirName(storedHandle.name);
        localStorage.setItem('autoBackupDirName', storedHandle.name);

        // Verifica a permissão silenciosamente
        const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
        if (!isMounted) return;

        if (permission === 'granted') {
          setBackupStatus('ok');
        } else if (permission === 'prompt') {
          // O navegador exige que o usuário clique para reconfirmar
          setBackupStatus('needs_permission');
        } else {
          setBackupStatus('no_permission');
        }
      } catch (err) {
        console.warn('Erro ao reidratar pasta de backup do IndexedDB:', err);
      }
    }

    rehydrateHandle();

    return () => {
      isMounted = false;
    };
  }, [isSupported, autoBackupEnabled]);

  /**
   * Verifica permissão de escrita na pasta
   */
  const verifyPermission = useCallback(async (dirHandle, withRequest = false) => {
    if (!dirHandle) return false;
    try {
      const opts = { mode: 'readwrite' };
      if ((await dirHandle.queryPermission(opts)) === 'granted') return true;
      if (withRequest && (await dirHandle.requestPermission(opts)) === 'granted') return true;
      return false;
    } catch {
      return false;
    }
  }, []);

  /**
   * Reconecta a permissão da pasta com 1 clique do usuário
   */
  const reconnectBackupFolder = useCallback(async () => {
    if (!dirHandleRef.current) return false;
    try {
      const granted = await verifyPermission(dirHandleRef.current, true);
      if (granted) {
        setBackupStatus('ok');
        return true;
      } else {
        setBackupStatus('no_permission');
        return false;
      }
    } catch (err) {
      console.error('Erro ao reconectar permissão da pasta:', err);
      setBackupStatus('error');
      return false;
    }
  }, [verifyPermission]);

  /**
   * Teste de escrita real imediato na pasta selecionada
   */
  const testDirectoryWritable = async (dirHandle) => {
    const testFileName = `.cifraplay_write_test_${Date.now()}.tmp`;
    try {
      const testFile = await dirHandle.getFileHandle(testFileName, { create: true });
      const writable = await testFile.createWritable();
      await writable.write('ok');
      await writable.close();
      await dirHandle.removeEntry(testFileName).catch(() => {});
      return true;
    } catch (err) {
      console.error('Pasta não possui permissão de escrita real no SO:', err);
      return false;
    }
  };

  /**
   * Pede ao usuário que escolha uma pasta e realiza todas as verificações de segurança.
   * Se a pasta já tiver um backup anterior, abre o modal de conflito.
   */
  const selectBackupFolder = useCallback(async (currentAppData = null, onConflictDecision = null) => {
    if (!isSupported) {
      alert('Seu navegador não suporta seleção de pasta. Use Chrome, Edge, Brave ou Opera no Desktop.');
      return false;
    }

    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'cifraplay-backup-v2',
        mode: 'readwrite',
        startIn: 'documents',
      });

      // 1. Verificação de Escrita Real
      const isWritable = await testDirectoryWritable(dirHandle);
      if (!isWritable) {
        alert('A pasta selecionada é somente-leitura ou protegida pelo sistema operacional. Por favor, selecione outra pasta.');
        return false;
      }

      // 2. Verificação de Backup Existente na Pasta
      let existingBackupData = null;
      try {
        const fileHandle = await dirHandle.getFileHandle(BACKUP_FILE_NAME, { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed && (parsed.songLibrary?.length > 0 || parsed.repertoires?.length > 0)) {
          existingBackupData = {
            data: parsed,
            songCount: parsed.songLibrary?.length || 0,
            repCount: parsed.repertoires?.length || 0,
            date: parsed._savedAt || file.lastModified,
          };
        }
      } catch {
        // Arquivo não existe ou não pôde ser lido — pasta nova/limpa
      }

      // Se encontrou backup existente na pasta: ativa proteção de conflito
      if (existingBackupData) {
        return new Promise((resolve) => {
          setBackupConflict({
            folderName: dirHandle.name,
            backupSongCount: existingBackupData.songCount,
            backupRepCount: existingBackupData.repCount,
            backupDate: existingBackupData.date,
            appSongCount: currentAppData?.songLibrary?.length || 0,
            appRepCount: currentAppData?.repertoires?.length || 0,
            // Ações decididas pelo usuário no modal:
            onRestore: async () => {
              // Salva handle e ativa
              dirHandleRef.current = dirHandle;
              await setStoredDirectoryHandle(IDB_HANDLE_KEY, dirHandle);
              setBackupDirName(dirHandle.name);
              localStorage.setItem('autoBackupDirName', dirHandle.name);
              setAutoBackupEnabled(true);
              setBackupStatus('ok');
              setBackupConflict(null);
              if (onConflictDecision) onConflictDecision('restore', existingBackupData.data);
              resolve(true);
            },
            onMerge: async () => {
              dirHandleRef.current = dirHandle;
              await setStoredDirectoryHandle(IDB_HANDLE_KEY, dirHandle);
              setBackupDirName(dirHandle.name);
              localStorage.setItem('autoBackupDirName', dirHandle.name);
              setAutoBackupEnabled(true);
              setBackupStatus('ok');
              setBackupConflict(null);
              if (onConflictDecision) onConflictDecision('merge', existingBackupData.data);
              resolve(true);
            },
            onOverwrite: async () => {
              // Faz cópia de segurança .bak antes de sobrescrever
              try {
                const bakHandle = await dirHandle.getFileHandle(BACKUP_BAK_FILE_NAME, { create: true });
                const bakWritable = await bakHandle.createWritable();
                await bakWritable.write(JSON.stringify(existingBackupData.data, null, 2));
                await bakWritable.close();
              } catch (e) {
                console.warn('Não foi possível gerar .bak:', e);
              }

              dirHandleRef.current = dirHandle;
              await setStoredDirectoryHandle(IDB_HANDLE_KEY, dirHandle);
              setBackupDirName(dirHandle.name);
              localStorage.setItem('autoBackupDirName', dirHandle.name);
              setAutoBackupEnabled(true);
              setBackupStatus('ok');
              setBackupConflict(null);
              resolve(true);
            },
            onCancel: () => {
              setBackupConflict(null);
              resolve(false);
            }
          });
        });
      }

      // 3. Pasta limpa sem backup anterior: ativação direta
      dirHandleRef.current = dirHandle;
      await setStoredDirectoryHandle(IDB_HANDLE_KEY, dirHandle);
      setBackupDirName(dirHandle.name);
      localStorage.setItem('autoBackupDirName', dirHandle.name);
      setAutoBackupEnabled(true);
      setBackupStatus('ok');
      return true;

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao selecionar pasta:', err);
        setBackupStatus('error');
      }
      return false;
    }
  }, [isSupported]);

  /**
   * Salva os dados na pasta escolhida com rotação atômica de segurança (.bak)
   */
  const saveBackupToFile = useCallback(async (data) => {
    if (!autoBackupEnabled || !dirHandleRef.current) return;

    // Trava de segurança: impede apagar backup existente com biblioteca vazia acidental
    const hasAnyContent = (data.songLibrary && data.songLibrary.length > 0) || (data.repertoires && data.repertoires.length > 0);

    const hasPermission = await verifyPermission(dirHandleRef.current, false);
    if (!hasPermission) {
      setBackupStatus('needs_permission');
      return;
    }

    try {
      setBackupStatus('saving');

      // 1. Se o arquivo principal já existe, cria cópia .bak antes de sobrescrever
      try {
        const existingHandle = await dirHandleRef.current.getFileHandle(BACKUP_FILE_NAME, { create: false });
        const existingFile = await existingHandle.getFile();
        
        // Se a biblioteca do app está vazia mas o arquivo no disco tem dados, aborta a sobrescrita!
        if (!hasAnyContent && existingFile.size > 200) {
          console.warn('Segurança: tentativa de gravar biblioteca vazia sobre backup existente cancelada.');
          setBackupStatus('ok');
          return;
        }

        const existingText = await existingFile.text();
        const bakHandle = await dirHandleRef.current.getFileHandle(BACKUP_BAK_FILE_NAME, { create: true });
        const bakWritable = await bakHandle.createWritable();
        await bakWritable.write(existingText);
        await bakWritable.close();
      } catch {
        // Arquivo ainda não existia ou .bak falhou sem gravidade
      }

      // 2. Grava o novo backup atualizado
      const fileHandle = await dirHandleRef.current.getFileHandle(BACKUP_FILE_NAME, { create: true });
      const writable = await fileHandle.createWritable();
      const payload = {
        ...data,
        _app: 'Cifra&Play',
        _version: '1.1.0',
        _savedAt: new Date().toISOString(),
      };
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();

      setBackupStatus('ok');
      setLastBackupTime(new Date());
    } catch (err) {
      console.error('Falha no backup automático:', err);
      setBackupStatus('error');
    }
  }, [autoBackupEnabled, verifyPermission]);

  /**
   * Desativa o backup automático e limpa os registros
   */
  const disableAutoBackup = useCallback(async () => {
    dirHandleRef.current = null;
    setAutoBackupEnabled(false);
    setBackupDirName(null);
    setBackupStatus('idle');
    localStorage.removeItem('autoBackupDirName');
    localStorage.removeItem(STORAGE_KEY_AUTO_BACKUP);
    await removeStoredDirectoryHandle(IDB_HANDLE_KEY);
  }, []);

  return {
    isSupported,
    autoBackupEnabled,
    backupStatus,
    lastBackupTime,
    backupDirName,
    backupConflict,
    selectBackupFolder,
    reconnectBackupFolder,
    saveBackupToFile,
    disableAutoBackup,
  };
};

export default useAutoBackup;
