import React, { useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { 
  MusicNotesPlus, 
  Playlist, 
  MagnifyingGlass, 
  CaretRight,
  Play,
  PencilSimple,
  Trash,
  MonitorPlay,
  Queue,
  MusicNote,
  Sparkle,
  Gear,
  SidebarSimple,
  HardDrive,
  FolderOpen,
  X
} from '@phosphor-icons/react';

const Sidebar = () => {
  const { 
    songLibrary, activeSongId, setActiveSongId, 
    repertoires, activeRepertoireId, setActiveRepertoireId,
    addSong, addRepertoire, deleteRepertoire, setEditingRepertoireId,
    setIsStageMode, setIsTeleprompterOpen, setIsImportModalOpen,
    setIsSettingsModalOpen, autoBackupEnabled, isSupported: backupApiSupported,
    selectBackupFolder
  } = useLibrary();
  
  // Tab ativa: 'repertoires' | 'library'
  const [activeTab, setActiveTab] = useState('repertoires');
  const [searchTerm, setSearchTerm] = useState('');
  const [backupBannerDismissed, setBackupBannerDismissed] = useState(false);

  // Estado recolhido / expandido com persistência em localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('cifra_play_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cifra_play_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Músicas filtradas pela busca
  const filteredSongs = songLibrary.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfigureBackup = async () => {
    const selected = await selectBackupFolder();
    if (!selected) {
      setIsSettingsModalOpen(true);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MODO RECOLHIDO (Mini Sidebar de 68px)
  ─────────────────────────────────────────────────────────────── */
  if (isCollapsed) {
    return (
      <aside 
        className="w-[68px] flex-shrink-0 flex flex-col bg-white dark:bg-slate-950 transition-all duration-300 border-r border-slate-200 dark:border-slate-800 overflow-hidden select-none py-3 items-center justify-between z-20"
        title="Barra lateral recolhida"
      >
        {/* Topo: Mini logo e botão expandir */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          <button
            onClick={toggleCollapsed}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition-colors group relative"
            title="Expandir barra lateral"
          >
            <SidebarSimple size={22} weight="bold" />
            <span className="sr-only">Expandir barra</span>
          </button>

          <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1" />

          {/* Botões rápidos de abas em ícone */}
          <button
            onClick={() => { setActiveTab('repertoires'); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all ${
              activeTab === 'repertoires'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={`Repertórios (${repertoires.length})`}
          >
            <Queue size={20} weight={activeTab === 'repertoires' ? 'fill' : 'bold'} />
            {repertoires.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                {repertoires.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('library'); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={`Biblioteca (${songLibrary.length})`}
          >
            <MusicNote size={20} weight={activeTab === 'library' ? 'fill' : 'bold'} />
            {songLibrary.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                {songLibrary.length}
              </span>
            )}
          </button>
        </div>

        {/* Centro: Lista compacta de repertórios */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-2 py-4 px-1.5 scrollbar-none">
          {activeTab === 'repertoires' ? (
            repertoires.map(rep => {
              const isActive = activeRepertoireId === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => { setActiveRepertoireId(rep.id); setActiveSongId(null); }}
                  className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center transition-all relative group ${
                    isActive
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title={`${rep.name} (${rep.songIds?.length || 0} músicas)`}
                >
                  {rep.name.substring(0, 2).toUpperCase()}
                </button>
              );
            })
          ) : (
            <button
              onClick={toggleCollapsed}
              className="text-[10px] text-slate-400 text-center py-2 hover:text-indigo-400 transition-colors"
              title="Expandir para ver lista completa"
            >
              <MagnifyingGlass size={18} />
            </button>
          )}
        </div>

        {/* Rodapé recolhido: Status de backup e ajustes */}
        <div className="flex flex-col items-center gap-2 w-full px-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          {backupApiSupported && (
            <button
              onClick={handleConfigureBackup}
              className={`p-2 rounded-xl transition-all relative ${
                autoBackupEnabled
                  ? 'text-emerald-500 hover:bg-emerald-500/10'
                  : 'text-amber-500 hover:bg-amber-500/10'
              }`}
              title={autoBackupEnabled ? 'Backup automático configurado e ativo' : 'Backup não configurado (clique para configurar)'}
            >
              <HardDrive size={18} weight={autoBackupEnabled ? 'fill' : 'bold'} />
              {!autoBackupEnabled && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          )}

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Configurações"
          >
            <Gear size={20} weight="bold" />
          </button>
        </div>
      </aside>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     MODO EXPANDIDO (Layout completo moderno)
  ─────────────────────────────────────────────────────────────── */
  return (
    <aside className="w-72 md:w-80 flex-shrink-0 flex flex-col bg-white dark:bg-slate-950 transition-all duration-300 border-r border-slate-200 dark:border-slate-800 overflow-hidden z-20">
      
      {/* ── Topo: Logo + Botão Recolher ── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 bg-clip-text text-transparent tracking-tighter">
            Cifra&Play
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
            Estúdio & Ao Vivo
          </p>
        </div>

        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-95"
          title="Recolher barra lateral para ganhar espaço"
        >
          <SidebarSimple size={18} weight="bold" />
        </button>
      </div>

      {/* ── Tabs: Repertórios / Biblioteca ── */}
      <div className="flex-shrink-0 px-3 pb-2">
        <div className="flex bg-slate-100 dark:bg-slate-900/90 rounded-2xl p-1 gap-1 border border-slate-200/50 dark:border-slate-800/60">
          
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
            <Queue size={14} weight={activeTab === 'repertoires' ? 'fill' : 'bold'} />
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
            <MusicNote size={14} weight={activeTab === 'library' ? 'fill' : 'bold'} />
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
              className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 border border-emerald-500/20 shadow-xs"
              title="Criar Novo Repertório"
            >
              <Playlist size={13} weight="bold" /> Adicionar
            </button>
          </div>

          {/* Lista de repertórios */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
            {repertoires.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40 italic text-sm gap-2 py-10">
                <Queue size={32} />
                <p>Nenhum repertório ainda.<br/>Clique em Adicionar.</p>
              </div>
            ) : (
              repertoires.map(rep => {
                const isActive = activeRepertoireId === rep.id;
                const songCount = rep.songIds?.length || 0;

                return (
                  <div 
                    key={rep.id}
                    onClick={() => { setActiveRepertoireId(rep.id); setActiveSongId(null); }}
                    className={`group relative flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                      isActive 
                      ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-l-4 border-l-emerald-500 border-y border-r border-emerald-500/30 text-slate-900 dark:text-white shadow-md shadow-emerald-950/10' 
                      : 'bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Linha Principal: Título + Botão Palco */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isActive ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'
                        }`} />
                        <span className="font-bold text-sm truncate">{rep.name}</span>
                      </div>

                      {/* Botão de Tocar no Palco */}
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActiveRepertoireId(rep.id); 
                          setIsStageMode(true); 
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95 flex-shrink-0 ${
                          isActive
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                            : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white dark:text-emerald-400'
                        }`}
                        title="Iniciar Modo Palco com este repertório"
                      >
                        <Play size={10} weight="fill" />
                        <span>Palco</span>
                      </button>
                    </div>

                    {/* Linha Secundária: Quantidade de Músicas + Ações */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px]">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {songCount} {songCount === 1 ? 'música' : 'músicas'}
                      </span>

                      {/* Ações: Teleprompter, Editar, Excluir */}
                      <div className="flex items-center gap-0.5">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveRepertoireId(rep.id); 
                            setIsTeleprompterOpen(true); 
                          }} 
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" 
                          title="Abrir Teleprompter"
                        >
                          <MonitorPlay size={14} weight="bold" />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingRepertoireId(rep.id); 
                          }} 
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                          title="Editar / Ordenar músicas"
                        >
                          <PencilSimple size={14} weight="bold" />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            deleteRepertoire(rep.id); 
                          }} 
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" 
                          title="Excluir repertório"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
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
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="text-[9px] font-bold tracking-widest uppercase bg-amber-500/10 hover:bg-amber-600 text-amber-500 hover:text-white px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 border border-amber-500/20"
                  title="Importar por Link (Letras ou CifraClub)"
                >
                  <Sparkle size={12} weight="fill" /> Importar
                </button>
                <button 
                  onClick={() => addSong()}
                  className="text-[9px] font-bold tracking-widest uppercase bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 border border-indigo-500/20"
                  title="Criar Nova Música"
                >
                  <MusicNotesPlus size={12} weight="bold" /> Adicionar
                </button>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar música ou artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Lista de músicas */}
          <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-1.5">
            {filteredSongs.length > 0 ? (
              filteredSongs.map(song => (
                <div 
                  key={song.id}
                  onClick={() => { setActiveSongId(song.id); setActiveRepertoireId(null); }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                    activeSongId === song.id 
                    ? 'bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 text-slate-900 dark:text-white shadow-sm border-indigo-500/40 ring-1 ring-indigo-500/30' 
                    : 'bg-white dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-bold text-xs truncate transition-colors">{song.title || 'Sem Título'}</span>
                    <span className={`text-[10px] font-semibold truncate ${activeSongId === song.id ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'}`}>
                      {song.artist || 'Artista desconhecido'}
                    </span>
                  </div>
                  {activeSongId === song.id ? (
                    <CaretRight size={16} weight="bold" className="text-indigo-500 flex-shrink-0" />
                  ) : (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0 border border-slate-200/50 dark:border-slate-700/50">
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

      {/* ── Aviso de Backup Compacto (Se não configurado e não dispensado) ── */}
      {backupApiSupported && !autoBackupEnabled && !backupBannerDismissed && (
        <div className="mx-3 mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <HardDrive size={15} weight="fill" className="text-amber-400 flex-shrink-0" />
            <div className="truncate">
              <p className="text-[10px] font-bold text-amber-400 leading-tight">Backup Pendente</p>
              <p className="text-[9px] text-amber-400/70 truncate">Salve automático em pasta local</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleConfigureBackup}
              className="text-[9px] font-black bg-amber-500 hover:bg-amber-400 text-slate-900 px-2 py-1 rounded-md transition-colors"
            >
              Configurar
            </button>
            <button
              onClick={() => setBackupBannerDismissed(true)}
              className="p-1 text-amber-400/60 hover:text-amber-300 transition-colors"
              title="Dispensar aviso por agora"
            >
              <X size={12} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ── Barra de Rodapé: Configurações + Status ── */}
      <div className="flex-shrink-0 px-3 py-2.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-between text-xs">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900 transition-colors font-bold text-[11px]"
        >
          <Gear size={16} weight="bold" />
          <span>Configurações</span>
        </button>

        {backupApiSupported && (
          <button
            onClick={handleConfigureBackup}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
              autoBackupEnabled 
                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
            }`}
            title={autoBackupEnabled ? 'Pasta de backup sincronizada' : 'Clique para selecionar pasta de backup'}
          >
            <HardDrive size={12} weight="fill" />
            <span>{autoBackupEnabled ? 'Backup OK' : 'Sem Backup'}</span>
          </button>
        )}
      </div>

    </aside>
  );
};

export default Sidebar;
