/**
 * Kreasilog Color Palette Engine
 * 4 Premium Themes with Semantic Token Mapping
 * 
 * Constraints:
 * - Background: ALWAYS #FFFFFF (pure white)
 * - Light mode only
 * - WCAG AA minimum (4.5:1 for normal text)
 * - 100 = darkest, 900 = lightest (inverted from Tailwind default)
 * - Runtime theme switching via CSS variables
 */

// ============================================
// 1. RAW THEME DEFINITIONS (verbatim from spec)
// ============================================

export const themes = {
  'ocean-flame': {
    name: 'Ocean Flame',
    colors: {
      blue_green: { 
        DEFAULT: '#219ebc', 
        100: '#071f25', 200: '#0d3e4b', 300: '#145d70', 400: '#1a7d95', 
        500: '#219ebc', 600: '#39bcdc', 700: '#6bcce5', 800: '#9cddee', 900: '#ceeef6' 
      },
      deep_space_blue: { 
        DEFAULT: '#023047', 
        100: '#00090e', 200: '#01131c', 300: '#011c2a', 400: '#012638', 
        500: '#023047', 600: '#04699b', 700: '#06a3f1', 800: '#54c3fb', 900: '#a9e1fd' 
      },
      amber_flame: { 
        DEFAULT: '#ffb703', 
        100: '#342500', 200: '#684b00', 300: '#9c7000', 400: '#d09500', 
        500: '#ffb703', 600: '#ffc637', 700: '#ffd569', 800: '#ffe39b', 900: '#fff1cd' 
      },
      princeton_orange: { 
        DEFAULT: '#fb8500', 
        100: '#321b00', 200: '#643500', 300: '#965000', 400: '#c86b00', 
        500: '#fb8500', 600: '#ff9e2f', 700: '#ffb663', 800: '#ffce97', 900: '#ffe7cb' 
      }
    }
  },

  'midnight-ember': {
    name: 'Midnight Ember',
    colors: {
      black: { 
        DEFAULT: '#000000', 
        100: '#000000', 200: '#000000', 300: '#000000', 400: '#000000', 
        500: '#000000', 600: '#333333', 700: '#666666', 800: '#999999', 900: '#cccccc' 
      },
      prussian_blue: { 
        DEFAULT: '#14213d', 
        100: '#04070c', 200: '#080d19', 300: '#0c1425', 400: '#101b31', 
        500: '#14213d', 600: '#29447e', 700: '#3e67bf', 800: '#7e99d5', 900: '#beccea' 
      },
      orange: { 
        DEFAULT: '#fca311', 
        100: '#362101', 200: '#6b4201', 300: '#a16402', 400: '#d68502', 
        500: '#fca311', 600: '#fdb541', 700: '#fec871', 800: '#fedaa0', 900: '#ffedd0' 
      },
      alabaster_grey: { 
        DEFAULT: '#e5e5e5', 
        100: '#2e2e2e', 200: '#5c5c5c', 300: '#8a8a8a', 400: '#b8b8b8', 
        500: '#e5e5e5', 600: '#ebebeb', 700: '#f0f0f0', 800: '#f5f5f5', 900: '#fafafa' 
      }
    }
  },

  'teal-gold-luxe': {
    name: 'Teal Gold Luxe',
    colors: {
      ink_black: { 
        DEFAULT: '#0c1618', 
        100: '#020405', 200: '#050909', 300: '#070d0e', 400: '#0a1113', 
        500: '#0c1618', 600: '#2c5057', 700: '#4c8a96', 800: '#81b5bf', 900: '#c0dadf' 
      },
      pine_teal: { 
        DEFAULT: '#004643', 
        100: '#000e0e', 200: '#001d1b', 300: '#002b29', 400: '#003936', 
        500: '#004643', 600: '#009f97', 700: '#00f7ea', 800: '#50fff6', 900: '#a7fffb' 
      },
      cornsilk: { 
        DEFAULT: '#faf4d3', 
        100: '#534809', 200: '#a58f12', 300: '#e8cb2c', 400: '#f1e07e', 
        500: '#faf4d3', 600: '#fbf6da', 700: '#fcf8e3', 800: '#fdfbed', 900: '#fefdf6' 
      },
      metallic_gold: { 
        DEFAULT: '#d1ac00', 
        100: '#2a2200', 200: '#544400', 300: '#7d6600', 400: '#a78900', 
        500: '#d1ac00', 600: '#ffd30e', 700: '#ffde4a', 800: '#ffe987', 900: '#fff4c3' 
      }
    }
  },

  'warm-ivory': {
    name: 'Warm Ivory',
    colors: {
      black: { 
        DEFAULT: '#000000', 
        100: '#000000', 200: '#000000', 300: '#000000', 400: '#000000', 
        500: '#000000', 600: '#333333', 700: '#666666', 800: '#999999', 900: '#cccccc' 
      },
      porcelain: { 
        DEFAULT: '#fffffc', 
        100: '#656500', 200: '#caca00', 300: '#ffff30', 400: '#ffff95', 
        500: '#fffffc', 600: '#fffffb', 700: '#fffffc', 800: '#fffffd', 900: '#fffffe' 
      },
      khaki_beige: { 
        DEFAULT: '#beb7a4', 
        100: '#29261d', 200: '#524c3a', 300: '#7c7258', 400: '#a09679', 
        500: '#beb7a4', 600: '#cbc5b5', 700: '#d8d3c8', 800: '#e5e2da', 900: '#f2f0ed' 
      },
      vivid_tangerine: { 
        DEFAULT: '#ff7f11', 
        100: '#361900', 200: '#6c3200', 300: '#a24c00', 400: '#d86500', 
        500: '#ff7f11', 600: '#ff993f', 700: '#ffb26f', 800: '#ffcc9f', 900: '#ffe5cf' 
      }
    }
  }
} as const;

