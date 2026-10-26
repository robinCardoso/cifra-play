import React, { useRef, useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
import useIsMobile from '../hooks/useIsMobile';
import { 
    X, Moon, Sun, Key, DownloadSimple, UploadSimple, 
    CheckCircle, Warning, FolderOpen, HardDrive,
    ArrowsClockwise, XCircle, ShieldCheck, Info
} from '@phosphor-icons/react';

const SettingsModal = () => {
    const { 
        isSettingsModalOpen, setIsSettingsModalOpen,
        theme, setTheme,
        licenseKey, isLicensed, activateLicense, licenseError,
        songLibrary, repertoires, artists, keys, styles,
        setSongLibrary, setRepertoires, setArtists, setKeys, setStyles,
        requestConfirm,
        // Auto Backup
        isSupported: backupApiSupported,
        autoBackupEnabled,
        backupStatus,
        lastBackupTime,
        backupDirName,
        selectBackupFolder,
        reconnectBackupFolder,
        disableAutoBackup,
    } = useLibrary();

    const isMobile = useIsMobile();
    const [keyInput, setKeyInput] = useState(licenseKey || '');
    const [successMsg, setSuccessMsg] = useState('');
    const [importMode, setImportMode] = useState('restore'); // 'restore' ou 'merge'
    const [busyAction, setBusyAction] = useState(null); // 'export' | 'import' | 'folder'
    const [settingsTab, setSettingsTab] = useState('appearance');
    const fileInputRef = useRef(null);

    const settingsTabs = [
        { id: 'appearance', label: 'Tema', icon: Sun },
        { id: 'license', label: 'Licença', icon: Key },
        { id: 'backup', label: 'Arquivo', icon: DownloadSimple },
        { id: 'folder', label: 'Pasta', icon: HardDrive },
    ];

    if (!isSettingsModalOpen) return null;

    const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

    const handleKeySubmission = () => {
        const success = activateLicense(keyInput);
        if (success) {
            setSuccessMsg('Licença ativada com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    const applyBackupData = async (data, isMerge) => {
        await yieldToUi();
        if (isMerge) {
            if (data.songLibrary) {
                setSongLibrary((prev) => {
                    const existingIds = new Set(prev.map((s) => s.id));
                    const news = data.songLibrary.filter((s) => !existingIds.has(s.id));
                    return [...prev, ...news];
                });
            }
            if (data.repertoires) {
                setRepertoires((prev) => {
                    const existingIds = new Set(prev.map((r) => r.id));
                    const news = data.repertoires.filter((r) => !existingIds.has(r.id));
                    return [...prev, ...news];
                });
            }
            if (data.artists) setArtists((prev) => [...new Set([...prev, ...data.artists])]);
            if (data.keys) setKeys((prev) => [...new Set([...prev, ...data.keys])]);
            if (data.styles) setStyles((prev) => [...new Set([...prev, ...data.styles])]);
            setSuccessMsg('Backup mesclado com sucesso!');
        } else {
            if (data.songLibrary) setSongLibrary(data.songLibrary);
            if (data.repertoires) setRepertoires(data.repertoires);
            if (data.artists) setArtists(data.artists);
            if (data.keys) setKeys(data.keys);
            if (data.styles) setStyles(data.styles);
            setSuccessMsg('Biblioteca restaurada com sucesso!');
        }
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleExportBackup = async () => {
        if (busyAction) return;
        setBusyAction('export');
        try {
            await yieldToUi();
            const backupData = { songLibrary, repertoires, artists, keys, styles };
            const json = JSON.stringify(backupData);
            await yieldToUi();
            const blob = new Blob([json], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `CifraPlay_Backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
            setSuccessMsg('Backup exportado!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            alert('Não foi possível exportar o backup. Tente novamente.');
        } finally {
            setBusyAction(null);
        }
    };

    const processBackupFile = async (file, isMerge) => {
        setBusyAction('import');
        try {
            const text = await file.text();
            await yieldToUi();
            const data = JSON.parse(text);
            await applyBackupData(data, isMerge);
        } catch {
            alert('Arquivo de backup inválido ou muito grande para processar.');
        } finally {
            setBusyAction(null);
        }
    };

    const handleImportBackup = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isMerge = importMode === 'merge';

        requestConfirm(
            isMerge ? 'Mesclar Backup' : 'Restaurar Backup',
            isMerge 
                ? 'Deseja adicionar as músicas e repertórios deste backup à sua biblioteca atual? Músicas com o mesmo ID serão ignoradas.'
                : 'Deseja substituir sua biblioteca atual por este backup? As músicas não salvas no backup serão perdidas.',
            () => {
                processBackupFile(file, isMerge);
            }
        );
        e.target.value = null;
    };

    const handleSelectBackupFolder = async () => {
        if (busyAction) return;
        setBusyAction('folder');
        try {
            await selectBackupFolder();
        } finally {
            setBusyAction(null);
        }
    };

    const cardPad = 'p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-700';
    const contentScrollPad = isMobile
        ? 'px-3 pt-2 pb-[max(5.5rem,env(safe-area-inset-bottom,0px))]'
        : 'px-5 py-4 pb-5';
    const btnSm =
        'inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 min-h-[34px]';
    const btnSmBlock = `${btnSm} w-full`;

    return (
        <div
            className={`fixed inset-0 z-[500] flex animate-in fade-in duration-200 ${
                isMobile ? 'items-end justify-stretch bg-black/85' : 'items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md'
            }`}
            onClick={() => isMobile && setIsSettingsModalOpen(false)}
            role="presentation"
        >
            <div
                className={`bg-white dark:bg-slate-900 w-full shadow-2xl overflow-hidden flex flex-col min-h-0 ${
                    isMobile
                        ? 'max-h-[min(92dvh,100%)] rounded-t-2xl border-t border-slate-200 dark:border-slate-700'
                        : 'max-w-lg rounded-3xl max-h-[min(90vh,calc(100dvh-1rem))]'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 px-3 py-2 md:px-5 md:py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2 bg-slate-50 dark:bg-slate-800/50 safe-top">
                    <h2 className="text-sm md:text-lg font-black text-slate-900 dark:text-white truncate">Configurações</h2>
                    <button
                        type="button"
                        onClick={() => setIsSettingsModalOpen(false)}
                        aria-label="Fechar configurações"
                        className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                <nav
                    className="flex-shrink-0 flex gap-1 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 overflow-x-auto scrollbar-thin"
                    aria-label="Seções de configuração"
                >
                    {settingsTabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setSettingsTab(id)}
                            className={`flex-shrink-0 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-wide transition-all min-h-[32px] ${
                                settingsTab === id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Icon size={14} weight="bold" />
                            {label}
                        </button>
                    ))}
                </nav>

                {successMsg && (
                    <div className="flex-shrink-0 mx-2 mt-1.5 md:mx-4 bg-emerald-500 text-center text-white text-[10px] font-bold py-1.5 px-2 rounded-md animate-in zoom-in-95">
                        {successMsg}
                    </div>
                )}

                <div className={`flex-1 overflow-y-auto flex flex-col gap-3 min-h-[200px] ${contentScrollPad}`}>
                    {busyAction && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-200 text-[10px]">
                            <ArrowsClockwise size={14} className="animate-spin flex-shrink-0" />
                            <span className="leading-snug">
                                {busyAction === 'export' && 'Gerando backup…'}
                                {busyAction === 'import' && 'Aplicando backup…'}
                                {busyAction === 'folder' && 'Aguardando pasta…'}
                            </span>
                        </div>
                    )}

                    {settingsTab === 'appearance' && (
                    <section className="space-y-2 animate-in fade-in duration-150">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Escolha o tema do aplicativo.</p>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => setTheme('light')}
                                className={`${btnSm} flex-1 border ${theme === 'light' ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/50 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                            >
                                <Sun size={15} weight="bold" /> Claro
                            </button>
                            <button 
                                type="button"
                                onClick={() => setTheme('dark')}
                                className={`${btnSm} flex-1 border ${theme === 'dark' ? 'bg-slate-800 border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                            >
                                <Moon size={15} weight="bold" /> Escuro
                            </button>
                        </div>
                    </section>
                    )}

                    {settingsTab === 'license' && (
                    <section className="space-y-2 animate-in fade-in duration-150">
                        <div className={`bg-slate-50 dark:bg-slate-800/50 space-y-2 ${cardPad}`}>
                            <div className="flex items-center gap-2">
                                {isLicensed ? <CheckCircle size={20} weight="fill" className="text-emerald-500 flex-shrink-0" /> : <Warning size={20} weight="fill" className="text-amber-500 flex-shrink-0" />}
                                <span className="font-bold text-xs md:text-sm dark:text-white leading-tight">
                                    {isLicensed ? 'Ativa' : 'Aguardando ativação'}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-col sm:flex-row sm:items-stretch">
                                <div className="relative flex-1 min-w-0">
                                    <Key size={16} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input 
                                        type="text" 
                                        value={keyInput}
                                        onChange={e => setKeyInput(e.target.value)}
                                        placeholder="Chave de licença"
                                        className="w-full pl-8 pr-2 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium dark:text-slate-200 min-h-[34px]"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleKeySubmission}
                                    className={`${btnSm} bg-indigo-600 hover:bg-indigo-700 text-white px-4 flex-shrink-0`}
                                >
                                    Ativar
                                </button>
                            </div>
                            {licenseError && <p className="text-red-500 text-[10px] font-bold">{licenseError}</p>}
                        </div>
                    </section>
                    )}

                    {settingsTab === 'backup' && (
                    <section className="space-y-2 animate-in fade-in duration-150">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Arquivo JSON da biblioteca completa.</p>
                        <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef} 
                            onChange={handleImportBackup} 
                            className="hidden" 
                        />
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={!!busyAction}
                                onClick={handleExportBackup}
                                className={`${btnSmBlock} bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700`}
                            >
                                <DownloadSimple size={16} weight="bold" />
                                Exportar backup
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={!!busyAction}
                                    onClick={() => { setImportMode('restore'); setTimeout(() => fileInputRef.current?.click(), 10); }} 
                                    className={`${btnSm} bg-slate-50 hover:bg-emerald-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700`}
                                >
                                    <UploadSimple size={15} />
                                    Restaurar
                                </button>
                                <button
                                    type="button"
                                    disabled={!!busyAction}
                                    onClick={() => { setImportMode('merge'); setTimeout(() => fileInputRef.current?.click(), 10); }} 
                                    className={`${btnSm} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25`}
                                >
                                    <CheckCircle size={15} />
                                    Mesclar
                                </button>
                            </div>
                        </div>
                    </section>
                    )}

                    {settingsTab === 'folder' && (
                    <section className="space-y-2 animate-in fade-in duration-150">
                        {!backupApiSupported && (
                            <div className={`flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 ${cardPad}`}>
                                <Warning size={18} weight="fill" className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] md:text-xs text-amber-300 leading-snug">
                                    {isMobile
                                        ? 'No celular use Exportar/Mesclar acima. Pasta automática: Chrome ou Edge no computador.'
                                        : 'Seu navegador não suporta pasta local. Use Chrome, Edge ou Opera no desktop.'}
                                </p>
                            </div>
                        )}

                        {backupApiSupported && !autoBackupEnabled && (
                            <>
                                {!isMobile && (
                                    <div className={`flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/30 ${cardPad}`}>
                                        <Info size={18} weight="fill" className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-[11px] md:text-xs text-indigo-300 leading-snug">
                                            Escolha uma pasta; o app grava <code className="bg-indigo-900/50 px-1 rounded text-[10px]">CifraPlay_AutoBackup.json</code> a cada alteração.
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={!!busyAction}
                                    onClick={handleSelectBackupFolder}
                                    className={`${btnSmBlock} bg-slate-50 hover:bg-indigo-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700`}
                                >
                                    <FolderOpen size={16} />
                                    Selecionar pasta
                                </button>
                            </>
                        )}

                        {backupApiSupported && autoBackupEnabled && (
                            <div className={`bg-slate-800/50 dark:bg-slate-800/80 space-y-2 ${cardPad}`}>
                                {/* Pasta selecionada */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <FolderOpen size={18} className="text-emerald-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pasta</p>
                                        <p className="text-xs md:text-sm font-bold text-white truncate">{backupDirName || '—'}</p>
                                    </div>
                                </div>

                                {backupStatus === 'needs_permission' ? (
                                    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-stretch sm:items-center justify-between gap-2 bg-amber-500/15 border border-amber-500/30 rounded-lg p-2.5`}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <ShieldCheck size={16} weight="fill" className="text-amber-400 flex-shrink-0" />
                                            <p className="text-[11px] font-bold text-amber-300 leading-tight">Reconectar pasta</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={reconnectBackupFolder}
                                            className={`${btnSm} bg-amber-500 hover:bg-amber-400 text-slate-900 flex-shrink-0`}
                                        >
                                            Reconectar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-2.5 py-2 min-h-[40px]">
                                        {backupStatus === 'saving' && <ArrowsClockwise size={15} className="text-indigo-400 animate-spin flex-shrink-0" />}
                                        {backupStatus === 'ok' && <CheckCircle size={15} weight="fill" className="text-emerald-400 flex-shrink-0" />}
                                        {backupStatus === 'error' && <XCircle size={15} weight="fill" className="text-red-400 flex-shrink-0" />}
                                        {backupStatus === 'no_permission' && <ShieldCheck size={15} weight="fill" className="text-amber-400 flex-shrink-0" />}
                                        {backupStatus === 'idle' && <HardDrive size={15} className="text-slate-500 flex-shrink-0" />}

                                        <span className="text-[11px] md:text-xs text-slate-300 flex-1 leading-snug">
                                            {backupStatus === 'saving' && 'Salvando…'}
                                            {backupStatus === 'ok' && (
                                                lastBackupTime
                                                    ? `Salvo ${lastBackupTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                                                    : 'Ativo'
                                            )}
                                            {backupStatus === 'error' && 'Erro ao salvar'}
                                            {backupStatus === 'no_permission' && 'Sem permissão'}
                                            {backupStatus === 'idle' && 'Backup automático ativo'}
                                        </span>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={!!busyAction}
                                        onClick={handleSelectBackupFolder}
                                        className={`${btnSm} flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200`}
                                    >
                                        <FolderOpen size={14} /> Trocar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={disableAutoBackup}
                                        className={`${btnSm} flex-1 bg-red-500/10 text-red-400 border border-red-500/20`}
                                    >
                                        <XCircle size={14} /> Desativar
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
