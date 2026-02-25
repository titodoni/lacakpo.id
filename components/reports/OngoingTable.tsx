'use client';

// New Color Palette
const PALETTE = {
  prussianBlue: '#001427',
  prussianBlue600: '#004687',
  deepTeal: '#708d81',
  deepTeal300: '#44554e',
  deepTeal600: '#8ea49b',
  deepTeal700: '#aabbb4',
  deepTeal900: '#e3e8e6',
};

interface Item {
  id: string;
  name: string;
  specification: string | null;
  poNumber: string;
  deadline: string | null;
  tracks: { department: string; progress: number }[];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID');
}

export default function OngoingTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-center py-8" style={{ color: PALETTE.deepTeal300 }}>Tidak ada item dalam progress</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b" style={{ borderColor: PALETTE.deepTeal700 }}>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Item</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>PO</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Deadline</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Progress per Dept</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b hover:bg-gray-50" style={{ borderColor: PALETTE.deepTeal900 }}>
            <td className="py-3 px-4">
              <p className="font-medium" style={{ color: PALETTE.prussianBlue }}>{item.name}</p>
              {item.specification && (
                <p className="text-sm" style={{ color: PALETTE.deepTeal300 }}>{item.specification}</p>
              )}
            </td>
            <td className="py-3 px-4" style={{ color: PALETTE.prussianBlue }}>{item.poNumber}</td>
            <td className="py-3 px-4" style={{ color: PALETTE.deepTeal300 }}>{formatDate(item.deadline)}</td>
            <td className="py-3 px-4">
              <div className="flex flex-wrap gap-2">
                {item.tracks.map((track) => (
                  <div key={track.department} className="flex items-center gap-1 text-xs">
                    <span className="capitalize" style={{ color: PALETTE.deepTeal300 }}>{track.department}:</span>
                    <span className="font-medium" style={{ color: PALETTE.prussianBlue }}>{track.progress}%</span>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
