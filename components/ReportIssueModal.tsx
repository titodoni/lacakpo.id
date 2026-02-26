'use client';

import { useState } from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; priority: 'high' | 'medium' | 'low' }) => void;
  itemName: string;
  editingIssue?: {
    id: string;
    title: string;
    description: string | null;
    priority: 'high' | 'medium' | 'low';
  } | null;
}

const priorityOptions = [
  {
    value: 'high' as const,
    label: 'Tinggi',
    description: 'Produksi terhenti',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700 border-red-200',
    selectedColor: 'bg-red-600 text-white border-red-600',
  },
  {
    value: 'medium' as const,
    label: 'Sedang',
    description: 'Produksi melambat',
    icon: AlertCircle,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    selectedColor: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'low' as const,
    label: 'Rendah',
    description: 'Masalah kecil',
    icon: Info,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    selectedColor: 'bg-blue-500 text-white border-blue-500',
  },
];

export function ReportIssueModal({
  isOpen,
  onClose,
  onSubmit,
  itemName,
  editingIssue,
}: ReportIssueModalProps) {
  const [title, setTitle] = useState(editingIssue?.title || '');
  const [description, setDescription] = useState(editingIssue?.description || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(
    editingIssue?.priority || 'medium'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or editing issue changes
  useState(() => {
    if (isOpen) {
      if (editingIssue) {
        setTitle(editingIssue.title);
        setDescription(editingIssue.description || '');
        setPriority(editingIssue.priority);
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
      }
    }
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit({ title: title.trim(), description: description.trim(), priority });
    setIsSubmitting(false);
    onClose();
  };

  const isEditing = !!editingIssue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? 'Edit Masalah' : 'Laporkan Masalah'}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Tingkat Prioritas</label>
            <div className="grid grid-cols-3 gap-2">
              {priorityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = priority === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                      isSelected
                        ? option.selectedColor
                        : `bg-card ${option.color} hover:bg-muted/50`
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{option.label}</span>
                    <span className={cn('text-[10px]', isSelected ? 'text-white/80' : 'text-muted-foreground')}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Judul Masalah <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Mesin CNC mati"
              className="w-full h-12 px-4 rounded-xl border border-border text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Keterangan (Opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan detail masalah..."
              rows={3}
              className="w-full p-4 rounded-xl border border-border text-base resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className={cn(
              'w-full h-14 rounded-xl font-semibold text-white transition-all',
              priority === 'high'
                ? 'bg-red-600 hover:bg-red-700'
                : priority === 'medium'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-blue-500 hover:bg-blue-600',
              'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
            )}
          >
            {isSubmitting
              ? 'Menyimpan...'
              : isEditing
              ? 'Simpan Perubahan'
              : 'Laporkan Masalah'}
          </button>
        </form>
      </div>
    </div>
  );
}
