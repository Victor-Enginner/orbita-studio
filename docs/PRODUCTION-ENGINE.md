# Órbita Production Engine — v0.2

## O que esta versão faz

Uma sala de criação por conteúdo, com motor local de estados e aprovação sequencial. É possível produzir briefings, roteiros, storyboards, prompts e pacotes editoriais reais dentro do frontend. Geração de mídia, execução de agentes, edição de arquivos e publicação continuam externas. A fase atual permanece frontend, como decidido pelo criador.

A qualidade vem de informações verificáveis, autoria editorial e revisão concreta. O software verifica estrutura, relações e registros; não decide sozinho se uma fonte é verdadeira ou se um vídeo é bom.

## Loop passo a passo

1. **Selecionar o conteúdo.** Abrir Engine ou usar Abrir sala de criação no quadro. Cada vídeo tem seu próprio ciclo.
2. **Definir a entrada.** Registrar público, promessa, abordagem, duração e orçamento. O briefing do quadro é usado como ponto de partida, sem aprovação automática.
3. **Executar as tarefas da etapa.** Consultar a lista de quatro tarefas. Produzir a entrega no formulário ou executar o trabalho na ferramenta externa indicada.
4. **Salvar o artefato.** O rascunho da etapa também é salvo ao trocar de área. Evidências, cenas, notas e métricas têm botões próprios de salvar.
5. **Verificar a entrada.** O motor lista campos ausentes e condições específicas, como uma evidência conferida ou duração do storyboard incompatível.
6. **Revisar o material.** Marcar os três critérios após conferir a entrega. O percentual exibido mede preenchimento, não qualidade, verdade ou potencial de viralização.
7. **Aprovar e avançar.** A aprovação só acontece se a etapa é a próxima pendente, todos os critérios estão registrados e não há bloqueio. Ela salva uma versão de valores, fontes e cenas.
8. **Devolver com um motivo.** A devolução limpa a revisão da etapa e invalida aprovações posteriores. Após três devoluções, o ciclo bloqueia novas aprovações.
9. **Mudar a abordagem.** Para retomar um ciclo bloqueado, o operador registra a mudança de plano. Isso zera o contador de tentativas, mas preserva o histórico.
10. **Entregar ao editor.** Exportar o pacote Markdown e, se útil, o SRT planejado. Esses arquivos não são projetos nativos CapCut e não incluem as mídias.
11. **Observar o resultado.** Registrar métricas reais com origem/janela ou feedback interno explicitamente identificado. Publicação não é necessária para registrar aprendizado de produção.
12. **Abrir o próximo experimento.** Após as 12 aprovações, criar um novo cartão com a hipótese e a duração/orçamento planejados. O ciclo anterior fica preservado; evidências, resultados e aprovações não são copiados.

O loop é dirigido por eventos do operador. Não existe temporizador chamando IA continuamente nem custo automático de API. Pausar impede aprovações, mas permite trabalhar nos rascunhos.

## As 12 etapas e 48 tarefas

| Etapa | Tarefas | Entrega |
| --- | --- | --- |
| Direção editorial | Público; promessa; abordagem original; duração/orçamento | Briefing |
| Fontes e evidências | Fonte primária/registro próprio; relação afirmação-fonte; data/contexto; lacunas | Dossiê |
| Gancho e promessa | Duas aberturas; primeira prova visual; escolha; coerência | Abertura escolhida |
| Roteiro e narrativa | Estrutura; demonstrações; leitura; checagem de fatos/tempo | Roteiro narrável |
| Cenas e ritmo | Divisão em cenas; tempos/voz; função visual; duração total | Storyboard |
| Mídias e geração | Ferramenta; arquivos; origem/permissão; takes/custos | Lista de mídias |
| Voz e desenho sonoro | Narração; pronúncia; trilha/efeitos; inteligibilidade | Plano de áudio |
| Montagem no editor | Organização; sequência; ritmo/mixagem; versão exportada | Corte identificado |
| Legendas e acessibilidade | Transcrição; correções; tempos; leitura no celular | Legendas revisadas |
| Embalagem por rede | Títulos/capa; descrição/créditos; variantes; coerência | Pacote de distribuição |
| Revisão e entrega | Fatos/originalidade; arquivo final; orçamento; aprovação | Parecer editorial |
| Aprendizado e novo ciclo | Feedback/origem; interpretação; hipótese; próximo briefing | Experimento seguinte |

Esse catálogo cobre o fluxo inicial de vídeos sem rosto, sem pretender enumerar todas as tarefas possíveis de qualquer gênero. Novos formatos podem exigir etapas adicionais. Ficção, documentário, tutorial e comentário precisam de critérios editoriais próprios.

## Evoluções implementadas em relação à v0.1

1. Sala de criação persistente por vídeo.
2. Linha sequencial de 12 etapas e 48 tarefas explícitas.
3. Verificação de entradas e 36 critérios de revisão do operador.
4. Dossiê que relaciona evidência, afirmação, contexto e conferência.
5. Desenvolvimento de duas aberturas, roteiro e conclusão.
6. Storyboard editável com ordem, tempos, narração e descrição visual.
7. Referência de mídia, origem/permissão e revisão por cena.
8. Orçamento com soma dos custos das cenas, incluindo tentativas descartadas.
9. Templates de prompts por etapa e cena, com até 30 versões.
10. Pacote de montagem Markdown, exportação do ciclo JSON e SRT planejado.
11. Catálogo de sete ferramentas com fontes oficiais, custos e maturidade.
12. Discussão vinculada ao vídeo, com até 100 notas do operador.
13. Histórico de 100 eventos e 36 snapshots de aprovação por ciclo.
14. Invalidação das aprovações dependentes quando entradas mudam.
15. Pausa, retomada e limite de três devoluções por abordagem.
16. Registro manual de resultados e criação do próximo experimento.

