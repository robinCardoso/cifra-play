# 📱 Plano de Adaptação Mobile — Cifra & Play

> Branch: `mobile` | Status: **Em planejamento**

---

## 🔍 Diagnóstico: Por que não funciona no mobile?

Após análise completa do código, foram identificados **6 problemas críticos**:

| # | Problema | Arquivo | Impacto |
|---|----------|---------|---------|
| 1 | **Sidebar fixa sempre visível** (w-72/w-80) ocupa toda a tela | `Layout.jsx`, `Sidebar.jsx` | ❌ Fatal |
| 2 | **StageMode usa canvas de 1920×1080px fixo** com scale transform — inutilizável em tela pequena | `StageMode.jsx` L17-18, L340-346 | ❌ Fatal |
| 3 | **SongEditor usa `h-full w-full textarea`** sem scroll no mobile | `SongEditor.jsx` L263 | 🔴 Alto |
| 4 | **Navegação por teclado** como única forma de navegar páginas | `StageMode.jsx` L268-305 | 🔴 Alto |
| 5 | **Modais (Settings, ListManager)** sem `max-h` nem scroll interno | `SettingsModal.jsx`, `ListManagerModal.jsx` | 🟡 Médio |
| 6 | **Sem viewport meta tag** correta e sem suporte a gestos touch | `index.html` | 🟡 Médio |

---

## 📋 Plano — 6 Fases

---

### ✅ FASE 1 — Fundação (Rápido: ~30min)
**Arquivo:** `index.html`, `index.css`

**Problemas resolvidos:**
- Viewport não configurado para mobile
- Scrollbar gigante no mobile

**Tarefas:**
- [ ] 1.1 — Verificar/corrigir `<meta name="viewport">` em `index.html`
- [ ] 1.2 — Adicionar `touch-action: manipulation` no CSS global para eliminar delay de 300ms
- [ ] 1.3 — Esconder scrollbar no mobile (`@media (max-width: 768px)`)
- [ ] 1.4 — Garantir que `body` não tenha overflow horizontal

---

### ✅ FASE 2 — Layout Responsivo: Sidebar → Bottom Navigation
**Arquivos:** `Layout.jsx`, `Sidebar.jsx`, novo `BottomNav.jsx`

**Problema central:** A sidebar ocupa 320px fixos. No mobile (360-414px de largura), sobra zero espaço para o conteúdo.

**Solução:** Criar um **Bottom Navigation Bar** para mobile, mantendo a sidebar apenas no desktop.

```
Desktop (≥768px):          Mobile (<768px):
┌────────┬──────────────┐  ┌──────────────────────┐
│Sidebar │  Conteúdo    │  │     Conteúdo          │
│        │              │  │                       │
│        │              │  │                       │
└────────┴──────────────┘  ├──────────────────────┤
                           │ [Repertórios][Biblio.] │
                           └──────────────────────┘
```

**Tarefas:**
- [ ] 2.1 — `Layout.jsx`: Adicionar hook `useIsMobile` (breakpoint 768px via `window.innerWidth`)
- [ ] 2.2 — `Layout.jsx`: Renderizar `<Sidebar>` apenas em desktop, `<BottomNav>` + drawer em mobile
- [ ] 2.3 — Criar `BottomNav.jsx`: barra fixada no bottom com ícones de Repertórios, Biblioteca, e botão "+" para adicionar
- [ ] 2.4 — Criar `MobileDrawer.jsx`: painel que desliza de baixo para cima com a lista de músicas/repertórios ao tocar no ícone
- [ ] 2.5 — `Sidebar.jsx`: Manter como está para desktop (sem quebrar)

**Componentes novos:**
```
src/components/
  BottomNav.jsx       ← nova barra de navegação mobile
  MobileDrawer.jsx    ← painel deslizante com listas
```

---

### ✅ FASE 3 — StageMode Mobile (Maior desafio)
**Arquivo:** `StageMode.jsx`

**Problema central:** O StageMode usa uma "câmera" de `1920×1080px` escalada via `transform: scale()`. No mobile isso resulta em escala ~0.2, letras minúsculas e controles inacessíveis.

**Solução:** Detectar mobile e usar um **layout nativo fluido** em vez do canvas fixo.

```
Desktop:                    Mobile:
┌─────────────────────┐    ┌────────────────┐
│ [Header com controles] │    │ ← Música 1/5 → │  ← swipe
│                     │    │ Título         │
│  Letra em 1920px   │    │                │
│  scale(0.5)        │    │  Letra fluida  │
│                     │    │  scroll normal │
│ [Footer paginação]  │    │ [●  ●  ○  ○]  │
└─────────────────────┘    │ [Prev]  [Next] │
                           └────────────────┘
```

