'use client';

// New Color Palette
const PALETTE = {
  prussianBlue: '#001427',
  prussianBlue600: '#004687',
  deepTeal: '#708d81',
  deepTeal300: '#44554e',
  deepTeal600: '#8ea49b',
  deepTeal700: '#aabbb4',
  deepTeal800: '#c6d2cd',
  deepTeal900: '#e3e8e6',
  jasmine: '#f4d58d',
  brickEmber: '#bf0603',
  bloodRed: '#8d0801',
};

interface Item {
  id: string;
  poId: string;
  name: string;
  specification: string | null;
  poNumber: string;
  deadline: string | null;
  progress: number;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID');
}

function getDaysOverdue(deadline: string | null) {
  if (!deadline) return 0;
  const days = Math.ceil(
    (new Date().getTime() - new Date(deadline).getTime()) / (1000 * 60 * 60 * 24)
  );
  return days > 0 ? days : 0;
}

export default function DelayedItemsTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-center py-8" style={{ color: PALETTE.deepTeal300 }}>Tidak ada item terlambat</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b" style={{ borderColor: PALETTE.deepTeal700 }}>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Item</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>PO</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Deadline</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Keterlambatan</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Progress</th>
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
              <span className="px-2 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: '#fee2e2', color: PALETTE.brickEmber }}>
                {getDaysOverdue(item.deadline)} hari
              </span>
            </td>
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: PALETTE.deepTeal800 }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round(item.progress)}%`, backgroundColor: PALETTE.prussianBlue600 }}
                  />
                </div>
                <span className="text-sm" style={{ color: PALETTE.deepTeal300 }}>{Math.round(item.progress)}%</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
