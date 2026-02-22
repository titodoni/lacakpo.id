'use client';

import { useState } from 'react';
import { cn, getProgressColor, canUpdateTrack } from '@/lib/utils';
import { SmartProgressInput } from './SmartProgressInput';
import { CheckCircle2, Lock, Pencil } from 'lucide-react';

interface Track {
  id: string;
  department: string;
  progress: number;
  updatedAt: string | null;
  updater: { name: string } | null;
}

interface TrackCardProps {
  track: Track;
  userRole: string;
  onUpdate: () => void;
}

export function TrackCard({ track, userRole, onUpdate }: TrackCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = canUpdateTrack(userRole, track.department);
  const progressColor = getProgressColor(track.progress);
  const isComplete = track.progress === 100;

  const departmentLabels: Record<string, string> = {
    drafting: 'Drafting',
    purchasing: 'Purchasing',
    production: 'Production',
    qc: 'QC',
  };

  const departmentIcons: Record<string, string> = {
    drafting: '✏️',
    purchasing: '🛒',
    production: '⚙️',
    qc: '✓',
  };

  if (isEditing && canEdit) {
    return (
      <SmartProgressInput
        trackId={track.id}
        department={track.department}
        currentValue={track.progress}
        onClose={() => setIsEditing(false)}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 border-2 transition-colors',
        canEdit 
          ? 'bg-white border-zinc-200 hover:border-zinc-400 cursor-pointer' 
          : 'bg-zinc-50 border-zinc-100',
        isComplete && 'bg-emerald-50/30 border-emerald-100'
      )}
      onClick={() => canEdit && setIsEditing(true)}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{departmentIcons[track.department]}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {departmentLabels[track.department]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          <span className={cn(
            'text-2xl font-bold font-mono',
            isComplete ? 'text-emerald-600' : 'text-zinc-900'
          )}>
            {track.progress}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-zinc-100 rounded-full overflow-hidden mb-3">
        <div
          className={cn('h-full rounded-full transition-all', progressColor)}
          style={{ width: `${track.progress}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {track.updatedAt ? (
          <p className="text-xs text-zinc-400">
            {new Date(track.updatedAt).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {track.updater && (
              <span className="text-zinc-500"> oleh {track.updater.name}</span>
            )}
          </p>
        ) : (
          <p className="text-xs text-zinc-300">Belum mulai</p>
        )}

        {/* Action Indicator */}
        {canEdit ? (
          <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg">
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-zinc-300">
            <Lock className="w-3 h-3" />
            <span>Hanya Baca</span>
          </div>
        )}
      </div>
    </div>
  );
}
