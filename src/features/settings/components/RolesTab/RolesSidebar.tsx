import React from 'react';

// L'Associé n'apparaît pas : il a un accès complet non configurable côté backend.
const roles = ['Juriste', 'Comptable', 'Formaliste', 'Assistant', 'Agent', 'Stagiaire'];

interface RolesSidebarProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
}

export const RolesSidebar: React.FC<RolesSidebarProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="w-full lg:w-64 flex flex-col gap-2">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => onSelectRole(role)}
          className={`
            px-4 py-3 rounded-lg text-left font-medium transition-colors
            ${selectedRole === role ? 'bg-activeBtn text-white' : 'text-text hover:bg-slate-100'}
          `}
        >
          {role}
        </button>
      ))}
    </div>
  );
};
