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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom border border-indigo-400/30">
            <div className="flex flex-col">
                <span className="font-bold text-sm">Instalar Cifra&Play</span>
                <span className="text-[10px] opacity-80">Use offline sem internet!</span>
            </div>
            <button 
                onClick={onClick}
                className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm hover:scale-105 transition-transform flex items-center gap-1"
            >
                <DownloadSimple size={14} weight="bold" /> Instalar
            </button>
            <button onClick={() => setIsVisible(false)} className="p-1 hover:bg-white/20 rounded-md">
                <X size={16} weight="bold" />
            </button>
        </div>
    );
};

export default InstallPWA;
