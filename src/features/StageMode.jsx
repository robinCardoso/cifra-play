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
  PencilSimple,
  Check,
  Plus,
  Minus,
} from '@phosphor-icons/react';

function parseLyrics(text) {
    if (!text || !String(text).trim()) return [['']];
    return String(text).split(/\n\s*\n/).map((stanza) => stanza.split('\n'));
}

function serializeLyrics(stanzas) {
    if (!stanzas?.length) return '';
    return stanzas.map((s) => s.join('\n')).join('\n\n');
}

function setLineInLyrics(lyrics, stanzaIndex, lineIndex, lineText) {
    const stanzas = parseLyrics(lyrics);
    if (!stanzas[stanzaIndex]) return lyrics;
    stanzas[stanzaIndex] = [...stanzas[stanzaIndex]];
    stanzas[stanzaIndex][lineIndex] = lineText;
    return serializeLyrics(stanzas);
}

function insertLineAfterInLyrics(lyrics, stanzaIndex, lineIndex, text = '') {
    const stanzas = parseLyrics(lyrics);
    if (!stanzas[stanzaIndex]) return lyrics;
    stanzas[stanzaIndex] = [...stanzas[stanzaIndex]];
    stanzas[stanzaIndex].splice(lineIndex + 1, 0, text);
    return serializeLyrics(stanzas);
}

function insertStanzaAfterInLyrics(lyrics, stanzaIndex) {
    const stanzas = parseLyrics(lyrics);
    stanzas.splice(stanzaIndex + 1, 0, ['']);
    return serializeLyrics(stanzas);
}

function mergeStanzaWithPreviousInLyrics(lyrics, stanzaIndex) {
    if (stanzaIndex <= 0) return lyrics;
    const stanzas = parseLyrics(lyrics);
    stanzas[stanzaIndex - 1] = [...stanzas[stanzaIndex - 1], ...stanzas[stanzaIndex]];
    stanzas.splice(stanzaIndex, 1);
    return serializeLyrics(stanzas);
}

function mergeWithPreviousLineInLyrics(lyrics, stanzaIndex, lineIndex) {
    if (lineIndex <= 0) return mergeStanzaWithPreviousInLyrics(lyrics, stanzaIndex);
    const stanzas = parseLyrics(lyrics);
    if (!stanzas[stanzaIndex]) return lyrics;
    stanzas[stanzaIndex] = [...stanzas[stanzaIndex]];
    const prev = stanzas[stanzaIndex][lineIndex - 1];
    const cur = stanzas[stanzaIndex][lineIndex];
    stanzas[stanzaIndex][lineIndex - 1] = prev + cur;
    stanzas[stanzaIndex].splice(lineIndex, 1);
    return serializeLyrics(stanzas);
}

function isCaretAtStart(el) {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !el) return false;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer)) return false;
    const probe = document.createRange();
    probe.selectNodeContents(el);
    probe.setEnd(range.startContainer, range.startOffset);
    return probe.toString().length === 0;
}

