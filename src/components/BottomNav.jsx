import React, { useState, useRef, useEffect } from 'react';
import { useLibrary } from '../store/LibraryContext';
import {
  Queue,
  MusicNote,
  MusicNotesPlus,
  Playlist,
  Gear,
  Plus,
} from '@phosphor-icons/react';

/**
 * Barra de navegação inferior para mobile com menu de ação rápida.
 */
const BottomNav = ({ activeTab, setActiveTab, onDrawerOpen }) => {
  const { 
    addSong, 
    addRepertoire, 
    setIsSettingsModalOpen, 
    repertoires, 
    songLibrary,
    setEditingRepertoireId 
  } = useLibrary();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
      }
    };
    if (isAddMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddMenuOpen]);

  const tabs = [
    {
      id: 'repertoires',
      label: 'Repertórios',
      icon: Queue,
      badge: repertoires.length,
    },
    {
      id: 'library',
      label: 'Biblioteca',
      icon: MusicNote,
      badge: songLibrary.length,
    },
  ];

  return (
    <nav className="flex-shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 safe-bottom relative z-[300]">
      
      {/* Menu de Ação Rápida (Floating) */}
      {isAddMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          <button
            onClick={() => {
              addSong();
              setIsAddMenuOpen(false);
            }}
            className="flex items-center gap-3 w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
              <MusicNotesPlus size={22} weight="bold" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Música</span>
              <span className="text-[10px] text-slate-400">Criar nova cifra</span>
            </div>
          </button>

          <button
            onClick={() => {
              const newRep = addRepertoire('Novo Repertório');
              setEditingRepertoireId(newRep.id);
              setActiveTab('repertoires');
              onDrawerOpen();
              setIsAddMenuOpen(false);
            }}
            className="flex items-center gap-3 w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Playlist size={22} weight="bold" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Repertório</span>
              <span className="text-[10px] text-slate-400">Nova lista de show</span>
            </div>
          </button>
        </div>
      )}

      <div className="flex items-center h-16 px-2">
        {/* Tabs principais */}
        {tabs.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                onDrawerOpen();
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full transition-all relative ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {/* Container de ícone com altura fixa para alinhar textos */}
              <div className="h-10 flex items-center justify-center relative">
                <Icon size={22} weight={isActive ? 'fill' : 'bold'} />
                {badge > 0 && (
                  <span className={`absolute top-0 -right-2 text-[9px] font-black px-1 rounded-full leading-none min-w-[14px] text-center ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}

        {/* Divisor */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1 opacity-50" />

        {/* Botão Adicionar (Toggle) */}
        <button
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
            isAddMenuOpen ? 'text-emerald-500' : 'text-emerald-500'
          }`}
        >
          <div className="h-10 flex items-center justify-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isAddMenuOpen ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/10'
            }`}>
              <Plus size={20} weight="bold" className={`transition-transform duration-300 ${isAddMenuOpen ? 'rotate-45' : ''}`} />
            </div>
          </div>
          <span className="text-[10px] font-bold mt-0.5">Adicionar</span>
        </button>

        {/* Configurações */}
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex-1 flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500"
        >
          <div className="h-10 flex items-center justify-center">
            <Gear size={22} weight="bold" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Config.</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
