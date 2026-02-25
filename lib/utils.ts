import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Progress color mapping based on percentage
export function getProgressColor(progress: number): string {
  if (progress === 100) return 'bg-emerald-500';
  if (progress >= 76) return 'bg-zinc-600';
  if (progress >= 51) return 'bg-zinc-500';
  if (progress >= 26) return 'bg-zinc-400';
  return 'bg-zinc-300';
}

// Format date for display
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format time for display
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format datetime for display
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate system message for activity log
export function generateSystemMessage(
  actorName: string,
  department: string,
  oldProgress: number,
  newProgress: number
): string {
  const delta = newProgress - oldProgress;
  const direction = delta > 0 ? 'meningkatkan' : 'menurunkan';
  const capitalizedDept = department.charAt(0).toUpperCase() + department.slice(1);
  
  return `${actorName} ${direction} ${capitalizedDept} dari ${oldProgress}% menjadi ${newProgress}% (${delta > 0 ? '+' : ''}${delta}%)`;
}

// Role to allowed departments mapping
// Only department-specific users can update progress
// super_admin, manager, sales_admin, finance = view only (no track updates)
export const roleTrackMap: Record<string, string[]> = {
  super_admin: [],
  manager: [],
  sales_admin: [],
  drafter: ['drafting'],
  purchasing: ['purchasing'],
  cnc_operator: ['production'],
  milling_operator: ['production'],
  fab_operator: ['production'],
  qc: ['qc'],
  delivery: ['delivery'],
  finance: [],
};

export function canUpdateTrack(userRole: string, trackDepartment: string): boolean {
  return roleTrackMap[userRole]?.includes(trackDepartment) ?? false;
}

// Format distance to now (e.g., "2 hours ago")
export function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  if (diffWeeks < 4) return `${diffWeeks} minggu yang lalu`;
  if (diffMonths < 12) return `${diffMonths} bulan yang lalu`;
  return `${diffYears} tahun yang lalu`;
}

// Format month and year for display (e.g., "January 2026")
export function formatMonthYear(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

// Get department label for display
export function getDepartmentLabel(department: string): string {
  const labels: Record<string, string> = {
    drafting: 'Drafting',
    purchasing: 'Purchasing',
    production: 'Production',
    qc: 'QC',
  };
  return labels[department] || department;
}
