# Sistema visual Strive

A identidade usa grafite, superfícies discretas e verde performance. A modernização preserva textos, componentes, rotas, dados e regras existentes.

## Tokens
A fonte de verdade é constants/palette.json. ThemeContext fornece as cores aos estilos nativos; constants/theme-variables.ts e tailwind.config.js compartilham os mesmos valores com NativeWind.

| Papel | Escuro | Claro |
|---|---|---|
| Fundo | #121619 | #F3F5F4 |
| Card | #1B2126 | #FCFDFC |
| Modal elevado | #242D33 | #FCFDFC |
| Borda discreta | #303A41 | #DCE4DF |
| Texto principal | #F2F5F4 | #172A20 |
| Texto secundário | #BAC5CA | #465B50 |
| Texto discreto | #98A6AE | #5F7068 |
| Destaque | #69C7A5 | #22694F |
| Texto sobre destaque | #10251E | #FFFFFF |

Sucesso, aviso, erro e informação possuem cores e superfícies próprias em ambos os temas. Em estilos novos, usar tokens semânticos em vez de novos hexadecimais.

## Tipografia
Inter, já presente no projeto, substitui visualmente Sora nos títulos. Regular 400 para leitura, Medium 500 para apoio, Semibold 600 para hierarquia e Bold 700 para títulos e métricas. A estrutura, os textos e as escalas de tamanho existentes foram preservados. Campos numéricos na web usam algarismos tabulares.

## Componentes
Cards usam superfícies neutras e bordas finas; cards de exercício e seleção usam radius 16. Outras geometrias existentes, incluindo botões em pílula, permanecem onde fazem parte da apresentação atual. Sombras foram suavizadas sem alterar elevação responsável pela ordem de sobreposição nativa.

O botão principal usa destaque sólido; texto e ícones usam onPrimary. Secondary usa superfície discreta e borda; Ghost preserva transparência; ações destrutivas usam error. Pressed e disabled mantêm os mecanismos existentes de opacidade. Na web, focus-visible usa contorno verde e hover possui ajuste discreto de brilho. Não foram adicionados handlers de foco nem animações nativas.

Modais usam superfície elevada; notificações mantêm ícones e comportamento e recebem cores semânticas. Gráficos mantêm biblioteca e dados. Navegação mantém estrutura e rotas com cores de seleção da paleta.

## Verificação desta entrega
- TypeScript: aprovado.
- Exportação Expo web e Android/Hermes: aprovada.
- Comparação AST ignorando apresentação: 87 arquivos, nenhuma diferença identificada no código restante.
- Revisão no navegador com viewport móvel e alternância de temas; capturas em outputs/visual-refresh.
- Contraste calculado dos tokens: texto discreto/card 6,50:1 escuro e 5,14:1 claro; texto/botão principal 7,90:1 escuro e 6,56:1 claro. Isso não representa auditoria de acessibilidade de todas as combinações.
- ESLint possui erros anteriores de textos não escapados e display-name; não se alteraram textos ou componentes para corrigir itens fora do escopo.

A exportação Android não equivale à validação em aparelho ou geração de APK assinado. FPS em aparelho, instalação PWA, comportamento offline e iPhone não foram medidos nesta etapa visual. Não há alegação de ganho de FPS.