export type ThemeKey = keyof typeof themes;

// ============================================
// 2. SEMANTIC TOKEN MAPPING
// ============================================

export interface SemanticTokens {
  // Background (always white per spec)
  background: string;
  foreground: string;
  
  // Primary brand
  primary: string;
  'primary-foreground': string;
  'primary-hover': string;
  'primary-active': string;
  
  // Secondary
  secondary: string;
  'secondary-foreground': string;
  
  // Accent (CTAs, highlights)
  accent: string;
  'accent-foreground': string;
  'accent-hover': string;
  
  // Muted (subtle backgrounds)
  muted: string;
  'muted-foreground': string;
  
  // Cards (still white, but with border)
  card: string;
  'card-foreground': string;
  
  // Popovers
  popover: string;
  'popover-foreground': string;
  
  // Borders
  border: string;
  'border-hover': string;
  input: string;
  ring: string;
  
  // Status colors
  destructive: string;
  'destructive-foreground': string;
  success: string;
  'success-foreground': string;
  warning: string;
  'warning-foreground': string;
  info: string;
  'info-foreground': string;
  
  // Sidebar
  'sidebar-bg': string;
  'sidebar-fg': string;
  'sidebar-accent': string;
  'sidebar-border': string;
  
  // Charts
  'chart-1': string;
  'chart-2': string;
  'chart-3': string;
  'chart-4': string;
}

