# Plano de Modernização e Organização: Cifra & Play

Este documento detalha a estratégia para transformar o arquivo único de 2.000 linhas em um projeto web moderno, escalável e profissional.

## 1. Framework Recomendado: **React + Vite**

### Por que usar?
- **Modularidade**: Permite separar o código em componentes (ex: `Sidebar.tsx`, `LyricsEditor.tsx`, `StageView.tsx`).
- **Performance**: O Vite é extremamente rápido para desenvolvimento e gera bundles otimizados.
- **Ecossistema PWA**: Facilidade extrema de instalar suporte offline via `vite-plugin-pwa`.
- **Manutenibilidade**: Facilita a correção de bugs e a adição de novas funções sem quebrar o resto do app.
- **Desenvolvimento Ágil**: O Vite refina apenas o arquivo alterado (HMR), tornando o desenvolvimento 10x mais rápido que rodar um arquivo único gigante.

---

## 2. Nova Arquitetura de Pastas
O projeto será organizado da seguinte forma:
```text
/src
  /components     (Botões, Selects, Modais)
  /features       (Lógica do Modo Palco, Teleprompter)
  /hooks          (Custom hooks para localStorage e Licença)
  /store          (Estado global do app)
  /styles         (CSS modular e Tailwind)
  /utils          (Formatadores de texto, criptografia)
App.tsx           (Componente principal)
main.tsx          (Ponto de entrada)

## 2.1 Benefícios da Separação (Componentização)
1. **Isolamento de Erros**: Erros no CSS de um componente não afetam a lógica de outro.
2. **Reutilização**: O mesmo seletor de Artista pode ser usado no Editor e no Gerenciador de Listas.
3. **Escalabilidade**: Preparação total para futuras funções como sincronização em nuvem ou transposição automática.
```

---

## 3. Implementação do PWA (Modo 100% Offline)
Para garantir que o app funcione sem internet:
1.  **Service Workers**: Utilizaremos o `vite-plugin-pwa` para fazer o cache automático de todos os arquivos do sistema (JS, CSS, Ícones).
2.  **Manifesto**: Criação do arquivo `manifest.json` para que o usuário possa "Instalar" o app no desktop ou celular, aparecendo como um aplicativo nativo.

---

## 4. Hospedagem no GitHub
1.  **Repositório**: Criaremos um repositório no seu GitHub.
2.  **GitHub Actions**: Configuraremos uma automação que, ao salvar o código, publica automaticamente a nova versão online.
3.  **GitHub Pages**: O app será acessível por uma URL do tipo `https://seu-usuario.github.io/cifra-pve`.

---

## 5. Cronograma de Execução (Passo a Passo)

### Fase 1: Setup do Ambiente
- Instalar Node.js.
- Inicializar o projeto com `npm create vite@latest`.
- Configurar Tailwind CSS e Phosphor Icons no novo ambiente.

### Fase 2: Migração de Dados e Estado
- Criar a camada de persistência (Hooks de LocalStorage).
- Migrar a lógica de descriptografia da licença.

### Fase 3: Construção dos Componentes
- **Semana 1**: Sidebar, Biblioteca e os novos seletores com botões (+).
- **Semana 2**: Editor de Letras com auto-save e Player de Áudio.
- **Semana 3**: Modo Palco com **Paginação Snap** e Teleprompter agrupado.

### Fase 4: PWA e Finalização
- Configurar o Service Worker para cache offline.
- Realizar o primeiro deploy no GitHub Pages.
- Testar compatibilidade de instalação no Windows e Mobile.

---

**Pronto para começar?** Se você concordar com este plano, o primeiro passo é prepararmos o diretório do novo projeto.
