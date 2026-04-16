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
- Seletores de agrupamento contêm atalho `(+)` para gerenciamento dinâmico de Listas.

### Modo Palco (Stage Mode)
- Overlay imersivo em tela inteira (`z-[100]`).
- Paginação Snap e cálculo inteligente de quebra de página de acordo com tela e tamanho da fonte.

### Teleprompter
- Agrupamento de músicas por "Blocos Musicais" (Estilos musicais).
- Visual em grid moderno, prevendo continuação de cifras longas.

### PWA Integrado (Offline)
- Prompt nativo para instalação em Mobile e Desktop através de componente contextual flutuante.