export const semanticMappings: Record<ThemeKey, SemanticTokens> = {
  'ocean-flame': {
    // White background per spec
    background: '#ffffff',
    // Darkest text for readability on white (deep_space_blue-100)
    foreground: '#00090e',
    
    // Primary: Vibrant blue-green (hero brand color)
    primary: '#219ebc',
    'primary-foreground': '#ffffff',
    'primary-hover': '#1a7d95', // 400 shade
    'primary-active': '#145d70', // 300 shade
    
    // Secondary: Deep space blue (trustworthy, professional)
    secondary: '#023047',
    'secondary-foreground': '#ffffff',
    
    // Accent: Princeton orange (warm, action-oriented)
    accent: '#fb8500',
    'accent-foreground': '#ffffff',
    'accent-hover': '#c86b00',
    
    // Muted: Very light blue-grey
    muted: '#ceeef6', // blue_green-900
    'muted-foreground': '#145d70', // blue_green-300
    
    // Cards: White with subtle border
    card: '#ffffff',
    'card-foreground': '#00090e',
    
    popover: '#ffffff',
    'popover-foreground': '#00090e',
    
    // Borders: Light blue-grey
    border: '#a9e1fd', // deep_space_blue-900
    'border-hover': '#54c3fb',
    input: '#a9e1fd',
    ring: '#219ebc',
    
    // Status
    destructive: '#dc2626', // Safe red that works on white
    'destructive-foreground': '#ffffff',
    success: '#219ebc', // Primary blue-green
    'success-foreground': '#ffffff',
    warning: '#ffb703', // Amber flame
    'warning-foreground': '#342500',
    info: '#023047', // Deep space blue
    'info-foreground': '#ffffff',
    
    // Sidebar
    'sidebar-bg': '#ffffff',
    'sidebar-fg': '#023047',
    'sidebar-accent': '#ceeef6',
    'sidebar-border': '#a9e1fd',
    
    // Charts
    'chart-1': '#219ebc',
    'chart-2': '#fb8500',
    'chart-3': '#ffb703',
    'chart-4': '#023047',
  },

  'midnight-ember': {
    background: '#ffffff',
    // Darkest from prussian_blue for elegance
    foreground: '#04070c',
    
    // Primary: Prussian blue (sophisticated, premium)
    primary: '#14213d',
    'primary-foreground': '#ffffff',
    'primary-hover': '#101b31',
    'primary-active': '#0c1425',
    
    // Secondary: Pure black for luxury feel
    secondary: '#000000',
    'secondary-foreground': '#ffffff',
    
    // Accent: Warm orange (ember glow)
    accent: '#fca311',
    'accent-foreground': '#362101',
    'accent-hover': '#d68502',
    
    // Muted: Very light grey
    muted: '#fafafa', // alabaster_grey-900
    'muted-foreground': '#5c5c5c', // alabaster_grey-200
    
    card: '#ffffff',
    'card-foreground': '#04070c',
    
    popover: '#ffffff',
    'popover-foreground': '#04070c',
    
    // Borders: Soft grey
    border: '#e5e5e5',
    'border-hover': '#b8b8b8',
    input: '#e5e5e5',
    ring: '#fca311', // Orange ring for focus
    
    // Status
    destructive: '#dc2626',
    'destructive-foreground': '#ffffff',
    success: '#14213d',
    'success-foreground': '#ffffff',
    warning: '#fca311',
    'warning-foreground': '#362101',
    info: '#3e67bf', // prussian_blue-700
    'info-foreground': '#ffffff',
    
    // Sidebar
    'sidebar-bg': '#ffffff',
    'sidebar-fg': '#14213d',
    'sidebar-accent': '#fafafa',
    'sidebar-border': '#e5e5e5',
    
    // Charts
    'chart-1': '#14213d',
    'chart-2': '#fca311',
    'chart-3': '#3e67bf',
    'chart-4': '#000000',
  },

  'teal-gold-luxe': {
    background: '#ffffff',
    // Ink black for maximum luxury
    foreground: '#020405',
    
    // Primary: Pine teal (rich, distinctive)
    primary: '#004643',
    'primary-foreground': '#ffffff',
    'primary-hover': '#003936',
    'primary-active': '#002b29',
    
    // Secondary: Ink black (premium)
    secondary: '#0c1618',
    'secondary-foreground': '#ffffff',
    
    // Accent: Metallic gold (luxury highlight)
    accent: '#d1ac00',
    'accent-foreground': '#2a2200',
    'accent-hover': '#a78900',
    
    // Muted: Cornsilk (warm, subtle)
    muted: '#fefdf6', // cornsilk-900
    'muted-foreground': '#534809', // cornsilk-100
    
    card: '#ffffff',
    'card-foreground': '#020405',
    
    popover: '#ffffff',
    'popover-foreground': '#020405',
    
    // Borders: Light gold tint
    border: '#fdfbed', // cornsilk-800
    'border-hover': '#f1e07e',
    input: '#fdfbed',
    ring: '#d1ac00',
    
    // Status
    destructive: '#991b1b',
    'destructive-foreground': '#ffffff',
    success: '#004643',
    'success-foreground': '#ffffff',
    warning: '#d1ac00',
    'warning-foreground': '#2a2200',
    info: '#009f97', // pine_teal-600
    'info-foreground': '#ffffff',
    
    // Sidebar
    'sidebar-bg': '#ffffff',
    'sidebar-fg': '#004643',
    'sidebar-accent': '#fefdf6',
    'sidebar-border': '#fdfbed',
    
    // Charts
    'chart-1': '#004643',
    'chart-2': '#d1ac00',
    'chart-3': '#009f97',
    'chart-4': '#0c1618',
  },

  'warm-ivory': {
    background: '#ffffff',
    // Black for clarity
    foreground: '#000000',
    
    // Primary: Khaki beige (warm, inviting)
    primary: '#beb7a4',
    'primary-foreground': '#29261d',
    'primary-hover': '#a09679',
    'primary-active': '#7c7258',
    
    // Secondary: Black for contrast
    secondary: '#000000',
    'secondary-foreground': '#ffffff',
    
    // Accent: Vivid tangerine (energetic)
    accent: '#ff7f11',
    'accent-foreground': '#ffffff',
    'accent-hover': '#d86500',
    
    // Muted: Light ivory
    muted: '#f2f0ed', // khaki_beige-900
    'muted-foreground': '#524c3a', // khaki_beige-200
    
    card: '#ffffff',
    'card-foreground': '#000000',
    
    popover: '#ffffff',
    'popover-foreground': '#000000',
    
    // Borders: Warm grey
    border: '#e5e2da',
    'border-hover': '#d8d3c8',
    input: '#e5e2da',
    ring: '#ff7f11',
    
    // Status
    destructive: '#dc2626',
    'destructive-foreground': '#ffffff',
    success: '#524c3a',
    'success-foreground': '#ffffff',
    warning: '#ff7f11',
    'warning-foreground': '#361900',
    info: '#7c7258',
    'info-foreground': '#ffffff',
    
    // Sidebar
    'sidebar-bg': '#ffffff',
    'sidebar-fg': '#29261d',
    'sidebar-accent': '#f2f0ed',
    'sidebar-border': '#e5e2da',
    
    // Charts
    'chart-1': '#beb7a4',
    'chart-2': '#ff7f11',
    'chart-3': '#29261d',
    'chart-4': '#000000',
  }
};

