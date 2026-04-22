import React, { useRef, useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
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
        disableAutoBackup,
    } = useLibrary();

    const [keyInput, setKeyInput] = useState(licenseKey || '');
    const [successMsg, setSuccessMsg] = useState('');
    const [importMode, setImportMode] = useState('restore'); // 'restore' ou 'merge'
    const fileInputRef = useRef(null);

    if (!isSettingsModalOpen) return null;

    const handleKeySubmission = () => {
        const success = activateLicense(keyInput);
        if (success) {
            setSuccessMsg('Licença ativada com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    const handleExportBackup = () => {
        const backupData = { songLibrary, repertoires, artists, keys, styles };
        const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `CifraPlay_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
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
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        if (isMerge) {
                            // Lógica de Mesclagem
                            if (data.songLibrary) {
                                setSongLibrary(prev => {
                                    const existingIds = new Set(prev.map(s => s.id));
                                    const news = data.songLibrary.filter(s => !existingIds.has(s.id));
                                    return [...prev, ...news];
                                });
                            }
                            if (data.repertoires) {
                                setRepertoires(prev => {
                                    const existingIds = new Set(prev.map(r => r.id));
                                    const news = data.repertoires.filter(r => !existingIds.has(r.id));
                                    return [...prev, ...news];
                                });
                            }
                            // Metadados simples (strings)
                            if (data.artists) setArtists(prev => [...new Set([...prev, ...data.artists])]);
                            if (data.keys) setKeys(prev => [...new Set([...prev, ...data.keys])]);
                            if (data.styles) setStyles(prev => [...new Set([...prev, ...data.styles])]);
                            
                            setSuccessMsg('Backup mesclado com sucesso!');
                        } else {
                            // Lógica de Restauração (Substituição)
                            if (data.songLibrary) setSongLibrary(data.songLibrary);
                            if (data.repertoires) setRepertoires(data.repertoires);
                            if (data.artists) setArtists(data.artists);
                            if (data.keys) setKeys(data.keys);
                            if (data.styles) setStyles(data.styles);
                            setSuccessMsg('Biblioteca restaurada com sucesso!');
                        }
                        
                        setTimeout(() => setSuccessMsg(''), 3000);
                    } catch (err) {
                        alert('Arquivo de backup inválido.');
                    }
                };
                reader.readAsText(file);
            }
        );
        e.target.value = null; // reseta o input
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Configurações</h2>
                    <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex flex-col gap-8 space-y-2">
                    
                    {/* Aparencia */}
                    <section className="space-y-3">
                        <h3 className="text-xs uppercase font-black text-slate-400 tracking-widest">Aparência</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setTheme('light')}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${theme === 'light' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}
                            >
                                <Sun size={18} weight="bold" /> Claro
                            </button>
                            <button 
                                onClick={() => setTheme('dark')}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${theme === 'dark' ? 'bg-slate-800 border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700'}`}
                            >
                                <Moon size={18} weight="bold" /> Escuro
                            </button>
                        </div>
                    </section>

                    {/* Licença */}
                    <section className="space-y-3">
                        <h3 className="text-xs uppercase font-black text-slate-400 tracking-widest">Autenticação (AES)</h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center gap-2">
                                {isLicensed ? <CheckCircle size={24} weight="fill" className="text-emerald-500" /> : <Warning size={24} weight="fill" className="text-amber-500" />}
                                <span className="font-bold text-sm dark:text-white">
                                    Licença {isLicensed ? 'Ativa e Validada' : 'Aguardando Ativação'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Key size={20} className="text-slate-400 absolute mt-3 ml-3" />
                                <input 
                                    type="text" 
                                    value={keyInput}
                                    onChange={e => setKeyInput(e.target.value)}
                                    placeholder="Insira sua Chave de Licença"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium dark:text-slate-200"
                                />
                                <button onClick={handleKeySubmission} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 rounded-xl text-sm transition-colors">
                                    Ativar
                                </button>
                            </div>
                            {licenseError && <p className="text-red-500 text-xs font-bold pt-1">{licenseError}</p>}
                        </div>
                    </section>

                    {/* Banco de Dados */}
                    <section className="space-y-3">
                        <h3 className="text-xs uppercase font-black text-slate-400 tracking-widest">Banco de Dados e Backup</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleExportBackup} className="py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 font-bold text-sm bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700 border-b-4 active:border-b active:translate-y-[3px]">
                                <DownloadSimple size={24} /> Exportar Backup
                            </button>
                            
                            <input 
                                type="file" 
                                accept=".json" 
                                ref={fileInputRef} 
                                onChange={handleImportBackup} 
                                className="hidden" 
                            />
                            <div className="grid grid-cols-1 gap-2">
                                <button 
                                    onClick={() => { setImportMode('restore'); setTimeout(() => fileInputRef.current?.click(), 10); }} 
                                    className="py-2 px-4 rounded-xl flex items-center gap-2 font-bold text-[11px] bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-emerald-400 transition-all border border-slate-200 dark:border-slate-700 border-b-2 active:border-b active:translate-y-[1px]"
                                >
                                    <UploadSimple size={16} /> Restaurar (Substituir)
                                </button>
                                <button 
                                    onClick={() => { setImportMode('merge'); setTimeout(() => fileInputRef.current?.click(), 10); }} 
                                    className="py-2 px-4 rounded-xl flex items-center gap-2 font-bold text-[11px] bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all border border-emerald-500/20 border-b-2 active:border-b active:translate-y-[1px]"
                                >
                                    <CheckCircle size={16} /> Mesclar (Adicionar)
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Backup Automático */}
                    <section className="space-y-3">
                        <h3 className="text-xs uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
                            <HardDrive size={14} /> Backup Automático em Pasta
                        </h3>

                        {/* Aviso sobre compatibilidade */}
                        {!backupApiSupported && (
                            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                                <Warning size={20} weight="fill" className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-300 leading-relaxed">
                                    Seu navegador não suporta seleção de pasta local. <br />
                                    Use <strong>Chrome, Edge ou Opera</strong> no desktop para ativar essa função.
                                </p>
                            </div>
                        )}

                        {backupApiSupported && !autoBackupEnabled && (
                            <>
                                {/* Card informativo */}
                                <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
                                    <Info size={20} weight="fill" className="text-indigo-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-indigo-300 leading-relaxed space-y-1">
                                        <p className="font-bold text-indigo-200">Como funciona?</p>
                                        <p>Selecione uma pasta no seu computador. A cada alteração, o app salva automaticamente um arquivo <code className="bg-indigo-900/50 px-1 rounded">CifraPlay_AutoBackup.json</code> nessa pasta.</p>
                                        <p className="text-indigo-400">O navegador pedirá sua permissão antes de qualquer gravação.</p>
                                    </div>
                                </div>

                                {/* Botão selecionar pasta */}
                                <button
                                    onClick={selectBackupFolder}
                                    className="w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 transition-all border border-slate-200 dark:border-slate-700 border-b-4 active:border-b active:translate-y-[3px]"
                                >
                                    <FolderOpen size={22} />
                                    Selecionar Pasta de Backup
                                </button>
                            </>
                        )}

                        {backupApiSupported && autoBackupEnabled && (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
                                {/* Pasta selecionada */}
                                <div className="flex items-center gap-3">
                                    <FolderOpen size={20} className="text-emerald-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Pasta Ativa</p>
                                        <p className="text-sm font-bold text-white truncate">{backupDirName || 'Pasta selecionada'}</p>
                                    </div>
                                </div>

                                {/* Status do último backup */}
                                <div className="flex items-center gap-3 bg-slate-900/60 rounded-xl px-3 py-2">
                                    {backupStatus === 'saving' && <ArrowsClockwise size={16} className="text-indigo-400 animate-spin" />}
                                    {backupStatus === 'ok' && <CheckCircle size={16} weight="fill" className="text-emerald-400" />}
                                    {backupStatus === 'error' && <XCircle size={16} weight="fill" className="text-red-400" />}
                                    {backupStatus === 'no_permission' && <ShieldCheck size={16} weight="fill" className="text-amber-400" />}
                                    {backupStatus === 'idle' && <HardDrive size={16} className="text-slate-500" />}

                                    <span className="text-xs text-slate-300 flex-1">
                                        {backupStatus === 'saving' && 'Salvando backup...'}
                                        {backupStatus === 'ok' && (
                                            lastBackupTime
                                                ? `Salvo às ${lastBackupTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                                                : 'Backup ativo — aguardando alterações'
                                        )}
                                        {backupStatus === 'error' && 'Erro ao salvar. Verifique as permissões.'}
                                        {backupStatus === 'no_permission' && 'Permissão negada. Clique abaixo para reconfigurar.'}
                                        {backupStatus === 'idle' && 'Backup automático ativo'}
                                    </span>
                                </div>

                                {/* Ações */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={selectBackupFolder}
                                        className="flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                                    >
                                        <FolderOpen size={14} /> Trocar Pasta
                                    </button>
                                    <button
                                        onClick={disableAutoBackup}
                                        className="flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
                                    >
                                        <XCircle size={14} /> Desativar
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                    
                    {/* Alertas Rapidos */}
                    {successMsg && (
                        <div className="bg-emerald-500 text-center text-white text-xs font-bold p-2 mb-2 rounded-xl animate-in zoom-in-95">
                            {successMsg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
