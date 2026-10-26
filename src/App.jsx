import React from 'react';
import { LibraryProvider, useLibrary } from './store/LibraryContext';
import Layout from './components/Layout';
import ManagerView from './features/ManagerView';
import StageMode from './features/StageMode';
import ListManagerModal from './features/ListManagerModal';
import Teleprompter from './features/Teleprompter';
import InstallPWA from './components/InstallPWA';
import ConfirmModal from './components/ConfirmModal';
import SettingsModal from './features/SettingsModal';
import ImportSongModal from './features/ImportSongModal';
import BackupConflictModal from './components/BackupConflictModal';

function AppContent() {
  const { isStageMode, setIsStageMode, confirmDialog, closeConfirm, backupConflict } = useLibrary();

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
      <SettingsModal />
      <ImportSongModal />
      <InstallPWA />

      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
        isDestructive={true}
      />

      <BackupConflictModal
        isOpen={!!backupConflict}
        conflictData={backupConflict}
        onRestore={backupConflict?.onRestore}
        onMerge={backupConflict?.onMerge}
        onOverwrite={backupConflict?.onOverwrite}
        onCancel={backupConflict?.onCancel}
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
