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
    return issue.creator?.id === currentUserId || isAdmin;
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
          isResolved ? 'bg-muted/50 border-border opacity-75' : 'bg-card border-border'
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
                <p className={cn('font-medium text-sm', isResolved && 'line-through text-muted-foreground')}>
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
                  <span className="text-xs text-muted-foreground">
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
                    className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(issue.id);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  className="text-xs px-2 py-1 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Buka Kembali
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-border">
            {issue.description && (
              <p className="text-sm text-muted-foreground mt-2">{issue.description}</p>
            )}

            {/* Creator Info */}
            {issue.creator && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>Dilaporkan oleh {issue.creator.name}</span>
              </div>
            )}

            {/* Resolver Info (if resolved) */}
            {isResolved && issue.resolver && (
              <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Diselesaikan oleh {issue.resolver.name}</span>
                {issue.resolvedAt && (
                  <span className="text-muted-foreground">
                    ({formatDistanceToNow(issue.resolvedAt)})
                  </span>
                )}
              </div>
            )}

            {/* Resolve Button - Only for creator or admin */}
            {!isResolved && canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(issue.id);
                }}
                className="mt-3 w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
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
      <div className="text-center py-6 text-muted-foreground text-sm">
        Tidak ada masalah dilaporkan
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {openIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Masalah Terbuka ({openIssues.length})
          </h4>
          {openIssues.map(renderIssue)}
        </div>
      )}

      {resolvedIssues.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Selesai ({resolvedIssues.length})
          </h4>
          {resolvedIssues.map(renderIssue)}
        </div>
      )}
    </div>
  );
}
