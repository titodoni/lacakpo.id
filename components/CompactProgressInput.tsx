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
    <div className="bg-zinc-50 rounded-lg p-3 mt-2">
      {/* Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          className="flex-1 h-2 bg-zinc-300 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #18181b ${value}%, #d4d4d8 ${value}%)` }}
        />
        <span className={cn('text-lg font-bold font-mono w-12 text-right', value === 100 ? 'text-emerald-600' : 'text-zinc-900')}>
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
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
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
          className="flex-1 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() => onUpdate(value)}
          disabled={value === currentValue}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-lg transition-colors',
            value === currentValue
              ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          )}
        >
          Update
        </button>
      </div>
    </div>
  );
}
