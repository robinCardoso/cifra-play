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

## 🎤 StageMode & Renderização (Estado Atual Consolidado)

### 1. Arquitetura do Palco
O `StageMode.jsx` é o núcleo de execução de letra ao vivo.
- **Viewport Fixa 16:9**: O palco renderiza em base virtual `1920x1080` e aplica `scale` automático para caber na janela. Isso mantém consistência de paginação dentro e fora de fullscreen.
- **Overlay**: Palco em `z-[220]`, com header de controle, corpo paginado e rodapé de progresso.
- **Abertura**:
  1. Por repertório (`activeRepertoire`).
  2. Por música isolada (`activeSongId`), no modo "Ensaio Avulso".

### 2. Regras de Colunas (Prioridade Obrigatória)
Prioridade de colunas usada no palco:
1. **Override de sessão do StageMode** (botão de colunas no header do palco).
2. **Preferência da música** (`song.columns`).
3. **Configuração global** (`columnCount`).

Regra: alteração no botão de colunas do palco deve impactar imediatamente a paginação da sessão atual, sem exigir sair/reabrir o modo palco.

### 3. Paginação Horizontal (Regra Oficial)
Paginação é controlada por `scrollLeft` horizontal no container de letra.
- **Step oficial**: `step = contentWidth + columnGap`, onde `contentWidth = clientWidth - paddingLeft - paddingRight`.
- **Limite**: `maxScrollLeft = scrollWidth - clientWidth`.
- **Total de páginas**: `totalPages = Math.max(1, Math.ceil(maxScrollLeft / step) + 1)`.
- **Snap obrigatório**: toda navegação deve usar `scrollLeft = clamp(page * step, 0, maxScrollLeft)`.

Isso evita:
- repetição da coluna direita na página seguinte,
- início de página "cortado" (estado entre grades),
- colunas fantasmas fora do enquadramento.

#### Regra Anti-Regressão (CRÍTICA)
**Nunca** usar `step = clientWidth` puro em layout multi-column com padding/gap.

Motivo:
- gera deslocamento diferente entre páginas,
- cria diferença de margem esquerda entre `Pág. 1` e `Pág. 2`,
- pode puxar texto residual no canto direito (vazamento da coluna seguinte).

Checklist obrigatório ao mexer em paginação:
1. Validar `Pág. 1` e `Pág. 2` com a mesma música longa em `2 colunas`.
2. Confirmar que a margem esquerda visual é idêntica nas duas páginas.
3. Confirmar ausência de texto "cortado/vazando" no canto direito.
4. Com debug ativo (`Ctrl+Shift+D`), verificar se o avanço de página segue o `step` calculado.
5. Validar também o `Modo Edição` (2 colunas) para garantir ausência de coluna residual no canto esquerdo.

### 4. Reflow e Estabilidade Durante Edição
Durante edição (`contentEditable`), o layout muda em tempo real e precisa de recálculo agressivo.
- **Debounce de salvamento**: `250ms` para `updateSong`.
- **Flush ao sair da edição**: ao sair do modo edição, persistir imediatamente o que estiver pendente.
- **Re-snap pós-input**: após `onInput`, executar realinhamento via `requestAnimationFrame`.
- **Guard de medição**: abortar cálculo quando `clientHeight < 100` para evitar medições instáveis em transição.
- **Duplo RAF**: manter medição após reflow com dupla chamada de `requestAnimationFrame` para evitar corrida de layout.
- **Compensação de última página**: usar `pageVisualOffset` quando o alvo virtual da página exceder o `maxScrollLeft`.
- **Regra estrutural do editor**: aplicar compensação na camada interna `contentEditable` (wrapper interno), nunca diretamente no container de scroll `main`.

### 5. Regras de Teclado e UX
- Em edição, **não** navegar página com setas/espaço.
- Em edição, `Escape` sai do modo edição (não fecha o palco direto).
- Busca (`Ctrl+F`) abre pesquisa rápida de músicas.
- Debug é oculto e alternado apenas por atalho `Ctrl+Shift+D`.

### 6. Renderização de Letra e Segurança
- Sem `dangerouslySetInnerHTML` para letra principal.
- Acordes (`[Am]`, `[G]`) são renderizados com `span.chord` de forma segura.
- Linhas vazias devem preservar altura visual (`min-height`) e `&nbsp;` para manter paridade com edição.

### 7. Controle de Estrofes
- Existe opção no header para evitar quebra ruim no fim da página: `Estrofes`.
- Quando ativa, aplica:
  - `break-inside: avoid-column`
  - `-webkit-column-break-inside: avoid`
  - `page-break-inside: avoid`

Regra: esta proteção melhora legibilidade de bloco, mas pode alterar a distribuição exata de linhas entre páginas.

### 8. Header e Legibilidade
- Header ampliado para uso em palco (tipografia e botões maiores).
- Selo informativo de layout fixo (`Layout 16:9 fixo`).
- Rodapé reduz dinamicamente quando há pouco conteúdo (menos espaço morto visual).

## 💾 Persistência e Estado
- **Auto-Save com Debounce**: O `StageMode` usa `onInput` com debounce para reduzir custo de render e escrita em `localStorage`.
- **Persistência central**: `usePersistence` grava `songLibrary` e demais listas por `useEffect`.
- **Cuidado de performance**: evitar gravação síncrona em toda tecla sem debounce em letras longas.
- **Observação de estrofes**: proteção de estrofes (`break-inside`) é opção de leitura e não deve ser tratada como verdade absoluta de layout no editor global.

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
