import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { 
  CaretLeft, 
  CaretRight, 
  XCircle, 
  TextT, 
  Columns, 
  ArrowsOut, 
  ArrowsIn 
} from '@phosphor-icons/react';

const StageMode = ({ onClose }) => {
    const { 
        activeRepertoire, 
        songLibrary, 
        fontSize, setFontSize,
        columnCount, setColumnCount
    } = useLibrary();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    
    const lyricsViewRef = useRef(null);
    const currentSongId = activeRepertoire?.songIds[currentIndex];
    const currentSong = songLibrary.find(s => s.id === currentSongId);
    const nextSongId = activeRepertoire?.songIds[currentIndex + 1];
    const nextSong = songLibrary.find(s => s.id === nextSongId);

    // Formatação de cifras para exibição
    const formatLyrics = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            const formattedLine = line.replace(/\[([^\]]+)\]/g, '<span class="chord">[$1]</span>');
            return <div key={i} className="lyric-line" dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />;
        });
    };

    // Calcular páginas sempre que a música ou o tamanho da fonte mudar
    useEffect(() => {
        const calculatePages = () => {
            if (lyricsViewRef.current) {
                const { clientHeight, scrollHeight } = lyricsViewRef.current;
                const pages = Math.ceil(scrollHeight / (clientHeight || 1)) || 1;
                setTotalPages(pages);
                setCurrentPage(0);
                lyricsViewRef.current.scrollTop = 0;
            }
        };

        const timer = setTimeout(calculatePages, 150); // Delay para renderização
        return () => clearTimeout(timer);
    }, [currentSongId, fontSize, columnCount]);

    const scrollToPage = (page) => {
        if (lyricsViewRef.current) {
            const pageHeight = lyricsViewRef.current.clientHeight;
            lyricsViewRef.current.scrollTo({
                top: page * pageHeight,
                behavior: 'smooth'
            });
            setCurrentPage(page);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            scrollToPage(currentPage + 1);
        } else if (currentIndex < activeRepertoire.songIds.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setCurrentPage(0);
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            scrollToPage(currentPage - 1);
        } else if (currentIndex > 0) {
            // Ao voltar música, idealmente cairia na última página da anterior
            // Simplificando por enquanto para ir ao início da anterior
            setCurrentIndex(prev => prev - 1);
            setCurrentPage(0);
        }
    };

    useEffect(() => {
        const handleKeys = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [currentPage, totalPages, currentIndex]);

    if (!activeRepertoire || !currentSong) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col font-sans animate-in fade-in duration-300">
            
            {/* Header de Controle do Palco */}
            <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest leading-none">Música {currentIndex + 1}/{activeRepertoire.songIds.length}</span>
                        <h2 className="text-xl font-black truncate max-w-xs md:max-w-md">{currentSong.title}</h2>
                    </div>
                    <div className="hidden md:flex flex-col opacity-40 ml-4 pl-4 border-l border-white/10">
                        <span className="text-[10px] uppercase font-bold tracking-widest">Tom</span>
                        <span className="font-black text-indigo-300">{currentSong.key || '--'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Botões de Navegação */}
                    <div className="flex items-center bg-white/5 rounded-2xl p-1 gap-1 border border-white/10">
                        <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-xl transition-all"><CaretLeft size={20} weight="bold" /></button>
                        <span className="text-xs font-bold px-2 whitespace-nowrap opacity-60">Pág. {currentPage + 1}/{totalPages}</span>
                        <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-xl transition-all"><CaretRight size={20} weight="bold" /></button>
                    </div>

                    {/* Controles de Estilo */}
                    <div className="hidden lg:flex items-center gap-1">
                        <button onClick={() => setFontSize(prev => Math.max(0.8, prev - 0.2))} className="p-2 hover:bg-white/10 rounded-xl"><TextT size={18} /></button>
                        <button onClick={() => setFontSize(prev => Math.min(4, prev + 0.2))} className="p-2 hover:bg-white/10 rounded-xl"><TextT size={24} weight="bold" /></button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button 
                            onClick={() => setColumnCount(c => c === 1 ? 2 : 1)}
                            className={`p-2 rounded-xl transition-all ${columnCount === 2 ? 'bg-indigo-600 text-white' : 'hover:bg-white/10'}`}
                        >
                            <Columns size={20} />
                        </button>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 active:scale-95"
                    >
                        <XCircle size={24} weight="bold" />
                    </button>
                </div>
            </header>

            {/* Visualizador de Letras */}
            <main 
                ref={lyricsViewRef}
                className={`flex-1 overflow-y-hidden p-8 md:p-16 scroll-smooth`}
                style={{ 
                    fontSize: `${fontSize}rem`,
                    columnCount: columnCount,
                    columnGap: '4rem'
                }}
            >
                <div className="max-w-none">
                    {formatLyrics(currentSong.lyrics)}
                </div>
            </main>

            {/* Rodapé / Progress Indicator */}
            <footer className="flex-shrink-0 h-16 flex items-center justify-between px-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentPage ? 'bg-indigo-500 scale-150 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/20'}`} 
                        />
                    ))}
                </div>
                
                {nextSong && (
                    <div className="flex flex-col items-end opacity-40">
                        <span className="text-[8px] uppercase font-black tracking-widest">Próxima de {nextSong.artist}</span>
                        <span className="text-xs font-bold leading-none">{nextSong.title}</span>
                    </div>
                )}
            </footer>

            {/* Estilos específicos para o Modo Palco */}
            <style dangerouslySetInnerHTML={{ __html: `
                .lyric-line {
                    display: block;
                    margin-bottom: 0.2em;
                    scroll-snap-align: start;
                    break-inside: avoid-column;
                }
                .chord {
                    color: #4ade80;
                    font-weight: 800;
                    font-family: monospace;
                    background: rgba(74, 222, 128, 0.1);
                    padding: 0 4px;
                    border-radius: 6px;
                    display: inline-block;
                    margin-bottom: 4px;
                }
                main {
                    scroll-snap-type: y mandatory;
                }
            `}} />
        </div>
    );
};

export default StageMode;
