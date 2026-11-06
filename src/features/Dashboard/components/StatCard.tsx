import React from 'react';
import { type LucideIcon } from 'lucide-react';

export type StatCardVariant = 'primary' | 'success' | 'warning' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon: LucideIcon;
  variant?: StatCardVariant;
  onClick?: () => void;
}

const variantStyles: Record<StatCardVariant, { iconContainer: string; iconText: string }> = {
  primary: {
    iconContainer: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  success: {
    iconContainer: 'bg-green-50',
    iconText: 'text-green-600',
  },
  warning: {
    iconContainer: 'bg-amber-50',
    iconText: 'text-amber-600',
  },
  purple: {
    iconContainer: 'bg-purple-50',
    iconText: 'text-purple-600',
  },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, subText, icon: Icon, variant = 'primary', onClick }) => {
  const styles = variantStyles[variant];

  return (
    <div 
      className="bg-white py-4 px-6 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-35 group cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-slate-200 transition-all duration-300 ease-in-out"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${styles.iconContainer} transition-transform duration-300 ease-out group-hover:scale-110`}>
          <Icon className={`w-6 h-6 ${styles.iconText}`} />
        </div>
        <span className="text-2xl font-bold text-text tracking-tight">{value}</span>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        {subText && <p className="text-xs text-slate-400 mt-0.5 font-normal">{subText}</p>}
      </div>
    </div>
  );
};
