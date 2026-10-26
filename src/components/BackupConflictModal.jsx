import React from 'react';
import { 
  FolderOpen, 
  DownloadSimple, 
  ArrowsMerge, 
  FloppyDisk, 
  X, 
  WarningCircle, 
  Clock, 
  MusicNotes,
  Queue
} from '@phosphor-icons/react';

/**
 * BackupConflictModal
 * 
 * Modal de segurança disparado quando o usuário escolhe uma pasta que
 * JÁ POSSUI um arquivo CifraPlay_AutoBackup.json com músicas salvas.
 * 
 * Evita que o app vazio sobrescreva os dados da pasta por engano,
 * e oferece restaurar, mesclar ou manter com cópia .bak.
 */
const BackupConflictModal = ({
  isOpen,
  conflictData,
  onRestore,
  onMerge,
  onOverwrite,
  onCancel,
}) => {
  if (!isOpen || !conflictData) return null;

  const {
    folderName,
    backupSongCount = 0,
    backupRepCount = 0,
    backupDate,
    appSongCount = 0,
    appRepCount = 0,
  } = conflictData;

  const formattedDate = backupDate 
    ? new Date(backupDate).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Data desconhecida';

  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-amber-500/30 animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
              <WarningCircle size={24} weight="fill" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Backup Encontrado na Pasta!
              </h2>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-xs">
                Pasta: {folderName}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Comparativo: Pasta vs App Atual */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Esta pasta já contém um arquivo de backup do Cifra&Play. Para proteger suas músicas de sobrescritas acidentais, escolha o que deseja fazer:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Cartão do Backup na Pasta */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/30 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block">
                Na Pasta Selecionada
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <MusicNotes size={14} className="text-emerald-500" />
                <span>{backupSongCount} {backupSongCount === 1 ? 'música' : 'músicas'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Queue size={14} />
                <span>{backupRepCount} {backupRepCount === 1 ? 'repertório' : 'repertórios'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                <Clock size={12} />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Cartão do App Atual */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                No Aplicativo Agora
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <MusicNotes size={14} className="text-indigo-400" />
                <span>{appSongCount} {appSongCount === 1 ? 'música' : 'músicas'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Queue size={14} />
                <span>{appRepCount} {appRepCount === 1 ? 'repertório' : 'repertórios'}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                {appSongCount === 0 ? '⚠️ Biblioteca Vazia' : 'Dados em memória'}
              </div>
            </div>
          </div>

          {/* Opções de Ação */}
          <div className="space-y-2 pt-2">
            {/* Opção 1: Restaurar da pasta */}
            <button
              onClick={onRestore}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 active:scale-98"
            >
              <div className="flex items-center gap-3">
                <DownloadSimple size={20} weight="bold" />
                <div className="text-left">
                  <p className="font-black text-sm leading-tight">Restaurar da Pasta (Recomendado)</p>
                  <p className="text-[10px] opacity-85">Carrega as músicas da pasta para este navegador</p>
                </div>
              </div>
            </button>

            {/* Opção 2: Mesclar dados */}
            {appSongCount > 0 && (
              <button
                onClick={onMerge}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <ArrowsMerge size={20} weight="bold" />
                  <div className="text-left">
                    <p className="font-black text-sm leading-tight">Mesclar (Juntar Tudo)</p>
                    <p className="text-[10px] opacity-85">Une as músicas da pasta com as músicas do app</p>
                  </div>
                </div>
              </button>
            )}

            {/* Opção 3: Sobrescrever (cria cópia .bak por segurança) */}
            <button
              onClick={onOverwrite}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FloppyDisk size={16} />
                <div className="text-left">
                  <p className="font-semibold text-xs leading-tight">Manter dados do app e substituir pasta</p>
                  <p className="text-[10px] text-slate-400">Uma cópia .bak do backup antigo será preservada</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Rodapé / Cancelar */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancelar Seleção
          </button>
        </div>

      </div>
    </div>
  );
};

export default BackupConflictModal;
