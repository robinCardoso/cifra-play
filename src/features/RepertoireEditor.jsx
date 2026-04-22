import React, { useState, useMemo } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { ReactSortable } from 'react-sortablejs';
import { 
    X, 
    DotsSixVertical, 
    CaretLeft, 
    CaretRight, 
    ArrowUp, 
    ArrowDown, 
    MagnifyingGlass,
    PencilSimple
} from '@phosphor-icons/react';

const RepertoireEditor = () => {
    const { 
        activeRepertoireId, setActiveRepertoireId, 
        repertoires, songLibrary, styles, 
        updateRepertoire, setActiveSongId 
    } = useLibrary();

    const activeRepertoire = repertoires.find(r => r.id === activeRepertoireId);
    
    // Filtros da Biblioteca Direita
    const [searchTerm, setSearchTerm] = useState('');
    const [styleFilter, setStyleFilter] = useState('');

    const librarySongs = useMemo(() => {
        const repertoireSongIds = new Set(activeRepertoire ? activeRepertoire.songIds : []);
        return songLibrary.filter(song => {
            if (repertoireSongIds.has(song.id)) return false;
            const matchSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                song.artist.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStyle = styleFilter ? song.style === styleFilter : true;
            return matchSearch && matchStyle;
        });
    }, [songLibrary, searchTerm, styleFilter, activeRepertoire]);

    if (!activeRepertoire) return null;

    // Resolve as IDs da lista atual para Objetos renderizáveis
    const currentSequence = activeRepertoire.songIds.map((id, index) => {
        const s = songLibrary.find(s => s.id === id);
        return s ? { ...s, uniqueKey: `${id}-${index}` } : { id, uniqueKey: `missing-${index}`, title: 'Desconhecida / Apagada', artist: '--' };
    });

    const handleSort = (newList) => {
        const newIds = newList.map(item => item.id);
        updateRepertoire(activeRepertoire.id, { songIds: newIds });
    };

    const handleAddSong = (id) => {
        const newIds = [...activeRepertoire.songIds, id];
        updateRepertoire(activeRepertoire.id, { songIds: newIds });
    };

    const handleRemoveSong = (indexToRemove) => {
        const newIds = activeRepertoire.songIds.filter((_, idx) => idx !== indexToRemove);
        updateRepertoire(activeRepertoire.id, { songIds: newIds });
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newIds = [...activeRepertoire.songIds];
        [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
        updateRepertoire(activeRepertoire.id, { songIds: newIds });
    };

    const moveDown = (index) => {
        if (index === activeRepertoire.songIds.length - 1) return;
        const newIds = [...activeRepertoire.songIds];
        [newIds[index + 1], newIds[index]] = [newIds[index], newIds[index + 1]];
        updateRepertoire(activeRepertoire.id, { songIds: newIds });
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-900 border-l border-slate-800 animate-in fade-in h-dvh overflow-hidden text-slate-200">
            {/* Top Bar - Header */}
            <div className="flex-shrink-0 p-4 md:p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-400 flex-shrink-0">Editor:</h1>
                    <div className="group relative flex items-center flex-1 min-w-0">
                        <input 
                            type="text"
                            value={activeRepertoire.name}
                            onChange={(e) => updateRepertoire(activeRepertoire.id, { name: e.target.value })}
                            className="text-xl md:text-2xl font-black bg-transparent border-b-2 border-transparent focus:border-emerald-500/50 outline-none text-emerald-400 pr-8 hover:bg-slate-800/50 rounded-t-lg px-2 transition-all w-full"
                            placeholder="Nome do Repertório..."
                            title="Clique para editar o nome"
                        />
                        <PencilSimple size={18} weight="bold" className="absolute right-2 text-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                </div>
                <button 
                    onClick={() => setActiveRepertoireId(null)}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded-xl font-bold transition-colors flex-shrink-0 ml-3"
                >
                    <X size={16} weight="bold" /> <span className="hidden sm:inline">Fechar</span>
                </button>
            </div>

            {/* Painéis Secundários */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 md:p-6 gap-3 md:gap-6 bg-slate-950">
                
                {/* ------------------------------------------- */}
                {/* ESQUERDA: Sequência das Músicas (SETLIST) */}
                {/* ------------------------------------------- */}
                <div className="flex-1 flex flex-col bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl min-h-[200px] lg:min-h-0">
                    <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-800/80">
                        <h2 className="text-base md:text-lg font-bold">Sequência das Músicas ({currentSequence.length})</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {currentSequence.length === 0 ? (
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-600 rounded-xl text-slate-400 p-8 text-center">
                                Use o painel ao lado para adicionar músicas à sua setlist.
                            </div>
                        ) : (
                            <ReactSortable 
                                list={currentSequence} 
                                setList={handleSort}
                                animation={200}
                                className="flex flex-col gap-2"
                                handle=".drag-handle"
                            >
                                {currentSequence.map((song, index) => (
                                    <div key={song.uniqueKey} className="group flex items-center justify-between bg-slate-900/50 hover:bg-slate-900 p-3 rounded-xl border border-transparent hover:border-slate-600 transition-colors gap-3">
                                        <div className="drag-handle cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1">
                                            <DotsSixVertical size={20} weight="bold" />
                                        </div>
                                        <button 
                                            title="Editar Cifra"
                                            onClick={() => setActiveSongId(song.id)}
                                            className="text-slate-500 hover:text-indigo-400 p-1"
                                        >
                                            <PencilSimple size={18} />
                                        </button>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="text-sm font-bold truncate text-slate-200">{song.title}</h3>
                                            <p className="text-[10px] text-slate-400 truncate tracking-wide">{song.artist}</p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveUp(index)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-700 rounded-md">
                                                <ArrowUp size={16} />
                                            </button>
                                            <button onClick={() => moveDown(index)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-700 rounded-md">
                                                <ArrowDown size={16} />
                                            </button>
                                            <button onClick={() => handleRemoveSong(index)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/20 rounded-md ml-2" title="Remover da Sequência">
                                                <CaretRight size={20} weight="bold" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </ReactSortable>
                        )}
                    </div>
                </div>

                {/* ------------------------------------------- */}
                {/* DIREITA: Biblioteca (ESTOQUE) */}
                {/* ------------------------------------------- */}
                <div className="flex-1 flex flex-col bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl min-h-[200px] lg:min-h-0">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex flex-col gap-3">
                        <h2 className="text-lg font-bold">Minhas Músicas</h2>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-900 rounded-lg flex items-center px-3 border border-slate-700 focus-within:border-indigo-500 transition-colors">
                                <MagnifyingGlass size={18} className="text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Filtrar por nome ou artista..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm px-2 py-2 text-slate-200 placeholder-slate-500 outline-none"
                                />
                            </div>
                            <select 
                                value={styleFilter}
                                onChange={(e) => setStyleFilter(e.target.value)}
                                className="w-40 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500 appearance-none"
                            >
                                <option value="">Todos os Estilos</option>
                                {styles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                        {librarySongs.map(song => (
                            <div key={song.id} className="group flex items-center bg-slate-900/40 hover:bg-slate-900 p-3 rounded-xl border border-transparent hover:border-slate-600 transition-colors gap-3">
                                <button 
                                    onClick={() => handleAddSong(song.id)}
                                    className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                                    title="Adicionar ao Repertório"
                                >
                                    <CaretLeft size={20} weight="bold" />
                                </button>
                                <div className="flex-1 min-w-0 flex flex-col justify-center text-right pr-2">
                                    <h3 className="text-sm font-bold truncate text-slate-200">{song.title}</h3>
                                    <p className="text-[10px] text-slate-400 truncate tracking-wide">{song.artist}</p>
                                </div>
                            </div>
                        ))}
                        {librarySongs.length === 0 && (
                            <p className="text-center text-slate-500 text-sm mt-8">Nenhuma música encontrada no filtro.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RepertoireEditor;
