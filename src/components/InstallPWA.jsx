import React, { useState, useEffect } from 'react';
import { DownloadSimple, X } from '@phosphor-icons/react';

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handler = e => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Detect se já está instalado
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setIsVisible(false);
        });

        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const onClick = evt => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        promptInstall.prompt();
    };

    if (!supportsPWA || isInstalled || !isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-indigo-600 p-8 flex justify-center relative">
                    <div className="absolute top-4 right-4">
                        <button onClick={() => setIsVisible(false)} className="p-2 text-white/50 hover:text-white transition-colors">
                            <X size={24} weight="bold" />
                        </button>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-600">
                        <DownloadSimple size={48} weight="bold" />
                    </div>
                </div>

                <div className="p-8 text-center space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white">Instalar Cifra&Play</h2>
                        <p className="text-slate-400 text-sm">Leve o palco no seu bolso e acesse tudo sem precisar de internet.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                            <span className="block text-indigo-400 font-bold text-xs uppercase mb-1">Offline</span>
                            <span className="text-[10px] text-slate-400 leading-tight">Funciona sem internet no palco</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                            <span className="block text-indigo-400 font-bold text-xs uppercase mb-1">Rápido</span>
                            <span className="text-[10px] text-slate-400 leading-tight">Acesso direto da tela inicial</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={onClick}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Instalar Aplicativo
                        </button>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold text-sm transition-colors"
                        >
                            Talvez mais tarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