// ============================================
// 3. CSS VARIABLE GENERATOR
// ============================================

export function generateCSSVariables(themeKey: ThemeKey): string {
  const theme = themes[themeKey];
  const semantic = semanticMappings[themeKey];
  
  let css = `/* ${theme.name} Theme */\n`;
  css += `:root[data-theme="${themeKey}"] {\n`;
  
  // Add semantic tokens
  Object.entries(semantic).forEach(([key, value]) => {
    css += `  --${key}: ${value};\n`;
  });
  
  // Add raw color scales for direct access
  Object.entries(theme.colors).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      const varName = shade === 'DEFAULT' 
        ? `--${colorName}` 
        : `--${colorName}-${shade}`;
      css += `  ${varName}: ${value};\n`;
    });
  });
  
  css += '}\n';
  return css;
}

// Generate all theme CSS
export function generateAllCSS(): string {
  return (Object.keys(themes) as ThemeKey[])
    .map(generateCSSVariables)
    .join('\n');
}

// ============================================
// 4. TAILWIND CONFIG EXTENSION
// ============================================

export const tailwindThemeExtension = {
  colors: {
    // Semantic tokens
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    primary: {
      DEFAULT: 'var(--primary)',
      foreground: 'var(--primary-foreground)',
      hover: 'var(--primary-hover)',
      active: 'var(--primary-active)',
    },
    secondary: {
      DEFAULT: 'var(--secondary)',
      foreground: 'var(--secondary-foreground)',
    },
    accent: {
      DEFAULT: 'var(--accent)',
      foreground: 'var(--accent-foreground)',
      hover: 'var(--accent-hover)',
    },
    muted: {
      DEFAULT: 'var(--muted)',
      foreground: 'var(--muted-foreground)',
    },
    card: {
      DEFAULT: 'var(--card)',
      foreground: 'var(--card-foreground)',
    },
    popover: {
      DEFAULT: 'var(--popover)',
      foreground: 'var(--popover-foreground)',
    },
    border: 'var(--border)',
    input: 'var(--input)',
    ring: 'var(--ring)',
    destructive: {
      DEFAULT: 'var(--destructive)',
      foreground: 'var(--destructive-foreground)',
    },
    success: {
      DEFAULT: 'var(--success)',
      foreground: 'var(--success-foreground)',
    },
    warning: {
      DEFAULT: 'var(--warning)',
      foreground: 'var(--warning-foreground)',
    },
    info: {
      DEFAULT: 'var(--info)',
      foreground: 'var(--info-foreground)',
    },
    sidebar: {
      bg: 'var(--sidebar-bg)',
      fg: 'var(--sidebar-fg)',
      accent: 'var(--sidebar-accent)',
      border: 'var(--sidebar-border)',
    },
    chart: {
      1: 'var(--chart-1)',
      2: 'var(--chart-2)',
      3: 'var(--chart-3)',
      4: 'var(--chart-4)',
    },
    // Raw color scales (for direct access)
    blue_green: {
      DEFAULT: 'var(--blue_green)',
      100: 'var(--blue_green-100)', 200: 'var(--blue_green-200)',
      300: 'var(--blue_green-300)', 400: 'var(--blue_green-400)',
      500: 'var(--blue_green-500)', 600: 'var(--blue_green-600)',
      700: 'var(--blue_green-700)', 800: 'var(--blue_green-800)',
      900: 'var(--blue_green-900)',
    },
    deep_space_blue: {
      DEFAULT: 'var(--deep_space_blue)',
      100: 'var(--deep_space_blue-100)', 200: 'var(--deep_space_blue-200)',
      300: 'var(--deep_space_blue-300)', 400: 'var(--deep_space_blue-400)',
      500: 'var(--deep_space_blue-500)', 600: 'var(--deep_space_blue-600)',
      700: 'var(--deep_space_blue-700)', 800: 'var(--deep_space_blue-800)',
      900: 'var(--deep_space_blue-900)',
    },
    amber_flame: {
      DEFAULT: 'var(--amber_flame)',
      100: 'var(--amber_flame-100)', 200: 'var(--amber_flame-200)',
      300: 'var(--amber_flame-300)', 400: 'var(--amber_flame-400)',
      500: 'var(--amber_flame-500)', 600: 'var(--amber_flame-600)',
      700: 'var(--amber_flame-700)', 800: 'var(--amber_flame-800)',
      900: 'var(--amber_flame-900)',
    },
    princeton_orange: {
      DEFAULT: 'var(--princeton_orange)',
      100: 'var(--princeton_orange-100)', 200: 'var(--princeton_orange-200)',
      300: 'var(--princeton_orange-300)', 400: 'var(--princeton_orange-400)',
      500: 'var(--princeton_orange-500)', 600: 'var(--princeton_orange-600)',
      700: 'var(--princeton_orange-700)', 800: 'var(--princeton_orange-800)',
      900: 'var(--princeton_orange-900)',
    },
    // Midnight Ember colors
    prussian_blue: {
      DEFAULT: 'var(--prussian_blue)',
      100: 'var(--prussian_blue-100)', 200: 'var(--prussian_blue-200)',
      300: 'var(--prussian_blue-300)', 400: 'var(--prussian_blue-400)',
      500: 'var(--prussian_blue-500)', 600: 'var(--prussian_blue-600)',
      700: 'var(--prussian_blue-700)', 800: 'var(--prussian_blue-800)',
      900: 'var(--prussian_blue-900)',
    },
    alabaster_grey: {
      DEFAULT: 'var(--alabaster_grey)',
      100: 'var(--alabaster_grey-100)', 200: 'var(--alabaster_grey-200)',
      300: 'var(--alabaster_grey-300)', 400: 'var(--alabaster_grey-400)',
      500: 'var(--alabaster_grey-500)', 600: 'var(--alabaster_grey-600)',
      700: 'var(--alabaster_grey-700)', 800: 'var(--alabaster_grey-800)',
      900: 'var(--alabaster_grey-900)',
    },
    // Teal Gold Luxe colors
    ink_black: {
      DEFAULT: 'var(--ink_black)',
      100: 'var(--ink_black-100)', 200: 'var(--ink_black-200)',
      300: 'var(--ink_black-300)', 400: 'var(--ink_black-400)',
      500: 'var(--ink_black-500)', 600: 'var(--ink_black-600)',
      700: 'var(--ink_black-700)', 800: 'var(--ink_black-800)',
      900: 'var(--ink_black-900)',
    },
    pine_teal: {
      DEFAULT: 'var(--pine_teal)',
      100: 'var(--pine_teal-100)', 200: 'var(--pine_teal-200)',
      300: 'var(--pine_teal-300)', 400: 'var(--pine_teal-400)',
      500: 'var(--pine_teal-500)', 600: 'var(--pine_teal-600)',
      700: 'var(--pine_teal-700)', 800: 'var(--pine_teal-800)',
      900: 'var(--pine_teal-900)',
    },
    cornsilk: {
      DEFAULT: 'var(--cornsilk)',
      100: 'var(--cornsilk-100)', 200: 'var(--cornsilk-200)',
      300: 'var(--cornsilk-300)', 400: 'var(--cornsilk-400)',
      500: 'var(--cornsilk-500)', 600: 'var(--cornsilk-600)',
      700: 'var(--cornsilk-700)', 800: 'var(--cornsilk-800)',
      900: 'var(--cornsilk-900)',
    },
    metallic_gold: {
      DEFAULT: 'var(--metallic_gold)',
      100: 'var(--metallic_gold-100)', 200: 'var(--metallic_gold-200)',
      300: 'var(--metallic_gold-300)', 400: 'var(--metallic_gold-400)',
      500: 'var(--metallic_gold-500)', 600: 'var(--metallic_gold-600)',
      700: 'var(--metallic_gold-700)', 800: 'var(--metallic_gold-800)',
      900: 'var(--metallic_gold-900)',
    },
    // Warm Ivory colors
    porcelain: {
      DEFAULT: 'var(--porcelain)',
      100: 'var(--porcelain-100)', 200: 'var(--porcelain-200)',
      300: 'var(--porcelain-300)', 400: 'var(--porcelain-400)',
      500: 'var(--porcelain-500)', 600: 'var(--porcelain-600)',
      700: 'var(--porcelain-700)', 800: 'var(--porcelain-800)',
      900: 'var(--porcelain-900)',
    },
    khaki_beige: {
      DEFAULT: 'var(--khaki_beige)',
      100: 'var(--khaki_beige-100)', 200: 'var(--khaki_beige-200)',
      300: 'var(--khaki_beige-300)', 400: 'var(--khaki_beige-400)',
      500: 'var(--khaki_beige-500)', 600: 'var(--khaki_beige-600)',
      700: 'var(--khaki_beige-700)', 800: 'var(--khaki_beige-800)',
      900: 'var(--khaki_beige-900)',
    },
    vivid_tangerine: {
      DEFAULT: 'var(--vivid_tangerine)',
      100: 'var(--vivid_tangerine-100)', 200: 'var(--vivid_tangerine-200)',
      300: 'var(--vivid_tangerine-300)', 400: 'var(--vivid_tangerine-400)',
      500: 'var(--vivid_tangerine-500)', 600: 'var(--vivid_tangerine-600)',
      700: 'var(--vivid_tangerine-700)', 800: 'var(--vivid_tangerine-800)',
      900: 'var(--vivid_tangerine-900)',
    },
  }
};

// ============================================
// 5. CONTRAST CHECKER (WCAG AA)
// ============================================

export function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => {
    const v = parseInt(x, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) || [0, 0, 0];
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function isWCAGAA(color1: string, color2: string, largeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

// ============================================
// 6. DEFAULT THEME
// ============================================

export const DEFAULT_THEME: ThemeKey = 'ocean-flame';
