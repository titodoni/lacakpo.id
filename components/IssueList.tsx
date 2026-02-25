'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X, Edit2, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/utils';
import { Issue } from './ItemCard';

interface IssueListProps {
  issues: Issue[];
  currentUserId: string;
  isAdmin: boolean;
  onResolve: (issueId: string) => void;
  onReopen: (issueId: string) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issueId: string) => void;
}

const priorityConfig = {
  high: {
    label: 'Tinggi',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    dotColor: 'bg-red-500',
  },
  medium: {
    label: 'Sedang',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertCircle,
    dotColor: 'bg-amber-500',
  },
  low: {
    label: 'Rendah',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Info,
    dotColor: 'bg-blue-500',
  },
};

export function IssueList({
  issues,
  currentUserId,
  isAdmin,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
}: IssueListProps) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const openIssues = issues.filter((i) => i.status === 'open');
  const resolvedIssues = issues.filter((i) => i.status === 'resolved');

  const canEditIssue = (issue: Issue) => {
    return issue.creator.id === currentUserId || isAdmin;
  };

  const renderIssue = (issue: Issue) => {
    const config = priorityConfig[issue.priority];
    const Icon = config.icon;
    const isExpanded = expandedIssue === issue.id;
    const canEdit = canEditIssue(issue);
    const isResolved = issue.status === 'resolved';

    return (
      <div
        key={issue.id}
        className={cn(
          'border rounded-xl overflow-hidden transition-all',
          isResolved ? 'bg-zinc-50 border-zinc-200 opacity-75' : 'bg-white border-zinc-200'
        )}
      >
        {/* Header */}
        <div
          className="p-3 cursor-pointer"
          onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.color.split(' ')[1])} />
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', isResolved && 'line-through text-zinc-500')}>
                  {issue.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', config.color)}>
                    {config.label}
                  </span>
                  {isResolved && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
                      Selesai
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">
                    {formatDistanceToNow(issue.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {!isResolved && canEdit && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(issue);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(issue.id);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {isResolved && canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReopen(issue.id);
                  }}
                  className="text-xs px-2 py-1 bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 transition-colors"
                >
                  Buka Kembali
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-zinc-100">
            {issue.description && (
              <p className="text-sm text-zinc-600 mt-2">{issue.description}</p>
            )}

            {/* Creator Info */}
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
              <User className="w-3 h-3" />
              <span>Dilaporkan oleh {issue.creator.name}</span>
            </div>

            {/* Resolver Info (if resolved) */}
            {isResolved && issue.resolver && (
              <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Diselesaikan oleh {issue.resolver.name}</span>
                {issue.resolvedAt && (
                  <span className="text-zinc-400">
                    ({formatDistanceToNow(issue.resolvedAt)})
                  </span>
                )}
              </div>
            )}

            {/* Resolve Button */}
            {!isResolved && (
              <button
                onClick={() => onResolve(issue.id)}
                className="mt-3 w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                Tandai Selesai
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-400 text-sm">
        Tidak ada masalah dilaporkan
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {openIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Masalah Terbuka ({openIssues.length})
          </h4>
          {openIssues.map(renderIssue)}
        </div>
      )}

      {resolvedIssues.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-200">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
            Selesai ({resolvedIssues.length})
          </h4>
          {resolvedIssues.map(renderIssue)}
        </div>
      )}
    </div>
  );
}
