import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '../store/LibraryContext';
import {
  MusicNotesPlus,
  Playlist,
  MagnifyingGlass,
  CaretRight,
  PlayCircle,
  PencilSimple,
  Trash,
  MonitorPlay,
  Queue,
  MusicNote,
  X,
  Play,
} from '@phosphor-icons/react';
/**
 * Drawer deslizante de baixo para cima — exibe Repertórios ou Biblioteca.
 * Usado apenas no mobile como substituto da Sidebar.
 */
const MobileDrawer = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const {
    songLibrary, activeSongId, setActiveSongId,
    repertoires, activeRepertoireId, setActiveRepertoireId,
    deleteRepertoire, setEditingRepertoireId, setIsStageMode, setIsTeleprompterOpen,
  } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const overlayRef = useRef(null);

  // Fecha ao clicar no overlay escuro
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Fecha ao pressionar ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const filteredSongs = songLibrary.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  // h-16 da BottomNav + safe-area (não edite o BottomNav; só espelha a altura reservada)
  const bottomNavReserve = 'calc(4rem + env(safe-area-inset-bottom, 0px))';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed top-0 left-0 right-0 z-[400] flex flex-col justify-end bg-black/50 backdrop-blur-sm"
      style={{ bottom: bottomNavReserve }}
    >
      <div
        className="bg-white dark:bg-slate-950 rounded-t-3xl flex flex-col min-h-0 w-full max-h-[min(88dvh,100%)] overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Handle de arraste */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header com tabs */}
        <div className="flex-shrink-0 px-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {activeTab === 'repertoires' ? 'Meus Repertórios' : 'Minha Biblioteca'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('repertoires')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-black transition-all ${
                activeTab === 'repertoires'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              <Queue size={13} weight={activeTab === 'repertoires' ? 'fill' : 'bold'} />
              Repertórios
              {repertoires.length > 0 && (
                <span className={`text-[9px] font-black px-1 rounded-full ${
                  activeTab === 'repertoires' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>{repertoires.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-black transition-all ${
                activeTab === 'library'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              <MusicNote size={13} weight={activeTab === 'library' ? 'fill' : 'bold'} />
              Biblioteca
              {songLibrary.length > 0 && (
                <span className={`text-[9px] font-black px-1 rounded-full ${
                  activeTab === 'library' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>{songLibrary.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Conteúdo: Repertórios ── */}
        {activeTab === 'repertoires' && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
            {repertoires.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-40 italic text-sm gap-2">
                <Queue size={32} />
                <p>Nenhum repertório ainda.</p>
              </div>
            ) : (
              repertoires.map(rep => {
                const isActive = activeRepertoireId === rep.id;
                const songCount = rep.songIds?.length || 0;

                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setActiveRepertoireId(rep.id);
                      setActiveSongId(null);
                      onClose();
                    }}
                    className={`flex flex-col p-3.5 rounded-2xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-l-4 border-l-emerald-500 border-y border-r border-emerald-500/30 text-slate-900 dark:text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isActive ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'
                        }`} />
                        <span className="font-bold text-sm truncate">{rep.name}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRepertoireId(rep.id);
                          setIsStageMode(true);
                          onClose();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all active:scale-95 flex-shrink-0 ${
                          isActive
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                            : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white dark:text-emerald-400'
                        }`}
                        title="Tocar no Palco"
                      >
                        <Play size={11} weight="fill" />
                        <span>Palco</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">
                        {songCount} {songCount === 1 ? 'música' : 'músicas'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveRepertoireId(rep.id); setIsTeleprompterOpen(true); onClose(); }}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
                          title="Teleprompter"
                        >
                          <MonitorPlay size={17} weight="bold" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingRepertoireId(rep.id); onClose(); }}
                          className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Editar"
                        >
                          <PencilSimple size={17} weight="bold" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRepertoire(rep.id); }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          title="Excluir"
                        >
                          <Trash size={17} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Conteúdo: Biblioteca ── */}
        {activeTab === 'library' && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
            {/* Busca */}
            <div className="relative mb-2">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar na biblioteca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {filteredSongs.length > 0 ? (
              filteredSongs.map(song => (
                <div
                  key={song.id}
                  onClick={() => {
                    setActiveSongId(song.id);
                    setActiveRepertoireId(null);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                    activeSongId === song.id
                      ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl border-transparent'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-black text-sm truncate">{song.title || 'Sem Título'}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-tight truncate ${activeSongId === song.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {song.artist || 'Artista desconhecido'}
                    </span>
                  </div>
                  {activeSongId === song.id ? (
                    <CaretRight size={20} weight="bold" />
                  ) : (
                    <span className="text-[10px] font-black p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0">
                      {song.key || '--'}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-40 italic text-sm gap-2">
                <MusicNotesPlus size={32} />
                <p>{searchTerm ? 'Nenhuma música encontrada.' : 'Biblioteca vazia.'}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MobileDrawer;
