import React from 'react';
import { useLibrary } from '../store/LibraryContext';
import { MusicNotes, MonitorPlay, Gear, List } from '@phosphor-icons/react';
import SongEditor from './SongEditor';
import RepertoireEditor from './RepertoireEditor';
import useIsMobile from '../hooks/useIsMobile';

const ManagerView = () => {
    const { activeSongId, activeRepertoireId, setIsSettingsModalOpen, setIsStageMode } = useLibrary();
    const isMobile = useIsMobile();

    if (activeSongId) {
        return <SongEditor />;
    }

    if (activeRepertoireId) {
        return <RepertoireEditor />;
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500">
                <MusicNotes size={48} weight="duotone" />
            </div>
            <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight">Cifra & Play</h2>
                <p className="text-slate-500 max-w-xs text-sm">
                    {isMobile
                        ? 'Toque em Repertórios ou Biblioteca na barra inferior para começar.'
                        : 'Selecione uma música na biblioteca ou carregue um repertório para começar sua performance.'
                    }
                </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm">
                <div 
                    onClick={() => { if(activeRepertoireId) setIsStageMode(true); }}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition-colors ${activeRepertoireId ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer group' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed'}`}
                >
                    <MonitorPlay size={24} className={`transition-colors ${activeRepertoireId ? 'text-indigo-500 group-hover:text-indigo-400' : 'text-slate-400'}`} />
                    <h3 className="font-bold text-sm">Modo Palco</h3>
                    <p className="text-[10px] text-slate-500">{activeRepertoireId ? 'Abra seu repertório formatado para palco.' : 'Abra um repertório para acessar.'}</p>
                </div>
                <div 
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-left space-y-2 cursor-pointer transition-colors group"
                >
                    <Gear size={24} className="text-slate-500 group-hover:text-indigo-500 transition-colors" />
                    <h3 className="font-bold text-sm">Configurações</h3>
                    <p className="text-[10px] text-slate-500">Ajuste o tema, fontes e licença.</p>
                </div>
            </div>
        </div>
    );
};

export default ManagerView;
