# Studio — sistema visual 0.3.1

## Direção

Uma central de criação, não uma landing page. A entrada principal é uma ideia que abre um briefing editável. O Engine vem em seguida; quantidades locais, equipe e revisão mantêm a operação visível sem disputar o título.

A base do fundo é preto absoluto; as superfícies de trabalho são quase pretas. Lima sinaliza a ação principal, violeta identifica o Engine e ciano complementa identidades e cenas. Cores de aviso continuam acompanhadas de texto. Nenhuma cor significa que um agente real está conectado.

## Tokens

| Uso                       | Valor                             |
| ------------------------- | --------------------------------- |
| Canvas                    | `#000000`                         |
| Sidebar                   | `#000000ed`                       |
| Superfície                | `#090b10`                         |
| Superfície elevada        | `#10141b`                         |
| Separador decorativo      | `#303035`                         |
| Contorno de entrada       | `#74747e`                         |
| Texto principal           | `#f4f4f5`                         |
| Texto secundário          | `#a1a1aa`                         |
| Ação principal            | `#b7ff00`, texto `#171b10`        |
| Violeta / ciano / pêssego | `#a86bff` / `#00edff` / `#ff963b` |

Fontes nativas sans-serif; monospace para índices e trechos técnicos. Bordas de 8–20 px conforme o componente. Inputs legíveis no celular, foco visível, movimento reduzido respeitado. O orb é CSS estático e decorativo, sem WebGL ou consumo contínuo de animação.

## Componentes

- Navegação: destino ativo neutro, atalhos de criação e conteúdos locais.
- Campo de ideia: input real, envio para formulário de conteúdo e confirmação antes de salvar.
- Botões: primário lima, secundário neutro, atalhos discretos, estados hover/foco/disabled.
- Cards: superfície neutra; destaque violeta limitado ao Engine e quantidade em produção.
- Chat: respostas sem balões pesados, mensagens do usuário em superfície elevada, compositor arredondado.
- Engine: cabeçalho compacto, abas segmentadas, índice sequencial e aprovação destacada.
- Mobile: navegação inferior com seis destinos; listas, formulários e salas reorganizados; rolagem horizontal intencional apenas em quadros, abas, agentes e etapas.

## Referências consultadas

- [shadcn/ui](https://ui.shadcn.com/docs/components/sidebar): exemplos de sidebar consultados pelo MCP conectado e checklist de auditoria. Padrões adaptados à aplicação nativa; não há React/Radix instalado.
- [CodeFronts — Minimalist UI](https://codefronts.com/design-styles/css-minimalist-ui/): hierarquia tipográfica, superfícies neutras, foco e alvos de interação.
- [CodeFronts — Neon](https://codefronts.com/design-styles/css-neon/): referência de destaque, sem glow em textos corridos.
- [v0](https://v0.app): referência pública de workspace centrado na entrada de criação. Nenhuma geração, conta ou integração v0 foi utilizada; não há ferramenta de geração v0 exposta nesta sessão.
- [BagUI](https://bagui.vercel.app): catálogo React/shadcn consultado como referência; blocos de landing page não foram importados no dashboard.
- [Thinking orbs](https://orbs.jakubantalik.com) aponta para [Libraries.dev](https://libraries.dev). O orb local é uma implementação CSS própria, não uma instalação dessa biblioteca.
- [Yerd](https://yerd.app): referência pública consultada; trata-se de ambiente local de desenvolvimento PHP, não um registry de componentes. Nenhum software Yerd foi instalado.

Nenhuma biblioteca nova de runtime, fonte remota, CDN ou serviço pago. As referências orientam a direção; não constituem cópia integral de qualquer interface.

## Limites da entrega

34 testes de estado/interação aprovados. DOM e parsing de CSS não comprovam layout, zoom ou teclado virtual: usar o roteiro de validação em navegador real antes de aprovar o visual. O redesenho não altera a execução simulada dos agentes nem conecta contas sociais.

## Camada neural 0.3.1

Canvas 2D fixo, sem interação com ponteiro e escondido da árvore de acessibilidade. Ramificações estáticas são pré-renderizadas em uma camada de cache. 10 impulsos no celular e 18 em telas maiores percorrem conexões, sem pulsação de luminosidade da tela inteira. Limite de 30 fps, escala de pixels até 1,5 e teto aproximado de 2,5 milhões de pixels por camada. Isso limita trabalho e memória, mas não é um benchmark de desempenho no aparelho.

Pausa manual persistida separadamente do workspace, respeito a `prefers-reduced-motion`, suspensão por visibilidade e ciclo de página. Canvas indisponível deixa o fundo preto e oculta o controle. O orb inicial continua estático; só a rede de fundo é animada. Os brilhos LED são localizados em botões, bordas, ícones e números.

Verificar no navegador real: legibilidade durante o movimento, teclado virtual, controle de pausa, aquecimento/bateria e preferência de movimento reduzido. Testes automatizados cobrem topologia, limitação de frames, pausa, persistência, visibilidade e fallback — não certificam aparência nem desempenho.
