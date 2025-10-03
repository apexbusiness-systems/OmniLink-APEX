import { Link } from 'react-router-dom';
import builtCanadianBadge from '@/assets/built_canadian_badge.svg';
import appIcon from '@/assets/app_icon.svg';
export const Header = () => {
  return <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left group */}
        <div className="flex items-center gap-2">
          <img src={builtCanadianBadge} alt="" role="img" aria-label="Built Canadian badge" title="Built Canadian" className="h-5 md:h-6 lg:h-7 w-auto opacity-90 hover:opacity-100 transition-opacity" aria-hidden="true" focusable="false" />
          <div className="flex items-center gap-2 ml-0.5 md:ml-1">
            
            <span className="font-semibold tracking-tight text-sm md:text-base">
              APEX Business Systems
            </span>
          </div>
        </div>

        {/* Right group - empty for now, nav can go here */}
        <div className="flex items-center gap-4">
          {/* Future nav items */}
        </div>
      </div>
    </header>;
};