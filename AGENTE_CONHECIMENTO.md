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

### PWA Integrado (Offline)
- Prompt nativo para instalação em Mobile e Desktop através de componente contextual flutuante.
- Cache de Assets em nível de Service Worker para funcionamento 100% offline.
