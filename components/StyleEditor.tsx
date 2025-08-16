import React from 'react';

interface StyleEditorProps {
  colors: Record<string, string>;
  setColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isVisible: boolean;
}

const colorConfigs = [
  { id: 'containerBg', label: 'Container Background' },
  { id: 'cardFrontBg', label: 'Card Front BG' },
  { id: 'cardFrontBorder', label: 'Card Front Border' },
  { id: 'cardBackBg', label: 'Card Back BG' },
  { id: 'cardBackBorder', label: 'Card Back Border' },
  { id: 'iconColor', label: 'Icon Color' },
  { id: 'termFrontColor', label: 'Front Term Color' },
  { id: 'termBackColor', label: 'Back Term Color' },
  { id: 'definitionColor', label: 'Definition Color' },
  { id: 'cardShadowColor', label: 'Card Shadow' },
];

const StyleEditor: React.FC<StyleEditorProps> = ({ colors, setColors, isVisible }) => {
  if (!isVisible) return null;

  const handleColorChange = (id: string, value: string) => {
    setColors(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="absolute top-4 right-4 z-40 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-300 shadow-2xl w-64">
      <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Style Editor</h3>
      <div className="space-y-3">
        {colorConfigs.map(({ id, label }) => (
          <div key={id} className="flex items-center justify-between">
            <label htmlFor={id} className="text-sm text-slate-600">{label}</label>
            <input
              id={id}
              type="color"
              value={colors[id] || '#000000'} // Fallback for new properties
              onChange={(e) => handleColorChange(id, e.target.value)}
              className="w-8 h-8 p-0 border-none rounded bg-transparent cursor-pointer"
              style={{ backgroundColor: colors[id] }} // Show current color
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StyleEditor;
