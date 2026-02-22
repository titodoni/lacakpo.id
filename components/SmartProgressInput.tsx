'use client';

import { useState, useCallback } from 'react';
import { cn, getProgressColor } from '@/lib/utils';

interface SmartProgressInputProps {
  trackId: string;
  department: string;
  currentValue: number;
  onClose: () => void;
  onUpdate: () => void;
}

export function SmartProgressInput({
  trackId,
  department,
  currentValue,
  onClose,
  onUpdate,
}: SmartProgressInputProps) {
  const [value, setValue] = useState(currentValue);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSlider, setShowSlider] = useState(false);

  const quickSets = [0, 25, 50, 75, 100];
  const progressColor = getProgressColor(value);

  const departmentLabels: Record<string, string> = {
    drafting: 'Drafting',
    purchasing: 'Purchasing',
    production: 'Production',
    qc: 'QC',
  };

  const adjust = (delta: number) => {
    const newVal = Math.max(0, Math.min(100, value + delta));
    setValue(newVal);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(e.target.value));
  };

  const handleSubmit = async () => {
    if (value === currentValue && !note) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/tracks/${trackId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newProgress: value, userNote: note }),
      });

      if (res.ok) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate color based on value for slider
  const getSliderBackground = () => {
    if (value === 100) return 'bg-emerald-500';
    if (value >= 75) return 'bg-zinc-600';
    if (value >= 50) return 'bg-zinc-500';
    if (value >= 25) return 'bg-zinc-400';
    return 'bg-zinc-300';
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-zinc-900 shadow-lg">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">
        Update {departmentLabels[department]}
      </h3>

      {/* Large Display */}
      <div className="text-center mb-4">
        <span
          className={cn(
            'text-5xl font-bold font-mono transition-colors',
            value === 100 ? 'text-emerald-600' : 'text-zinc-900'
          )}
        >
          {value}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-zinc-100 rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-300', progressColor)}
          style={{ width: `${value}%` }}
        />
      </div>

      {/* Slider (Toggleable) */}
      <div className="mb-4">
        <button
          onClick={() => setShowSlider(!showSlider)}
          className="text-xs text-zinc-500 hover:text-zinc-900 mb-2 flex items-center gap-1"
        >
          {showSlider ? '▼ Sembunyikan Slider' : '▶ Tampilkan Slider'}
        </button>
        
        {showSlider && (
          <div className="px-1">
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={handleSliderChange}
              disabled={isLoading}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              style={{
                background: `linear-gradient(to right, ${
                  value === 100 ? '#10b981' :
                  value >= 75 ? '#52525b' :
                  value >= 50 ? '#71717a' :
                  value >= 25 ? '#a1a1aa' : '#d4d4d8'
                } ${value}%, #e4e4e7 ${value}%)`
              }}
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Set */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {quickSets.map((q) => (
          <button
            key={q}
            onClick={() => setValue(q)}
            disabled={isLoading}
            className={cn(
              'h-12 rounded-lg font-semibold text-sm transition-all active:scale-95',
              value === q
                ? 'bg-zinc-900 text-white shadow-md'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            )}
          >
            {q}%
          </button>
        ))}
      </div>

      {/* Fine Adjust */}
      <div className="flex justify-between items-center gap-3 mb-4">
        <button
          onClick={() => adjust(-5)}
          disabled={isLoading || value === 0}
          className="flex-1 h-12 rounded-lg border-2 border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 active:scale-95 transition-all disabled:opacity-50"
        >
          -5%
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-zinc-400">Penyesuaian Halus</span>
        </div>
        <button
          onClick={() => adjust(5)}
          disabled={isLoading || value === 100}
          className="flex-1 h-12 rounded-lg border-2 border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 active:scale-95 transition-all disabled:opacity-50"
        >
          +5%
        </button>
      </div>

      {/* Note Input */}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Tambah catatan (opsional)..."
        disabled={isLoading}
        className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-sm mb-3 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 h-12 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 active:scale-95 transition-all"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            'flex-1 h-12 rounded-lg font-medium text-white transition-all active:scale-95',
            value === currentValue && !note
              ? 'bg-zinc-400 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-800'
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Menyimpan...
            </span>
          ) : (
            'Update Progress'
          )}
        </button>
      </div>
    </div>
  );
}
