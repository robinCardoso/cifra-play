import React from 'react';
import { useLibrary } from '../store/LibraryContext';
import { MusicNotes, MonitorPlay, Gear } from '@phosphor-icons/react';
import SongEditor from './SongEditor';

const ManagerView = () => {
    const { activeSongId, activeSong } = useLibrary();

    if (!activeSongId) {
        // ... tela de boas vindas ...
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500">
                    <MusicNotes size={48} weight="duotone" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight">Cifra & Play V2</h2>
                    <p className="text-slate-500 max-w-xs text-sm">
                        Selecione uma música na biblioteca ou carregue um repertório para começar sua performance.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-sm">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
                        <MonitorPlay size={24} className="text-indigo-500" />
                        <h3 className="font-bold text-sm">Modo Palco</h3>
                        <p className="text-[10px] text-slate-500">Abra seu repertório formatado para palco.</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
                        <Gear size={24} className="text-slate-500" />
                        <h3 className="font-bold text-sm">Configurações</h3>
                        <p className="text-[10px] text-slate-500">Ajuste o tema, fontes e chaves de licença.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SongEditor />
    );
};

export default ManagerView;
