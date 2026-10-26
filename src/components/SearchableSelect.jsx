import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Check, X } from '@phosphor-icons/react';

/**
 * SearchableSelect
 * 
 * Seletor com filtro digitável e limite de visualização (máximo 5 opções com scroll).
 * Permite digitar para filtrar rapidamente ou selecionar da lista.
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Selecione ou digite...',
  maxVisible = 5,
  uppercase = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Quando o valor externo muda, ou fecha o dropdown, alinha o searchTerm
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

  // Filtragem das opções
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleInputChange = (e) => {
    const nextVal = uppercase ? e.target.value.toUpperCase() : e.target.value;
    setSearchTerm(nextVal);
    onChange(nextVal);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectOption = (opt) => {
    onChange(opt);
    setSearchTerm(opt);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    inputRef.current?.focus();
  };

  // Altura calculada para mostrar no máximo 5 itens (cada item tem ~36px)
  const maxHeightStyle = { maxHeight: `${maxVisible * 38}px` };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Campo de Input com Busca */}
      <div 
        className="relative flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500"
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (value || '')}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm(value || '');
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-white outline-none placeholder-slate-400 ${uppercase ? 'uppercase' : ''}`}
        />

        <div className="flex items-center gap-1 pr-2.5 flex-shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              title="Limpar seleção"
            >
              <X size={13} weight="bold" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(prev => !prev);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200"
          >
            <CaretDown 
              size={14} 
              weight="bold" 
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* Dropdown de Opções (máximo 5 visíveis com scroll) */}
      {isOpen && (
        <div 
          style={maxHeightStyle}
          className="absolute z-50 left-0 right-0 mt-1.5 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        >
          {filteredOptions.length > 0 ? (
            <div className="p-1 flex flex-col gap-0.5">
              {filteredOptions.map((opt) => {
                const isSelected = opt.toLowerCase() === (value || '').toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <Check size={14} weight="bold" className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">
              <p>Nenhuma opção encontrada</p>
              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelectOption(searchTerm.trim())}
                  className="mt-1.5 text-indigo-500 hover:underline font-bold block w-full truncate"
                >
                  Usar "{searchTerm.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
