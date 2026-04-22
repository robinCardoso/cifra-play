import React, { useEffect, useRef, useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { 
  PlusCircle, 
  DownloadSimple, 
  Trash, 
  MusicNote, 
  MicrophoneStage,
  MusicNotes,
  PencilSimple,
  Columns,
  CaretLeft
} from '@phosphor-icons/react';

const SongEditor = () => {
    const { 
        activeSong, updateSong, deleteSong,
        artists, keys, styles,
        setIsListModalOpen, fontSize, columnCount,
        setIsStageMode, setActiveSongId
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

    const activeCols = activeSong?.columns || columnCount || 1;

    return (
        <>
        {/* ══════════════════════════════════════════════════════
            MOBILE: layout scrollável — tudo em fluxo vertical
            ══════════════════════════════════════════════════════ */}
        <div className="flex md:hidden flex-1 flex-col min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-900 animate-in fade-in duration-300"
             style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* Linha 1: Voltar + Ações (ícones apenas) */}
            <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
                <button 
                    onClick={() => setActiveSongId(null)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                >
                    <CaretLeft size={17} weight="bold" />
                    Voltar
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={exportLyrics}
                        className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-md"
                        title="Exportar letra"
                    >
                        <DownloadSimple size={18} weight="bold" />
                    </button>
                    <button onClick={() => deleteSong(activeSong.id)}
                        className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 active:scale-95 transition-all"
                        title="Excluir música"
                    >
                        <Trash size={18} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Título — largura total */}
            <div className="px-3 pb-2">
                <input 
                    type="text" 
                    value={activeSong.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Título da Música"
                    className="text-2xl font-black bg-white dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none rounded-2xl px-4 py-3 w-full text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                />
            </div>

            {/* Campos de metadados — grade 2×2 */}
            <div className="px-3 pb-2">
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                    
                    {/* Artista */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-slate-400 px-1">
                            <label className="flex items-center gap-1"><MicrophoneStage size={10} /> Artista</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500"><PlusCircle size={11} weight="bold" /></button>
                        </div>
                        <input list="artists-list-m" value={activeSong.artist || ''} onChange={(e) => handleFieldChange('artist', e.target.value)}
                            placeholder="Artista..." className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium w-full dark:text-slate-200" />
                        <datalist id="artists-list-m">{artists.map(a => <option key={a} value={a} />)}</datalist>
                    </div>

                    {/* Tom */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-slate-400 px-1">
                            <label className="flex items-center gap-1"><MusicNotes size={10} /> Tom</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500"><PlusCircle size={11} weight="bold" /></button>
                        </div>
                        <input list="keys-list-m" value={activeSong.key || ''} onChange={(e) => handleFieldChange('key', e.target.value)}
                            placeholder="--" className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold w-full dark:text-slate-200 uppercase" />
                        <datalist id="keys-list-m">{keys.map(k => <option key={k} value={k} />)}</datalist>
                    </div>

                    {/* Estilo */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-slate-400 px-1">
                            <label className="flex items-center gap-1"><MusicNote size={10} /> Estilo</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500"><PlusCircle size={11} weight="bold" /></button>
                        </div>
                        <input list="styles-list-m" value={activeSong.style || ''} onChange={(e) => handleFieldChange('style', e.target.value)}
                            placeholder="Estilo..." className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium w-full dark:text-slate-200" />
                        <datalist id="styles-list-m">{styles.map(s => <option key={s} value={s} />)}</datalist>
                    </div>

                    {/* Áudio */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 px-1">Áudio</label>
                        <div className="bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center min-h-[38px]">
                            {activeSong.audioUrl ? (
                                <div className="flex items-center w-full p-1 gap-1">
                                    <audio src={activeSong.audioUrl} controls className="h-7 w-full outline-none" />
                                    <button onClick={removeAudio} className="text-red-400 p-1 flex-shrink-0"><Trash size={13} weight="bold" /></button>
                                </div>
                            ) : (
                                <>
                                    <input type="file" accept="audio/mp3,audio/wav,audio/ogg" onChange={handleAudioUpload} ref={audioInputRef} className="hidden" id="audio-upload-m" />
                                    <label htmlFor="audio-upload-m" className="text-xs font-bold text-indigo-500 cursor-pointer py-2 px-3 text-center">+ Trilha</label>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Área da Letra — toolbar sticky, textarea cresce com conteúdo */}
            <div className="mx-3 mb-4 flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                {/* Toolbar STICKY — gruda no topo quando o usuário rola para a letra */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Letra e Cifras</span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => { setActiveSongId(activeSong.id); setIsStageMode(true); }}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95"
                        >
                            Ver no Palco
                        </button>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg">
                            <Columns size={12} className="text-slate-400 ml-1" />
                            <button onClick={() => handleFieldChange('columns', 1)}
                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase transition-all ${activeCols === 1 ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
                            >1</button>
                            <button onClick={() => handleFieldChange('columns', 2)}
                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase transition-all ${activeCols === 2 ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-400'}`}
                            >2</button>
                        </div>
                    </div>
                </div>
                {/* Textarea — cresce com o conteúdo, sem altura mínima forçada */}
                <textarea
                    value={activeSong.lyrics}
                    onChange={(e) => handleFieldChange('lyrics', e.target.value)}
                    placeholder="Cole aqui sua letra com cifras..."
                    rows={20}
                    className="w-full bg-transparent p-4 outline-none resize-none font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-700"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                />
            </div>

        </div>

        {/* ══════════════════════════════════════════════════════
            DESKTOP: layout flex-col original (sem scroll geral)
            ══════════════════════════════════════════════════════ */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-8 animate-in fade-in duration-500">
            
            {/* Cabeçalho do Editor */}
            <div className="flex-shrink-0 space-y-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="group relative w-full lg:w-1/2 flex items-center gap-3">
                        <button 
                            onClick={() => setActiveSongId(null)}
                            className="group flex items-center gap-2 px-4 py-2 bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:text-indigo-500 font-bold text-sm border border-transparent hover:border-indigo-500/30"
                        >
                            <CaretLeft size={20} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
                            <span>Voltar</span>
                        </button>
                        <input 
                            type="text" 
                            value={activeSong.title}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            placeholder="Título da Música"
                            title="Clique para editar o nome da música"
                            className="text-3xl md:text-4xl font-black bg-transparent border-b-2 border-transparent focus:border-indigo-500/50 outline-none hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-xl px-2 py-1 w-full text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 transition-all pr-12"
                        />
                        <PencilSimple size={24} weight="bold" className="absolute right-3 text-indigo-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <div className="flex items-center gap-2 self-end lg:self-center">
                        <button 
                            onClick={exportLyrics}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm"
                        >
                            <DownloadSimple size={20} weight="bold" />
                            <span>Exportar</span>
                        </button>
                        <button 
                            onClick={() => deleteSong(activeSong.id)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all border border-red-500/20 hover:border-red-500 active:scale-95 text-sm"
                        >
                            <Trash size={20} weight="bold" />
                            <span>Excluir</span>
                        </button>
                    </div>
                </div>

                {/* Grid de Seletores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                    {/* Artista */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MicrophoneStage size={12} /> Artista</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors"><PlusCircle size={14} weight="bold" /></button>
                        </div>
                        <input list="artists-list" value={activeSong.artist || ''} onChange={(e) => handleFieldChange('artist', e.target.value)}
                            placeholder="Selecione..." className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium w-full text-slate-800 dark:text-slate-200" />
                        <datalist id="artists-list">{artists.map(a => <option key={a} value={a} />)}</datalist>
                    </div>
                    {/* Tom */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MusicNotes size={12} /> Tom</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors"><PlusCircle size={14} weight="bold" /></button>
                        </div>
                        <input list="keys-list" value={activeSong.key || ''} onChange={(e) => handleFieldChange('key', e.target.value)}
                            placeholder="--" className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold w-full text-slate-800 dark:text-slate-200 uppercase" />
                        <datalist id="keys-list">{keys.map(k => <option key={k} value={k} />)}</datalist>
                    </div>
                    {/* Estilo */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MusicNote size={12} /> Estilo</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors"><PlusCircle size={14} weight="bold" /></button>
                        </div>
                        <input list="styles-list" value={activeSong.style || ''} onChange={(e) => handleFieldChange('style', e.target.value)}
                            placeholder="Sem Estilo" className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium w-full text-slate-800 dark:text-slate-200" />
                        <datalist id="styles-list">{styles.map(s => <option key={s} value={s} />)}</datalist>
                    </div>
                    {/* Áudio / Player */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 ml-1 flex justify-between">
                            <span>Áudio de Apoio</span>
                            {activeSong.audioName && <span className="text-indigo-400 font-normal truncate max-w-[120px]" title={activeSong.audioName}>{activeSong.audioName}</span>}
                        </label>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-between px-2 min-h-[44px]">
                            {activeSong.audioUrl ? (
                                <div className="flex items-center gap-1 w-full p-1">
                                    <audio src={activeSong.audioUrl} controls className="h-9 w-full outline-none" />
                                    <button onClick={removeAudio} className="text-red-400 hover:text-red-500 p-2 rounded-md transition-colors" title="Remover Áudio">
                                        <Trash size={18} weight="bold" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex w-full">
                                    <input type="file" accept="audio/mp3,audio/wav,audio/ogg" onChange={handleAudioUpload} ref={audioInputRef} className="hidden" id="audio-upload" />
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
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden min-h-0">
                <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Letra e Cifras</span>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { setActiveSongId(activeSong.id); setIsStageMode(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                        >
                            Ver no Palco
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            A quebra real e visualizacao final sao validadas no palco
                        </span>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                            <Columns size={14} className="text-slate-400 ml-1" />
                            <div className="flex">
                                <button onClick={() => handleFieldChange('columns', 1)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-all ${activeCols === 1 ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >1 Col</button>
                                <button onClick={() => handleFieldChange('columns', 2)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-all ${activeCols === 2 ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >2 Cols</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative overflow-hidden group min-h-0">
                    <textarea 
                        ref={textareaRef}
                        value={activeSong.lyrics}
                        onChange={(e) => handleFieldChange('lyrics', e.target.value)}
                        placeholder="Cole aqui sua letra com cifras..."
                        className="h-full w-full bg-transparent p-8 outline-none resize-none font-mono text-base md:text-lg leading-[1.75rem] text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-800 relative z-30"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    />
                </div>
            </div>
        </div>
        </>
    );
};

export default SongEditor;
