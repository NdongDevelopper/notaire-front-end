import { MenuSquareIcon } from 'lucide-react';

type Props = {
  onOpenSidebar: () => void;
};

const MobileTopBar = ({ onOpenSidebar }: Props) => {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-bg-sidebar text-text-sidebar border-b border-white/10">
      <button onClick={onOpenSidebar} className="p-2 rounded-md hover:bg-white/10 transition" aria-label="Ouvrir le menu">
        <MenuSquareIcon size={25} />
      </button>

      <div className="font-semibold text-md md:text-lg">Étude Notaire</div>
    </div>
  );
};

export default MobileTopBar;
