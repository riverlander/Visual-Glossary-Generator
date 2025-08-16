
import React from 'react';
import { GlossaryEntry } from '../types';
import GlossaryCard from './GlossaryCard';

interface GlossaryGridProps {
  entries: GlossaryEntry[];
  colors: Record<string, string>;
  onCardClick: (index: number) => void;
  cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  flippedStates: boolean[];
  startIndex: number;
  focusedIndex: number | null;
}

const GlossaryGrid: React.FC<GlossaryGridProps> = ({ entries, colors, onCardClick, cardRefs, flippedStates, startIndex, focusedIndex }) => {
  return (
    <div className="w-full max-w-6xl mx-auto p-8 flex flex-wrap gap-6 justify-center items-start">
      {entries.map((entry, i) => {
        const originalIndex = startIndex + i;
        return (
          <div 
            key={entry.term + i} 
            ref={el => { cardRefs.current[originalIndex] = el; }}
            style={{ visibility: focusedIndex === originalIndex ? 'hidden' : 'visible' }}
          >
            <GlossaryCard
              term={entry.term}
              definition={entry.definition}
              iconName={entry.iconName}
              colors={colors}
              isFlipped={flippedStates[originalIndex] ?? false}
              onClick={() => onCardClick(originalIndex)}
            />
          </div>
        )
      })}
    </div>
  );
};

export default GlossaryGrid;
