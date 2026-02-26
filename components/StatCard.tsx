import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, color, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-border card-hover cursor-default ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${color} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
