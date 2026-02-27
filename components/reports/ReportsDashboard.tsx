'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingUp,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Dynamic imports for heavy table sections
const DelayedItemsTable = dynamic(() => import('./DelayedItemsTable'), {
  loading: () => <TableSkeleton />,
});
const ProblemsTable = dynamic(() => import('./ProblemsTable'), {
  loading: () => <TableSkeleton />,
});
const OngoingTable = dynamic(() => import('./OngoingTable'), {
  loading: () => <TableSkeleton />,
});
const FinishedTable = dynamic(() => import('./FinishedTable'), {
  loading: () => <TableSkeleton />,
});

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
  jasmine400: '#edba45',
  brickEmber: '#bf0603',
  bloodRed: '#8d0801',
};

const COLORS = {
  delayed: PALETTE.brickEmber,
  problems: PALETTE.jasmine400,
  ongoing: PALETTE.prussianBlue600,
  finished: PALETTE.deepTeal,
};

interface ReportData {
  summary: {
    delayed: number;
    problems: number;
    finishedPaid: number;
    ongoing: number;
    onTimePercentage: number;
    totalDelivered: number;
    onTimeDelivered: number;
  };
  details: {
    delayed: ItemDetail[];
    problems: ItemDetail[];
    finishedPaid: ItemDetail[];
    ongoing: ItemDetail[];
  };
}

interface ItemDetail {
  id: string;
  poId: string;
  name: string;
  specification: string | null;
  poNumber: string;
  clientPoNumber: string | null;
  quantity: number;
  unit: string;
  deadline: string | null;
  deliveredAt: string | null;
  progress: number;
  tracks: { department: string; progress: number }[];
  openIssues: { id: string; title: string; priority: string; status: string }[];
}

export function ReportsDashboard({ initialData }: { initialData: ReportData }) {
  const [data] = useState<ReportData>(initialData);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    delayed: true,
    problems: true,
    ongoing: false,
    finished: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Item Terlambat"
          count={data.summary.delayed}
          color={COLORS.delayed}
          bgColor="bg-red-50"
          icon={AlertTriangle}
        />
        <SummaryCard
          title="Item Bermasalah"
          count={data.summary.problems}
          color={COLORS.problems}
          bgColor="bg-orange-50"
          icon={AlertCircle}
        />
        <SummaryCard
          title="Dalam Progress"
          count={data.summary.ongoing}
          color={COLORS.ongoing}
          bgColor="bg-blue-50"
          icon={Clock}
        />
        <SummaryCard
          title="Selesai & Lunas"
          count={data.summary.finishedPaid}
          color={COLORS.finished}
          bgColor="bg-green-50"
          icon={Package}
        />
      </div>

      {/* On-time Delivery Performance */}
      <OnTimePerformance
        percentage={data.summary.onTimePercentage}
        onTimeDelivered={data.summary.onTimeDelivered}
        totalDelivered={data.summary.totalDelivered}
      />

      {/* Detailed Tables */}
      <div className="space-y-4">
        {/* Delayed Items */}
        <CollapsibleSection
          title="Item Terlambat"
          count={data.summary.delayed}
          color="red"
          icon={AlertTriangle}
          isExpanded={expandedSections.delayed}
          onToggle={() => toggleSection('delayed')}
        >
          {expandedSections.delayed && <DelayedItemsTable items={data.details.delayed} />}
        </CollapsibleSection>

        {/* Problems */}
        <CollapsibleSection
          title="Item Bermasalah"
          count={data.summary.problems}
          color="orange"
          icon={AlertCircle}
          isExpanded={expandedSections.problems}
          onToggle={() => toggleSection('problems')}
        >
          {expandedSections.problems && <ProblemsTable items={data.details.problems} />}
        </CollapsibleSection>

        {/* Ongoing */}
        <CollapsibleSection
          title="Dalam Progress"
          count={data.summary.ongoing}
          color="blue"
          icon={Clock}
          isExpanded={expandedSections.ongoing}
          onToggle={() => toggleSection('ongoing')}
        >
          {expandedSections.ongoing && <OngoingTable items={data.details.ongoing} />}
        </CollapsibleSection>

        {/* Finished */}
        <CollapsibleSection
          title="Selesai & Lunas"
          count={data.summary.finishedPaid}
          color="green"
          icon={Package}
          isExpanded={expandedSections.finished}
          onToggle={() => toggleSection('finished')}
        >
          {expandedSections.finished && <FinishedTable items={data.details.finishedPaid} />}
        </CollapsibleSection>
      </div>
    </>
  );
}

