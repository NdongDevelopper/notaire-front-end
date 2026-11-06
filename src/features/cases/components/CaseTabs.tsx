interface Tab {
  id: string;
  label: string;
}

interface CaseTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const CaseTabs = ({ tabs, activeTab, onTabChange }: CaseTabsProps) => {
  return (
    <div className="border-b border-slate-200 mb-6 flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-3 text-sm font-semibold relative transition-colors shrink-0 ${
            activeTab === tab.id ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {tab.label}
          {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full" />}
        </button>
      ))}
    </div>
  );
};