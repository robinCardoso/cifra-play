import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY_AUTO_BACKUP = 'autoBackupEnabled';

/**
 * useAutoBackup
 * 
 * Gerencia backup automático em arquivo usando a File System Access API.
 * O usuário escolhe UMA VEZ uma pasta no computador. A partir daí, toda
 * alteração nos dados salva automaticamente um arquivo .json nessa pasta.
 * 
 * SEGURANÇA: O acesso à pasta NUNCA é concedido sem permissão explícita do usuário.
 * A cada sessão, o navegador pode pedir confirmação (depende do browser).
 * A referência ao diretório é mantida apenas em memória (não persiste entre sessões).
 */
export const useAutoBackup = () => {
  // Se o usuário ativou o backup automático
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(
    () => localStorage.getItem(STORAGE_KEY_AUTO_BACKUP) === 'true'
  );

  // Referência ao diretório escolhido (só existe em memória durante a sessão)
  const dirHandleRef = useRef(null);

  // Status visual para o usuário
  const [backupStatus, setBackupStatus] = useState('idle'); // 'idle' | 'saving' | 'ok' | 'error' | 'no_permission'
  const [lastBackupTime, setLastBackupTime] = useState(null);
  const [backupDirName, setBackupDirName] = useState(
    () => localStorage.getItem('autoBackupDirName') || null
  );

  // Verifica se a API é suportada
  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Persiste a preferência de ativação
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUTO_BACKUP, autoBackupEnabled);
  }, [autoBackupEnabled]);

  /**
   * Pede ao usuário que escolha uma pasta.
   * Retorna true se a pasta foi selecionada com sucesso.
   */
  const selectBackupFolder = useCallback(async () => {
    if (!isSupported) {
      alert('Seu navegador não suporta seleção de pasta. Use Chrome, Edge ou Opera.');
      return false;
    }
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'cifraplay-backup',
        mode: 'readwrite',
        startIn: 'documents',
      });
      dirHandleRef.current = dirHandle;
      setBackupDirName(dirHandle.name);
      localStorage.setItem('autoBackupDirName', dirHandle.name);
      setAutoBackupEnabled(true);
      setBackupStatus('ok');
      return true;
    } catch (err) {
      // Usuário cancelou — não é um erro
      if (err.name !== 'AbortError') {
        console.error('Erro ao selecionar pasta:', err);
        setBackupStatus('error');
      }
      return false;
    }
  }, [isSupported]);

  /**
   * Verifica (e re-solicita, se necessário) a permissão de escrita na pasta.
   */
  const verifyPermission = useCallback(async (dirHandle, withRequest = false) => {
    const opts = { mode: 'readwrite' };
    if ((await dirHandle.queryPermission(opts)) === 'granted') return true;
    if (withRequest && (await dirHandle.requestPermission(opts)) === 'granted') return true;
    return false;
  }, []);

  /**
   * Salva os dados na pasta escolhida.
   * Chamado automaticamente sempre que os dados mudam (via useEffect externo).
   */
  const saveBackupToFile = useCallback(async (data) => {
    if (!autoBackupEnabled || !dirHandleRef.current) return;

    const hasPermission = await verifyPermission(dirHandleRef.current, true);
    if (!hasPermission) {
      setBackupStatus('no_permission');
      return;
    }

    try {
      setBackupStatus('saving');
      const fileName = `CifraPlay_AutoBackup.json`;
      const fileHandle = await dirHandleRef.current.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify({ ...data, _savedAt: new Date().toISOString() }, null, 2));
      await writable.close();
      setBackupStatus('ok');
      setLastBackupTime(new Date());
    } catch (err) {
      console.error('Falha no backup automático:', err);
      setBackupStatus('error');
    }
  }, [autoBackupEnabled, verifyPermission]);

  /**
   * Desativa o backup automático e limpa as referências.
   */
  const disableAutoBackup = useCallback(() => {
    dirHandleRef.current = null;
    setAutoBackupEnabled(false);
    setBackupDirName(null);
    setBackupStatus('idle');
    localStorage.removeItem('autoBackupDirName');
  }, []);

  return {
    isSupported,
    autoBackupEnabled,
    backupStatus,
    lastBackupTime,
    backupDirName,
    selectBackupFolder,
    saveBackupToFile,
    disableAutoBackup,
  };
};
