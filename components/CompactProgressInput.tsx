'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CompactProgressInputProps {
  currentValue: number;
  onUpdate: (value: number) => void;
  onCancel: () => void;
}

export function CompactProgressInput({ currentValue, onUpdate, onCancel }: CompactProgressInputProps) {
  const [value, setValue] = useState(currentValue);

  return (
    <div className="bg-muted rounded-lg p-3 mt-2">
      {/* Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          className="flex-1 h-2 bg-muted-foreground/40 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #18181b ${value}%, #d4d4d8 ${value}%)` }}
        />
        <span className={cn('text-lg font-bold font-mono w-12 text-right', value === 100 ? 'text-emerald-600' : 'text-foreground')}>
          {value}%
        </span>
      </div>

      {/* Quick Set Buttons */}
      <div className="flex gap-1 mt-3">
        {[0, 25, 50, 75, 100].map((q) => (
          <button
            key={q}
            onClick={() => setValue(q)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold rounded-lg transition-colors',
              value === q
                ? 'bg-foreground text-white'
                : 'bg-white text-foreground border border-border hover:bg-muted'
            )}
          >
            {q}%
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-white border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() => onUpdate(value)}
          disabled={value === currentValue}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-lg transition-colors',
            value === currentValue
              ? 'bg-muted-foreground/40 text-muted-foreground cursor-not-allowed'
              : 'bg-foreground text-white hover:bg-foreground/90'
          )}
        >
          Update
        </button>
      </div>
    </div>
  );
}
