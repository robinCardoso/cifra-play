import React, { createContext, useContext, useState } from 'react';
import { usePersistence } from '../hooks/usePersistence';
import { useLicense } from '../hooks/useLicense';

const LibraryContext = createContext();

export const LibraryProvider = ({ children }) => {
  const persistenceSet = usePersistence();
  const licenseSet = useLicense();
  
  // Selection state
  const [activeSongId, setActiveSongId] = useState(null);
  const [activeRepertoireId, setActiveRepertoireId] = useState(null);
  const [editingRepertoireId, setEditingRepertoireId] = useState(null);
  const [isStageMode, setIsStageMode] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const requestConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const activeSong = persistenceSet.songLibrary.find(s => s.id === activeSongId);
  const activeRepertoire = persistenceSet.repertoires.find(r => r.id === activeRepertoireId);
  const editingRepertoire = persistenceSet.repertoires.find(r => r.id === editingRepertoireId);

  // Helper functions (migrated from vanilla JS)
  const addSong = (newSongData) => {
    const newSong = {
      id: `manual_${Date.now()}`,
      title: 'Nova Música',
      artist: '',
      key: '',
      style: '',
      lyrics: '',
      ...newSongData
    };
    persistenceSet.setSongLibrary(prev => [newSong, ...prev]);
    setActiveSongId(newSong.id);
    return newSong;
  };

  const updateSong = (id, updates) => {
    persistenceSet.setSongLibrary(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSong = (id) => {
    requestConfirm(
      'Excluir Música',
      'Estação ação removerá esta música permanentemente de sua biblioteca.',
      () => {
        persistenceSet.setSongLibrary(prev => prev.filter(s => s.id !== id));
        if (activeSongId === id) setActiveSongId(null);
        closeConfirm();
      }
    );
  };

  const addRepertoire = (name) => {
    const newRep = { id: `rep_${Date.now()}`, name, songIds: [] };
    persistenceSet.setRepertoires(prev => [...prev, newRep]);
    return newRep;
  };

  const updateRepertoire = (id, updates) => {
    persistenceSet.setRepertoires(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRepertoire = (id) => {
    requestConfirm(
      'Excluir Repertório',
      'Excluir este repertório apenas removerá a lista. Suas músicas continuarão salvas na biblioteca.',
      () => {
        persistenceSet.setRepertoires(prev => prev.filter(r => r.id !== id));
        if (activeRepertoireId === id) setActiveRepertoireId(null);
        if (editingRepertoireId === id) setEditingRepertoireId(null);
        closeConfirm();
      }
    );
  };

  const value = {
    ...persistenceSet,
    ...licenseSet,
    activeSongId, setActiveSongId,
    activeSong,
    activeRepertoireId, setActiveRepertoireId,
    activeRepertoire,
    editingRepertoireId, setEditingRepertoireId,
    editingRepertoire,
    isStageMode, setIsStageMode,
    isListModalOpen, setIsListModalOpen,
    isTeleprompterOpen, setIsTeleprompterOpen,
    isSettingsModalOpen, setIsSettingsModalOpen,
    confirmDialog, closeConfirm, requestConfirm,
    addSong,
    updateSong,
    deleteSong,
    addRepertoire,
    updateRepertoire,
    deleteRepertoire
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
