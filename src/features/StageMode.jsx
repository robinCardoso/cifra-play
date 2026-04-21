import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { 
  CaretLeft, 
  CaretRight, 
  XCircle, 
  TextT, 
  Columns, 
  ArrowsOut, 
  ArrowsIn,
  MagnifyingGlass,
  ArrowUUpLeft,
  MusicNotes
} from '@phosphor-icons/react';

const StageMode = ({ onClose }) => {
    const BASE_STAGE_WIDTH = 1920;
    const BASE_STAGE_HEIGHT = 1080;

    const { 
        activeRepertoire, 
        songLibrary, 
        fontSize, setFontSize,
        columnCount, setColumnCount,
        activeSongId,
        updateSong
    } = useLibrary();

    const [isEditing, setIsEditing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(() => {
        if (activeSongId && activeRepertoire) {
            const index = activeRepertoire.songIds.indexOf(activeSongId);
            return index !== -1 ? index : 0;
        }
        return 0;
    });
    
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [stageScale, setStageScale] = useState(1);
    const [centerOffsetTop, setCenterOffsetTop] = useState(0);
    const [stageColumnOverride, setStageColumnOverride] = useState(null);
    
    // Estados da Busca (On-the-fly)
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [offScriptSong, setOffScriptSong] = useState(null);
    const searchInputRef = useRef(null);
    const saveLyricsTimeoutRef = useRef(null);
    const pendingLyricsRef = useRef('');

    const lyricsViewRef = useRef(null);


    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const updateStageScale = () => {
            const widthRatio = window.innerWidth / BASE_STAGE_WIDTH;
            const heightRatio = window.innerHeight / BASE_STAGE_HEIGHT;
            setStageScale(Math.max(0.2, Math.min(widthRatio, heightRatio)));
        };

        updateStageScale();
        window.addEventListener('resize', updateStageScale);
        return () => window.removeEventListener('resize', updateStageScale);
    }, []);
    const resolvedSongId = activeRepertoire?.songIds[currentIndex] || activeSongId;
    const currentSong = offScriptSong || songLibrary.find(s => s.id === resolvedSongId);
    const nextSongId = activeRepertoire?.songIds[currentIndex + 1];
    const nextSong = offScriptSong ? null : songLibrary.find(s => s.id === nextSongId);

    // Motor de Decisão de Colunas:
    // 1) Override da sessão de palco (botão de colunas no StageMode)
    // 2) Preferência da música
    // 3) Configuração global
    const activeCols = stageColumnOverride ?? currentSong?.columns ?? columnCount ?? 1;

    // Sincroniza o contenteditable com o texto da música quando o modo Editor abre
    useEffect(() => {
        if (isEditing && lyricsViewRef.current && currentSong) {
            const el = lyricsViewRef.current;
            if (el.innerText !== (currentSong.lyrics || '')) {
                el.innerText = currentSong.lyrics || '';
            }
            pendingLyricsRef.current = currentSong.lyrics || '';
        }
    }, [isEditing, resolvedSongId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Formatação de cifras para exibição
    const formatLyrics = (text) => {
        if (!text) return null;
        // Dividimos apenas por linha para manter o ritmo vertical idêntico ao editor
        const lines = text.split('\n');
        
        return lines.map((line, index) => {
            const parts = line.split(/(\[[^\]]+\])/g);
            return (
                <div key={index} className="lyric-line">
                    {parts.length === 1 && parts[0] === '' ? (
                        <>&nbsp;</>
                    ) : (
                        parts.map((part, partIndex) =>
                            /^\[[^\]]+\]$/.test(part) ? (
                                <span key={`${index}-${partIndex}`} className="chord">{part}</span>
                            ) : (
                                <React.Fragment key={`${index}-${partIndex}`}>{part}</React.Fragment>
                            )
                        )
                    )}
                </div>
            );
        });
    };

    // Calcular páginas sempre que a música, fonte, colunas ou LETRA mudar
    useEffect(() => {
        let rafId;
        const calculatePages = () => {
            if (lyricsViewRef.current) {
                const el = lyricsViewRef.current;
                
                // SEGURANÇA: Se a altura for muito pequena ou zero (durante o reflow), 
                // não mede, pois os resultados serão fantasmas.
                if (el.clientHeight < 100) return;

                const style = window.getComputedStyle(el);
                
                const padL = parseFloat(style.paddingLeft) || 0;
                const padR = parseFloat(style.paddingRight) || 0;
                const padSum = padL + padR;
                const gap = 64; 
                
                const step = el.clientWidth - padSum + gap;
                const totalWidth = el.scrollWidth - padSum + gap;
                
                const pages = Math.max(1, Math.ceil(totalWidth / step));
                setTotalPages(pages);
                if (!isEditing && pages === 1) {
                    const freeSpace = el.clientHeight - el.scrollHeight;
                    const extraTop = Math.max(0, Math.floor(freeSpace / 2));
                    setCenterOffsetTop(extraTop);
                } else {
                    setCenterOffsetTop(0);
                }
                
                // Sincroniza a página atual para não ficar em um índice inexistente
                if (currentPage >= pages) {
                    setCurrentPage(0);
                    el.scrollTo({ left: 0, behavior: 'instant' });
                }
            }
        };

        rafId = requestAnimationFrame(() => {
            rafId = requestAnimationFrame(calculatePages);
        });

        return () => cancelAnimationFrame(rafId);
    }, [resolvedSongId, fontSize, activeCols, activeRepertoire, currentSong?.lyrics, isEditing, stageScale]);

    const scrollToPage = (page) => {
        if (lyricsViewRef.current) {
            const el = lyricsViewRef.current;
            const step = el.clientWidth - 128 + 64; // 128 (padding total 64+64) + 64 (gap)
            
            el.scrollTo({
                left: page * step,
                behavior: 'smooth'
            });
            setCurrentPage(page);
        }
    };

    // Avançar página ou ir para próxima música
    const handleNext = () => {
        if (offScriptSong) {
            setOffScriptSong(null); // Volta pro repertório oficial se der Next num pedido
            setCurrentPage(0);
            return;
        }

        if (currentPage < totalPages - 1) {
            scrollToPage(currentPage + 1);
        } else if (currentIndex < (activeRepertoire?.songIds.length || 1) - 1) {
            setCurrentIndex(i => i + 1);
            setCurrentPage(0);
        }
    };

    const saveLyricsDebounced = (songId, lyrics) => {
        pendingLyricsRef.current = lyrics;
        if (saveLyricsTimeoutRef.current) {
            clearTimeout(saveLyricsTimeoutRef.current);
        }
        saveLyricsTimeoutRef.current = setTimeout(() => {
            updateSong(songId, { lyrics: pendingLyricsRef.current });
            saveLyricsTimeoutRef.current = null;
        }, 250);
    };

    const flushPendingLyrics = (songId) => {
        if (!songId) return;
        if (saveLyricsTimeoutRef.current) {
            clearTimeout(saveLyricsTimeoutRef.current);
            saveLyricsTimeoutRef.current = null;
        }
        if (typeof pendingLyricsRef.current === 'string') {
            updateSong(songId, { lyrics: pendingLyricsRef.current });
        }
    };

    // Voltar página ou ir para música anterior (indo direto para a última página dela)
    const handlePrev = () => {
        if (offScriptSong) {
            setOffScriptSong(null); // Volta pro repertório oficial
            setCurrentPage(0);
            return;
        }

        if (currentPage > 0) {
            scrollToPage(currentPage - 1);
        } else if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            window._stageComingBack = true;
        }
    };

    // Navegação por teclado
    useEffect(() => {
        const handleKeys = (e) => {
            // Se a busca estiver aberta, ignore setas (deixe o usuário digitar)
            if (isSearchOpen) {
                if (e.key === 'Escape') setIsSearchOpen(false);
                return;
            }

            if (isEditing) {
                if (e.key === 'Escape') {
                    flushPendingLyrics(currentSong?.id);
                    setIsEditing(false);
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                setIsSearchOpen(true);
            } else if (e.key === 'ArrowRight' || e.key === ' ') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [currentPage, totalPages, currentIndex, offScriptSong, isSearchOpen, isEditing, currentSong?.id]);

    useEffect(() => {
        return () => {
            if (saveLyricsTimeoutRef.current) clearTimeout(saveLyricsTimeoutRef.current);
        };
    }, []);

    // Foco automático na busca quando abrir
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 50);
        } else {
            setSearchQuery('');
        }
    }, [isSearchOpen]);

    if (!currentSong) return null;

    // Filtro de Busca
    const filteredSearch = songLibrary.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 8); // Limite de visualização rápida

    return (
        <div className="fixed inset-0 z-[220] bg-slate-950 overflow-hidden">
            <div
                className="absolute left-1/2 top-1/2 text-white font-sans animate-in fade-in duration-300"
                style={{
                    width: `${BASE_STAGE_WIDTH}px`,
                    height: `${BASE_STAGE_HEIGHT}px`,
                    transform: `translate(-50%, -50%) scale(${stageScale})`,
                    transformOrigin: 'center center',
                }}
            >
        <div className="w-full h-full flex flex-col">
            
            {/* Header de Controle do Palco */}
            <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        {offScriptSong ? (
                            <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <ArrowUUpLeft weight="bold"/> Fora de Roteiro
                            </span>
                        ) : activeRepertoire ? (
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest leading-none">
                                Música {currentIndex + 1}/{activeRepertoire.songIds.length}
                            </span>
                        ) : (
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1">
                                <MusicNotes weight="bold" /> Ensaio Avulso
                            </span>
                        )}
                        <h2 className={`text-xl font-black truncate max-w-xs md:max-w-md ${offScriptSong ? 'text-amber-400' : ''}`}>
                            {currentSong.title}
                        </h2>
                    </div>
                    <div className="hidden md:flex flex-col opacity-40 ml-4 pl-4 border-l border-white/10">
                        <span className="text-[10px] uppercase font-bold tracking-widest">Tom</span>
                        <span className="font-black text-indigo-300">{currentSong.key || '--'}</span>
                    </div>

                    {offScriptSong && (
                        <button 
                            onClick={() => { setOffScriptSong(null); setCurrentPage(0); }}
                            className="ml-4 px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <ArrowUUpLeft size={16} weight="bold"/>
                            <span className="hidden sm:inline">Voltar ao Repertório</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Pesquisa (CTRL+F) */}
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ${isSearchOpen ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                        title="Buscar Música (Ctrl + F)"
                    >
                        <MagnifyingGlass size={20} weight="bold" />
                        <span className="hidden lg:inline mr-1">Buscar</span>
                    </button>

                    {/* Botões de Navegação (Só mostra se houver repertório) */}
                    {activeRepertoire && (
                        <div className="flex items-center bg-white/5 rounded-2xl p-1 gap-1 border border-white/10">
                            <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-xl transition-all"><CaretLeft size={20} weight="bold" /></button>
                            <span className="text-xs font-bold px-2 whitespace-nowrap opacity-60">Pág. {currentPage + 1}/{totalPages}</span>
                            <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-xl transition-all"><CaretRight size={20} weight="bold" /></button>
                        </div>
                    )}
                    
                    {/* Paginação Isolada (Para Música Avulsa) */}
                    {!activeRepertoire && (
                        <div className="flex items-center bg-white/5 rounded-2xl py-1 px-3 gap-1 border border-white/10">
                            <span className="text-xs font-bold px-2 whitespace-nowrap opacity-60">Pág. {currentPage + 1}/{totalPages}</span>
                        </div>
                    )}

                    <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-white/10 text-slate-400 bg-white/5">
                        Layout 16:9 fixo
                    </span>

                    {/* Controles de Estilo e Edição */}
                    <div className="hidden lg:flex items-center gap-1">
                        <button 
                            onClick={() => {
                                if (isEditing) {
                                    flushPendingLyrics(currentSong?.id);
                                }
                                setIsEditing(!isEditing);
                            }}
                            className={`px-3 py-1.5 rounded-xl transition-all text-xs font-bold tracking-wider uppercase flex items-center gap-2 ${isEditing ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                            title="Editar Letra ao Vivo"
                        >
                            {isEditing ? 'Sair do Modo Edição' : 'Editar'}
                        </button>
                        
                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <button onClick={() => setFontSize(prev => Math.max(0.8, prev - 0.2))} className="p-2 hover:bg-white/10 rounded-xl"><TextT size={18} /></button>
                        <button onClick={() => setFontSize(prev => Math.min(4, prev + 0.2))} className="p-2 hover:bg-white/10 rounded-xl"><TextT size={24} weight="bold" /></button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button 
                            onClick={() => {
                                const nextCols = activeCols === 2 ? 1 : 2;
                                setStageColumnOverride(nextCols);
                            }}
                            className={`p-2 rounded-xl transition-all ${activeCols === 2 ? 'bg-indigo-600 text-white' : 'hover:bg-white/10'}`}
                        >
                            <Columns size={20} />
                        </button>
                        <button 
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                            title="Tela Cheia (F11)"
                        >
                            <ArrowsOut size={20} weight="bold" />
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

            {/* Modo Edição: mesmo layout do palco mas com contentEditable */}
            {isEditing ? (
                <main
                    key="editor"
                    ref={lyricsViewRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                        saveLyricsDebounced(currentSong.id, e.currentTarget.innerText);
                    }}
                    className="flex-1 overflow-x-hidden overflow-y-hidden py-8 outline-none caret-amber-400 selection:bg-amber-500/30"
                    style={{
                        paddingLeft: '64px',
                        paddingRight: '64px',
                        fontSize: `${fontSize}rem`,
                        columnCount: activeCols,
                        columnGap: '64px',
                        columnWidth: activeCols === 1 ? '100%' : 'auto',
                        columnFill: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#ffffff',
                        lineHeight: '1.6',
                        fontFamily: 'inherit',
                        cursor: 'text',
                    }}
                />
            ) : (
                <main 
                    key="viewer"
                    ref={lyricsViewRef}
                    className="flex-1 overflow-x-hidden overflow-y-hidden py-8"
                    style={{ 
                        paddingLeft: '64px',
                        paddingRight: '64px',
                        paddingTop: `calc(2rem + ${centerOffsetTop}px)`,
                        paddingBottom: '2rem',
                        fontSize: `${fontSize}rem`,
                        lineHeight: '1.6',
                        columnCount: activeCols,
                        columnGap: '64px',
                        columnWidth: activeCols === 1 ? '100%' : 'auto',
                        columnFill: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#ffffff'
                    }}
                >
                    {formatLyrics(currentSong.lyrics)}
                </main>
            )}

            {/* Modal de Busca Rápida (Off-Script) */}
            {isSearchOpen && (
                <div className="absolute top-[80px] right-4 md:right-16 lg:right-32 w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 shadow-2xl p-4 z-[150] animate-in slide-in-from-top-4 duration-200">
                    <div className="flex bg-slate-950/50 rounded-2xl items-center px-4 mb-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                        <MagnifyingGlass size={20} className="text-slate-400" />
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            name="stage-search"
                            autoComplete="off"
                            placeholder="Pesquisar pedido da plateia..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none text-white outline-none w-full p-4 placeholder-slate-500 font-bold"
                        />
                    </div>
                    {searchQuery.length > 0 && (
                        <ul className="max-h-64 overflow-y-auto space-y-1 pr-2 mt-2 custom-scrollbar">
                            {filteredSearch.map(s => (
                                <li key={s.id}>
                                    <button
                                        onClick={() => {
                                            setOffScriptSong(s);
                                            setIsSearchOpen(false);
                                            setCurrentPage(0);
                                        }}
                                        className="w-full text-left p-3 hover:bg-white/10 rounded-xl transition-all focus:bg-white/10 outline-none flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate max-w-[200px]">{s.title}</div>
                                            <div className="text-xs text-slate-500 truncate">{s.artist || 'Desconhecido'}</div>
                                        </div>
                                        {s.key && (
                                            <div className="text-[10px] text-amber-400/80 font-bold px-2 py-1 bg-amber-500/10 rounded-md">
                                                {s.key}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            ))}
                            {filteredSearch.length === 0 && (
                                <li className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nenhuma música encontrada</li>
                            )}
                        </ul>
                    )}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                            Busca em toda biblioteca
                        </span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                            ESC p/ FECHAR
                        </span>
                    </div>
                </div>
            )}

            {/* Rodapé / Progress Indicator */}
            <footer className={`flex-shrink-0 ${totalPages === 1 && !nextSong ? 'h-8' : 'h-16'} flex items-center justify-between px-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-none`}>
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
                .lyric-stanza {
                    margin-bottom: 1.6em;
                    position: relative;
                }
                .lyric-line {
                    display: block;
                    line-height: 1.6;
                    min-height: 1.6em; /* Garante altura para linhas vazias */
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .chord {
                    color: #4ade80;
                    font-weight: 700;
                    font-family: inherit;
                }
                main {
                    column-fill: auto;
                }
            `}} />
        </div>
        </div>
        </div>
    );
};

export default StageMode;
