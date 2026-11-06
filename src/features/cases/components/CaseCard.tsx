import React from 'react';
import type { Case } from '../types/case';

interface CaseCardProps {
  item: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ item }) => {
  return (
    <div className="bg-white p-3 mb-3 rounded-xl shadow-sm border border-slate-100 relative group hover:border-slate-300 transition-all max-w-[320px] w-full">
      <div className="flex justify-between items-center mb-2 gap-2">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-blue-600 uppercase tracking-wide truncate">
          {item.type}
        </span>
        <button className="text-slate-400 hover:text-slate-600 font-bold text-xs shrink-0">•••</button>
      </div>

      <h5 className="text-sm font-bold text-slate-900 mb-3 break-all">{item.id}</h5>

      <div className="flex justify-between items-center text-[11px] gap-2">
        <div className="flex -space-x-1.5">
          {(item.clients || []).slice(0, 3).map((client, idx) => (
            <span
              key={client.id || idx}
              className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-700 uppercase"
            >
              {client.name.slice(0, 2)}
            </span>
          ))}
        </div>
        <small className="text-slate-400 flex items-center gap-1 font-medium shrink-0">
          🕒 {item.createdAt}
        </small>
      </div>
    </div>
  );
};