import React from 'react';
import { Warning, X } from '@phosphor-icons/react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", isDestructive = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                
                {/* Detalhe visual de fundo */}
                {isDestructive && (
                    <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                )}

                <div className="flex flex-col gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-red-500/20 text-red-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                        <Warning size={28} weight="duotone" />
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">{title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <button 
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-100/50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all transform active:scale-95 shadow-lg
                                ${isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
