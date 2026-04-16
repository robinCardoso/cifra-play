import React, { useState, useEffect } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { X, CaretRight, CaretLeft } from '@phosphor-icons/react';

const Teleprompter = () => {
    const {
        isTeleprompterOpen, setIsTeleprompterOpen,
        activeRepertoire, songLibrary
    } = useLibrary();

    const [groupedSongs, setGroupedSongs] = useState({});
    const [styleList, setStyleList] = useState([]);
    const [currentStyleIndex, setCurrentStyleIndex] = useState(0);

    useEffect(() => {
        if (!activeRepertoire) return;

        const groups = {};
        activeRepertoire.songIds.forEach(id => {
            const song = songLibrary.find(s => s.id === id);
            if (song) {
                const style = song.style || 'Outros';
                if (!groups[style]) groups[style] = [];
                groups[style].push(song);
            }
        });

        setGroupedSongs(groups);
        const styles = Object.keys(groups).sort();
        setStyleList(styles);
        setCurrentStyleIndex(0);
    }, [activeRepertoire, songLibrary, isTeleprompterOpen]);

    if (!isTeleprompterOpen || !activeRepertoire) return null;

    const currentStyle = styleList[currentStyleIndex];
    const currentSongs = groupedSongs[currentStyle] || [];

    const handleNext = () => {
        if (currentStyleIndex < styleList.length - 1) {
            setCurrentStyleIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStyleIndex > 0) {
            setCurrentStyleIndex(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-slate-950 text-white flex flex-col font-sans animate-in fade-in duration-300">
            <header className="flex-shrink-0 bg-slate-900 p-4 flex items-center justify-between border-b border-white/10">
                <div>
                    <h2 className="text-xl font-black text-indigo-400">Teleprompter: {activeRepertoire.name}</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Navegação por Estilo Musical</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1">
                        <button onClick={handlePrev} disabled={currentStyleIndex === 0} className="p-2 hover:bg-slate-700 disabled:opacity-30 rounded-lg transition-colors"><CaretLeft size={20} weight="bold" /></button>
                        <div className="flex flex-col items-center justify-center min-w-[140px]">
                            <span className="text-sm font-bold text-center leading-none">{currentStyle || '--'}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Bloco {currentStyleIndex + 1}/{styleList.length}</span>
                        </div>
                        <button onClick={handleNext} disabled={currentStyleIndex >= styleList.length - 1} className="p-2 hover:bg-slate-700 disabled:opacity-30 rounded-lg transition-colors"><CaretRight size={20} weight="bold" /></button>
                    </div>
                    <button 
                        onClick={() => setIsTeleprompterOpen(false)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                    >
                        <X size={24} weight="bold" />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-black/20">
                {currentSongs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {currentSongs.map(song => (
                            <div key={song.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-4 hover:border-indigo-500/30 transition-colors">
                                <div className="border-b border-white/10 pb-4">
                                    <h3 className="text-2xl font-black leading-tight text-white mb-1">{song.title}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400 uppercase tracking-wider font-bold">{song.artist || 'Desconhecido'}</span>
                                        <span className="bg-indigo-500/20 text-indigo-300 font-black text-sm px-3 py-1 rounded-lg">{song.key || '--'}</span>
                                    </div>
                                </div>
                                <div className="text-base md:text-lg leading-relaxed text-slate-300 font-mono line-clamp-[12]">
                                    {song.lyrics?.split('\n').filter(l => l.trim()).slice(0, 12).map((line, i) => (
                                        <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\[([^\]]+)\]/g, '<span class="text-emerald-400 font-bold bg-emerald-400/10 px-1 rounded mx-0.5">[$1]</span>') }} />
                                    ))}
                                    {song.lyrics?.split('\n').length > 12 && <div className="text-indigo-400 mt-2 text-sm italic">...continua no Modo Palco</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 font-bold">Nenhuma música neste bloco.</div>
                )}
            </main>
        </div>
    );
};

export default Teleprompter;
