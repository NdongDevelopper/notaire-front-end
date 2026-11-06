import React from 'react';
import type { SettingsTabId } from '../types/settings';

interface SettingsTabsProps {
  activeTab: SettingsTabId;
  onTabChange: (tabId: SettingsTabId) => void;
}

const tabs = [
  { id: 'users', label: 'Utilisateurs' },
  { id: 'roles', label: 'Rôles & Permissions' },
  { id: 'document-types', label: "Types d'Actes" },
  { id: 'company-info', label: 'Informations Étude' },
] as const;

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="relative w-full mb-6">
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent sm:hidden z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden z-10" />

      <div
        className="flex overflow-x-auto overflow-y-hidden space-x-1 border-b border-slate-200 snap-x snap-mandatory scrollbar-hide"
        style={{
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'none',
          touchAction: 'pan-x',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center h-10 whitespace-nowrap px-4 text-sm font-medium
                transition-colors duration-200 snap-start shrink-0
                ${isActive ? 'text-activeBtn' : 'text-text-muted hover:text-slate-700'}
              `}
            >
              {tab.label}
              {isActive && <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-activeBtn rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
