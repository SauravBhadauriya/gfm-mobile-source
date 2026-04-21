import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  };
  
  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
          {trend && (
            <p className={`mt-1.5 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={`rounded-lg ${colors.bg} p-2.5 ml-3 flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
