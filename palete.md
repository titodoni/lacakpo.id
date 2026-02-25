**pallete.md** (copy-paste this entire file content to Kimi):

```markdown
# Kreasilog PO Tracking App — Dynamic Color Palette Engine (4 Themes)

You are a senior UI/UX engineer and design system expert who has built production-grade SaaS dashboards (like Linear, Vercel, Stripe, Notion). 

The app is **Kreasilog PO Tracking** — a clean, professional, modern web dashboard for managing Purchase Orders,  analytics. Think clean tables, kanban boards, status badges, forms, side nav, top bar, cards, modals. Everything must feel trustworthy, fast, and premium.

## Core Constraints (NEVER break these)
- **Background is ALWAYS pure white** (`#FFFFFF`) for the entire UI (html/body, main container, cards, modals, tables, sidebars — everything uses white or near-white surfaces).
- Light mode only (no dark mode).
- Must be 100% accessible (WCAG AA minimum, ideally AAA for normal text — contrast ≥ 4.5:1, large text ≥ 3:1).
- Support instant theme switching at runtime (user preference / admin setting / default). Use CSS variables + a single class on `<html>` or a React context/Tailwind variant.
- Use the exact shade system provided (100 = darkest variant → 900 = lightest variant, DEFAULT = main brand color). This is intentional and different from classic Tailwind 50-950.

## The 4 Themes (exact colors — copy these verbatim)

**Theme 1 — "Ocean Flame"**
```js
{
  blue_green: { DEFAULT: '#219ebc', 100: '#071f25', 200: '#0d3e4b', 300: '#145d70', 400: '#1a7d95', 500: '#219ebc', 600: '#39bcdc', 700: '#6bcce5', 800: '#9cddee', 900: '#ceeef6' },
  deep_space_blue: { DEFAULT: '#023047', 100: '#00090e', 200: '#01131c', 300: '#011c2a', 400: '#012638', 500: '#023047', 600: '#04699b', 700: '#06a3f1', 800: '#54c3fb', 900: '#a9e1fd' },
  amber_flame: { DEFAULT: '#ffb703', 100: '#342500', 200: '#684b00', 300: '#9c7000', 400: '#d09500', 500: '#ffb703', 600: '#ffc637', 700: '#ffd569', 800: '#ffe39b', 900: '#fff1cd' },
  princeton_orange: { DEFAULT: '#fb8500', 100: '#321b00', 200: '#643500', 300: '#965000', 400: '#c86b00', 500: '#fb8500', 600: '#ff9e2f', 700: '#ffb663', 800: '#ffce97', 900: '#ffe7cb' }
}
```

**Theme 2 — "Midnight Ember"**
```js
{
  black: { DEFAULT: '#000000', 100: '#000000', 200: '#000000', 300: '#000000', 400: '#000000', 500: '#000000', 600: '#333333', 700: '#666666', 800: '#999999', 900: '#cccccc' },
  prussian_blue: { DEFAULT: '#14213d', 100: '#04070c', 200: '#080d19', 300: '#0c1425', 400: '#101b31', 500: '#14213d', 600: '#29447e', 700: '#3e67bf', 800: '#7e99d5', 900: '#beccea' },
  orange: { DEFAULT: '#fca311', 100: '#362101', 200: '#6b4201', 300: '#a16402', 400: '#d68502', 500: '#fca311', 600: '#fdb541', 700: '#fec871', 800: '#fedaa0', 900: '#ffedd0' },
  alabaster_grey: { DEFAULT: '#e5e5e5', 100: '#2e2e2e', 200: '#5c5c5c', 300: '#8a8a8a', 400: '#b8b8b8', 500: '#e5e5e5', 600: '#ebebeb', 700: '#f0f0f0', 800: '#f5f5f5', 900: '#fafafa' }
}
```

