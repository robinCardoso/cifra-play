import React, { useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { HardDrive, FolderOpen, X, ArrowRight } from '@phosphor-icons/react';

/**
 * BackupBanner
 * 
 * Aviso fixo que aparece enquanto o usuário não configurou
 * uma pasta de backup automático. Some quando:
 * - O usuário clica em "Configurar agora" e seleciona uma pasta
 * - O usuário dispensa o aviso (fica dispensado só até fechar o app)
 * 
 * Props:
 * - compact: boolean — exibição compacta para uso em drawers mobile
 */
const BackupBanner = ({ compact = false }) => {
    const {
        isSupported: backupApiSupported,
        autoBackupEnabled,
        selectBackupFolder,
        setIsSettingsModalOpen,
    } = useLibrary();

    // Controle local de dispensa (non-persistent: volta a aparecer na próxima sessão)
    const [dismissed, setDismissed] = useState(false);

    // Não mostra se: já configurado, dispensado, API não suportada
    if (autoBackupEnabled || dismissed || !backupApiSupported) return null;

    const handleConfigure = async () => {
        const selected = await selectBackupFolder();
        // Se o usuário cancelou o seletor, abre as Configurações como alternativa
        if (!selected) {
            setIsSettingsModalOpen(true);
        }
    };

    // Versão compacta para mobile drawer
    if (compact) {
        return (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">
                <HardDrive size={14} weight="fill" className="text-amber-400 flex-shrink-0" />
                <span className="text-[10px] text-amber-300 font-bold flex-1">Backup não configurado</span>
                <button
                    onClick={handleConfigure}
                    className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg"
                >
                    Configurar
                </button>
                <button onClick={() => setDismissed(true)} className="text-amber-500/50 p-1">
                    <X size={12} weight="bold" />
                </button>
            </div>
        );
    }

    return (
        <div className="
            relative mx-2 mb-2
            bg-gradient-to-br from-amber-500/20 to-orange-600/10
            border border-amber-500/40
            rounded-2xl p-3
            animate-in slide-in-from-bottom-2 fade-in duration-300
        ">
            {/* Botão fechar — canto superior direito */}
            <button
                onClick={() => setDismissed(true)}
                title="Dispensar aviso"
                className="absolute top-2 right-2 p-1 text-amber-500/40 hover:text-amber-300 transition-colors rounded-lg hover:bg-amber-500/10"
            >
                <X size={13} weight="bold" />
            </button>

            {/* Linha do título */}
            <div className="flex items-center gap-2 mb-1 pr-5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/25 flex items-center justify-center flex-shrink-0">
                    <HardDrive size={15} weight="fill" className="text-amber-400" />
                </div>
                <p className="text-xs font-black text-amber-300 leading-tight">
                    Backup não configurado
                </p>
            </div>

            {/* Subtexto */}
            <p className="text-[10px] text-amber-400/70 leading-relaxed mb-3 pl-9">
                Seus dados ficam só no navegador. Selecione uma pasta para salvar automaticamente.
            </p>

            {/* Botão ação — largura total */}
            <button
                onClick={handleConfigure}
                className="
                    w-full flex items-center justify-center gap-2
                    bg-amber-500 hover:bg-amber-400
                    text-slate-900 font-black text-[11px]
                    py-2 rounded-xl
                    transition-all hover:scale-[1.02] active:scale-[0.98]
                "
            >
                <FolderOpen size={14} weight="bold" />
                Selecionar Pasta de Backup
                <ArrowRight size={12} weight="bold" />
            </button>
        </div>
    );
};

export default BackupBanner;
