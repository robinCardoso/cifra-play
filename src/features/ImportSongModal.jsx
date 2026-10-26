import React, { useState } from 'react';
import { useLibrary } from '../store/LibraryContext';
import { fetchSongFromUrl } from '../services/lyricsImportService';
import { 
  X, 
  LinkSimpleHorizontal, 
  ArrowClockwise, 
  CheckCircle, 
  WarningCircle,
  MusicNotes,
  Sparkle,
  PencilSimple
} from '@phosphor-icons/react';
import SearchableSelect from '../components/SearchableSelect';

const ImportSongModal = () => {
  const { 
    isImportModalOpen, 
    setIsImportModalOpen, 
    addSong,
    artists,
    keys,
    styles,
    setArtists
  } = useLibrary();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dados extraídos para pré-visualização e edição
  const [previewData, setPreviewData] = useState(null);

  if (!isImportModalOpen) return null;

  const handleClose = () => {
    setIsImportModalOpen(false);
    setUrl('');
    setError(null);
    setPreviewData(null);
    setLoading(false);
  };

  const handleFetch = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchSongFromUrl(url);
      setPreviewData(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar link.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setPreviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!previewData || !previewData.title.trim()) return;

    // Se o artista não estiver na lista de artistas salvos, adiciona automaticamente
    if (previewData.artist && !artists.includes(previewData.artist)) {
      setArtists(prev => [...prev, previewData.artist].sort());
    }

    addSong({
      title: previewData.title.trim(),
      artist: previewData.artist.trim(),
      lyrics: previewData.lyrics,
      key: previewData.key || '',
      style: previewData.style || ''
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] md:max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-800 dark:text-white">
                Importar Música por Link
              </h2>
              <p className="text-[11px] text-slate-400">
                Letras.mus.br ou Cifra Club
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Input de URL */}
          <form onSubmit={handleFetch} className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Cole o link da música ou cifra
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkSimpleHorizontal size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  placeholder="Ex: https://www.letras.mus.br/baitaca/249774/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex-shrink-0"
              >
                {loading ? (
                  <>
                    <ArrowClockwise size={18} className="animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <span>Buscar</span>
                )}
              </button>
            </div>
          </form>

          {/* Mensagem de Erro */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3 text-xs animate-in fade-in">
              <WarningCircle size={20} weight="bold" className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Instrução Inicial */}
          {!previewData && !loading && !error && (
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 mb-1">
                <MusicNotes size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Cole o link da página e clique em Buscar
              </p>
              <p className="text-xs max-w-sm">
                O Cifra&Play vai extrair o título, artista e a letra formatada em estrofes pronta para o palco!
              </p>
            </div>
          )}

          {/* Pré-visualização & Ajustes */}
          {previewData && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle size={16} weight="fill" /> Letra pronta para importar
                </span>
                <span className="text-[11px] text-slate-400">
                  Você pode revisar antes de salvar
                </span>
              </div>

              {/* Linha: Título e Artista */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Título da Música
                  </label>
                  <input
                    type="text"
                    value={previewData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Artista / Banda
                  </label>
                  <input
                    type="text"
                    value={previewData.artist}
                    onChange={(e) => handleFieldChange('artist', e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Linha: Tom e Estilo com SearchableSelect (máximo 5 opções visíveis com scroll e busca digitável) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Tom
                  </label>
                  <SearchableSelect
                    options={keys}
                    value={previewData.key}
                    onChange={(val) => handleFieldChange('key', val)}
                    placeholder="Selecione ou digite..."
                    uppercase
                    maxVisible={5}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Estilo / Ritmo
                  </label>
                  <SearchableSelect
                    options={styles}
                    value={previewData.style}
                    onChange={(val) => handleFieldChange('style', val)}
                    placeholder="Selecione ou digite..."
                    maxVisible={5}
                  />
                </div>
              </div>

              {/* Letra formatada */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                    <PencilSimple size={14} /> Letra Formatada
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Estrofes separadas por linha vazia
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={previewData.lyrics}
                  onChange={(e) => handleFieldChange('lyrics', e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-4 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

            </div>
          )}

        </div>

        {/* Rodapé de Ações — flex-shrink-0 e sempre visível */}
        <div className="flex-shrink-0 p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 flex items-center justify-end gap-2.5">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!previewData || !previewData.title.trim()}
            className="px-5 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            Salvar na Biblioteca
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImportSongModal;