function EditableLyricLine({ stanzaIndex, lineIndex, line, onCommit, onRequestNewLine, onRequestNewStanza, onMergeWithPrevious }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || document.activeElement === el) return;
        const next = line === '' ? '' : line;
        if (el.innerText !== next) el.innerText = next;
    }, [line, stanzaIndex, lineIndex]);

    return (
        <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            data-stanza={stanzaIndex}
            data-line={lineIndex}
            className="lyric-line outline-none rounded-sm focus:ring-1 focus:ring-amber-500/40 caret-amber-400 selection:bg-amber-500/30"
            onInput={(e) => {
                const text = e.currentTarget.innerText.replace(/\r\n/g, '\n').replace(/\n/g, '');
                onCommit(stanzaIndex, lineIndex, text);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    onRequestNewStanza(stanzaIndex);
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onRequestNewLine(stanzaIndex, lineIndex);
                    return;
                }
                if (e.key === 'Backspace' && isCaretAtStart(e.currentTarget)) {
                    if (lineIndex > 0 || stanzaIndex > 0) {
                        e.preventDefault();
                        onMergeWithPrevious(stanzaIndex, lineIndex);
                    }
                }
            }}
        />
    );
}

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
    const [editLyrics, setEditLyrics] = useState('');
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

    const getPaginationMetrics = (el) => {
        const style = window.getComputedStyle(el);
        const padL = parseFloat(style.paddingLeft) || 0;
        const padR = parseFloat(style.paddingRight) || 0;
        const gap = parseFloat(style.columnGap) || 64;
        const contentWidth = Math.max(1, el.clientWidth - padL - padR);
        // Em CSS multi-column, a próxima "página" começa após 1 bloco visível de colunas:
        // largura útil + gap. Usar clientWidth puro causa drift entre páginas.
        const step = Math.max(1, Math.round(contentWidth + gap));
        const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
        return { step, maxScrollLeft, padL, padR, gap, sourceWidth: el.scrollWidth };
    };

    const snapToPage = (el, page, total) => {
        const { step, maxScrollLeft } = getPaginationMetrics(el);
        const safePage = Math.max(0, Math.min(page, Math.max(0, total - 1)));
        const virtualTargetLeft = safePage * step;
        const targetLeft = Math.min(virtualTargetLeft, maxScrollLeft);
        const visualOffset = Math.max(0, virtualTargetLeft - targetLeft);
        el.scrollTo({ left: targetLeft, behavior: 'auto' });
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
            // Desconta a altura do header (aprox 104px)
            const availableHeight = isMobile ? window.innerHeight : (window.innerHeight - 104);
            const heightRatio = availableHeight / BASE_STAGE_HEIGHT;
            setStageScale(Math.max(0.2, Math.min(widthRatio, heightRatio)));
        };

        updateStageScale();
        window.addEventListener('resize', updateStageScale);
        return () => window.removeEventListener('resize', updateStageScale);
    }, [isMobile]);
    const resolvedSongId = activeRepertoire?.songIds[currentIndex] || activeSongId;
    const currentSong = offScriptSong || songLibrary.find(s => s.id === resolvedSongId);
    const nextSongId = activeRepertoire?.songIds[currentIndex + 1];
    const nextSong = offScriptSong ? null : songLibrary.find(s => s.id === nextSongId);

    // Motor de Decisão de Colunas:
    // 1) Override da sessão de palco (botão de colunas no StageMode)
    // 2) Preferência da música
    // 3) Configuração global
    const activeCols = stageColumnOverride ?? currentSong?.columns ?? columnCount ?? 1;
    // Mobile: telas estreitas não exibem 2 colunas (a preferência 2 col. vale no desktop/ensaio).
    const effectiveCols = isMobile ? 1 : activeCols;

    const displayLyrics = isEditing ? editLyrics : (currentSong?.lyrics ?? '');

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

    const focusLyricLine = (stanzaIndex, lineIndex) => {
        requestAnimationFrame(() => {
            const el = lyricsViewRef.current?.querySelector(
                `[data-stanza="${stanzaIndex}"][data-line="${lineIndex}"]`
            );
            if (el) {
                el.focus();
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        });
    };

    const pushEditLyrics = (getNext) => {
        setEditLyrics((prev) => {
            const next = typeof getNext === 'function' ? getNext(prev) : getNext;
            pendingLyricsRef.current = next;
            if (currentSong?.id) saveLyricsDebounced(currentSong.id, next);
            setEditLayoutTick((t) => t + 1);
            return next;
        });
    };

    const handleLineCommit = (stanzaIndex, lineIndex, text) => {
        pushEditLyrics((prev) => setLineInLyrics(prev, stanzaIndex, lineIndex, text));
    };

    const handleRequestNewLine = (stanzaIndex, lineIndex) => {
        pushEditLyrics((prev) => insertLineAfterInLyrics(prev, stanzaIndex, lineIndex, ''));
        focusLyricLine(stanzaIndex, lineIndex + 1);
    };

    const handleRequestNewStanza = (stanzaIndex) => {
        pushEditLyrics((prev) => insertStanzaAfterInLyrics(prev, stanzaIndex));
        focusLyricLine(stanzaIndex + 1, 0);
    };

    const handleMergeWithPrevious = (stanzaIndex, lineIndex) => {
        let focusStanza = stanzaIndex;
        let focusLine = lineIndex;
        pushEditLyrics((prev) => {
            const stanzasBefore = parseLyrics(prev);
            if (lineIndex > 0) {
                focusLine = lineIndex - 1;
                return mergeWithPreviousLineInLyrics(prev, stanzaIndex, lineIndex);
            }
            focusStanza = stanzaIndex - 1;
            focusLine = Math.max(0, (stanzasBefore[stanzaIndex - 1]?.length ?? 1) - 1);
            return mergeStanzaWithPreviousInLyrics(prev, stanzaIndex);
        });
        focusLyricLine(focusStanza, focusLine);
    };

    const enterEditMode = () => {
        const lyrics = currentSong?.lyrics || '';
        setEditLyrics(lyrics);
        pendingLyricsRef.current = lyrics;
        setIsEditing(true);
    };

    const exitEditMode = () => {
        flushPendingLyrics(currentSong?.id);
        setIsEditing(false);
    };

    useEffect(() => {
        if (!isEditing) return;
        const lyrics = currentSong?.lyrics || '';
        setEditLyrics(lyrics);
        pendingLyricsRef.current = lyrics;
    }, [isEditing, resolvedSongId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Mesma árvore DOM no palco e na edição (estrofes, linhas, estrofes juntas)
    const formatLyrics = (text, editable = false) => {
        if (!text && !editable) return null;
        const stanzas = text ? text.split(/\n\s*\n/) : [''];

        const stanzaFlowClass =
            keepStanzaTogether && effectiveCols === 1 ? 'keep-stanza-together' : '';

        return stanzas.map((stanza, stanzaIndex) => {
            const lines = stanza.split('\n');
            return (
                <div
                    key={stanzaIndex}
                    className={`lyric-stanza ${stanzaFlowClass}`}
                >
                    {lines.map((line, lineIndex) => {
                        if (editable) {
                            return (
                                <EditableLyricLine
                                    key={`${stanzaIndex}-${lineIndex}`}
                                    stanzaIndex={stanzaIndex}
                                    lineIndex={lineIndex}
                                    line={line}
                                    onCommit={handleLineCommit}
                                    onRequestNewLine={handleRequestNewLine}
                                    onRequestNewStanza={handleRequestNewStanza}
                                    onMergeWithPrevious={handleMergeWithPrevious}
                                />
                            );
                        }
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
                if (pages === 1) {
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
    }, [resolvedSongId, fontSize, effectiveCols, activeRepertoire, displayLyrics, keepStanzaTogether, stageScale, editLayoutTick]);

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
                    exitEditMode();
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
    }, [currentPage, totalPages, effectiveCols, resolvedSongId, isEditing]);

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
        // O `fontSize` global (rem) calibra o palco 16:9; no mobile mapeamos para rem legíveis na largura ~360px.
        // Faixa calibrada para ~2 estrofes típicas na altura útil (equivalente ao “2 blocos” do desktop em 2 colunas).
        const MOBILE_FONT_LO = 0.88;
        const MOBILE_FONT_HI = 1.28;
        const MOBILE_LH = 1.55;
        const STAGE_F_MIN = 0.8;
        const STAGE_F_MAX = 4;
        const t = Math.min(1, Math.max(0, (fontSize - STAGE_F_MIN) / (STAGE_F_MAX - STAGE_F_MIN)));
        const mobileFontSize = MOBILE_FONT_LO + t * (MOBILE_FONT_HI - MOBILE_FONT_LO);
        const totalSongs = activeRepertoire?.songIds.length || 1;
        // Com o menu do app oculto no palco, só respiro leve + safe area (o rodapé do palco tem os botões)
        const mobileLyricsPadBottom = 'max(1.25rem, env(safe-area-inset-bottom, 0px))';

        return (
            <div
                ref={mobileContainerRef}
                className="fixed inset-0 z-[500] bg-slate-950 flex flex-col text-white overflow-hidden"
                style={{ touchAction: 'pan-y', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}

                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* ── Header Mobile Moderno ── */}
                <header className="flex-shrink-0 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-white/10 safe-top">
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                        {activeRepertoire && (
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                {offScriptSong ? '⚡ Fora de Roteiro' : `Música ${currentIndex + 1} de ${totalSongs}`}
                            </span>
                        )}
                        <h2 className="font-black text-sm sm:text-base leading-tight truncate">
                            {currentSong.title}
                        </h2>
                        {currentSong.key && (
                            <span className="text-indigo-300 text-[11px] font-bold">Tom: {currentSong.key}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Botão de Busca */}
                        <button
                            onClick={() => setIsSearchOpen(v => !v)}
                            className={`p-2 rounded-xl transition-all ${
                                isSearchOpen ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
                            }`}
                            title="Buscar Música"
                        >
                            <MagnifyingGlass size={18} weight="bold" />
                        </button>

                        {/* Botão de Editar Música */}
                        <button
                            onClick={() => (isEditing ? exitEditMode() : enterEditMode())}
                            className={`px-2.5 py-1.5 rounded-xl transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 ${
                                isEditing
                                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                                    : 'bg-white/10 text-slate-200'
                            }`}
                            title={isEditing ? 'Concluir Edição' : 'Editar Letra'}
                        >
                            {isEditing ? (
                                <>
                                    <Check size={14} weight="bold" />
                                    <span>Salvar</span>
                                </>
                            ) : (
                                <>
                                    <PencilSimple size={14} weight="bold" className="text-amber-400" />
                                    <span>Editar</span>
                                </>
                            )}
                        </button>

                        {/* Controles de Palco */}
                        <button
                            onClick={() => setMobileControlsOpen(v => !v)}
                            className={`p-2 rounded-xl transition-all ${
                                mobileControlsOpen ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400'
                            }`}
                            title="Ajustes de Palco"
                        >
                            <SlidersHorizontal size={18} weight="bold" />
                        </button>

                        {/* Fechar */}
                        <button
                            onClick={onClose}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 active:scale-95 transition-all"
                            title="Sair do Palco"
                        >
                            <X size={18} weight="bold" />
                        </button>
                    </div>
                </header>

                {/* Aviso quando em modo edição no mobile */}
                {isEditing && (
                    <div className="bg-amber-500/20 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-300 font-bold animate-in fade-in">
                        <span>✏️ Toque em qualquer linha para editar o texto</span>
                        <button onClick={exitEditMode} className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">
                            Concluir
                        </button>
                    </div>
                )}

                {/* ── Painel de controles mobile ── */}
                {mobileControlsOpen && (
                    <div className="flex-shrink-0 bg-slate-900 border-b border-white/10 px-3 py-2.5 flex items-center justify-between gap-2 animate-in slide-in-from-top-2">
                        {/* Fonte */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                            <button onClick={() => setFontSize(p => Math.max(0.8, p - 0.2))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300">
                                <Minus size={14} weight="bold" />
                            </button>
                            <span className="text-xs font-bold px-1 text-slate-300 min-w-[28px] text-center">{fontSize.toFixed(1)}x</span>
                            <button onClick={() => setFontSize(p => Math.min(4, p + 0.2))} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300">
                                <Plus size={14} weight="bold" />
                            </button>
                        </div>

                        {/* Estrofes */}
                        <button
                            type="button"
                            onClick={() => setKeepStanzaTogether((v) => !v)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                keepStanzaTogether
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                    : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${keepStanzaTogether ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span>Estrofes</span>
                        </button>

                        {/* Tela cheia */}
                        <button
                            onClick={toggleFullscreen}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 text-slate-300 hover:text-white"
                        >
                            <ArrowsOut size={15} />
                            <span>Tela Cheia</span>
                        </button>
                    </div>
                )}

                {/* ── Área de letra — Paginação horizontal (swipe) ── */}
                <main
                    ref={lyricsViewRef}
                    className={`flex-1 overflow-x-hidden overflow-y-hidden px-4 pt-4 ${isEditing ? 'cursor-text' : ''}`}
                    style={{
                        fontSize: `${mobileFontSize}rem`,
                        lineHeight: String(MOBILE_LH),
                        columnCount: effectiveCols,
                        columnGap: '2rem',
                        columnFill: 'auto',
                        paddingBottom: mobileLyricsPadBottom,
                        touchAction: 'pan-y',
                        transform: `translateX(${swipeOffset}px)`,
                        transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
                    }}
                >
                    {formatLyrics(displayLyrics, isEditing)}
                </main>


                {/* ── Footer Mobile: navegação e indicador ── */}
                <footer className="flex-shrink-0 bg-slate-900/80 backdrop-blur-md px-3 py-2.5 safe-bottom">
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

                {/* Mesmas regras de estrofes do desktop: evita “sobra” de uma linha no limite do fragmento coluna/página */}
                <style dangerouslySetInnerHTML={{ __html: `
                    .lyric-stanza { margin-bottom: 1.22em; position: relative; }
                    .keep-stanza-together {
                        -webkit-column-break-inside: avoid;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    .lyric-line { display: block; line-height: ${MOBILE_LH}; min-height: 1.5em; white-space: pre-wrap; word-break: break-word; }
                    .chord { color: #4ade80; font-weight: 700; }
                    main { column-fill: auto; }
                `}} />
            </div>
        );
    }

    // ────────────────────────────────────────────
    // LAYOUT DESKTOP: canvas 1920×1080 (original)
    // ────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[500] bg-slate-950 overflow-hidden flex flex-col text-white">
            
            {/* Header de Controle do Palco Modernizado */}
            <header className="flex-shrink-0 h-[68px] md:h-[72px] bg-slate-900/95 backdrop-blur-md px-5 md:px-6 flex items-center justify-between border-b border-white/10 relative z-20 w-full transition-all">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex flex-col min-w-0">
                        {offScriptSong ? (
                            <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <ArrowUUpLeft weight="bold"/> Fora de Roteiro
                            </span>
                        ) : activeRepertoire ? (
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest leading-none">
                                Música {currentIndex + 1} de {activeRepertoire.songIds.length}
                            </span>
                        ) : (
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1">
                                <MusicNotes weight="bold" /> Ensaio Avulso
                            </span>
                        )}
                        <h2 className={`text-xl md:text-2xl font-black truncate max-w-xs md:max-w-md ${offScriptSong ? 'text-amber-400' : 'text-white'}`}>
                            {currentSong.title}
                        </h2>
                    </div>

                    {currentSong.key && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex-shrink-0">
                            <span className="text-[10px] uppercase font-bold text-indigo-400/80">Tom</span>
                            <span className="font-black text-xs md:text-sm">{currentSong.key}</span>
                        </div>
                    )}

                    {offScriptSong && (
                        <button 
                            onClick={() => { setOffScriptSong(null); setCurrentPage(0); }}
                            className="ml-2 px-2.5 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 flex-shrink-0"
                        >
                            <ArrowUUpLeft size={14} weight="bold"/>
                            <span className="hidden md:inline text-xs">Voltar</span>
                        </button>
                    )}
                </div>

                {/* Toolbar de Controles Agrupados */}
                <div className="flex items-center gap-2 md:gap-3">
                    
                    {/* Paginação Compacta */}
                    <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10 shadow-inner">
                        <button 
                            onClick={handlePrev} 
                            disabled={currentPage === 0 && currentIndex === 0 && !offScriptSong}
                            className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-all text-slate-300"
                            title="Página Anterior (Seta Esquerda / Espaço)"
                        >
                            <CaretLeft size={16} weight="bold" />
                        </button>
                        <span className="text-xs font-bold px-2 whitespace-nowrap text-slate-300">
                            {currentPage + 1}/{totalPages}
                        </span>
                        <button 
                            onClick={handleNext} 
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-300"
                            title="Próxima Página (Seta Direita / PageDown)"
                        >
                            <CaretRight size={16} weight="bold" />
                        </button>
                    </div>

                    {/* ── BOTÃO DE EDITAR MÚSICA ── */}
                    <button 
                        onClick={() => (isEditing ? exitEditMode() : enterEditMode())}
                        className={`px-3.5 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 shadow-sm ${
                            isEditing 
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border border-amber-300 ring-2 ring-amber-400/40 shadow-amber-500/30' 
                                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                        }`}
                        title={isEditing ? 'Concluir e sair da edição (Esc)' : 'Editar letra — Enter: nova linha · Ctrl+Enter: nova estrofe'}
                    >
                        {isEditing ? (
                            <>
                                <Check size={15} weight="bold" />
                                <span>Concluir</span>
                            </>
                        ) : (
                            <>
                                <PencilSimple size={15} weight="bold" className="text-amber-400" />
                                <span>Editar</span>
                            </>
                        )}
                    </button>

                    {/* Controles de Formatação (Fonte, Colunas, Estrofes) */}
                    <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                        {/* Ajuste de Fonte */}
                        <div className="flex items-center gap-1 px-1">
                            <button 
                                onClick={() => setFontSize(prev => Math.max(0.8, prev - 0.2))} 
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                title="Diminuir Fonte"
                            >
                                <Minus size={14} weight="bold" />
                            </button>
                            <span className="text-xs font-bold text-slate-300 min-w-[32px] text-center">
                                {fontSize.toFixed(1)}x
                            </span>
                            <button 
                                onClick={() => setFontSize(prev => Math.min(4, prev + 0.2))} 
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                title="Aumentar Fonte"
                            >
                                <Plus size={14} weight="bold" />
                            </button>
                        </div>

                        <div className="w-px h-5 bg-white/10 mx-0.5" />

                        {/* Alternar Colunas */}
                        <button 
                            onClick={() => {
                                const nextCols = activeCols === 2 ? 1 : 2;
                                setStageColumnOverride(nextCols);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeCols === 2 
                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                            title="Alternar 1 ou 2 Colunas"
                        >
                            <Columns size={15} weight={activeCols === 2 ? "fill" : "regular"} />
                            <span>{activeCols} Col</span>
                        </button>

                        {/* Manter Estrofes Juntas */}
                        <button
                            onClick={() => setKeepStanzaTogether((prev) => !prev)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                keepStanzaTogether 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                            title="Manter estrofes unidas sem quebra"
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${keepStanzaTogether ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span>Estrofes</span>
                        </button>
                    </div>

                    {/* Busca Rápida (CTRL+F) */}
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2.5 rounded-xl transition-all ${
                            isSearchOpen ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'
                        }`}
                        title="Buscar Música no Palco (Ctrl + F)"
                    >
                        <MagnifyingGlass size={20} weight="bold" />
                    </button>

                    {/* Tela Cheia */}
                    <button 
                        onClick={toggleFullscreen}
                        className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
                        title="Tela Cheia (F11)"
                    >
                        <ArrowsOut size={20} weight="bold" />
                    </button>

                    {/* Fechar Palco */}
                    <button 
                        onClick={onClose}
                        className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 active:scale-95"
                        title="Sair do Palco (Esc)"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>
            </header>

            {/* Banner Flutuante de Ajuda quando em Modo Edição */}
            {isEditing && (
                <div className="bg-amber-500/15 border-b border-amber-500/30 py-2 px-6 flex items-center justify-between text-amber-300 text-xs font-medium z-10 animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                        <PencilSimple size={16} weight="bold" className="text-amber-400" />
                        <span><strong>Modo de Edição Ativo:</strong> As colunas enchem em ordem (esquerda → direita). Linhas “soltas” são estrofes separadas — use <strong>Backspace</strong> no início da linha para juntar à anterior.</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-amber-400/80">
                        <span><strong>Enter:</strong> nova linha</span>
                        <span><strong>Ctrl+Enter:</strong> nova estrofe</span>
                        <span><strong>Backspace</strong> (início da linha): juntar</span>
                        <button 
                            onClick={exitEditMode}
                            className="font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors shadow-sm"
                        >
                            Concluir
                        </button>
                    </div>
                </div>
            )}

            {/* Container do Palco (Área restante) */}
            <div className="flex-1 relative overflow-hidden">
                <div
                    className="absolute left-1/2 top-1/2 font-sans animate-in fade-in duration-300"
                    style={{
                        width: `${BASE_STAGE_WIDTH}px`,
                        height: `${BASE_STAGE_HEIGHT}px`,
                        transform: `translate(-50%, -50%) scale(${stageScale})`,
                        transformOrigin: 'center center',
                    }}
                >
                    <div className="w-full h-full flex flex-col">

            <main
                ref={lyricsViewRef}
                className={`flex-1 overflow-x-hidden overflow-y-hidden py-8 ${isEditing ? 'cursor-text' : ''}`}
                style={{
                    paddingLeft: '64px',
                    paddingRight: '64px',
                    paddingTop: `calc(2rem + ${centerOffsetTop}px)`,
                    paddingBottom: '2rem',
                    fontSize: `${fontSize}rem`,
                    lineHeight: '1.6',
                    columnCount: effectiveCols,
                    columnGap: '64px',
                    columnWidth: effectiveCols === 1 ? '100%' : 'auto',
                    columnFill: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#ffffff',
                }}
            >
                <div style={{ transform: `translateX(-${pageVisualOffset}px)` }}>
                    {formatLyrics(displayLyrics, isEditing)}
                </div>
            </main>

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
                /* Em 1 coluna: evita cortar estrofe entre páginas do scroll. Em 2 colunas a classe não é aplicada — o texto preenche col. 1 e depois col. 2. */
                .keep-stanza-together {
                    break-inside: avoid;
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
        </div>
    );
};

export default StageMode;
