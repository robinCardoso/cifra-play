# MEMÓRIA TÉCNICA DO AGENTE - CIFRA & PLAY

Este arquivo contém o estado atual, decisões críticas e padrões de arquitetura para garantir a continuidade do desenvolvimento por qualquer agente de IA.

## 🚀 FASE ATUAL: Modernização Mobile (Concluída/Estabilização)

### 📱 REGRAS DE OURO MOBILE
- **Layout Duplo (SongEditor):** O editor possui blocos separados para `md:hidden` (Mobile) e `hidden md:flex` (Desktop). **Sempre atualize ambos.**
- **Navegação StageMode:** 
  - Swipe horizontal para trocar páginas/músicas.
  - Scroll vertical para ler a letra.
  - Bloqueio de scroll horizontal nativo via `touch-action: pan-y`.
  - Feedback visual via `swipeOffset` (translateX).
- **Interface BottomNav:**
  - Botão "Adicionar" abre um menu de ação com opções explícitas (Música/Repertório).
  - Alinhamento de baseline garantido por containers de ícone com altura fixa (`h-10`).
- **Medidas Dinâmicas:** Uso obrigatório de `dvh` para alturas e `safe-bottom`/`safe-top` para áreas de notch/barra de navegação.

### 🛠️ ARQUITETURA TÉCNICA
- **Persistência:** `LibraryContext` centraliza `songLibrary` e `repertoires`.
- **Navegação Mobile:** `BottomNav` controla as abas e dispara o `MobileDrawer` para exibir listas.
- **Paginação:** Calculada dinamicamente via `scrollWidth` e `columnGap` no `StageMode`, permitindo que a letra se comporte como páginas de um livro no mobile.

### 📋 PENDÊNCIAS / PRÓXIMOS PASSOS
- [ ] Monitorar performance do `SongEditor` em dispositivos com pouca RAM.
- [ ] Validar comportamento do teclado virtual no Android (redimensionamento de viewport).
- [ ] Otimização de imagens geradas via IA para carregamento progressivo.

---
*Última atualização: 21 de Abril de 2026*
