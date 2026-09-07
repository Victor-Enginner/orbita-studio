# Validação da prévia

## Objetivo

Validar se um criador consegue entender o estado do estúdio, configurar a equipe e organizar conteúdos pelo celular. A primeira versão não avalia desempenho de IA, publicação ou monetização.

## Roteiro no navegador

1. Abra em uma tela de aproximadamente 390 px e depois no desktop, em 1440 px.
2. Na visão geral, localize equipe, perfis, conteúdo em revisão e acesso à produção.
3. Abra Agentes e crie um agente com nome, função, missão, entrega e instruções.
4. Envie uma mensagem. Verifique a identificação da resposta simulada. Troque de agente e volte: a conversa precisa continuar separada.
5. Em Função e instruções, edite e pause o agente; o envio deve ficar indisponível até a reativação.
6. Crie um perfil com redes planejadas e equipe. Confirme que o cadastro não sugere que uma conta real foi conectada.
7. Crie um conteúdo, atribua perfil e agente, edite o briefing e mova para Em revisão. O conteúdo precisa aparecer também em Na sua mesa.
8. No celular, deslize horizontalmente o quadro; as demais telas não devem exigir rolagem horizontal.
9. Teste busca global, busca de conteúdo e filtro por perfil, inclusive quando não há resultados.
10. Recarregue a página: cadastros, conversas e etapas devem permanecer.
11. Exporte o workspace. Importe em outro navegador/endereço para verificar a transferência. Cancele uma importação e confira que os dados atuais permanecem.
12. Navegue com Tab e Shift+Tab; use Esc em diálogos e setas nas abas. Confirme foco visível, fechamento do diálogo e retorno do foco.
13. Abra o teclado do celular no chat e nos formulários. Verifique se é possível alcançar Enviar e Salvar.

## Decisões para revisar com o criador

- “Órbita” é um nome provisório; identidade grafite com ação principal em lima neon e acentos violeta, ciano e pêssego.
- Seis destinos principais: visão geral, agentes, perfis, produção, Engine e workspace.
- Os perfis representam identidades editoriais com várias redes planejadas.
- Cada agente tem uma função configurável e uma conversa própria.
- O quadro usa mudança explícita de etapa; não depende de arrastar cartões no celular.
- O painel mostra quantidades reais do workspace local, sem inventar resultados comerciais.

## Limites de validação automática

Os testes de estado verificam integridade de importações, referências entre entidades, movimentação de conteúdo e recuperação diante de falhas no armazenamento. Os testes com happy-dom verificam os fluxos de criação/edição, conversas, busca, filtros e cancelamento. Não comprovam dimensões, contraste, aparência ou comportamento do teclado em um navegador real.

## Redesign 0.3 — verificações pendentes no navegador

- Inspecionar 320, 390, 768 e 1440 px; testar zoom de 200% e teclado virtual.
- Na visão geral, digitar uma ideia em duas linhas e criar conteúdo: a primeira linha vira título e o texto completo vira briefing. Cancelar preserva o texto na tela; salvar exige confirmação pelo formulário. O campo inicial não chama IA e seu texto não salvo não persiste após recarregar ou trocar de tela.
- Conferir a navegação inferior com seis destinos, sem corte no celular.
- Conferir foco, leitura dos textos secundários e áreas de toque no Engine, modais, chat e quadro.
- O orb da tela inicial é decorativo e estático, não um indicador de processamento.

Validação automatizada desta versão: 30 testes passando, sintaxe JavaScript verificada e arquivos principais servidos com HTTP 200. Não há navegador real automatizado disponível neste ambiente; isso não equivale a aprovação visual.
