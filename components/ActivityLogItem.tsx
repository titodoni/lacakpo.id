interface ActivityLog {
  id: string;
  department: string;
  actionType: string;
  oldProgress: number | null;
  newProgress: number | null;
  delta: number | null;
  systemMessage: string;
  userNote: string | null;
  createdAt: string;
  item: { itemName: string } | null;
  actor: { name: string; username: string } | null;
}

interface ActivityLogItemProps {
  log: ActivityLog;
}

export function ActivityLogItem({ log }: ActivityLogItemProps) {
  const departmentColors: Record<string, string> = {
    drafting: 'bg-blue-100 text-blue-700',
    purchasing: 'bg-purple-100 text-purple-700',
    production: 'bg-orange-100 text-orange-700',
    qc: 'bg-emerald-100 text-emerald-700',
  };

  const isIncrease = (log.delta || 0) > 0;
  const isDecrease = (log.delta || 0) < 0;

  return (
    <div className="flex gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
      {/* Status Dot */}
      <div className="flex-shrink-0 mt-1">
        <div className={`w-2 h-2 rounded-full ${
          log.newProgress === 100 ? 'bg-emerald-500' :
          log.newProgress && log.newProgress > 0 ? 'bg-zinc-400' :
          'bg-zinc-200'
        }`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400">
            {new Date(log.createdAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            departmentColors[log.department] || 'bg-zinc-100 text-zinc-600'
          }`}>
            {log.department}
          </span>
        </div>

        <p className="text-sm text-zinc-700 mt-1">
          <span className="font-medium">{log.actor?.name || 'Unknown'}</span>
           mengupdate 
          <span className="font-medium">{log.item?.itemName || 'Item'}</span>
        </p>

        {/* Progress Change */}
        {log.oldProgress !== null && log.newProgress !== null && (
          <p className="text-sm text-zinc-600 mt-1 flex items-center gap-2">
            <span className="font-mono">{log.oldProgress}%</span>
            <span className="text-zinc-400">→</span>
            <span className="font-mono font-medium">{log.newProgress}%</span>
            {log.delta !== null && (
              <span className={`ml-2 text-xs font-medium ${
                isIncrease ? 'text-emerald-600' :
                isDecrease ? 'text-red-600' :
                'text-zinc-500'
              }`}>
                {isIncrease ? '+' : ''}{log.delta}%
              </span>
            )}
          </p>
        )}

        {/* User Note */}
        {log.userNote && (
          <p className="text-sm text-zinc-500 mt-1 italic">
            "{log.userNote}"
          </p>
        )}
      </div>
    </div>
  );
}
