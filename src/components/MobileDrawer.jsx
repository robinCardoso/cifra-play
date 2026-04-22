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
} from '@phosphor-icons/react';
import BackupBanner from './BackupBanner';

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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex flex-col justify-end"
    >
      {/* Painel deslizante */}
      <div className="bg-white dark:bg-slate-950 rounded-t-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        style={{ maxHeight: '82dvh' }}
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
              repertoires.map(rep => (
                <div
                  key={rep.id}
                  onClick={() => {
                    setActiveRepertoireId(rep.id);
                    setActiveSongId(null);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    activeRepertoireId === rep.id
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <PlayCircle
                      size={24}
                      weight={activeRepertoireId === rep.id ? 'fill' : 'bold'}
                      className={activeRepertoireId === rep.id ? 'text-white' : 'text-emerald-500'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRepertoireId(rep.id);
                        setIsStageMode(true);
                        onClose();
                      }}
                    />
                    <span className="font-bold text-sm truncate">{rep.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveRepertoireId(rep.id); setIsTeleprompterOpen(true); onClose(); }}
                      className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-lg"
                    >
                      <MonitorPlay size={18} weight="bold" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingRepertoireId(rep.id); onClose(); }}
                      className="p-2 hover:bg-white/20 rounded-lg"
                    >
                      <PencilSimple size={18} weight="bold" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRepertoire(rep.id); }}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
                    >
                      <Trash size={18} weight="bold" />
                    </button>
                  </div>
                </div>
              ))
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