**Theme 3 — "Teal Gold Luxe"**
```js
{
  ink_black: { DEFAULT: '#0c1618', 100: '#020405', 200: '#050909', 300: '#070d0e', 400: '#0a1113', 500: '#0c1618', 600: '#2c5057', 700: '#4c8a96', 800: '#81b5bf', 900: '#c0dadf' },
  pine_teal: { DEFAULT: '#004643', 100: '#000e0e', 200: '#001d1b', 300: '#002b29', 400: '#003936', 500: '#004643', 600: '#009f97', 700: '#00f7ea', 800: '#50fff6', 900: '#a7fffb' },
  cornsilk: { DEFAULT: '#faf4d3', 100: '#534809', 200: '#a58f12', 300: '#e8cb2c', 400: '#f1e07e', 500: '#faf4d3', 600: '#fbf6da', 700: '#fcf8e3', 800: '#fdfbed', 900: '#fefdf6' },
  metallic_gold: { DEFAULT: '#d1ac00', 100: '#2a2200', 200: '#544400', 300: '#7d6600', 400: '#a78900', 500: '#d1ac00', 600: '#ffd30e', 700: '#ffde4a', 800: '#ffe987', 900: '#fff4c3' }
}
```

**Theme 4 — "Warm Ivory"**
```js
{
  black: { DEFAULT: '#000000', 100: '#000000', 200: '#000000', 300: '#000000', 400: '#000000', 500: '#000000', 600: '#333333', 700: '#666666', 800: '#999999', 900: '#cccccc' },
  porcelain: { DEFAULT: '#fffffc', 100: '#656500', 200: '#caca00', 300: '#ffff30', 400: '#ffff95', 500: '#fffffc', 600: '#fffffb', 700: '#fffffc', 800: '#fffffd', 900: '#fffffe' },
  khaki_beige: { DEFAULT: '#beb7a4', 100: '#29261d', 200: '#524c3a', 300: '#7c7258', 400: '#a09679', 500: '#beb7a4', 600: '#cbc5b5', 700: '#d8d3c8', 800: '#e5e2da', 900: '#f2f0ed' },
  vivid_tangerine: { DEFAULT: '#ff7f11', 100: '#361900', 200: '#6c3200', 300: '#a24c00', 400: '#d86500', 500: '#ff7f11', 600: '#ff993f', 700: '#ffb26f', 800: '#ffcc9f', 900: '#ffe5cf' }
}
```

## Task: Build the COMPLETE Color Palette Engine

Create a full production-ready color system with:

1. **Semantic Token Mapping** (shadcn/ui + Radix style — this is the heart of a beautiful production UI):
   - `background` → always `#FFFFFF`
   - `foreground` → darkest text (usually the 100 or 200 shade of the darkest color)
   - `primary` → the vibrant DEFAULT color (the hero brand color)
   - `primary-foreground` → white or highest-contrast text on primary
   - `secondary` → secondary brand color (use the second darkest/vibrant)
   - `accent` → highlight/action color (the warm/orange/gold one — perfect for PO status, buttons, badges)
   - `muted` / `muted-foreground`
   - `card` / `card-foreground` (still white + text)
   - `popover` / `popover-foreground`
   - `border`
   - `input`
   - `ring` (focus rings)
   - `destructive` (red — derive softly from palette or use a safe red that works on white)
   - `success` (green — derive from teal/pine if possible)
   - `warning` (use amber/orange from palette)
   - `info`

   For each of the 4 themes, explicitly define which source color + which shade becomes each semantic token. Explain your choice so it creates a coherent, beautiful, professional look.

2. **Full CSS Variables** (ready for `:root` and `.theme-ocean-flame`, `.theme-midnight-ember`, etc.)

3. **Tailwind CSS config** (`theme.extend.colors`) that works with the semantic tokens and the original shades (so developers can still use `bg-blue_green-500`, `text-princeton_orange-400`, etc.)

4. **Theme Switcher Code** (React + Tailwind or plain JS example — how to apply `data-theme="ocean-flame"` or class)

5. **Usage Guidelines** (this is crucial — tell exactly where to apply each token for a beautiful PO tracking UI):
   - Sidebar / header
   - Primary buttons & CTAs
   - Secondary / outline buttons
   - Status badges (Delivered = success, Pending = warning, Overdue = destructive, etc.)
   - Table rows, hover states
   - Cards, metrics, charts
   - Form inputs, focus rings
   - Text hierarchy (headings vs body)
   - Hover / active / disabled states (use appropriate shades)

6. **Accessibility & Polish Checklist** you followed.

## Output Format
Return:
- Clear section headers
- Complete, copy-pasteable code blocks (CSS vars, Tailwind config, theme objects, React context example)
- Beautiful, professional, production-grade choices — no generic answers. Make the 4 themes feel distinct yet equally premium.

Start directly with the solution. Do not ask questions — you have everything you need.
``