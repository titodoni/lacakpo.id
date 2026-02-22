'use client';

import { useState } from 'react';
import { cn, getProgressColor } from '@/lib/utils';

interface TrackUpdateModalProps {
  trackId: string;
  department: string;
  itemName: string;
  currentValue: number;
  onClose: () => void;
  onUpdate: () => void;
}

export function TrackUpdateModal({
  trackId,
  department,
  itemName,
  currentValue,
  onClose,
  onUpdate,
}: TrackUpdateModalProps) {
  const [value, setValue] = useState(currentValue);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickSets = [0, 25, 50, 75, 100];
  const progressColor = getProgressColor(value);

  const departmentLabels: Record<string, string> = {
    drafting: 'Drafting',
    purchasing: 'Purchasing',
    production: 'Production',
    qc: 'QC',
  };

  const adjust = (delta: number) => {
    setValue(Math.max(0, Math.min(100, value + delta)));
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
      console.error('Failed to update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">
            Update Progress
          </p>
          <h2 className="text-lg font-bold text-zinc-900">
            {departmentLabels[department]}
          </h2>
          <p className="text-sm text-zinc-500 mt-1 truncate">{itemName}</p>
        </div>

        {/* Large Display */}
        <div className="text-center mb-6">
          <span
            className={cn(
              'text-6xl font-bold font-mono',
              value === 100 ? 'text-emerald-600' : 'text-zinc-900'
            )}
          >
            {value}%
          </span>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value))}
            disabled={isLoading}
            className="w-full h-3 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #18181b ${value}%, #e4e4e7 ${value}%)`
            }}
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-4 bg-zinc-100 rounded-full overflow-hidden mb-6">
          <div
            className={cn('h-full rounded-full transition-all duration-300', progressColor)}
            style={{ width: `${value}%` }}
          />
        </div>

        {/* Quick Set */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {quickSets.map((q) => (
            <button
              key={q}
              onClick={() => setValue(q)}
              disabled={isLoading}
              className={cn(
                'h-11 rounded-lg font-semibold text-sm transition-all',
                value === q
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              )}
            >
              {q}%
            </button>
          ))}
        </div>

        {/* Fine Adjust */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => adjust(-5)}
            disabled={isLoading}
            className="flex-1 h-11 rounded-lg border-2 border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            -5%
          </button>
          <button
            onClick={() => adjust(5)}
            disabled={isLoading}
            className="flex-1 h-11 rounded-lg border-2 border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            +5%
          </button>
        </div>

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add note (optional)..."
          disabled={isLoading}
          className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-sm mb-6 focus:border-zinc-900 focus:outline-none"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-12 bg-zinc-900 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
