import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      {/* Sidebar - Componente Lateral */}
      <Sidebar />
      
      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-xl z-10 md:rounded-l-3xl">
        {children}
      </main>
    </div>
  );
};

export default Layout;
