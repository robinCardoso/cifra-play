import React from 'react';
import { LibraryProvider, useLibrary } from './store/LibraryContext';
import Layout from './components/Layout';
import ManagerView from './features/ManagerView';
import StageMode from './features/StageMode';
import ListManagerModal from './features/ListManagerModal';
import Teleprompter from './features/Teleprompter';
import InstallPWA from './components/InstallPWA';
import ConfirmModal from './components/ConfirmModal';

function AppContent() {
  const { isStageMode, setIsStageMode, confirmDialog, closeConfirm } = useLibrary();

  return (
    <>
      <Layout>
        <ManagerView />
      </Layout>
      
      {isStageMode && (
        <StageMode onClose={() => setIsStageMode(false)} />
      )}
      
      <ListManagerModal />
      <Teleprompter />
      <InstallPWA />

      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
        isDestructive={true}
      />
    </>
  );
}

function App() {
  return (
    <LibraryProvider>
      <AppContent />
    </LibraryProvider>
  );
}

export default App;
