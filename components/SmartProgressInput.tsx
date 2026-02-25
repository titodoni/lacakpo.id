'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SmartProgressInputProps {
  trackId: string;
  department: string;
  currentValue: number;
  onClose: () => void;
  onUpdate: () => void;
}

export function SmartProgressInput({ trackId, currentValue, onClose, onUpdate }: SmartProgressInputProps) {
  const [value, setValue] = useState(currentValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (value === currentValue) { onClose(); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tracks/${trackId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newProgress: value }),
      });
      if (res.ok) { onUpdate(); onClose(); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="bg-zinc-50 rounded-lg p-3 mt-2">
      <div className="flex items-center gap-3">
        <input type="range" min="0" max="100" step="5" value={value} onChange={(e) => setValue(parseInt(e.target.value))} disabled={isLoading}
          className="flex-1 h-2 bg-zinc-300 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #18181b ${value}%, #d4d4d8 ${value}%)` }}
        />
        <span className={cn('text-2xl font-bold font-mono w-14 text-right', value === 100 ? 'text-emerald-600' : 'text-zinc-900')}>{value}%</span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1">
          {[0, 25, 50, 75, 100].map((q) => (
            <button key={q} onClick={() => setValue(q)} disabled={isLoading}
              className={cn('px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors', value === q ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200')}>
              {q}%
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors">Batal</button>
          <button onClick={handleSubmit} disabled={isLoading || value === currentValue}
            className={cn('px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors', value === currentValue ? 'bg-zinc-300 text-zinc-500' : 'bg-zinc-900 text-white hover:bg-zinc-800')}>
            {isLoading ? '...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
