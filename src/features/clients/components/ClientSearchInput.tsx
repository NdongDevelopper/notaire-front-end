// ADJUST THIS IMPORT to match the shared Input component's actual location.
import { Input } from '../../../shared/components/ui/Input/Input';

interface ClientSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4 text-slate-400"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function ClientSearchInput({ value, onChange }: ClientSearchInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
        <SearchIcon />
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher par nom, téléphone..."
        className="pl-11"
      />
    </div>
  );
}
