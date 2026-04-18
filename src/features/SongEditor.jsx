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

    // Cálculo dinâmico das guias baseado no tamanho da letra e colunas do palco
    // Assumimos que o StageMode renderiza na tela uma área útil média de 35~38rem.
    // Multiplicamos o fontSize por 1.5 para considerar a altura real da linha (line-height)
    const linesPerColumn = Math.max(10, Math.floor(38 / (fontSize * 1.5)));
    const totalLinesPerPage = linesPerColumn * (columnCount || 1); 
    
    // Altura ABSOLUTA da linha no editor para sincronizar o background perfeitamente
    const editorLineHeight = 1.75; // Equivalente a leading-[1.75rem]
    const columnBreakInterval = linesPerColumn * editorLineHeight;
    const pageBreakInterval = totalLinesPerPage * editorLineHeight;

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

    // Função de formatação importada do StageMode para o Live Preview
    const formatLyrics = (text) => {
        if (!text) return null;
        const stanzas = text.split(/\n\s*\n/);
        return stanzas.map((stanza, stanzaIndex) => {
            const lines = stanza.split('\n');
            return (
                <div key={stanzaIndex} className="lyric-stanza mb-[1.5em] break-inside-avoid relative">
                    {lines.map((line, lineIndex) => {
                        const formattedLine = line.replace(/\[([^\]]+)\]/g, '<span class="chord font-bold text-indigo-400">[$1]</span>');
                        return (
                            <div key={lineIndex} className="lyric-line break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />
                        );
                    })}
                </div>
            );
        });
    };

    const activeCols = activeSong?.columns || columnCount || 1;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-4 md:p-8 animate-in fade-in duration-500">
            
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
                        <input 
                            list="artists-list"
                            value={activeSong.artist || ''}
                            onChange={(e) => handleFieldChange('artist', e.target.value)}
                            placeholder="Selecione..."
                            className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium w-full text-slate-800 dark:text-slate-200"
                        />
                        <datalist id="artists-list">
                            {artists.map(a => <option key={a} value={a} />)}
                        </datalist>
                    </div>

                    {/* Tom */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MusicNotes size={12} /> Tom</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors">
                                <PlusCircle size={14} weight="bold" />
                            </button>
                        </div>
                        <input 
                            list="keys-list"
                            value={activeSong.key || ''}
                            onChange={(e) => handleFieldChange('key', e.target.value)}
                            placeholder="--"
                            className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold w-full text-slate-800 dark:text-slate-200 uppercase"
                        />
                        <datalist id="keys-list">
                            {keys.map(k => <option key={k} value={k} />)}
                        </datalist>
                    </div>

                    {/* Estilo */}
                    <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between ml-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                            <label className="flex items-center gap-1"><MusicNote size={12} /> Estilo</label>
                            <button onClick={() => setIsListModalOpen(true)} className="text-indigo-500 hover:text-indigo-400 transition-colors">
                                <PlusCircle size={14} weight="bold" />
                            </button>
                        </div>
                        <input 
                            list="styles-list"
                            value={activeSong.style || ''}
                            onChange={(e) => handleFieldChange('style', e.target.value)}
                            placeholder="Sem Estilo"
                            className="bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium w-full text-slate-800 dark:text-slate-200"
                        />
                        <datalist id="styles-list">
                            {styles.map(s => <option key={s} value={s} />)}
                        </datalist>
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
                                    <audio 
                                        src={activeSong.audioUrl} 
                                        controls 
                                        className="h-9 w-full outline-none" 
                                    />
                                    <button 
                                        onClick={removeAudio} 
                                        className="text-red-400 hover:text-red-500 p-2 rounded-md transition-colors" 
                                        title="Remover Áudio"
                                    >
                                        <Trash size={18} weight="bold" />
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

            {/* Editor de Letras Original e Limpo */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Letra e Cifras</span>
                    <div className="flex items-center gap-4">
                        {/* Botão para Testar no Palco */}
                        <button 
                            onClick={() => {
                                setActiveSongId(activeSong.id);
                                setIsStageMode(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                        >
                            Ver no Palco
                        </button>

                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                            <Columns size={14} className="text-slate-400 ml-1" />
                            <div className="flex">
                                <button 
                                    onClick={() => handleFieldChange('columns', 1)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-all ${activeCols === 1 ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'} `}
                                >1 Col</button>
                                <button 
                                    onClick={() => handleFieldChange('columns', 2)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-all ${activeCols === 2 ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'} `}
                                >2 Cols</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 relative overflow-hidden group">
                    <textarea 
                        ref={textareaRef}
                        value={activeSong.lyrics}
                        onChange={(e) => handleFieldChange('lyrics', e.target.value)}
                        placeholder="Cole aqui sua letra com cifras..."
                        className="h-full w-full bg-transparent p-8 outline-none resize-none font-mono text-base md:text-lg leading-[1.75rem] text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-800 relative z-30"
                        style={{ 
                            backgroundImage: `
                                linear-gradient(to bottom, transparent calc(${pageBreakInterval}rem - 0.1rem), rgba(245, 158, 11, 0.8) calc(${pageBreakInterval}rem - 0.1rem), rgba(245, 158, 11, 0.8) calc(${pageBreakInterval}rem + 0.1rem), transparent calc(${pageBreakInterval}rem + 0.1rem)),
                                linear-gradient(to bottom, transparent calc(${columnBreakInterval}rem - 0.05rem), rgba(236, 72, 153, 0.5) calc(${columnBreakInterval}rem - 0.05rem), rgba(236, 72, 153, 0.5) calc(${columnBreakInterval}rem + 0.05rem), transparent calc(${columnBreakInterval}rem + 0.05rem)),
                                linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
                            `,
                            backgroundSize: `100% ${pageBreakInterval}rem, 100% ${columnBreakInterval}rem, 100% ${editorLineHeight}rem`,
                            backgroundAttachment: 'local',
                            backgroundRepeat: 'repeat-y'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SongEditor;
