import { useState, useEffect } from 'react';

// Key used in local storage
const STORAGE_KEYS = {
  SONG_LIBRARY: 'songLibrary',
  REPERTOIRES: 'repertoires',
  ARTISTS_LIST: 'artistsList',
  KEYS_LIST: 'keysList',
  STYLES_LIST: 'stylesList',
  LICENSE_KEY: 'licenseKey',
  APP_THEME: 'appTheme',
  SETLIST_FONT_SIZE: 'setlistFontSize',
  SETLIST_COLUMN_COUNT: 'setlistColumnCount',
};

// Default lists (as found in the original app)
const DEFAULT_VALUE = {
  ARTISTS: ["Banda Calmon", "Banda G10", "Banda Passarela", "Banda San Marino", "Brilha Som", "Corpo e Alma", "Daniel", "Eduardo Costa", "Gusttavo Lima", "João Paulo e Daniel", "Musical JM", "Musical San Francisco", "OS Atuais", "Os Federais", "Os Nativos", "Porto Do Som", "Tchê Garatos", "Terceira Dimensão"],
  KEYS: ["C", "Cm", "C#", "C#m", "D", "Dm", "D#", "D#m", "E", "Em", "F", "Fm", "F#", "F#m", "G", "Gm", "G#", "G#m", "A", "Am", "A#", "A#m", "B", "Bm"],
  STYLES: ["Arrocha", "Axé", "Bachata", "Blues", "Bolero", "Bossa Nova", "Brega", "Brega-funk", "Catchaca", "Clássico", "Country", "Cumbia", "Dance", "Disco", "Eletrônica", "Folk", "Forró", "Funk", "Funk Internacional", "Gospel/Religioso", "Guarânia", "Hard Rock", "Heavy Metal", "Hip Hop/Rap", "House", "Hyperpop", "Infantil", "Jazz", "Jovem Guarda", "K-Pop", "MPB", "Merengue", "Metal", "Nativista", "New Age", "Pagode", "Piseiro", "Pop", "Pop Rock", "Punk Rock", "R&B", "Ranchera", "Reggae", "Reggaeton", "Regional", "Rock", "Romântico", "Salsa", "Samba", "Samba Enredo", "Sertanejo", "Ska", "Tango", "Valsa", "Vaneira", "Xote"]
};

export const usePersistence = () => {
  const getStored = (key, defaultVal) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [songLibrary, setSongLibrary] = useState(() => getStored(STORAGE_KEYS.SONG_LIBRARY, []));
  const [repertoires, setRepertoires] = useState(() => getStored(STORAGE_KEYS.REPERTOIRES, []));
  const [artists, setArtists] = useState(() => getStored(STORAGE_KEYS.ARTISTS_LIST, DEFAULT_VALUE.ARTISTS));
  const [keys, setKeys] = useState(() => getStored(STORAGE_KEYS.KEYS_LIST, DEFAULT_VALUE.KEYS));
  const [styles, setStyles] = useState(() => getStored(STORAGE_KEYS.STYLES_LIST, DEFAULT_VALUE.STYLES));
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.APP_THEME) || 'dark');
  const [fontSize, setFontSize] = useState(() => parseFloat(localStorage.getItem(STORAGE_KEYS.SETLIST_FONT_SIZE)) || 1.5);
  const [columnCount, setColumnCount] = useState(() => parseInt(localStorage.getItem(STORAGE_KEYS.SETLIST_COLUMN_COUNT)) || 1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SONG_LIBRARY, JSON.stringify(songLibrary));
  }, [songLibrary]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPERTOIRES, JSON.stringify(repertoires));
  }, [repertoires]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ARTISTS_LIST, JSON.stringify(artists));
  }, [artists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KEYS_LIST, JSON.stringify(keys));
  }, [keys]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STYLES_LIST, JSON.stringify(styles));
  }, [styles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APP_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETLIST_FONT_SIZE, fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETLIST_COLUMN_COUNT, columnCount);
  }, [columnCount]);

  return {
    songLibrary, setSongLibrary,
    repertoires, setRepertoires,
    artists, setArtists,
    keys, setKeys,
    styles, setStyles,
    theme, setTheme,
    fontSize, setFontSize,
    columnCount, setColumnCount
  };
};
