'use client';

import { useRouter } from 'next/navigation';
import { IssueBadge } from '@/components/IssueBadge';

interface Item {
  id: string;
  poId: string;
  name: string;
  specification: string | null;
  poNumber: string;
  openIssues: { id: string; title: string; priority: string; status: string }[];
}

export default function ProblemsTable({ items }: { items: Item[] }) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        ✅ Tidak ada item bermasalah
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const issueCount = item.openIssues.length;

        // Create properly formatted issues for IssueBadge
        const formattedIssues = item.openIssues.map((issue) => ({
          id: issue.id || item.id + issue.priority,
          priority: issue.priority as 'high' | 'medium' | 'low',
          status: issue.status as 'open' | 'resolved',
        }));

        return (
          <button
            key={item.id}
            onClick={() => router.push(`/pos/${item.poId}`)}
            className="w-full text-left bg-card border border-border rounded-xl p-3 hover:border-muted-foreground/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              {/* Left: Item name and PO */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.poNumber}
                </p>
                <p className="text-xs text-destructive mt-1">
                  {issueCount} masalah terbuka
                </p>
              </div>

              {/* Right: Priority badge */}
              <div className="shrink-0">
                <IssueBadge issues={formattedIssues} compact />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
