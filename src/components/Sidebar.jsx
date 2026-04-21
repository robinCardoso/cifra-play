import React, { useState } from 'react';
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
} from '@phosphor-icons/react';
import BackupBanner from './BackupBanner';

const Sidebar = () => {
  const { 
    songLibrary, activeSongId, setActiveSongId, 
    repertoires, activeRepertoireId, setActiveRepertoireId,
    addSong, addRepertoire, deleteRepertoire, setEditingRepertoireId,
    setIsStageMode, setIsTeleprompterOpen
  } = useLibrary();
  
  // Tab ativa: 'repertoires' | 'library'
  const [activeTab, setActiveTab] = useState('repertoires');
  const [searchTerm, setSearchTerm] = useState('');

  // Músicas filtradas pela busca
  const filteredSongs = songLibrary.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-72 md:w-80 flex-shrink-0 flex flex-col bg-white dark:bg-slate-950 transition-all border-r border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* ── Logo ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <h1 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
          Cifra&Play
        </h1>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 px-3 pb-2">
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 gap-1">
          
          {/* Tab: Repertórios */}
          <button
            onClick={() => setActiveTab('repertoires')}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl
              text-[11px] font-black transition-all duration-200
              ${activeTab === 'repertoires'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }
            `}
          >
            <Queue size={13} weight={activeTab === 'repertoires' ? 'fill' : 'bold'} />
            <span>Repertórios</span>
            {repertoires.length > 0 && (
              <span className={`
                text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none
                ${activeTab === 'repertoires'
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }
              `}>
                {repertoires.length}
              </span>
            )}
          </button>

          {/* Tab: Biblioteca */}
          <button
            onClick={() => setActiveTab('library')}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl
              text-[11px] font-black transition-all duration-200
              ${activeTab === 'library'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }
            `}
          >
            <MusicNote size={13} weight={activeTab === 'library' ? 'fill' : 'bold'} />
            <span>Biblioteca</span>
            {songLibrary.length > 0 && (
              <span className={`
                text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none
                ${activeTab === 'library'
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }
              `}>
                {songLibrary.length}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* CONTEÚDO: MEUS REPERTÓRIOS        */}
      {/* ══════════════════════════════════ */}
      {activeTab === 'repertoires' && (
        <div className="flex-1 flex flex-col overflow-hidden px-3 pb-2">
          
          {/* Header da aba */}
          <div className="flex-shrink-0 flex justify-between items-center py-2 mb-1">
            <h2 className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
              Meus Repertórios
            </h2>
            <button 
              onClick={() => addRepertoire('Novo Repertório')}
              className="text-[9px] font-bold tracking-widest uppercase bg-emerald-500/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-2 py-1 rounded-md transition-all flex items-center gap-1 active:scale-95 border border-emerald-500/20"
              title="Criar Novo Repertório"
            >
              <Playlist size={12} weight="bold" /> Adicionar
            </button>
          </div>

          {/* Lista de repertórios */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-0.5">
            {repertoires.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40 italic text-sm gap-2 py-10">
                <Queue size={32} />
                <p>Nenhum repertório ainda.<br/>Clique em Adicionar.</p>
              </div>
            ) : (
              repertoires.map(rep => (
                <div 
                  key={rep.id}
                  onClick={() => { setActiveRepertoireId(rep.id); setActiveSongId(null); }}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    activeRepertoireId === rep.id 
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <PlayCircle 
                       size={22} 
                       weight={activeRepertoireId === rep.id ? "fill" : "bold"} 
                       className={activeRepertoireId === rep.id ? "text-white" : "text-emerald-500"}
                       onClick={(e) => { e.stopPropagation(); setActiveRepertoireId(rep.id); setIsStageMode(true); }}
                    />
                    <span className="font-bold text-sm truncate">{rep.name}</span>
                  </div>
                  <div className={`flex items-center gap-1 transition-opacity ${activeRepertoireId === rep.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveRepertoireId(rep.id); setIsTeleprompterOpen(true); }} className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg" title="Teleprompter">
                      <MonitorPlay size={16} weight="bold" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingRepertoireId(rep.id); }} className="p-1.5 hover:bg-white/20 rounded-lg" title="Editar">
                      <PencilSimple size={16} weight="bold" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRepertoire(rep.id); }} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg" title="Excluir">
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* CONTEÚDO: MINHA BIBLIOTECA        */}
      {/* ══════════════════════════════════ */}
      {activeTab === 'library' && (
        <div className="flex-1 flex flex-col overflow-hidden px-3 pb-2">

          {/* Header + busca */}
          <div className="flex-shrink-0 space-y-2 mb-2">
            <div className="flex justify-between items-center py-2">
              <h2 className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">
                Minha Biblioteca
              </h2>
              <button 
                onClick={() => addSong()}
                className="text-[9px] font-bold tracking-widest uppercase bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white px-2 py-1 rounded-md transition-all flex items-center gap-1 active:scale-95 border border-indigo-500/20"
                title="Criar Nova Música"
              >
                <MusicNotesPlus size={12} weight="bold" /> Adicionar
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar na biblioteca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
              />
            </div>
          </div>

          {/* Lista de músicas */}
          <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-1">
            {filteredSongs.length > 0 ? (
              filteredSongs.map(song => (
                <div 
                  key={song.id}
                  onClick={() => { setActiveSongId(song.id); setActiveRepertoireId(null); }}
                  className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                    activeSongId === song.id 
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl shadow-indigo-500/20 border-transparent' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-black text-sm truncate transition-colors">{song.title || 'Sem Título'}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-tight truncate ${activeSongId === song.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {song.artist || 'Artista desconhecido'}
                    </span>
                  </div>
                  {activeSongId === song.id ? (
                    <CaretRight size={20} weight="bold" />
                  ) : (
                    <span className="text-[10px] font-black p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 flex-shrink-0">
                      {song.key || '--'}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40 italic text-sm gap-2 py-10">
                <MusicNotesPlus size={32} />
                <p>{searchTerm ? 'Nenhuma música encontrada.' : 'Biblioteca vazia.\nClique em Adicionar.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Banner de backup (sempre visível) ── */}
      <BackupBanner />

    </aside>
  );
};

export default Sidebar;
