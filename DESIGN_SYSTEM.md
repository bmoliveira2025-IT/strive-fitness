# Strive Premium Design System 2026 🏆

Este documento define os padrões visuais do **Strive Top-Tier 2026**, focado em um visual maduro, suave, profissional e extremamente legível, suportando tanto o Modo Claro quanto o Modo Escuro.

---

## 🎨 1. Core Principles (Princípios de Design)

1.  **Dual Theme (Claro & Escuro)**: Suporte completo para temas claro e escuro, respeitando a preferência do usuário ou o sistema.
2.  **Soft Contrast & Legibility**: Substituir o contraste extremo por um contraste mais suave e agradável aos olhos. No modo escuro, usar fundos cinza-escuro (`#0F172A`) em vez de preto puro (`#000000`). No modo claro, usar fundos quase brancos com cartões limpos.
3.  **Softer Accents**: Uso de cores primárias suaves e tons pastéis elegantes (ex: Azul Suave, Indigo Suave) em vez de neons vibrantes.
4.  **Modern Typography**: Hierarquia moderna. Títulos expansivos e expressivos, focados na clareza instantânea de números e métricas, mas com pesos equilibrados.
5.  **Perfect Touch**: Área de toque mínima garantida de `44x44px`. Safe Areas estritamente respeitados em modais e headers.
6.  **8pt Grid System**: Espaçamento metódico múltiplo de 8 (8, 16, 24, 32, 48).

---

## 🛠️ 2. Design Tokens (Valores Padrão)

### Espaçamento (8pt Grid)
- **XS**: `8px` (Gap entre ícones e texto)
- **S**: `16px` (Padding padrão de containers pequenos)
- **M**: `24px` (Padding padrão de telas e modais)
- **L**: `32px` (Separação entre seções)

### Superfícies e Bordas
| Elemento | Especificação |
| :--- | :--- |
| **Border Radius Core** | `16px` (Sólido, amigável mas sério) |
| **Border Radius Pill** | `999px` (Para tags e botões full) |
| **Border Width** | `1px` (Hairline sharp) |
| **Border Color** | Definida pelo tema atual. |

### Sombras
Sombras suaves no modo claro (`shadow-sm`) e dependência maior de bordas finas e cores de superfície no modo escuro.

---

## 📦 3. Component Templates (Modelos de Código)

### A. O Cartão Padrão
O novo container padrão utiliza as cores do `ThemeContext`.

```tsx
const { theme } = useTheme();

<View style={{
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
}}>
    {/* Conteúdo limpo... */}
</View>
```

### B. Cabeçalhos de Seção (Headers)
Visual afiado para seções do app, usando as cores do tema.

```tsx
const { theme } = useTheme();

<View className="px-6 mb-4 flex-row justify-between items-end">
    <Text style={{ color: theme.colors.text }} className="text-2xl font-black tracking-tight">
        MEU TREINO
    </Text>
    <Text style={{ color: theme.colors.primary }} className="font-bold text-sm">Ver todos</Text>
</View>
```

### C. Botões Principais (Call to Actions)
Visuais claros e acionáveis, com a cor primária suave.

```tsx
const { theme } = useTheme();

<TouchableOpacity 
    style={{ backgroundColor: theme.colors.primary }}
    className="items-center justify-center rounded-2xl min-h-[56px] px-6"
    activeOpacity={0.8}
>
    <Text className="text-white font-bold text-lg">Começar Treino</Text>
</TouchableOpacity>
```

---

## 📱 4. Regras Mobile-First e Safe Area

1. **Safe Area Compliance**: Nenhum conteúdo interativo ficará sob a Status Bar (topo) ou a Navigation Bar (fundo).
2. **Bottom Sheets / Modals**: Devem arredondar apenas o topo (`rounded-t-3xl`) e ter padding inferior que inclui o `insets.bottom` para não colidir com a Home Indicator do iOS.
3. **One-Handed Usability**: Controles primários (Next, Start, Finish) devem sempre repousar na metade inferior da tela.

---

## 🌙 5. Temas (Claro e Escuro)

O aplicativo utiliza o `ThemeContext` para gerenciar as cores. Sempre confie no `theme.colors` ao invés de classes hardcoded do Tailwind para cores (`bg-black`, `text-white`), garantindo que a troca de temas funcione perfeitamente.

> [!TIP]
> Use a cor `textMuted` ou `textSecondary` para informações de menor hierarquia visual, mantendo a leitura leve e profissional.
