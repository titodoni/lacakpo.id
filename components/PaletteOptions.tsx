'use client';

import { useTheme, type ThemeKey } from '@/lib/themes/ThemeProvider';
import { Check, Palette } from 'lucide-react';
import { useState } from 'react';

interface ThemeOption {
  key: ThemeKey;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    preview: string[];
  };
}

const themeOptions: ThemeOption[] = [
  {
    key: 'ocean-flame',
    name: 'Ocean Flame',
    description: 'Fresh, trustworthy, energetic',
    colors: {
      primary: '#219ebc',
      accent: '#fb8500',
      preview: ['#219ebc', '#023047', '#fb8500', '#ffb703'],
    },
  },
  {
    key: 'midnight-ember',
    name: 'Midnight Ember',
    description: 'Sophisticated, premium, luxurious',
    colors: {
      primary: '#14213d',
      accent: '#fca311',
      preview: ['#14213d', '#000000', '#fca311', '#e5e5e5'],
    },
  },
  {
    key: 'teal-gold-luxe',
    name: 'Teal Gold Luxe',
    description: 'Exclusive, rich, distinctive',
    colors: {
      primary: '#004643',
      accent: '#d1ac00',
      preview: ['#004643', '#0c1618', '#d1ac00', '#faf4d3'],
    },
  },
  {
    key: 'warm-ivory',
    name: 'Warm Ivory',
    description: 'Friendly, warm, inviting',
    colors: {
      primary: '#beb7a4',
      accent: '#ff7f11',
      preview: ['#beb7a4', '#000000', '#ff7f11', '#f2f0ed'],
    },
  },
];

export function PaletteOptions({ 
  variant = 'grid',
  showLabel = true,
}: { 
  variant?: 'grid' | 'list' | 'dropdown';
  showLabel?: boolean;
}) {
  const { theme: currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const activeTheme = themeOptions.find((t) => t.key === currentTheme);

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        {showLabel && (
          <label className="block text-sm font-medium text-foreground mb-2">
            <Palette className="w-4 h-4 inline mr-2" />
            Color Theme
          </label>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-card border border-border 
            hover:border-border-hover rounded-xl transition-colors text-left"
        >
          <div 
            className="w-8 h-8 rounded-lg shadow-sm"
            style={{ 
              background: `linear-gradient(135deg, ${activeTheme?.colors.primary} 50%, ${activeTheme?.colors.accent} 50%)` 
            }}
          />
          <div className="flex-1">
            <p className="font-medium text-foreground">{activeTheme?.name}</p>
            <p className="text-xs text-muted-foreground">{activeTheme?.description}</p>
          </div>
          <svg 
            className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {themeOptions.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => {
                    setTheme(theme.key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left
                    ${currentTheme === theme.key ? 'bg-muted/50' : ''}`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary} 50%, ${theme.colors.accent} 50%)` 
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{theme.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{theme.description}</p>
                  </div>
                  {currentTheme === theme.key && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {showLabel && (
          <label className="block text-sm font-medium text-foreground">
            <Palette className="w-4 h-4 inline mr-2" />
            Color Theme
          </label>
        )}
        {themeOptions.map((theme) => (
          <button
            key={theme.key}
            onClick={() => setTheme(theme.key)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
              ${currentTheme === theme.key 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border hover:border-border-hover hover:bg-muted'}`}
          >
            <div 
              className="w-12 h-12 rounded-xl shadow-sm flex-shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary} 50%, ${theme.colors.accent} 50%)` 
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{theme.name}</p>
                {currentTheme === theme.key && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{theme.description}</p>
            </div>
            <div className="flex gap-1">
              {theme.colors.preview.map((color, i) => (
                <div 
                  key={i}
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className="space-y-3">
      {showLabel && (
        <label className="block text-sm font-medium text-foreground">
          <Palette className="w-4 h-4 inline mr-2" />
          Color Theme
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        {themeOptions.map((theme) => (
          <button
            key={theme.key}
            onClick={() => setTheme(theme.key)}
            className={`relative p-4 rounded-xl border transition-all text-left
              ${currentTheme === theme.key 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border hover:border-border-hover hover:bg-muted'}`}
          >
            {currentTheme === theme.key && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
            
            <div 
              className="w-full h-16 rounded-lg mb-3 shadow-sm"
              style={{ 
                background: `linear-gradient(135deg, ${theme.colors.primary} 50%, ${theme.colors.accent} 50%)` 
              }}
            />
            
            <p className="font-semibold text-foreground text-sm">{theme.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
            
            <div className="flex gap-1 mt-2">
              {theme.colors.preview.slice(0, 3).map((color, i) => (
                <div 
                  key={i}
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Compact inline version for headers/navbars
export function PaletteSwitcherCompact() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const activeTheme = themeOptions.find((t) => t.key === currentTheme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        title="Change theme"
      >
        <div 
          className="w-5 h-5 rounded-full border border-border shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, ${activeTheme?.colors.primary} 50%, ${activeTheme?.colors.accent} 50%)` 
          }}
        />
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {activeTheme?.name}
        </span>
        <svg 
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 z-50 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Theme
              </p>
              {themeOptions.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => {
                    setTheme(theme.key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left
                    ${currentTheme === theme.key ? 'bg-muted' : ''}`}
                >
                  <div 
                    className="w-6 h-6 rounded-full border border-border flex-shrink-0"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary} 50%, ${theme.colors.accent} 50%)` 
                    }}
                  />
                  <span className="text-sm text-foreground flex-1">{theme.name}</span>
                  {currentTheme === theme.key && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
