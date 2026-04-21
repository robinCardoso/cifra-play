import React, { useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
import BackupBanner from './BackupBanner';
import { 
  MusicNotesPlus, 
  Playlist, 
  MagnifyingGlass, 
  CaretRight,
  PlayCircle,
  PencilSimple,
  Trash,
  DotsThreeVertical,
  PlusCircle,
  MonitorPlay
} from '@phosphor-icons/react';

const Sidebar = () => {
  const { 
    songLibrary, activeSongId, setActiveSongId, 
    repertoires, activeRepertoireId, setActiveRepertoireId,
    addSong, addRepertoire, deleteRepertoire, setEditingRepertoireId,
    setIsStageMode, setIsTeleprompterOpen
  } = useLibrary();
  
  const [searchTerm, setSearchTerm] = useState('');

  // Filial - Músicas (Filtradas)
  const filteredSongs = songLibrary.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-80 md:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-slate-950 p-4 gap-6 transition-all border-r border-slate-200 dark:border-slate-800">
      
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">Cifra&Play</h1>
      </div>

      {/* Repertórios */}
      <section className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <h2 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">Meus Repertórios</h2>
            <button 
                onClick={() => addRepertoire('Novo Repertório')}
                className="text-[9px] font-bold tracking-widest uppercase bg-emerald-500/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-2 py-1 rounded-md transition-all flex items-center gap-1 active:scale-95 border border-emerald-500/20"
                title="Criar Novo Repertório"
            >
                <Playlist size={12} weight="bold" /> Adicionar
            </button>
        </div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          {repertoires.map(rep => (
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
          ))}
        </div>
      </section>

      {/* Busca */}
      <div className="relative">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar na biblioteca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
        />
      </div>

      {/* Biblioteca de Músicas */}
      <section className="flex-1 flex flex-col gap-2 overflow-hidden">
        <div className="flex justify-between items-center">
            <h2 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">Minha Biblioteca</h2>
            <button 
                onClick={() => addSong()}
                className="text-[9px] font-bold tracking-widest uppercase bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white px-2 py-1 rounded-md transition-all flex items-center gap-1 active:scale-95 border border-indigo-500/20"
                title="Criar Nova Música"
            >
                <MusicNotesPlus size={12} weight="bold" /> Adicionar
            </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
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
                  <span className="text-[10px] font-black p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500">
                    {song.key || '--'}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center opacity-40 grayscale italic text-sm">
              <MusicNotesPlus size={32} className="mb-2" />
              Nenhuma música encontrada
            </div>
          )}
        </div>
      </section>

      {/* Banner de aviso: backup não configurado */}
      <BackupBanner />

    </aside>
  );
};

export default Sidebar;
