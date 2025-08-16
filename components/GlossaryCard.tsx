
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import * as icons from 'lucide-react';

// Define a type for the icons object to allow string indexing
type IconCollection = { [key: string]: React.ComponentType<any> };

interface GlossaryCardProps {
  term: string;
  definition: string;
  iconName: string;
  colors: Record<string, string>;
  isFlipped: boolean;
  onClick: () => void;
}

const GlossaryCard = React.forwardRef<HTMLDivElement, GlossaryCardProps>(
  ({ term, definition, iconName, colors, isFlipped, onClick }, ref) => {
    const cardInnerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!cardInnerRef.current) return;
      gsap.to(cardInnerRef.current, {
        rotationY: isFlipped ? 180 : 0,
        duration: 0.7,
        ease: 'power3.inOut',
      });
    }, [isFlipped]);

    const IconComponent = (icons as unknown as IconCollection)[iconName] || icons.HelpCircle;

    return (
      <div
        ref={ref}
        className="w-[9.75rem] h-[10rem] cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={onClick}
        aria-label={`Card for ${term}, currently ${isFlipped ? 'showing definition' : 'showing term'}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        <div
          ref={cardInnerRef}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Front */}
          <div
            className="absolute w-full h-full rounded-2xl flex flex-col items-center justify-center p-2 text-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              backgroundColor: colors.cardFrontBg,
              border: `1px solid ${colors.cardFrontBorder}`,
              boxShadow: `0 4px 15px ${colors.cardShadowColor}`,
            }}
          >
            <div style={{ color: colors.iconColor }} className="mb-2">
              <IconComponent size={32} />
            </div>
            <h3 className="text-base font-bold tracking-wide leading-tight" style={{ color: colors.termFrontColor }}>
              {term}
            </h3>
          </div>

          {/* Card Back */}
          <div
            className="absolute w-full h-full rounded-2xl flex flex-col justify-start text-left p-3"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: colors.cardBackBg,
              border: `1px solid ${colors.cardBackBorder}`,
              boxShadow: `0 4px 15px ${colors.cardShadowColor}`,
            }}
          >
            <h4 className="text-xs font-bold mb-1" style={{ color: colors.termBackColor }}>
              {term}
            </h4>
            <p
              className="text-[13px] font-medium leading-snug flex-1 min-h-0 overflow-y-auto custom-scrollbar"
              style={{ color: colors.definitionColor }}
              onClick={(e) => e.stopPropagation()}
            >
              {definition}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

export default GlossaryCard;