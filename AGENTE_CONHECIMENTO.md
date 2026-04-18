# Agente de Conhecimento: Cifra & Play V2 (Modernizado)

Este documento serve como a base de conhecimento definitiva para o sistema **Cifra & Play**, capturando sua nova arquitetura baseada em componentes, regras de negócio restritas e fluxo de dados.

## 1. Visão Geral
O **Cifra & Play** agora é uma aplicação **PWA (Progressive Web App)** 100% offline projetada para músicos. 

### Stack Tecnológica Atual
- **Core**: React 18, Vite.
- **Estilização**: Tailwind CSS.
- **Ícones**: Phosphor Icons React.
- **PWA**: vite-plugin-pwa (Service Workers com AutoUpdate).
- **Persistência**: Hook Customizado (`usePersistence`) manipulando `localStorage`.
- **Criptografia e Licenciamento**: Hook Customizado (`useLicense`) utilizando CryptoJS (AES).

---

## 2. Padrões Obrigatórios de UI/UX (REGRAS CRÍTICAS)
- **Proibição de Alertas Nativos**: É ESTRITAMENTE PROIBIDO o uso de `window.alert`, `window.confirm` ou `window.prompt`. O sistema deve sempre renderizar Modal/Dialog customizados construídos em React respeitando a hierarquia de z-index do Tailwind CSS (ex: `z-[300]`) e com interface com blur e cantos curvos.
- **Design System**: A interface deve parecer um App nativo, com cantos arredondados (`rounded-3xl`, `rounded-2xl`), suporte a interações Touch (sem `hover` forçado em mobile), e fundos estéticos com `backdrop-blur`.

---

## 3. Arquitetura de Dados & Estado
- Estado Global centralizado via `LibraryContext.jsx`.
- **Song (Música)**: `id`, `title`, `artist`, `key`, `style`, `lyrics`.
- **Repertoire (Repertório)**: `id`, `name`, `songIds` (ordenado).
- Armazenamento Reativo: A gravação no `localStorage` é feita automaticamente via `useEffect` no hook de persistência.

---

## 4. Funcionalidades Principais Implementadas

## 🎤 StageMode & Renderização (Modernização)

### 1. Motor Unificado (Live Editor)
O `StageMode.jsx` agora é o centro da aplicação. Ele utiliza um único container de colunas CSS (`column-count`) tanto para exibição quanto para edição.
- **Modo Performance**: Renderização linear via `formatLyrics()`. **Regra de Ouro**: O texto deve ser renderizado linha por linha (split por `\n`) em vez de estrofe por estrofe. Isso garante que o ritmo vertical seja ditado apenas pelos caracteres de quebra de linha, eliminando discrepâncias causadas por margens de bloco de CSS.
- **Modo Edição**: Usa `contentEditable` no mesmo container CSS com `whiteSpace: 'pre-wrap'`.

### 2. Fórmula de Paginação Horizontal
Para garantir que o scroll caia sempre no início da coluna, ignorando paddings laterais, deve-se usar:
```javascript
const padSum = paddingLeft + paddingRight;
const step = clientWidth - padSum + columnGap;
const totalWidth = scrollWidth - padSum + columnGap;
const totalPages = Math.max(1, Math.round(totalWidth / step));
```
*Nunca use `clientWidth + gap` puro se houver padding no container.*

### 3. Sincronia de Layout e Proteções
Medições de `scrollWidth` ou `clientWidth` após mudanças de estado (fonte, colunas, texto) devem ser feitas dentro de um **duplo `requestAnimationFrame`**. Além disso, aplique as seguintes proteções para evitar "Páginas Fantasmas":

- **Height Guard**: Sempre verifique se o container tem uma altura mínima antes de medir. Durante transições de modo (viewer <-> editor), a altura pode ser zero momentaneamente, causando cálculos absurdos de colunas.
```javascript
if (el.clientHeight < 100) return; // Aborta cálculo instável
```
- **React Keys**: Use chaves únicas (`key="editor"`, `key="viewer"`) no elemento `main`. Isso força o React a recriar o nó do DOM, garantindo que o `scrollWidth` anterior não interfira na medição do novo conteúdo.
- **Fixed Pixels vs REM**: Para sistemas de paginação por coluna, **prefira pixels fixos (ex: 64px)** para gaps e paddings laterais. O uso de `rem` pode gerar frações de pixels (64.33px) dependendo do zoom, causando "frestas" laterais no scroll.
- **Métricas de Fonte (Acordes)**: Para que o Editor e o Viewer tenham o mesmo número de páginas, os acordes (`.chord`) **devem herdar** `font-family` e `font-weight`. Se o acorde for mais largo ou alto que o texto comum, o layout de colunas irá divergir.
- **Paridade de Linhas Vazias**: No modo Viewer, linhas vazias devem ser protegidas com `min-height: 1.6em` (ou o valor do `line-height`) e conter um `&nbsp;` se necessário, para garantir que ocupem o mesmo espaço vertical que uma linha vazia no Editor.

### 4. Orquestração de Abertura
O Palco pode ser aberto de duas formas:
1. **Pelo Repertório**: `activeRepertoire` preenchido.
2. **Cifra Isolada**: Botão "Ver no Palco" no Editor Global. O `StageMode` utiliza o `activeSongId` como fallback caso não haja repertório, entrando no modo "Ensaio Avulso".

## 💾 Persistência e Estado
- **Auto-Save**: O `StageMode` dispara `updateSong` no evento `onInput` do editor.
- **Limpeza de Estrofes**: Use `.filter(s => s.trim())` ao processar a letra para evitar que espaços em branco no final da música gerem páginas vazias.
- **Natural Flow**: Evite `break-inside: avoid-column` se precisar de paridade 1:1 com o editor de texto, pois o editor quebra versos livremente no fim da coluna.

