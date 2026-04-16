import React, { useEffect, useRef } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { 
  PlusCircle, 
  DownloadSimple, 
  Trash, 
  MusicNote, 
  MicrophoneStage,
  MusicNotes
} from '@phosphor-icons/react';

const SongEditor = () => {
    const { 
        activeSong, updateSong, deleteSong,
        artists, keys, styles,
        setIsListModalOpen
    } = useLibrary();

    const textareaRef = useRef(null);
    const audioInputRef = useRef(null);

    if (!activeSong) return null;

    const handleFieldChange = (field, value) => {
        updateSong(activeSong.id, { [field]: value });
    };

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            updateSong(activeSong.id, { audioUrl: url, audioName: file.name });
        }
    };

    const removeAudio = () => {
        updateSong(activeSong.id, { audioUrl: null, audioName: null });
        if (audioInputRef.current) audioInputRef.current.value = "";
    };

    const exportLyrics = () => {
        const text = `${activeSong.title}\n${activeSong.artist}\n\n${activeSong.lyrics}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeSong.title || 'musica'}.txt`;
        a.click();
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-4 md:p-8 animate-in fade-in duration-500">
            
            {/* Cabeçalho do Editor */}
            <div className="flex-shrink-0 space-y-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <input 
                        type="text" 
                        value={activeSong.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        placeholder="Título da Música"
                        className="text-4xl font-black bg-transparent border-none focus:ring-0 focus:outline-none p-0 w-full text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    
                    <div className="flex items-center gap-2 self-end lg:self-center">
                        <button 
                            onClick={exportLyrics}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm"
                        >
                            <DownloadSimple size={20} weight="bold" />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                        <button 
                            onClick={() => deleteSong(activeSong.id)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all border border-red-500/20 hover:border-red-500 active:scale-95 text-sm"
                        >
                            <Trash size={20} weight="bold" />
                            <span className="hidden sm:inline">Excluir</span>
                        </button>
                    </div>
                </div>

                {/* Grid de Seletores Agrupados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                    {/* Artista */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MicrophoneStage size={12} /> Artista</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors">
                                <PlusCircle size={14} weight="bold" />
                            </button>
                        </div>
                        <select 
                            value={activeSong.artist}
                            onChange={(e) => handleFieldChange('artist', e.target.value)}
                            className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        >
                            <option value="">Selecione...</option>
                            {artists.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    {/* Tom */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MusicNotes size={12} /> Tom</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors">
                                <PlusCircle size={14} weight="bold" />
                            </button>
                        </div>
                        <select 
                            value={activeSong.key}
                            onChange={(e) => handleFieldChange('key', e.target.value)}
                            className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                        >
                            <option value="">--</option>
                            {keys.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>

                    {/* Estilo */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MusicNote size={12} /> Estilo</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors">
                                <PlusCircle size={14} weight="bold" />
                            </button>
                        </div>
                        <select 
                            value={activeSong.style}
                            onChange={(e) => handleFieldChange('style', e.target.value)}
                            className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        >
                            <option value="">Sem Estilo</option>
                            {styles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Áudio / Player */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 ml-1">Áudio de Apoio</label>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-between px-3 min-h-[40px]">
                            {activeSong.audioUrl ? (
                                <div className="flex items-center gap-2 w-full">
                                    <audio src={activeSong.audioUrl} controls className="h-6 w-full max-w-[150px] outline-none" />
                                    <button onClick={removeAudio} className="text-red-400 hover:text-red-500 p-1 rounded-md" title="Remover Áudio">
                                        <Trash size={16} weight="bold" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex w-full">
                                    <input 
                                        type="file" 
                                        accept="audio/mp3,audio/wav,audio/ogg" 
                                        onChange={handleAudioUpload}
                                        ref={audioInputRef}
                                        className="hidden" 
                                        id="audio-upload"
                                    />
                                    <label htmlFor="audio-upload" className="text-xs font-bold text-indigo-500 hover:text-indigo-400 cursor-pointer flex items-center gap-1 w-full justify-center h-full py-2">
                                        + Adicionar Trilha
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor de Letras */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Letra e Cifras</span>
                    <div className="text-[10px] text-slate-500 font-mono">DICA: Use [D] para acordes</div>
                </div>
                <textarea 
                    ref={textareaRef}
                    value={activeSong.lyrics}
                    onChange={(e) => handleFieldChange('lyrics', e.target.value)}
                    placeholder="Cole aqui sua letra com cifras..."
                    className="flex-1 w-full bg-transparent p-6 md:p-8 outline-none resize-none font-mono text-base md:text-lg leading-relaxed text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-800"
                />
            </div>
        </div>
    );
};

export default SongEditor;
