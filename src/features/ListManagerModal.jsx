import React, { useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { X, Trash, Plus } from '@phosphor-icons/react';

const ListManagerModal = () => {
    const { 
        isListModalOpen, setIsListModalOpen,
        artists, setArtists,
        keys, setKeys,
        styles, setStyles
    } = useLibrary();

    const [activeTab, setActiveTab] = useState('artists');
    const [newItem, setNewItem] = useState('');

    if (!isListModalOpen) return null;

    const currentList = activeTab === 'artists' ? artists : activeTab === 'keys' ? keys : styles;
    const setCurrentList = activeTab === 'artists' ? setArtists : activeTab === 'keys' ? setKeys : setStyles;

    const handleAddItem = (e) => {
        e.preventDefault();
        const trimmed = newItem.trim();
        if (trimmed && !currentList.includes(trimmed)) {
            setCurrentList([...currentList, trimmed].sort());
            setNewItem('');
        }
    };

    const handleRemoveItem = (itemToRemove) => {
        setCurrentList(currentList.filter(item => item !== itemToRemove));
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] md:h-auto max-h-[800px] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-black tracking-widest uppercase">Gerenciar Listas</h2>
                    <button onClick={() => setIsListModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} weight="bold" />
                    </button>
                </div>

                <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    {['artists', 'keys', 'styles'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                                activeTab === tab 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            {tab === 'artists' ? 'Artistas' : tab === 'keys' ? 'Tons' : 'Estilos'}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleAddItem} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Adicionar novo item..."
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors">
                            <Plus size={20} weight="bold" />
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-950/50">
                    {currentList.map(item => (
                        <div key={item} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                            <span className="font-medium text-sm">{item}</span>
                            <button 
                                onClick={() => handleRemoveItem(item)}
                                className="text-red-400 hover:bg-red-500/10 hover:text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash size={16} weight="bold" />
                            </button>
                        </div>
                    ))}
                    {currentList.length === 0 && (
                        <div className="text-center p-8 text-slate-400 text-sm">
                            Nenhum item nesta lista.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListManagerModal;