## Qualidade de entrada: o que impede avanço

- Campos obrigatórios vazios ou valores numéricos inválidos.
- Aprovação de etapa futura antes da anterior.
- Pesquisa sem ao menos uma evidência conferida com afirmação e referência.
- Storyboard vazio, incompleto ou com duração diferente do briefing por mais de um segundo.
- Produção visual sem referência de mídia, origem/permissão ou conferência de todas as cenas.
- Revisão final com custo acumulado acima do orçamento.
- Ausência de um dos três critérios de revisão da etapa.
- Ciclo pausado ou bloqueado por retrabalho.

Uma caixa marcada é uma declaração do operador, não uma inspeção automática de vídeo. A conferência automática de todas as afirmações, licenças, imagens e áudio exigirá outras capacidades na fase de backend.

Alterar uma fonte invalida Pesquisa e etapas seguintes. Alterar cenas invalida Storyboard e etapas seguintes. Alterar campos de uma etapa invalida essa etapa e as posteriores. Alterar identidade editorial ou briefing do quadro invalida a linha a partir da Direção editorial. Os snapshots anteriores continuam disponíveis para comparação.

O quadro geral mantém seus estados manuais (Ideias, Em produção, Em revisão, Pronto). As aprovações do Engine são independentes e mais detalhadas; mover um cartão para Pronto não aprova o ciclo nem publica um vídeo.

## Rota de produção com ferramentas externas

### CapCut

O site oficial descreve Script to Video, Auto Reframe e Auto Captions. Nesta versão, a rota é manual: roteiro/storyboard no Órbita → mídias organizadas → montagem no CapCut → revisão → registro da versão do corte. Recursos e limites devem ser conferidos na conta, versão e região. [Fonte oficial](https://www.capcut.com/tools/desktop-ai-power).

### Higgsfield

A plataforma é proprietária. Há API oficial com autenticação e fluxo assíncrono, mas o Órbita não a chama. A rota planejada é storyboard → prompt por cena → geração no serviço oficial → seleção de takes → edição. Não foi identificada uma edição oficial open source para assumir como dependência gratuita. [Plataformas oficiais](https://higgsfield.ai/creator-hub/help-center/getting-started/official-higgsfield-platforms), [documentação da API](https://docs.higgsfield.ai/docs).

### Alternativas abertas verificadas em 07/09/2026

| Projeto | Papel proposto | Condição observada |
| --- | --- | --- |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Workflows de geração no PC/servidor | GPL-3.0; pesos e plugins precisam de avaliação própria |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | Transcrição do áudio final | MIT; execução local depende de hardware/ambiente |
| [FFmpeg](https://ffmpeg.org/) | Processamento e variantes de áudio/vídeo | [LGPL/GPL conforme compilação](https://ffmpeg.org/legal.html) |
| [Shotcut](https://github.com/mltframework/shotcut) | Montagem desktop | GPL-3.0; alternativa local de edição |
| [OpenCut](https://github.com/opencut-app/opencut) | Avaliação de editor e futura integração | MIT; README informa reescrita e recomenda a versão classic para uso atual |

Nenhum repositório foi clonado ou executado neste trabalho. API, MCP e headless anunciados para a reescrita do OpenCut não foram tratados como recursos disponíveis. Código aberto não significa processamento gratuito nem concede automaticamente direitos sobre modelos ou mídias de terceiros.

## Transferência e dados

Continuamos usando a chave `orbita-studio:v1` para preservar dados do navegador. O novo campo opcional `production` é associado aos IDs dos conteúdos. Exportações antigas continuam aceitas; novas exportações incluem ciclos, prompts, notas, snapshots, cenas e evidências. O campo possui validação de tipos, tamanhos, referências e sequência de aprovações.

Use **Meu workspace → Exportar workspace** para transferir tudo ao PC. **Exportar ciclo JSON** serve como artefato de um vídeo; não é uma exportação completa para o importador de workspace. O limite de importação completa continua em 5 MB. Não há sincronização entre abas/dispositivos, upload de mídia ou armazenamento de credenciais.

## Validação de aceitação

1. Abrir um conteúdo no Engine e tentar aprovar a primeira etapa vazia: devem aparecer pendências.
2. Preencher o briefing, salvar, marcar os critérios e aprovar: a pesquisa é liberada.
3. Cadastrar uma evidência não conferida: a pesquisa permanece bloqueada.
4. Criar cenas, ajustar a soma dos tempos e registrar custo/origem: testar os respectivos bloqueios.
5. Aprovar etapas, editar uma fonte anterior e conferir a invalidação posterior.
6. Devolver três vezes: exigir nova abordagem para retomar.
7. Pausar e confirmar que a aprovação fica indisponível.
8. Versionar um prompt, alterar o contexto e comparar as versões.
9. Exportar Markdown e SRT: inspecionar conteúdo e tempos planejados.
10. Registrar observações sem métricas: não inventar números no painel.
11. Concluir o ciclo e criar o próximo: nenhum resultado anterior deve se tornar resultado do novo vídeo.
12. Exportar/importar workspace antigo e novo sem perder o restante dos cadastros.

Os testes automatizados cobrem estado e interações no DOM. A aparência, a rolagem horizontal das áreas e o teclado móvel precisam de validação em navegador real.
