import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLibrary } from '../store/LibraryContext';
import useIsMobile from '../hooks/useIsMobile';
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
  MusicNotes,
  SlidersHorizontal,
  X,
} from '@phosphor-icons/react';

const StageMode = ({ onClose }) => {
    const BASE_STAGE_WIDTH = 1920;
    const BASE_STAGE_HEIGHT = 1080;

    const isMobile = useIsMobile();

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
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [debugMetrics, setDebugMetrics] = useState({ scrollLeft: 0, step: 0, maxScrollLeft: 0 });
    const [editLayoutTick, setEditLayoutTick] = useState(0);
    const [keepStanzaTogether, setKeepStanzaTogether] = useState(true);
    const [pageVisualOffset, setPageVisualOffset] = useState(0);
    
    // Estados da Busca (On-the-fly)
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [offScriptSong, setOffScriptSong] = useState(null);
    const searchInputRef = useRef(null);
    const saveLyricsTimeoutRef = useRef(null);
    const pendingLyricsRef = useRef('');

    // ── Estados Mobile ──
    const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);      // feedback visual do swipe
    const [isDragging, setIsDragging] = useState(false);    // para cursor e feedback mouse
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const swipeLockedH = useRef(false);
    const mobileContainerRef = useRef(null);


    const lyricsViewRef = useRef(null);
    const editorContentRef = useRef(null);

    const getPaginationMetrics = (el) => {
        const metricsSource = isEditing && editorContentRef.current ? editorContentRef.current : el;
        const style = window.getComputedStyle(metricsSource);
        const padL = parseFloat(style.paddingLeft) || 0;
        const padR = parseFloat(style.paddingRight) || 0;
        const gap = parseFloat(style.columnGap) || 64;
        const contentWidth = Math.max(1, el.clientWidth - padL - padR);
        // Em CSS multi-column, a próxima "página" começa após 1 bloco visível de colunas:
        // largura útil + gap. Usar clientWidth puro causa drift entre páginas.
        const step = Math.max(1, Math.round(contentWidth + gap));
        const maxScrollLeft = Math.max(0, metricsSource.scrollWidth - el.clientWidth);
        return { step, maxScrollLeft, padL, padR, gap, sourceWidth: metricsSource.scrollWidth };
    };

    const snapToPage = (el, page, total) => {
        const { step, maxScrollLeft, padL, padR, gap, sourceWidth } = getPaginationMetrics(el);
        const safePage = Math.max(0, Math.min(page, Math.max(0, total - 1)));
        const virtualTargetLeft = safePage * step;
        const targetLeft = isEditing ? 0 : Math.min(virtualTargetLeft, maxScrollLeft);
        const visualOffset = isEditing
            ? virtualTargetLeft
            : Math.max(0, virtualTargetLeft - targetLeft);
        const scrollHost = el;
        scrollHost.scrollTo({ left: targetLeft, behavior: 'auto' });
        setPageVisualOffset(visualOffset);
        setDebugMetrics({ scrollLeft: targetLeft, step, maxScrollLeft });
        return safePage;
    };


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
        if (isEditing && editorContentRef.current && currentSong) {
            const el = editorContentRef.current;
            if (el.innerText !== (currentSong.lyrics || '')) {
                el.innerText = currentSong.lyrics || '';
            }
            pendingLyricsRef.current = currentSong.lyrics || '';
        }
    }, [isEditing, resolvedSongId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Formatação de cifras para exibição
    const formatLyrics = (text) => {
        if (!text) return null;
        const stanzas = text.split(/\n\s*\n/);

        return stanzas.map((stanza, stanzaIndex) => {
            const lines = stanza.split('\n');
            return (
                <div
                    key={stanzaIndex}
                    className={`lyric-stanza ${keepStanzaTogether ? 'keep-stanza-together' : ''}`}
                >
                    {lines.map((line, lineIndex) => {
                        const parts = line.split(/(\[[^\]]+\])/g);
                        return (
                            <div key={`${stanzaIndex}-${lineIndex}`} className="lyric-line">
                                {parts.length === 1 && parts[0] === '' ? (
                                    <>&nbsp;</>
                                ) : (
                                    parts.map((part, partIndex) =>
                                        /^\[[^\]]+\]$/.test(part) ? (
                                            <span key={`${stanzaIndex}-${lineIndex}-${partIndex}`} className="chord">{part}</span>
                                        ) : (
                                            <React.Fragment key={`${stanzaIndex}-${lineIndex}-${partIndex}`}>{part}</React.Fragment>
                                        )
                                    )
                                )}
                            </div>
                        );
                    })}
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
                const { step, maxScrollLeft } = getPaginationMetrics(el);
                // Se houver qualquer overflow horizontal parcial,
                // já existe uma próxima página válida.
                const pages = Math.max(1, Math.ceil(maxScrollLeft / step) + 1);
                setTotalPages(pages);
                setDebugMetrics({ scrollLeft: el.scrollLeft, step, maxScrollLeft });
                if (currentPage === 0) setPageVisualOffset(0);
                if (!isEditing && pages === 1) {
                    const freeSpace = el.clientHeight - el.scrollHeight;
                    const extraTop = Math.max(0, Math.floor(freeSpace / 2));
                    setCenterOffsetTop(extraTop);
                } else {
                    setCenterOffsetTop(0);
                }
                
                // Sincroniza a página atual para não ficar em um índice inexistente
                if (currentPage >= pages) {
                    const snappedPage = snapToPage(el, pages - 1, pages);
                    setCurrentPage(snappedPage);
                }
            }
        };

        rafId = requestAnimationFrame(() => {
            rafId = requestAnimationFrame(calculatePages);
        });

        return () => cancelAnimationFrame(rafId);
    }, [resolvedSongId, fontSize, activeCols, activeRepertoire, currentSong?.lyrics, isEditing, stageScale, editLayoutTick]);

    const scrollToPage = (page) => {
        if (lyricsViewRef.current) {
            const el = lyricsViewRef.current;
            const safePage = snapToPage(el, page, totalPages);
            setCurrentPage(safePage);
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
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
                    e.preventDefault();
                    setIsDebugMode((prev) => !prev);
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                setIsSearchOpen(true);
            } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                setIsDebugMode((prev) => !prev);
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

    useEffect(() => {
        if (!lyricsViewRef.current) return;
        const el = lyricsViewRef.current;
        snapToPage(el, currentPage, totalPages);
    }, [currentPage, totalPages, activeCols, resolvedSongId, isEditing]);

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

    // ── Touch handlers para swipe mobile ──
    // touch-action: pan-y no container → browser não captura horizontal → eventos canceláveis
    const initSwipe = (x, y) => {
        touchStartX.current = x;
        touchStartY.current = y;
        swipeLockedH.current = false;
    };

    const moveSwipe = (x, y) => {
        if (touchStartX.current === null) return;
        const deltaX = x - touchStartX.current;
        const deltaY = y - touchStartY.current;
        if (!swipeLockedH.current) {
            if (Math.abs(deltaX) > Math.abs(deltaY) + 5)  swipeLockedH.current = true;
            else if (Math.abs(deltaY) > Math.abs(deltaX) + 5) { touchStartX.current = null; return; }
            else return;
        }

        // Feedback visual amortecido
        setSwipeOffset(deltaX * 0.35);
    };

    const endSwipe = (x, y) => {
        setSwipeOffset(0);
        swipeLockedH.current = false;

        if (touchStartX.current === null) return;
        const deltaX = x - touchStartX.current;
        const deltaY = y - touchStartY.current;
        touchStartX.current = null;
        touchStartY.current = null;
        if (Math.abs(deltaX) < 35 || Math.abs(deltaY) > Math.abs(deltaX)) return;
        if (deltaX < 0) handleNext();
        else            handlePrev();
    };

    // Touch
    const handleTouchStart = (e) => initSwipe(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchMove = (e) => moveSwipe(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchEnd  = (e) => endSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    // Mouse (desktop / Chrome DevTools)
    const handleMouseDown = (e) => { if (e.button !== 0) return; setIsDragging(true); initSwipe(e.clientX, e.clientY); };
    const handleMouseMove = (e) => { if (!isDragging) return; moveSwipe(e.clientX, e.clientY); };
    const handleMouseUp   = (e) => { if (!isDragging) return; setIsDragging(false); endSwipe(e.clientX, e.clientY); };


    // ────────────────────────────────────────────
    // LAYOUT MOBILE: fluido, sem canvas 1920px
    // ────────────────────────────────────────────
    if (isMobile) {
        const mobileFontSize = Math.max(0.9, Math.min(fontSize, 2.5));
        const totalSongs = activeRepertoire?.songIds.length || 1;

        return (
            <div
                ref={mobileContainerRef}
                className="fixed inset-0 z-[220] bg-slate-950 flex flex-col text-white overflow-hidden"
                style={{ touchAction: 'pan-y', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}

                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* ── Header Mobile ── */}
                <header className="flex-shrink-0 bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10 safe-top">
                    <div className="flex flex-col min-w-0 flex-1">
                        {activeRepertoire && (
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                {offScriptSong ? '⚡ Fora de Roteiro' : `${currentIndex + 1} / ${totalSongs}`}
                            </span>
                        )}
                        <h2 className="font-black text-lg leading-tight truncate">
                            {currentSong.title}
                        </h2>
                        {currentSong.key && (
                            <span className="text-indigo-300 text-xs font-bold">Tom: {currentSong.key}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {/* Controles */}
                        <button
                            onClick={() => setMobileControlsOpen(v => !v)}
                            className={`p-2.5 rounded-xl transition-all ${
                                mobileControlsOpen ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400'
                            }`}
                        >
                            <SlidersHorizontal size={20} weight="bold" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/20"
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </div>
                </header>

                {/* ── Painel de controles (bottom sheet) ── */}
                {mobileControlsOpen && (
                    <div className="flex-shrink-0 bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-wrap">
                        {/* Fonte */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                            <button onClick={() => setFontSize(p => Math.max(0.8, p - 0.2))} className="p-2 hover:bg-white/10 rounded-lg"><TextT size={16} /></button>
                            <span className="text-xs font-bold px-1 text-slate-400">{fontSize.toFixed(1)}x</span>
                            <button onClick={() => setFontSize(p => Math.min(4, p + 0.2))} className="p-2 hover:bg-white/10 rounded-lg"><TextT size={20} weight="bold" /></button>
                        </div>
                        {/* Colunas */}
                        <button
                            onClick={() => setStageColumnOverride(stageColumnOverride === 2 ? 1 : 2)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                (stageColumnOverride ?? currentSong?.columns ?? columnCount ?? 1) === 2
                                    ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
                            }`}
                        >
                            <Columns size={16} /> 2 Colunas
                        </button>
                        {/* Tela cheia */}
                        <button
                            onClick={toggleFullscreen}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 text-slate-300"
                        >
                            <ArrowsOut size={16} /> Tela Cheia
                        </button>
                    </div>
                )}

                {/* ── Área de letra — Paginação horizontal (swipe) ── */}
                <main
                    ref={lyricsViewRef}
                    className="flex-1 overflow-x-hidden overflow-y-hidden px-6 py-6"
                    style={{
                        fontSize: `${mobileFontSize}rem`,
                        lineHeight: '1.7',
                        columnCount: (stageColumnOverride ?? currentSong?.columns ?? columnCount ?? 1),
                        columnGap: '2rem',
                        columnFill: 'auto', // Essencial para colunas transbordarem horizontalmente
                        touchAction: 'pan-y',
                        transform: `translateX(${swipeOffset}px)`,
                        transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
                    }}
                >
                    {formatLyrics(currentSong.lyrics)}
                </main>


                {/* ── Footer Mobile: navegação e indicador ── */}
                <footer className="flex-shrink-0 bg-slate-900/80 backdrop-blur-md px-4 py-3 safe-bottom">
                    {/* Próxima música */}
                    {nextSong && !offScriptSong && (
                        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                            A seguir: {nextSong.title}
                        </p>
                    )}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0 && !offScriptSong}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-sm disabled:opacity-30 transition-all active:scale-95"
                        >
                            <CaretLeft size={20} weight="bold" />
                            Anterior
                        </button>

                        {/* Indicador de posição */}
                        <div className="flex flex-col items-center gap-1.5">
                            {/* Indicador de PÁGINA (dentro da música) */}
                            {totalPages > 1 && (
                                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                    Pág {currentPage + 1}/{totalPages}
                                </span>
                            )}
                            
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(totalSongs, 7) }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-full transition-all duration-300 ${
                                            i === currentIndex
                                                ? 'w-4 h-1.5 bg-indigo-500'
                                                : 'w-1.5 h-1.5 bg-white/20'
                                        }`}
                                    />
                                ))}
                                {totalSongs > 7 && <span className="text-[9px] text-slate-500 self-end">...</span>}
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold tracking-widest">
                                MÚSICA {currentIndex + 1}/{totalSongs}
                            </span>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={currentIndex === totalSongs - 1 && !offScriptSong}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-sm disabled:opacity-30 transition-all active:scale-95"
                        >
                            Próxima
                            <CaretRight size={20} weight="bold" />
                        </button>
                    </div>
                </footer>

                {/* Estilos cifra */}
                <style dangerouslySetInnerHTML={{ __html: `
                    .lyric-stanza { margin-bottom: 1.6em; }
                    .lyric-line { display: block; line-height: 1.7; min-height: 1.7em; white-space: pre-wrap; word-break: break-word; }
                    .chord { color: #4ade80; font-weight: 700; }
                `}} />
            </div>
        );
    }

    // ────────────────────────────────────────────
    // LAYOUT DESKTOP: canvas 1920×1080 (original)
    // ────────────────────────────────────────────
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
            <header className="flex-shrink-0 min-h-[104px] bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5 relative z-10">
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
                        <h2 className={`text-2xl font-black truncate max-w-xs md:max-w-md ${offScriptSong ? 'text-amber-400' : ''}`}>
                            {currentSong.title}
                        </h2>
                    </div>
                    <div className="hidden md:flex flex-col opacity-50 ml-4 pl-4 border-l border-white/10">
                        <span className="text-[11px] uppercase font-bold tracking-widest">Tom</span>
                        <span className="font-black text-lg text-indigo-300">{currentSong.key || '--'}</span>
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

                <div className="flex items-center gap-3 md:gap-4">
                    {/* Pesquisa (CTRL+F) */}
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2.5 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ${isSearchOpen ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                        title="Buscar Música (Ctrl + F)"
                    >
                        <MagnifyingGlass size={22} weight="bold" />
                        <span className="hidden lg:inline mr-1">Buscar</span>
                    </button>

                    {/* Botões de Navegação (Só mostra se houver repertório) */}
                    {activeRepertoire && (
                        <div className="flex items-center bg-white/5 rounded-2xl p-1 gap-1 border border-white/10">
                            <button onClick={handlePrev} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><CaretLeft size={22} weight="bold" /></button>
                            <span className="text-sm font-bold px-2 whitespace-nowrap opacity-70">Pág. {currentPage + 1}/{totalPages}</span>
                            <button onClick={handleNext} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><CaretRight size={22} weight="bold" /></button>
                        </div>
                    )}
                    
                    {/* Paginação Isolada (Para Música Avulsa) */}
                    {!activeRepertoire && (
                        <div className="flex items-center bg-white/5 rounded-2xl p-1 gap-1 border border-white/10">
                            <button onClick={handlePrev} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><CaretLeft size={22} weight="bold" /></button>
                            <span className="text-sm font-bold px-2 whitespace-nowrap opacity-70">Pág. {currentPage + 1}/{totalPages}</span>
                            <button onClick={handleNext} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><CaretRight size={22} weight="bold" /></button>
                        </div>
                    )}

                    <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-white/10 text-slate-400 bg-white/5">
                        Layout 16:9 fixo
                    </span>
                    <button
                        onClick={() => setKeepStanzaTogether((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${keepStanzaTogether ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                        title="Evitar quebra de estrofe no fim da página"
                    >
                        Estrofes
                    </button>

                    {/* Controles de Estilo e Edição */}
                    <div className="hidden lg:flex items-center gap-1">
                        <button 
                            onClick={() => {
                                if (isEditing) {
                                    flushPendingLyrics(currentSong?.id);
                                }
                                setIsEditing(!isEditing);
                            }}
                            className={`px-4 py-2 rounded-xl transition-all text-sm font-bold tracking-wider uppercase flex items-center gap-2 ${isEditing ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                            title="Editar Letra ao Vivo"
                        >
                            {isEditing ? 'Sair do Modo Edição' : 'Editar'}
                        </button>
                        
                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <button onClick={() => setFontSize(prev => Math.max(0.8, prev - 0.2))} className="p-2.5 hover:bg-white/10 rounded-xl"><TextT size={20} /></button>
                        <button onClick={() => setFontSize(prev => Math.min(4, prev + 0.2))} className="p-2.5 hover:bg-white/10 rounded-xl"><TextT size={26} weight="bold" /></button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button 
                            onClick={() => {
                                const nextCols = activeCols === 2 ? 1 : 2;
                                setStageColumnOverride(nextCols);
                            }}
                            className={`p-2.5 rounded-xl transition-all ${activeCols === 2 ? 'bg-indigo-600 text-white' : 'hover:bg-white/10'}`}
                        >
                            <Columns size={22} />
                        </button>
                        <button 
                            onClick={toggleFullscreen}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                            title="Tela Cheia (F11)"
                        >
                            <ArrowsOut size={22} weight="bold" />
                        </button>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 active:scale-95"
                    >
                        <XCircle size={26} weight="bold" />
                    </button>
                </div>
            </header>

            {/* Modo Edição: mesmo layout do palco mas com contentEditable */}
            {isEditing ? (
                <main
                    key="editor"
                    ref={lyricsViewRef}
                    className="flex-1 overflow-x-hidden overflow-y-hidden py-8 outline-none caret-amber-400 selection:bg-amber-500/30"
                >
                    <div
                        ref={editorContentRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                            saveLyricsDebounced(currentSong.id, e.currentTarget.innerText);
                            setEditLayoutTick((prev) => prev + 1);
                            requestAnimationFrame(() => {
                                if (lyricsViewRef.current) {
                                    snapToPage(lyricsViewRef.current, currentPage, totalPages);
                                }
                            });
                        }}
                        className="h-full outline-none caret-amber-400 selection:bg-amber-500/30"
                        style={{
                            paddingLeft: '64px',
                            paddingRight: '64px',
                            transform: `translateX(-${pageVisualOffset}px)`,
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
                            minHeight: '100%',
                        }}
                    />
                </main>
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
                    <div style={{ transform: `translateX(-${pageVisualOffset}px)` }}>
                        {formatLyrics(currentSong.lyrics)}
                    </div>
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

            {isDebugMode && (
                <div className="absolute bottom-4 right-6 z-[180] bg-black/70 border border-emerald-400/30 rounded-xl px-3 py-2 text-[11px] font-mono text-emerald-300 pointer-events-none">
                    <div>page: {currentPage + 1}/{totalPages}</div>
                    <div>scrollLeft: {Math.round(debugMetrics.scrollLeft)}</div>
                    <div>step: {Math.round(debugMetrics.step)}</div>
                    <div>maxScrollLeft: {Math.round(debugMetrics.maxScrollLeft)}</div>
                </div>
            )}

            {/* Estilos específicos para o Modo Palco */}
            <style dangerouslySetInnerHTML={{ __html: `
                .lyric-stanza {
                    margin-bottom: 1.6em;
                    position: relative;
                }
                .keep-stanza-together {
                    break-inside: avoid-column;
                    -webkit-column-break-inside: avoid;
                    page-break-inside: avoid;
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