// Sub-components
function SummaryCard({
  title,
  count,
  color,
  bgColor,
  icon: Icon,
}: {
  title: string;
  count: number;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: PALETTE.deepTeal700 }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: PALETTE.deepTeal300 }}>{title}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>
            {count}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function OnTimePerformance({
  percentage,
  onTimeDelivered,
  totalDelivered,
}: {
  percentage: number;
  onTimeDelivered: number;
  totalDelivered: number;
}) {
  const strokeColor = percentage >= 80 
    ? PALETTE.deepTeal 
    : percentage >= 60 
    ? PALETTE.jasmine400 
    : PALETTE.brickEmber;

  return (
    <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: PALETTE.deepTeal700 }}>
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-5 h-5" style={{ color: PALETTE.prussianBlue600 }} />
        <h2 className="text-lg font-semibold" style={{ color: PALETTE.prussianBlue }}>
          Performa Pengiriman Tepat Waktu
        </h2>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke={PALETTE.deepTeal800} strokeWidth="12" fill="none" />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={strokeColor}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 3.52} 351.86`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: PALETTE.prussianBlue }}>{percentage}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <p style={{ color: PALETTE.deepTeal300 }}>
            <span className="font-semibold" style={{ color: PALETTE.prussianBlue }}>{onTimeDelivered}</span> item terkirim tepat waktu
          </p>
          <p style={{ color: PALETTE.deepTeal300 }}>
            dari total <span className="font-semibold" style={{ color: PALETTE.prussianBlue }}>{totalDelivered}</span> item terkirim
          </p>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  color,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  color: 'red' | 'orange' | 'blue' | 'green';
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colorMap = {
    red: {
      bg: 'bg-red-50',
      hover: 'hover:bg-red-100',
      badge: 'bg-red-200 text-red-800',
      icon: PALETTE.brickEmber,
    },
    orange: {
      bg: 'bg-orange-50',
      hover: 'hover:bg-orange-100',
      badge: 'bg-orange-200 text-orange-800',
      icon: PALETTE.jasmine400,
    },
    blue: {
      bg: 'bg-blue-50',
      hover: 'hover:bg-blue-100',
      badge: 'bg-blue-200 text-blue-800',
      icon: PALETTE.prussianBlue600,
    },
    green: {
      bg: 'bg-green-50',
      hover: 'hover:bg-green-100',
      badge: 'bg-green-200 text-green-800',
      icon: PALETTE.deepTeal,
    },
  };

  const colorSet = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: PALETTE.deepTeal700 }}>
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 flex items-center justify-between ${colorSet.bg} ${colorSet.hover} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" style={{ color: colorSet.icon }} />
          <span className="font-semibold" style={{ color: PALETTE.prussianBlue }}>{title}</span>
          <span className={`px-2 py-1 ${colorSet.badge} text-xs rounded-full font-medium`}>{count}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" style={{ color: PALETTE.deepTeal300 }} />
        ) : (
          <ChevronDown className="w-5 h-5" style={{ color: PALETTE.deepTeal300 }} />
        )}
      </button>

      {isExpanded && <div className="p-4 overflow-x-auto">{children}</div>}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 rounded mb-4" style={{ backgroundColor: PALETTE.deepTeal900 }} />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded" style={{ backgroundColor: PALETTE.deepTeal900 }} />
        ))}
      </div>
    </div>
  );
}
