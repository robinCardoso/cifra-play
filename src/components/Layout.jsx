import React, { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileDrawer from './MobileDrawer';
import useIsMobile from '../hooks/useIsMobile';

const Layout = ({ children }) => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('repertoires');

  return (
    <div className={`${isMobile ? 'flex-col' : 'flex'} flex h-dvh bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden font-sans`}>

      {/* ── Desktop: Sidebar lateral ── */}
      {!isMobile && <Sidebar />}

      {/* ── Conteúdo Principal ── */}
      <main className={`flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-900 ${!isMobile ? 'shadow-xl md:rounded-l-3xl' : 'min-h-0'}`}>
        {children}
      </main>

      {/* ── Mobile: Barra inferior + Drawer ── */}
      {isMobile && (
        <>
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onDrawerOpen={() => setDrawerOpen(true)}
          />
          <MobileDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </>
      )}
    </div>
  );
};

export default Layout;
