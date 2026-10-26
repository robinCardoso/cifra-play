/**
 * Serviço de importação e parsing de letras e cifras a partir de links
 * Suporta: Letras.mus.br e Cifra Club
 */

export const IMPORT_FETCH_TIMEOUT_MS = 25_000;
const MAX_PARSE_CHARS = 200_000;

/**
 * Normaliza e limpa as estrofes para respeitar a convenção do Cifra&Play:
 * - Estrofes separadas por linha dupla (\n\n)
 * - Linhas da mesma estrofe separadas por (\n)
 * - Trim em cada linha
 */
export function formatLyricsToCifraPlay(rawText) {
  if (!rawText) return '';

  // Quebra inicial em linhas
  const lines = rawText.split(/\r?\n/);
  const result = [];
  let prevEmpty = false;

  for (let line of lines) {
    // Remove zero-width spaces e espaços invisíveis
    const cleanLine = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    if (!cleanLine) {
      if (!prevEmpty && result.length > 0) {
        result.push('');
        prevEmpty = true;
      }
    } else {
      result.push(cleanLine);
      prevEmpty = false;
    }
  }

  // Remove linhas vazias no final
  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }

  return result.join('\n');
}

/**
 * Converte notação markdown do Jina/CifraClub com acordes em negrito (**E**)
 * para a notação oficial do Cifra&Play com colchetes ([E])
 */
export function convertMarkdownChordsToCifraPlay(text) {
  if (!text) return '';

  // Linha a linha evita regex pesada em respostas enormes do proxy
  const converted = text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\*\*([A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|\+|M|-)*\/?(?:[A-G][b#]?)?)\*\*/g, '[$1]')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
    )
    .join('\n');

  return formatLyricsToCifraPlay(converted);
}

/**
 * Extrai Artista e Título do cabeçalho Markdown de resposta
 */
export function parseHeaderTitle(titleHeader) {
  if (!titleHeader) return { title: '', artist: '' };

  // Geralmente: "Nome da Música - Nome do Artista - LETRAS.MUS.BR" ou "- Cifra Club"
  const cleaned = titleHeader
    .replace(/\s*-\s*LETRAS\.MUS\.BR/i, '')
    .replace(/\s*-\s*Cifra Club/i, '')
    .trim();

  const parts = cleaned.split(/\s+-\s+/);
  if (parts.length >= 2) {
    return {
      title: parts[0].trim(),
      artist: parts[1].trim()
    };
  }

  return {
    title: cleaned,
    artist: ''
  };
}

/**
 * Tenta inferir o primeiro acorde para sugerir como Tom (Key)
 */
export function inferSongKey(lyrics) {
  if (!lyrics) return '';
  const match = lyrics.match(/\[([A-G][b#]?(?:m|#)?)\]/);
  return match ? match[1] : '';
}

function trimForParse(text) {
  if (!text || text.length <= MAX_PARSE_CHARS) return text || '';
  return text.slice(0, MAX_PARSE_CHARS);
}

/**
 * Parseia o corpo retornado pelo proxy Jina (após o fetch).
 */
export function parseSongFromJinaResponse(rawText, sourceUrl) {
  const isLetras = /letras\.mus\.br/i.test(sourceUrl);
  const isCifraClub = /cifraclub\.com\.br/i.test(sourceUrl);

  const titleMatch = rawText.match(/^Title:\s*([^\r\n]+)/im);
  const headerInfo = parseHeaderTitle(titleMatch ? titleMatch[1] : '');

  const contentIndex = rawText.indexOf('Markdown Content:');
  let content = contentIndex !== -1 ? rawText.slice(contentIndex + 'Markdown Content:'.length) : rawText;
  content = trimForParse(content);

  if (isLetras) {
    const cutPos = content.search(/\n\*\s*\*\s*\*|\n###\s+/);
    if (cutPos !== -1) {
      content = content.slice(0, cutPos);
    }
  }

  let formattedLyrics = '';
  let inferredKey = '';

  if (isCifraClub) {
    formattedLyrics = convertMarkdownChordsToCifraPlay(content);
    inferredKey = inferSongKey(formattedLyrics);
  } else {
    formattedLyrics = formatLyricsToCifraPlay(content);
  }

  if (!formattedLyrics) {
    throw new Error('Não foi possível identificar a letra no link fornecido.');
  }

  return {
    title: headerInfo.title || 'Música Importada',
    artist: headerInfo.artist || '',
    lyrics: formattedLyrics,
    key: inferredKey,
    style: '',
    sourceUrl: sourceUrl.trim(),
  };
}

/**
 * Busca letra ou cifra a partir de uma URL (rede + parse).
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] — cancelamento (fechar modal / nova busca)
 */
export async function fetchSongFromUrl(targetUrl, options = {}) {
  const { signal: externalSignal } = options;
  const url = targetUrl.trim();
  if (!url) {
    throw new Error('Por favor, informe um link válido.');
  }

  const isLetras = /letras\.mus\.br/i.test(url);
  const isCifraClub = /cifraclub\.com\.br/i.test(url);

  if (!isLetras && !isCifraClub) {
    throw new Error('No momento, aceitamos links do Letras.mus.br ou CifraClub.com.br');
  }

  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
  const headers = {};

  if (isLetras) {
    headers['X-Target-Selector'] = '.lyric-original';
  } else if (isCifraClub) {
    headers['X-Target-Selector'] = 'pre';
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), IMPORT_FETCH_TIMEOUT_MS);

  const onExternalAbort = () => timeoutController.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new Error('Busca cancelada.');
    }
    externalSignal.addEventListener('abort', onExternalAbort);
  }

  try {
    const response = await fetch(jinaUrl, { headers, signal: timeoutController.signal });
    if (!response.ok) {
      throw new Error(`Falha ao obter os dados da música (${response.status} ${response.statusText}). Verifique se o link está correto.`);
    }

    const rawText = trimForParse(await response.text());
    await new Promise((resolve) => setTimeout(resolve, 0));

    return parseSongFromJinaResponse(rawText, url);
  } catch (err) {
    if (timeoutController.signal.aborted) {
      if (externalSignal?.aborted) {
        throw new Error('Busca cancelada.');
      }
      throw new Error(`A busca demorou mais de ${IMPORT_FETCH_TIMEOUT_MS / 1000} segundos. Verifique sua internet ou tente outro link.`);
    }
    if (err?.name === 'TypeError' && /fetch/i.test(String(err.message))) {
      throw new Error('Não foi possível conectar ao serviço de importação. Verifique sua internet.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
