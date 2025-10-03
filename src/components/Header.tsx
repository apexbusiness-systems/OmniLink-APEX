import { Link } from 'react-router-dom';
import builtCanadianBadge from '@/assets/built_canadian_badge.svg';
import apexWordmark from '@/assets/apex_wordmark_hero.svg';

export const Header = () => {
  return <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        {/* Left group */}
        <div className="flex items-center gap-2">
          <img 
            src={builtCanadianBadge} 
            alt="Built Canadian" 
            className="h-6 md:h-7 w-auto opacity-90 hover:opacity-100 transition-opacity" 
            title="Built Canadian"
          />
        </div>

        {/* Center - Wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <img 
            src={apexWordmark} 
            alt="APEX Business Systems" 
            className="h-12 md:h-16 w-auto" 
          />
        </div>

        {/* Right group - empty for now, nav can go here */}
        <div className="flex items-center gap-4">
          {/* Future nav items */}
        </div>
      </div>
    </header>;
};