### Editor de Música (SongEditor)
- Possui salvamento em tempo real (Auto-Save integrado via Context).
- **Combobox Nativo**: Para filtros e seleção rápida com recurso de busca em tempo real (autocomplete), os campos "Artista", "Tom" e "Estilo" utilizam o elemento nativo HTML5 `<datalist>` conectado a um `<input>`, eliminando complexidades de dropdowns customizados e garantindo compatibilidade cross-browser.
- **Armazenamento de Áudio**: CUIDADO COM LOCALSTORAGE! Gravar áudio como `Base64/DataURL` gera o erro crítico `QuotaExceededError` pois estoura o limite de 5MB por origem. A regra atual é manter o áudio em memória volátil via `URL.createObjectURL(file)` de forma temporária.
- **Restrição CSS de Player Embutido**: O componente `<audio>` (player nativo) é **"desativado" pelo Chrome** (botão de play fica não-clicável) se tiver uma altura menor que `36-40px`. Sempre assegure blocos altos, usando no mínimo `h-9` ou altura flexível para o player de apoio.

### Modo Palco (Stage Mode)
- **Overlay Imersivo**: Renderizado em tela inteira (`z-[220]`) com fundo `slate-950`. Ele é programado com Z-Index superior ao Teleprompter para funcionar em simbiose com ele.
- **Integração Dinâmica**: Foi refatorado para ser chamado de qualquer local. Ele lê o `activeSongId` no momento da abertura e recálcula internamente o `currentIndex` no tempo de montagem para garantir que salte exatamente para a música clicada.
- **Paginação Horizontal Nativa**: Utiliza CSS Multi-column (`column-count`). A navegação entre páginas é feita acionando a função de recálculo matemático de tamanho. **Padrão Encontrado**: Botões de navegação virtuais não rolam a tela nativamente ao alterar o State da página, sempre dispare métodos imperativos (`el.scrollTo`) em conjunto.
- **Alinhamento Vertical Perfeito**: Para evitar que a coluna da direita comece em altura diferente da esquerda, use `column-fill: auto`.

### Teleprompter (Estudo/Blocos)
- **Integração com StageMode**: O recurso atua apenas como visualizador de Blocos por estilo (z-[150]). Ao clicar na música específica, o sistema **NÃO DEVE** exibir janelas modais separadas, e sim interconectar despachando o id na Store e ativando sobreposto o `StageMode`, unificando a leitura de letras num único sistema maduro de colunas na aplicação.

### Editor de Repertório (Classic Dual-Pane)
- **Painel Duplo**: Lado esquerdo (Setlist) e Lado direito (Biblioteca Global).
- **Manipulação**: Implementado com **SortableJS** para Drag & Drop e botões de reordenação manual.
- **Edição Direta**: Títulos do editor (Músicas e Repertório) implementam inputs "In-line" disfarçados (texto grande renderizado transparente/sem-borda com auto-save no resvalo de onChange), apresentando o botão de editar (via ícone lápis) num hover suave (`group-hover:opacity-100`). Evita criação de popups.

### Padrões Globais Adicionais (CSS e Z-Index)
- **Hierarquia Estrita**:
    - `StageMode.jsx`: z-[220] (Mais Alto: Cobre tudo, incluindo o teleprompter base).
    - Modais Globais (Delete Confirmation): z-[300].
    - `Teleprompter.jsx`: z-[150] (Cobre dashboard).
    - `ListManagerModal.jsx` (Modais utilitários): z-[200].
- **Cortes de Modais (`overflow` excessivo)**: Ao flexbox alinhar modais com `items-center justify-center`, atente-se ao uso de limite de altura em telas widescreen ou desktop (`max-h-[85vh]`). Utilizar apenas classe de auto ou vh completa, dependendo do conteúdo, oculta permanentemente o cabeçalho fora dos limites de rolagem superior do flex.

## 📶 PWA & Deploy (Modernização)

### 1. Progressive Web App (Offline First)
O sistema utiliza o `vite-plugin-pwa` para transformar o site em um aplicativo instalável.
- **Estratégia**: `autoUpdate`. O app detecta novas versões e se atualiza sozinho as emendas ao código.
- **Cache**: Todos os arquivos estáticos (JS, CSS, Fontes, Ícones) são cacheados pelo Service Worker, permitindo que o músico abra o app e acesse as cifras mesmo em locais **sem sinal de internet**.

### 2. Modal Premium de Instalação (`InstallPWA.jsx`)
Em vez de depender do aviso padrão do navegador, usamos um modal customizado:
- **Evento**: Captura o `beforeinstallprompt`.
- **UX**: Explica os benefícios (Offline, Acesso Rápido) e só aparece para usuários que ainda não instalaram o app.
- **Z-Index**: `z-[400]` (para sobrepor todos os outros modais e o StageMode).

### 3. Automação de Deploy (GitHub Actions)
O deploy é automatizado via `.github/workflows/deploy.yml`:
- **Branch**: `main` ou `master`.
- **Processo**: `Install (npm ci)` -> `Build (vite)` -> `Deploy (GitHub Pages)`.
- **Vite Config**: O `base` no `vite.config.js` está fixado como `/cifra-play/`.

## 📌 Histórico de Versões
- **v1.0.0**: Lançamento da modernização (StageMode unificado, Live Editor, Paginação Matemática).
- **v1.0.1**: Implementação do PWA v2, Modal Premium de Instalação e Botão de Voltar no Editor.
