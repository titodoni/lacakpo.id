'use client';

import { AlertTriangle } from 'lucide-react';

interface Issue {
  id: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'resolved';
}

interface IssueBadgeProps {
  issues: Issue[];
  compact?: boolean;
}

// Color Palette
const colors = {
  emerald: '#50c878',
  shamrock: '#4d995a',
  brightTeal: '#1978c6',
  platinum: '#f5f3f3',
};

export function IssueBadge({ issues, compact = true }: IssueBadgeProps) {
  const openIssues = issues.filter((i) => i.status === 'open');
  const highPriorityCount = openIssues.filter((i) => i.priority === 'high').length;
  
  if (openIssues.length === 0) return null;

  const hasHigh = highPriorityCount > 0;
  
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-primary-foreground"
        style={{
          backgroundColor: hasHigh ? colors.emerald : colors.shamrock,
        }}
        title={`${openIssues.length} masalah terbuka`}
      >
        <AlertTriangle className="w-3 h-3" />
        {openIssues.length}
      </span>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: hasHigh ? `${colors.emerald}20` : `${colors.shamrock}20`,
        color: hasHigh ? colors.emerald : colors.shamrock,
      }}
    >
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm font-bold">
        {openIssues.length} Masalah
      </span>
    </div>
  );
}
