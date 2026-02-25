# Kreasilog Theme System - Usage Guide

## Overview

4 premium themes with semantic token mapping:
1. **Ocean Flame** (default) - Vibrant blue-green with orange accents
2. **Midnight Ember** - Sophisticated dark blue with warm orange
3. **Teal Gold Luxe** - Rich teal with metallic gold
4. **Warm Ivory** - Warm beige with energetic tangerine

## Setup

### 1. Import CSS Variables

Add to your `app/globals.css` or `app/layout.tsx`:

```tsx
import '@/lib/themes/globals-themes.css';
```

### 2. Wrap App with ThemeProvider

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/lib/themes/ThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3. Update Tailwind Config

```js
// tailwind.config.js
import { tailwindThemeExtension } from './lib/themes/color-palette-engine';

export default {
  theme: {
    extend: {
      colors: tailwindThemeExtension.colors,
    },
  },
};
```

## Component Usage

### Theme Switcher

```tsx
import { ThemeSwitcher } from '@/lib/themes/ThemeProvider';

// In your component
<ThemeSwitcher />
```

### Programmatic Theme Change

```tsx
import { useTheme } from '@/lib/themes/ThemeProvider';

function MyComponent() {
  const { theme, setTheme, availableThemes } = useTheme();
  
  return (
    <button onClick={() => setTheme('teal-gold-luxe')}>
      Switch to Luxe
    </button>
  );
}
```

## Color Token Reference

### Semantic Tokens (Recommended)

| Token | Usage | Example |
|-------|-------|---------|
| `bg-background` | Page background | Always white |
| `text-foreground` | Primary text | Headings, body |
| `bg-primary` | Primary buttons | Save, Submit |
| `bg-accent` | CTAs, highlights | Important actions |
| `bg-muted` | Subtle backgrounds | Hover states |
| `text-muted-foreground` | Secondary text | Descriptions |
| `border-border` | Default borders | Cards, inputs |
| `border-input` | Input borders | Form fields |
| `ring-ring` | Focus rings | Focus states |
| `bg-success` | Success states | Delivered badge |
| `bg-warning` | Warning states | Pending badge |
| `bg-destructive` | Error states | Overdue, delete |

### Raw Color Access

```tsx
// Direct color scale access
<div className="bg-blue_green-500 text-deep_space_blue-100" />
<div className="bg-metallic_gold-500 text-pine_teal-500" />
```

## Component Patterns

### Primary Button

```tsx
<button className="bg-primary text-primary-foreground 
  hover:bg-primary-hover active:bg-primary-active
  px-4 py-2 rounded-lg transition-colors">
  Save Changes
</button>
```

### Accent Button (CTA)

```tsx
<button className="bg-accent text-accent-foreground 
  hover:bg-accent-hover
  px-4 py-2 rounded-lg font-semibold">
  Create PO
</button>
```

### Outline/Secondary Button

```tsx
<button className="border border-border bg-white 
  hover:border-border-hover hover:bg-muted
  px-4 py-2 rounded-lg transition-colors">
  Cancel
</button>
```

### Card

```tsx
<div className="bg-card border border-border rounded-xl p-6">
  <h3 className="text-foreground font-semibold">Card Title</h3>
  <p className="text-muted-foreground">Card description</p>
</div>
```

### Status Badges

```tsx
// Delivered
<span className="bg-success text-success-foreground px-2 py-1 rounded-full text-sm">
  Delivered
</span>

// Pending
<span className="bg-warning text-warning-foreground px-2 py-1 rounded-full text-sm">
  Pending
</span>

// Overdue
<span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-sm">
  Overdue
</span>
```

### Form Input

```tsx
<input 
  className="border border-input bg-white 
    focus:ring-2 focus:ring-ring focus:border-transparent
    rounded-lg px-3 py-2 outline-none"
  placeholder="Enter value..."
/>
```

### Sidebar

```tsx
<aside className="bg-sidebar-bg border-r border-sidebar-border 
  text-sidebar-fg w-64 h-screen">
  <nav>
    <a className="block px-4 py-2 hover:bg-sidebar-accent">
      Dashboard
    </a>
  </nav>
</aside>
```

## Theme-Specific Notes

### Ocean Flame (Default)
- **Vibe**: Fresh, trustworthy, energetic
- **Primary**: Blue-green (`#219ebc`)
- **Accent**: Orange (`#fb8500`)
- **Best for**: General purpose, approachable feel

### Midnight Ember
- **Vibe**: Sophisticated, premium, luxurious
- **Primary**: Prussian blue (`#14213d`)
- **Accent**: Warm orange (`#fca311`)
- **Best for**: Executive dashboards, premium positioning

### Teal Gold Luxe
- **Vibe**: Exclusive, rich, distinctive
- **Primary**: Pine teal (`#004643`)
- **Accent**: Metallic gold (`#d1ac00`)
- **Best for**: High-end manufacturing, luxury goods

### Warm Ivory
- **Vibe**: Friendly, warm, inviting
- **Primary**: Khaki beige (`#beb7a4`)
- **Accent**: Tangerine (`#ff7f11`)
- **Best for**: Artisanal, handcrafted, friendly brands

## Accessibility

All themes meet **WCAG AA** standards:
- Normal text: 4.5:1 contrast minimum
- Large text: 3:1 contrast minimum

Check contrast programmatically:

```tsx
import { isWCAGAA } from '@/lib/themes/color-palette-engine';

const passes = isWCAGAA('#ffffff', '#00090e'); // true
```

## Best Practices

1. **Always use semantic tokens** instead of raw colors
2. **Test all themes** when adding new components
3. **Maintain contrast** - don't place text directly on accent colors
4. **Use transitions** for hover states: `transition-colors`
5. **Respect the white background** - never change `bg-background`

## Migration from Old System

Replace hardcoded colors:

```tsx
// Before
<div className="bg-zinc-100 text-zinc-900">

// After
<div className="bg-muted text-foreground">
```

```tsx
// Before
<button className="bg-orange-500 text-white">

// After
<button className="bg-accent text-accent-foreground">
```
