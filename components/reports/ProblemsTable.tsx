'use client';

// New Color Palette
const PALETTE = {
  prussianBlue: '#001427',
  prussianBlue600: '#004687',
  deepTeal: '#708d81',
  deepTeal300: '#44554e',
  deepTeal700: '#aabbb4',
  deepTeal900: '#e3e8e6',
  jasmine: '#f4d58d',
  jasmine400: '#edba45',
  brickEmber: '#bf0603',
  bloodRed: '#8d0801',
};

interface Item {
  id: string;
  name: string;
  specification: string | null;
  poNumber: string;
  openIssues: { title: string; priority: string }[];
}

export default function ProblemsTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-center py-8" style={{ color: PALETTE.deepTeal300 }}>Tidak ada item bermasalah</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b" style={{ borderColor: PALETTE.deepTeal700 }}>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Item</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>PO</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Issue Terbuka</th>
          <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: PALETTE.deepTeal300 }}>Prioritas</th>
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
            <td className="py-3 px-4">
              {item.openIssues.map((issue, idx) => (
                <p key={idx} className="text-sm" style={{ color: PALETTE.prussianBlue }}>{issue.title}</p>
              ))}
            </td>
            <td className="py-3 px-4">
              {item.openIssues.map((issue, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: issue.priority === 'high' ? '#fee2e2' : issue.priority === 'medium' ? '#ffedd5' : '#dbeafe',
                    color: issue.priority === 'high' ? PALETTE.brickEmber : issue.priority === 'medium' ? PALETTE.jasmine400 : PALETTE.prussianBlue600,
                  }}
                >
                  {issue.priority === 'high' ? 'Tinggi' : issue.priority === 'medium' ? 'Sedang' : 'Rendah'}
                </span>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
