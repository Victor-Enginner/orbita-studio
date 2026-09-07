# Órbita Studio

Versão 0.3.1 de uma central de operações de conteúdo com IA, com Production Engine e interface Studio: preto absoluto, fundo neural animado e acentos LED. Frontend navegável, em português, pensado para validar o trabalho pelo celular e continuar no PC.

## Interface Studio

A tela inicial abre com um campo de ideias: descreva o conteúdo e revise o briefing preenchido antes de salvar. Atalhos abrem agentes, perfis e quadro; a barra lateral dá acesso a conteúdos do fluxo. Chat, formulários, cards e Engine compartilham a mesma linguagem visual.

O redesign mantém dados e importações compatíveis, sem dependências novas de runtime. Referências, tokens e critérios em [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Fundo neural / LED

Rede decorativa em Canvas 2D com ramificações e impulsos ciano/violeta. O botão **Neural ativo/pausado**, no canto inferior, salva a preferência neste navegador. O efeito não usa IA nem dados do workspace.

Movimento reduzido do dispositivo produz uma rede estática. A animação pausa em abas ocultas, limita o desenho a até 30 fps e usa menos partículas no celular. Os painéis preservam superfícies escuras para leitura. Não há flashes de tela inteira, dependências novas ou requisições externas. Desative o movimento para economizar mais bateria.

## Production Engine

Abra **http://localhost:4173/#engine** ou use **Produção → Abrir sala de criação**. São 12 etapas, 48 tarefas e 36 critérios de revisão. A sala inclui evidências, storyboard, prompts versionados, ferramentas, discussão, aprendizado e histórico.

O loop segue **preparar → verificar → revisar → aprovar → avançar**. Mudanças em entradas invalidam aprovações posteriores. Três devoluções exigem uma nova abordagem registrada pelo operador. Ao concluir, é possível criar o próximo experimento sem copiar resultados anteriores.

Leia o [guia completo do motor](docs/PRODUCTION-ENGINE.md) para o fluxo passo a passo, as 16 evoluções e as rotas de produção com CapCut, Higgsfield e projetos abertos.

## Abrir

Requer Node.js 20 ou superior. A aplicação não depende de instalação de pacotes para funcionar.

```sh
cd /data/data/com.termux/files/home/projects/orbita-studio
node server.mjs
```

Abra **http://localhost:4173** no navegador do celular. Mantenha o processo do Termux ativo. O Android pode suspender processos em segundo plano.

No PC, copie esta pasta, entre nela pelo terminal e execute `node server.mjs`. O servidor usa apenas `127.0.0.1`; não publica o projeto na internet.

Se a porta estiver ocupada, use `PORT=4174 node server.mjs` no Termux/Linux/macOS. No PowerShell: `$env:PORT=4174; node server.mjs`.

## Fluxos disponíveis

- **Visão geral:** entrada de ideias, atalhos, resumo do workspace, equipe, revisões e atividade local.
- **Agentes:** criar/editar nome, função, missão, entrega e limites; pausar/ativar; chat separado por agente.
- **Perfis:** criar/editar identidades editoriais, público, linguagem, redes planejadas e equipe associada.
- **Produção:** criar/editar conteúdo, filtrar, buscar e mover entre Ideias, Em produção, Em revisão e Pronto.
- **Engine:** sala de produção por conteúdo, etapas sequenciais, evidências, cenas, custos, revisão, versões e exportações.
- **Meu workspace:** exportar/importar configurações, conteúdos e conversas em JSON.
- **Busca global:** botão no topo ou tecla `/`; `Esc` fecha a janela.

O chat responde com uma simulação explícita, sem chamar modelos. O cadastro de perfis não cria contas sociais. “Pronto” não publica conteúdo. Os exemplos iniciais são fictícios e editáveis. A sala permite registrar métricas manualmente, com origem e janela de medição; não busca audiência ou receita nas redes.

## Continuar no PC

1. No celular, abra **Meu workspace → Exportar workspace**.
2. Transfira o arquivo JSON e a pasta do projeto para o PC. `node_modules` não é necessário para executar a aplicação.
3. Abra o projeto no PC com `node server.mjs`.
4. Use **Meu workspace → Importar arquivo**. A importação substitui os dados locais após confirmação; exporte a cópia atual se quiser preservá-la.

Os dados ficam em `localStorage`, separados por navegador e endereço. Use sempre `http://localhost:4173` para acessar a mesma cópia: trocar para `127.0.0.1` ou outra porta muda o armazenamento. Exportações incluem as conversas. Não guarde senhas ou chaves de API nesta prévia. O limite de importação é 5 MB.

## Organização

```text
index.html          Documento e ponto de entrada
src/styles.css      Identidade visual e layouts responsivos
src/app.js          Telas, formulários e eventos da interface
src/state.js        Dados demonstrativos e validação de importações
src/icons.js        Ícones vetoriais locais
src/production/     Motor de estados, sala de criação e catálogo de ferramentas
server.mjs          Servidor estático local com Node.js
tests/              Verificações de estado e interação no DOM
docs/               Escopo e roteiro de validação
```

HTML, CSS e JavaScript em módulos nativos, sem build, CDN, fontes externas ou dependências de runtime. Isso mantém a prévia leve e portátil no Termux. `happy-dom` é usado somente para verificações de desenvolvimento.

## Verificações

```sh
npm ci --ignore-scripts
npm run check
npm test
```

Os testes de DOM verificam interações, não renderização visual. O roteiro em `docs/VALIDACAO.md` cobre a inspeção em navegador real.

## Exportações da sala de criação

- **Pacote de montagem:** Markdown com briefing, roteiro, cenas, referências e instruções para levar ao editor; não é projeto nativo CapCut.
- **SRT planejado:** texto e tempos com base nas durações do storyboard; precisa de sincronização com o áudio final.
- **Ciclo JSON:** registro de um conteúdo para consulta; use a exportação de workspace para transferir todos os dados ao PC.

## Próxima fase

Validar a experiência antes de escolher o backend. Depois, separar persistência e simulação em adaptadores para armazenamento remoto e modelos; adicionar autenticação, arquivos de mídia, fila de execução e integrações sociais conforme o fluxo aprovado. Instruções de agentes são texto de configuração nesta versão, sem execução.
