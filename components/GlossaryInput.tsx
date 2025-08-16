import React, { useState } from 'react';

interface GlossaryInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const DEFAULT_TEXT = `React: A JavaScript library for building user interfaces.
D3.js: A JavaScript library for producing dynamic, interactive data visualizations in web browsers.
GSAP: A professional-grade animation library for the modern web.
AI: Artificial intelligence is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals and humans.
Cloud Computing: The on-demand availability of computer system resources, especially data storage and computing power, without direct active management by the user.
API: An application programming interface is a way for two or more computer programs to communicate with each other.`;

const GlossaryInput: React.FC<GlossaryInputProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState(DEFAULT_TEXT);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-300 shadow-2xl">
      <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Visual Glossary Generator</h2>
      <p className="text-center text-slate-600 mb-6">Paste your glossary below (e.g., "Term: Definition") and watch it come to life.</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g., "React: A JavaScript library..."'
          className="w-full h-64 p-4 bg-white/80 border border-slate-400 rounded-lg text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 py-3 px-6 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:bg-slate-400 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg shadow-cyan-600/30 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            '✨ Generate Visual Glossary'
          )}
        </button>
      </form>
    </div>
  );
};

export default GlossaryInput;