**Tarefas:**
- [ ] 3.1 — Criar hook `useIsMobile()` em `src/hooks/useIsMobile.js`
- [ ] 3.2 — `StageMode.jsx`: Adicionar branch `if (isMobile)` que retorna layout mobile
- [ ] 3.3 — Layout mobile do StageMode:
  - Header compacto com título e botão X (fechar)
  - Área de letra com **scroll vertical** (sem paginação horizontal)
  - Fonte ajustável com botões + / −
  - Footer com indicador de música e botões Anterior / Próxima
- [ ] 3.4 — Adicionar **swipe horizontal** para trocar de música (touch events: `touchstart`, `touchend`, detectar direção)
- [ ] 3.5 — Controles de estilo (colunas, fonte) em um **bottom sheet** acessível por botão ⚙️
- [ ] 3.6 — Botão de **tela cheia** nativa mobile (`requestFullscreen` com orientação landscape)

---

### ✅ FASE 4 — SongEditor Mobile
**Arquivo:** `SongEditor.jsx`

**Problema central:** O editor tem um header complexo com muitos campos em linha. No mobile fica espremido e inutilizável.

**Tarefas:**
- [ ] 4.1 — Header do editor: empilhar campos em coluna no mobile (já usa `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — verificar se está funcionando corretamente)
- [ ] 4.2 — Textarea da letra: garantir `min-height` adequado e scroll correto no iOS (adicionar `-webkit-overflow-scrolling: touch`)
- [ ] 4.3 — Botões de ação (Exportar, Excluir, Ver no Palco): reorganizar em mobile (mover para bottom bar ou ícones compactos)
- [ ] 4.4 — Testar teclado virtual do iOS/Android (o teclado virtual reduz o `viewport height` — usar `dvh` em vez de `vh`)

---

### ✅ FASE 5 — RepertoireEditor e Modais
**Arquivo:** `RepertoireEditor.jsx`, `SettingsModal.jsx`, `ListManagerModal.jsx`

**Tarefas:**
- [ ] 5.1 — `RepertoireEditor.jsx`: Garantir que lista de drag-and-drop funcione com touch (verificar se biblioteca de drag tem suporte touch ou adicionar alternativa)
- [ ] 5.2 — `SettingsModal.jsx`: Adicionar `max-h-[90dvh] overflow-y-auto` para modal caber na tela
- [ ] 5.3 — `ListManagerModal.jsx`: Mesmo tratamento de altura máxima
- [ ] 5.4 — `ConfirmModal.jsx`: Verificar posicionamento no mobile

---

### ✅ FASE 6 — Touch, Gestos e PWA Polish
**Arquivos:** vários

**Tarefas:**
- [ ] 6.1 — Aumentar área de toque de todos os botões para mínimo `44×44px` (padrão Apple/Google)
- [ ] 6.2 — Remover `hover:` effects que ficam "presos" no touch (substituir por `active:` onde necessário)
- [ ] 6.3 — Verificar `InstallPWA.jsx` — o banner aparece corretamente no mobile?
- [ ] 6.4 — Testar orientação landscape no StageMode mobile
- [ ] 6.5 — Verificar `BackupBanner.jsx` no mobile (File System Access API não funciona em todos os browsers mobile)
- [ ] 6.6 — Adicionar `manifest.json` correto para instalação PWA (ícones, `display: standalone`, orientação)

---

## 🗓️ Ordem de Execução Recomendada

```
FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6
 (30min)  (2h)     (3h)      (1h)      (1h)     (1h)
```

**Total estimado: ~8-9 horas de desenvolvimento**

> [!IMPORTANT]
> **Comece pela Fase 2 (Layout)** — ela desbloqueia todo o resto. Sem a navegação mobile funcionando, nada faz sentido testar.

> [!TIP]
> Teste em cada fase usando o DevTools do Chrome (F12 → ícone de celular) com viewport de **390×844px** (iPhone 14) e **768×1024px** (iPad).

---

## 🛠️ Novos Arquivos a Criar

| Arquivo | Propósito |
|---------|-----------|
| `src/hooks/useIsMobile.js` | Hook reativo para detectar breakpoint mobile |
| `src/components/BottomNav.jsx` | Barra de navegação inferior mobile |
| `src/components/MobileDrawer.jsx` | Painel deslizante com listas (Repertórios / Biblioteca) |

---

## 📌 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `index.html` | Viewport meta, theme-color |
| `src/index.css` | Touch-action, dvh vars, mobile scroll |
| `src/components/Layout.jsx` | Renderização condicional sidebar/bottomnav |
| `src/components/Sidebar.jsx` | Mínimas (apenas desktop) |
| `src/features/StageMode.jsx` | Layout mobile alternativo + swipe |
| `src/features/SongEditor.jsx` | Grid responsivo, textarea iOS fix |
| `src/features/RepertoireEditor.jsx` | Touch drag-and-drop |
| `src/features/SettingsModal.jsx` | max-h scroll |
| `src/features/ListManagerModal.jsx` | max-h scroll |
