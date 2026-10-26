import React, { useState, useMemo } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { ReactSortable } from 'react-sortablejs';
import useIsMobile from '../hooks/useIsMobile';
import { 
    X, 
    DotsSixVertical, 
    CaretLeft, 
    ArrowUp, 
    ArrowDown, 
    MagnifyingGlass,
    PencilSimple,
    Trash,
    Plus,
    ListNumbers,
} from '@phosphor-icons/react';
import SearchableSelect from '../components/SearchableSelect';

const MOBILE_BOTTOM_RESERVE = 'pb-[max(1rem,env(safe-area-inset-bottom,0px))]';

const REPERTOIRE_DND_GROUP = 'cifra-repertoire-dnd';

const RepertoireEditor = () => {
    const isMobile = useIsMobile();
    const { 
        activeRepertoireId, setActiveRepertoireId, 
        repertoires, songLibrary, styles, 
        updateRepertoire, setActiveSongId 
    } = useLibrary();

    const activeRepertoire = repertoires.find(r => r.id === activeRepertoireId);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [styleFilter, setStyleFilter] = useState('');
    const [mobilePanel, setMobilePanel] = useState('setlist');

    const librarySongs = useMemo(() => {
        const repertoireSongIds = new Set(activeRepertoire ? activeRepertoire.songIds : []);
        return songLibrary.filter(song => {
            if (repertoireSongIds.has(song.id)) return false;
            const matchSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchStyle = styleFilter ? song.style === styleFilter : true;
            return matchSearch && matchStyle;
        });
    }, [songLibrary, searchTerm, styleFilter, activeRepertoire]);

    const librarySortableList = useMemo(
        () => librarySongs.map((song) => ({ ...song, uniqueKey: `lib-${song.id}` })),
        [librarySongs]
    );

    if (!activeRepertoire) return null;

    const currentSequence = activeRepertoire.songIds.map((id, index) => {
        const s = songLibrary.find(s => s.id === id);
        return s ? { ...s, uniqueKey: `${id}-${index}` } : { id, uniqueKey: `missing-${index}`, title: 'Desconhecida / Apagada', artist: '--' };
    });

    const handleSort = (newList) => {
        const seen = new Set();
        const newIds = [];
        for (const item of newList) {
            if (!item?.id || seen.has(item.id)) continue;
            seen.add(item.id);
            newIds.push(item.id);
        }
        updateRepertoire(activeRepertoire.id, { songIds: newIds });
    };

    const handleAddSong = (id) => {
        const newIds = [...activeRepertoire.songIds, id];
        updateRepertoire(activeRepertoire.id, { songIds: newIds });
        if (isMobile) setMobilePanel('setlist');
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

    const emptySetlistMessage = isMobile
        ? 'Nenhuma música na setlist. Toque em «Adicionar» para escolher da biblioteca.'
        : 'Arraste músicas da biblioteca para cá ou use o botão ← em cada música.';

    const desktopDndSetlistGroup = { name: REPERTOIRE_DND_GROUP, pull: true, put: true };
    const desktopDndLibraryGroup = { name: REPERTOIRE_DND_GROUP, pull: 'clone', put: false };

    const libraryFilters = (
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <div className="flex-1 bg-slate-900 rounded-lg flex items-center px-3 border border-slate-700 focus-within:border-indigo-500 transition-colors min-h-[44px]">
                <MagnifyingGlass size={18} className="text-slate-400 flex-shrink-0" />
                <input 
                    type="text" 
                    placeholder="Filtrar por nome ou artista..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm px-2 py-2.5 text-slate-200 placeholder-slate-500 outline-none"
                />
            </div>
            <div className={isMobile ? 'w-full' : 'w-48 flex-shrink-0'}>
                <SearchableSelect 
                    options={['Todos os Estilos', ...styles]}
                    value={styleFilter || 'Todos os Estilos'}
                    onChange={(val) => setStyleFilter(val === 'Todos os Estilos' ? '' : val)}
                    placeholder="Todos os Estilos"
                    maxVisible={5}
                />
            </div>
        </div>
    );

    const setlistPanel = (
        <div className={`flex-1 flex flex-col bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl min-h-0 ${isMobile ? '' : 'lg:min-h-0'}`}>
            <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-800/80 flex-shrink-0">
                <h2 className="text-base md:text-lg font-bold">Sequência das Músicas ({currentSequence.length})</h2>
                {isMobile ? (
                    <p className="text-[11px] text-slate-500 mt-1">Segure o ícone ⋮ e arraste para reordenar.</p>
                ) : (
                    <p className="text-[11px] text-slate-500 mt-1">Arraste da biblioteca ou use ⋮ para reordenar a setlist.</p>
                )}
            </div>
            
            <div className={`flex-1 overflow-y-auto p-3 md:p-4 ${MOBILE_BOTTOM_RESERVE}`}>
                <div className="relative min-h-[160px]">
                    <ReactSortable 
                        list={currentSequence} 
                        setList={handleSort}
                        animation={200}
                        className={`flex flex-col gap-2 min-h-[160px] ${
                            currentSequence.length === 0 ? 'rounded-xl border-2 border-dashed border-slate-600 p-2' : ''
                        }`}
                        handle=".drag-handle"
                        delay={isMobile ? 150 : 0}
                        delayOnTouchOnly={isMobile}
                        group={!isMobile ? desktopDndSetlistGroup : undefined}
                        filter=".no-drag"
                        preventOnFilter={false}
                        ghostClass="repertoire-dnd-ghost"
                        chosenClass="repertoire-dnd-chosen"
                    >
                        {currentSequence.map((song, index) => (
                            <div key={song.uniqueKey} className="group flex items-center bg-slate-900/50 hover:bg-slate-900 p-2.5 md:p-3 rounded-xl border border-transparent hover:border-slate-600 transition-colors gap-2 md:gap-3">
                                <div className="drag-handle cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-2 -m-1 touch-manipulation">
                                    <DotsSixVertical size={22} weight="bold" />
                                </div>
                                <button 
                                    type="button"
                                    title="Editar cifra"
                                    onClick={() => setActiveSongId(song.id)}
                                    className="no-drag text-slate-500 hover:text-indigo-400 p-2 -m-1 rounded-lg hover:bg-slate-800"
                                >
                                    <PencilSimple size={20} />
                                </button>
                                <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                    <h3 className="text-sm font-bold truncate text-slate-200">{song.title}</h3>
                                    <p className="text-[10px] text-slate-400 truncate tracking-wide">{song.artist}</p>
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    {!isMobile && (
                                        <>
                                            <button type="button" onClick={() => moveUp(index)} className="no-drag text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg" title="Subir">
                                                <ArrowUp size={18} />
                                            </button>
                                            <button type="button" onClick={() => moveDown(index)} className="no-drag text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg" title="Descer">
                                                <ArrowDown size={18} />
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveSong(index)} 
                                        className="no-drag text-red-400 hover:text-red-200 p-2.5 hover:bg-red-500/20 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" 
                                        title="Remover da setlist"
                                        aria-label="Remover da setlist"
                                    >
                                        <Trash size={20} weight="bold" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </ReactSortable>
                    {currentSequence.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-400">
                            {emptySetlistMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const libraryPanel = (
        <div className={`flex-1 flex flex-col bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl min-h-0 ${isMobile ? '' : 'lg:min-h-0'}`}>
            <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-800/80 flex flex-col gap-3 flex-shrink-0">
                <h2 className="text-base md:text-lg font-bold">Minhas Músicas</h2>
                {libraryFilters}
            </div>

            <div className={`flex-1 overflow-y-auto p-3 md:p-4 ${MOBILE_BOTTOM_RESERVE}`}>
                {!isMobile && (
                    <p className="text-[11px] text-slate-500 mb-2 px-1">Arraste a música (ou o cartão) para a setlist à esquerda.</p>
                )}
                {isMobile ? (
                    <div className="flex flex-col gap-2">
                        {librarySongs.map((song) => (
                            <div key={song.id} className="group flex items-center bg-slate-900/40 hover:bg-slate-900 p-2.5 md:p-3 rounded-xl border border-transparent hover:border-slate-600 transition-colors gap-3">
                                <button 
                                    type="button"
                                    onClick={() => handleAddSong(song.id)}
                                    className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 rounded-xl transition-colors flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px]"
                                    title="Adicionar à setlist"
                                    aria-label={`Adicionar ${song.title}`}
                                >
                                    <Plus size={22} weight="bold" />
                                </button>
                                <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                    <h3 className="text-sm font-bold truncate text-slate-200">{song.title}</h3>
                                    <p className="text-[10px] text-slate-400 truncate tracking-wide">{song.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ReactSortable
                        list={librarySortableList}
                        setList={() => {}}
                        animation={200}
                        sort={false}
                        group={desktopDndLibraryGroup}
                        className="flex flex-col gap-2"
                        filter=".no-drag"
                        preventOnFilter={false}
                        ghostClass="repertoire-dnd-ghost"
                        chosenClass="repertoire-dnd-chosen"
                    >
                        {librarySortableList.map((song) => (
                            <div
                                key={song.uniqueKey}
                                className="library-song-item group flex items-center bg-slate-900/40 hover:bg-slate-900 p-2.5 md:p-3 rounded-xl border border-transparent hover:border-indigo-500/40 transition-colors gap-3 cursor-grab active:cursor-grabbing"
                            >
                                <button 
                                    type="button"
                                    onClick={() => handleAddSong(song.id)}
                                    className="no-drag text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 rounded-xl transition-colors flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px]"
                                    title="Adicionar à setlist"
                                    aria-label={`Adicionar ${song.title}`}
                                >
                                    <CaretLeft size={20} weight="bold" />
                                </button>
                                <div className="flex-1 min-w-0 flex flex-col justify-center text-left select-none">
                                    <h3 className="text-sm font-bold truncate text-slate-200">{song.title}</h3>
                                    <p className="text-[10px] text-slate-400 truncate tracking-wide">{song.artist}</p>
                                </div>
                                <DotsSixVertical size={20} weight="bold" className="text-slate-600 flex-shrink-0 opacity-60 group-hover:opacity-100" aria-hidden />
                            </div>
                        ))}
                    </ReactSortable>
                )}
                {librarySongs.length === 0 && (
                    <p className="text-center text-slate-500 text-sm mt-8 px-4">Nenhuma música encontrada no filtro.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border-l border-slate-800 animate-in fade-in overflow-hidden text-slate-200">
            <div className="flex-shrink-0 px-3 py-3 md:p-6 flex justify-between items-start md:items-center gap-2 border-b border-slate-800 bg-slate-900 safe-top">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 md:hidden">Editor de repertório</span>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0">
                        <h1 className="hidden md:block text-xl md:text-2xl font-bold text-slate-400 flex-shrink-0">Editor:</h1>
                        <div className="group relative flex items-center flex-1 min-w-0">
                            <input 
                                type="text"
                                value={activeRepertoire.name}
                                onChange={(e) => updateRepertoire(activeRepertoire.id, { name: e.target.value })}
                                className="text-lg md:text-2xl font-black bg-transparent border-b-2 border-transparent focus:border-emerald-500/50 outline-none text-emerald-400 pr-9 hover:bg-slate-800/50 rounded-t-lg px-1 md:px-2 transition-all w-full"
                                placeholder="Nome do repertório..."
                                title="Toque para editar o nome"
                            />
                            <PencilSimple
                                size={18}
                                weight="bold"
                                className="absolute right-1 text-emerald-500/70 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none"
                            />
                        </div>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={() => setActiveRepertoireId(null)}
                    className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 rounded-xl font-bold transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] md:min-w-0"
                    aria-label="Fechar editor"
                >
                    <X size={18} weight="bold" /> <span className="hidden sm:inline">Fechar</span>
                </button>
            </div>

            {isMobile && (
                <div className="flex-shrink-0 px-3 pt-2 pb-1 bg-slate-950 border-b border-slate-800">
                    <div className="flex gap-1 p-1 bg-slate-800/80 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setMobilePanel('setlist')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all min-h-[44px] ${
                                mobilePanel === 'setlist'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ListNumbers size={18} weight="bold" />
                            Setlist ({currentSequence.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobilePanel('add')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all min-h-[44px] ${
                                mobilePanel === 'add'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Plus size={18} weight="bold" />
                            Adicionar
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 md:p-6 gap-3 md:gap-6 bg-slate-950 min-h-0">
                {isMobile ? (
                    mobilePanel === 'setlist' ? setlistPanel : libraryPanel
                ) : (
                    <>
                        {setlistPanel}
                        {libraryPanel}
                    </>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .repertoire-dnd-ghost { opacity: 0.45; background: rgb(99 102 241 / 0.15) !important; }
                .repertoire-dnd-chosen { box-shadow: 0 0 0 2px rgb(99 102 241 / 0.5); }
            `}} />
        </div>
    );
};

export default RepertoireEditor;
