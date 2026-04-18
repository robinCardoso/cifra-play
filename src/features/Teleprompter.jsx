import React, { useState, useEffect } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { X, CaretRight, CaretLeft, BookOpen, ArrowLeft } from '@phosphor-icons/react';

const Teleprompter = () => {
    const {
        isTeleprompterOpen, setIsTeleprompterOpen,
        activeRepertoire, songLibrary,
        setActiveSongId, setIsStageMode
    } = useLibrary();

    const [tpGroups, setTpGroups] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [tpColumns, setTpColumns] = useState(1);

    useEffect(() => {
        if (!activeRepertoire) return;

        const groups = [];
        let current = null;
        activeRepertoire.songIds.forEach(id => {
            const song = songLibrary.find(s => s.id === id);
            if (!song) return;
            const style = song.style || 'Sem Estilo';
            if (current && current.style === style && current.songs.length < 10) {
                current.songs.push(song);
            } else {
                if (current) groups.push(current);
                current = { style, songs: [song] };
            }
        });
        if (current) groups.push(current);

        setTpGroups(groups);
        setCurrentPage(0);
    }, [activeRepertoire, songLibrary, isTeleprompterOpen]);

    const handleNext = () => {
        if (currentPage < tpGroups.length - 1) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 0) setCurrentPage(prev => prev - 1);
    };

    useEffect(() => {
        const handleKeys = (e) => {
            if (e.key === 'Escape') {
                setIsTeleprompterOpen(false);
            }
            if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [currentPage, tpGroups]);

    if (!isTeleprompterOpen || !activeRepertoire) return null;

    const group = tpGroups[currentPage];
    if (!group) return null;

    // Lógica para tamanhos baseada na contagem (como no original)
    const getTpSizes = (count, cols) => {
        const perCol = cols === 2 ? Math.ceil(count / 2) : count;
        if (perCol <= 1) return { styleSize: 'clamp(2.2rem,9vw,5.5rem)', nameSize: 'clamp(1.8rem,7.5vw,4rem)', keySize: 'clamp(1rem,3.5vw,2rem)', gap: 'clamp(1.4rem,3vw,2.5rem)' };
        if (perCol <= 2) return { styleSize: 'clamp(2rem,8vw,4.5rem)', nameSize: 'clamp(1.5rem,6.5vw,3.2rem)', keySize: 'clamp(0.85rem,3vw,1.75rem)', gap: 'clamp(1.2rem,2.7vw,2.2rem)' };
        if (perCol <= 3) return { styleSize: 'clamp(1.8rem,7.5vw,3.8rem)', nameSize: 'clamp(1.3rem,5.8vw,2.8rem)', keySize: 'clamp(0.8rem,2.8vw,1.5rem)', gap: 'clamp(1.1rem,2.5vw,2rem)' };
        if (perCol <= 5) return { styleSize: 'clamp(1.5rem,6.5vw,3rem)', nameSize: 'clamp(1.1rem,4.8vw,2.2rem)', keySize: 'clamp(0.7rem,2.4vw,1.25rem)', gap: 'clamp(0.9rem,2vw,1.6rem)' };
        if (perCol <= 7) return { styleSize: 'clamp(1.3rem,5.5vw,2.4rem)', nameSize: 'clamp(1rem,4.2vw,1.8rem)', keySize: 'clamp(0.65rem,2.1vw,1rem)', gap: 'clamp(0.8rem,1.8vw,1.3rem)' };
        return { styleSize: 'clamp(1.1rem,4.8vw,2rem)', nameSize: 'clamp(0.9rem,3.8vw,1.5rem)', keySize: 'clamp(0.6rem,1.9vw,0.9rem)', gap: 'clamp(0.7rem,1.5vw,1rem)' };
    };

    const sz = getTpSizes(group.songs.length, tpColumns);

    return (
        <div className="fixed inset-0 z-[150] bg-[#0a0a0f] text-white flex flex-col font-sans animate-in fade-in duration-300 overflow-hidden">


            {/* HEADER COM CONTROLES */}
            <header className="flex items-center justify-between px-5 py-2 flex-shrink-0 bg-black/60 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Teleprompter</span>
                    <span className="text-xs text-slate-400 font-mono">Pág. {currentPage + 1} de {tpGroups.length}</span>
                    <div className="flex items-center rounded overflow-hidden border border-slate-600 ml-2">
                        <button 
                            onClick={() => setTpColumns(1)}
                            className={`px-2 py-0.5 text-xs font-bold transition-colors ${tpColumns === 1 ? 'bg-indigo-500/80 text-white' : 'bg-white/5 text-slate-400'}`}
                        >
                            1col
                        </button>
                        <button 
                            onClick={() => setTpColumns(2)}
                            className={`px-2 py-0.5 text-xs font-bold transition-colors border-l border-white/10 ${tpColumns === 2 ? 'bg-indigo-500/80 text-white' : 'bg-white/5 text-slate-400'}`}
                        >
                            2col
                        </button>
                    </div>
                </div>
                <button 
                    onClick={() => setIsTeleprompterOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
                >
                    <X weight="bold" /> Fechar
                </button>
            </header>

            {/* CORPO PRINCIPAL */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-start px-8 pt-10 pb-6 overflow-y-auto">
                <div className="text-center w-full max-w-5xl">
                    <div 
                        className="font-black uppercase bg-clip-text text-transparent bg-gradient-to-br from-indigo-300 to-indigo-500 leading-none"
                        style={{ fontSize: sz.styleSize, marginBottom: sz.gap, letterSpacing: '0.18em' }}
                    >
                        {group.style}
                    </div>
                    <div style={{ width: '5rem', height: '3px', background: 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: '2px', margin: `0 auto ${sz.gap}` }}></div>
                    
                    <div 
                        style={{ 
                            display: tpColumns === 2 ? 'grid' : 'block',
                            gridTemplateColumns: tpColumns === 2 ? '1fr 1fr' : 'none',
                            gap: tpColumns === 2 ? '0 3rem' : '0',
                            textAlign: tpColumns === 2 ? 'left' : 'center'
                        }}
                    >
                        {group.songs.map((song, i) => (
                            <div 
                                key={song.id + '-' + i} 
                                onClick={() => {
                                    setActiveSongId(song.id);
                                    setIsStageMode(true);
                                }}
                                className="group cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-white/5"
                                style={{ marginBottom: sz.gap }}
                            >
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: tpColumns === 2 ? 'flex-start' : 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: sz.nameSize, fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                                        {song.title || 'Sem Título'}
                                    </span>
                                    {song.key && (
                                        <span style={{ fontSize: sz.keySize, color: '#6ee7b7', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                                            Tom: {song.key}
                                        </span>
                                    )}
                                    <BookOpen weight="bold" style={{ fontSize: sz.keySize, color: 'rgba(255,255,255,0.3)', marginLeft: '0.2rem' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RODAPÉ */}
            <footer className="flex items-center justify-between px-6 py-3 flex-shrink-0 bg-black/60 border-t border-white/5">
                <button 
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all text-slate-200 hover:text-white bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                >
                    <CaretLeft weight="bold" /> Anterior
                </button>
                <div className="flex items-center gap-2">
                    {tpGroups.map((g, i) => (
                        <span 
                            key={i} 
                            title={g.style}
                            style={{
                                width: i === currentPage ? '1.8rem' : '0.5rem',
                                height: '0.5rem',
                                borderRadius: '9999px',
                                background: i === currentPage ? '#6366f1' : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.3s',
                                display: 'inline-block'
                            }}
                        />
                    ))}
                </div>
                <button 
                    onClick={handleNext}
                    disabled={currentPage >= tpGroups.length - 1}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all text-slate-200 hover:text-white bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
                >
                    Próximo <CaretRight weight="bold" />
                </button>
            </footer>

        </div>
    );
};

export default Teleprompter;
