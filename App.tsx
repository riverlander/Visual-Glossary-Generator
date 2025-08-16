
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { renderToString } from 'react-dom/server';
import * as icons from 'lucide-react';
import { GlossaryEntry } from './types';
import { generateVisualGlossary } from './services/geminiService';
import GlossaryInput from './components/GlossaryInput';
import GlossaryGrid from './components/GlossaryGrid';
import GlossaryCard from './components/GlossaryCard';
import StyleEditor from './components/StyleEditor';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

type IconCollection = { [key: string]: React.ComponentType<any> };

const DEFAULT_COLORS = {
  containerBg: '#e7eafa',
  cardFrontBg: '#86c5e6',
  cardFrontBorder: '#5a9ac2',
  cardBackBg: '#86c5e6',
  cardBackBorder: '#5aa2c2',
  iconColor: '#1e3a8a',
  termFrontColor: '#1e293b',
  termBackColor: '#1e3a8a',
  definitionColor: '#1e293b',
  cardShadowColor: '#00000020',
};

const ITEMS_PER_PAGE = 10; // 5x2 grid

const App: React.FC = () => {
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [flippedStates, setFlippedStates] = useState<boolean[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusedCardContainerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(".main-container", {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 1, ease: 'power3.out'});
    gsap.set(gridWrapperRef.current, { opacity: 0, scale: 0.95, pointerEvents: 'none' });
    gsap.set(inputWrapperRef.current, { opacity: 1, pointerEvents: 'auto' });
  }, []);
  
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return glossaryEntries;
    return glossaryEntries.filter(
      entry =>
        entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [glossaryEntries, searchQuery]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage, startIndex]);


  const handleGenerate = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const entries = await generateVisualGlossary(text);
      setGlossaryEntries(entries);
      setFlippedStates(new Array(entries.length).fill(false));
      cardRefs.current = cardRefs.current.slice(0, entries.length);
      setShowGrid(true);

      const tl = gsap.timeline();
      tl.to(inputWrapperRef.current, { opacity: 0, duration: 0.5, ease: 'power3.in', pointerEvents: 'none' })
        .to(gridWrapperRef.current, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', pointerEvents: 'auto' }, "-=0.2");
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
      setShowGrid(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setShowGrid(false);
    setError(null);
    setSearchQuery('');
    setCurrentPage(1);
    const tl = gsap.timeline({ onComplete: () => {
      setGlossaryEntries([]);
      setFlippedStates([]);
      setFocusedIndex(null);
    }});
    tl.to(gridWrapperRef.current, { opacity: 0, scale: 0.95, duration: 0.5, ease: 'power3.in', pointerEvents: 'none' })
      .to(inputWrapperRef.current, { opacity: 1, duration: 0.7, ease: 'power3.out', pointerEvents: 'auto' }, "-=0.3");
  };

  const handleCardClick = useCallback((index: number) => {
    if (focusedIndex !== null) return; 

    setFlippedStates(prev => {
        const newStates = [...prev];
        newStates[index] = !newStates[index];
        return newStates;
    });
    
    setFocusedIndex(index);
  }, [focusedIndex]);

  const handleCloseFocus = useCallback(() => {
    if (focusedIndex === null) return;

    // Flip card back to front
    setFlippedStates(prev => {
        const newStates = [...prev];
        if (newStates[focusedIndex]) {
            newStates[focusedIndex] = false;
        }
        return newStates;
    });
    
    const cardEl = cardRefs.current[focusedIndex];
    const focusEl = focusedCardContainerRef.current;
    const backdropEl = backdropRef.current;

    if (!cardEl || !focusEl || !backdropEl) return;

    const startRect = cardEl.getBoundingClientRect();
    
    gsap.to(focusEl, {
        top: startRect.top,
        left: startRect.left,
        scale: 1,
        duration: 0.5,
        ease: 'power3.inOut',
        onComplete: () => {
            setFocusedIndex(null);
        }
    });
    gsap.to(backdropEl, { opacity: 0, duration: 0.5 });

  }, [focusedIndex]);

  useEffect(() => {
    const cardEl = focusedIndex !== null ? cardRefs.current[focusedIndex] : null;

    if (focusedIndex !== null && cardEl) {
       cardEl.style.visibility = 'visible';
    }

    if (focusedIndex === null) return;

    const focusEl = focusedCardContainerRef.current;
    const backdropEl = backdropRef.current;

    if (!cardEl || !focusEl || !backdropEl) return;

    const startRect = cardEl.getBoundingClientRect();
    const scale = 2.5;
    const targetTop = window.innerHeight / 2 - (startRect.height * scale) / 2;
    const targetLeft = window.innerWidth / 2 - (startRect.width * scale) / 2;

    gsap.set(focusEl, {
        top: startRect.top,
        left: startRect.left,
        width: startRect.width,
        height: startRect.height,
        scale: 1,
    });
    
    gsap.to(backdropEl, { opacity: 1, duration: 0.5 });
    gsap.to(focusEl, {
        top: targetTop,
        left: targetLeft,
        scale: scale,
        duration: 0.5,
        ease: 'power3.inOut',
    });
  }, [focusedIndex]);


  const handleDownload = useCallback(() => {
    const generateCardHTML = (entry: GlossaryEntry) => {
      const IconComponent = (icons as unknown as IconCollection)[entry.iconName] || icons.HelpCircle;
      const iconSvg = renderToString(<IconComponent size={32} />);
      return `
        <div class="card-container" data-term="${entry.term.toLowerCase()}" data-definition="${entry.definition.toLowerCase()}" style="display: none;">
          <div class="card-flipper">
            <div class="card-face card-front">
              <div class="icon">${iconSvg}</div>
              <h3>${entry.term}</h3>
            </div>
            <div class="card-face card-back">
              <h4>${entry.term}</h4>
              <p class="custom-scrollbar">${entry.definition}</p>
            </div>
          </div>
        </div>
      `;
    };
    
    const searchIconSvg = renderToString(<Search className="h-5 w-5" />);
    const chevronLeftSvg = renderToString(<ChevronLeft size={16} />);
    const chevronRightSvg = renderToString(<ChevronRight size={16} />);

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Glosario Visual de Conceptos</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
        <style>
          :root {
            --container-bg: ${colors.containerBg};
            --card-front-bg: ${colors.cardFrontBg};
            --card-front-border: ${colors.cardFrontBorder};
            --card-back-bg: ${colors.cardBackBg};
            --card-back-border: ${colors.cardBackBorder};
            --icon-color: ${colors.iconColor};
            --term-front-color: ${colors.termFrontColor};
            --term-back-color: ${colors.termBackColor};
            --definition-color: ${colors.definitionColor};
            --card-shadow-color: ${colors.cardShadowColor};
          }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #eef3f5; margin: 0; padding: 2rem; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .page-wrapper { width: 100%; max-width: 1280px; margin: auto; background-color: var(--container-bg); border-radius: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; }
          .header { padding: 1rem 2rem; border-bottom: 1px solid #d1dce5; }
          .header h1 { font-size: 1.5rem; font-weight: 600; color: #334155; text-align: center; margin-bottom: 1rem; }
          .search-container { position: relative; max-width: 28rem; margin: auto; }
          .search-container .icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #9ca3af; }
          #glossary-search { width: 100%; padding: 0.5rem 1rem 0.5rem 2.5rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; background-color: white; color: #334155; transition: all 0.2s ease-in-out; font-size: 1rem; box-sizing: border-box; }
          #glossary-search:focus { outline: none; border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }
          .grid-container { display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; align-items: start; width: 100%; max-width: 72rem; margin-left: auto; margin-right: auto; padding: 2rem; box-sizing: border-box; flex-grow: 1; }
          .no-results { display: none; text-align: center; font-size: 1.25rem; color: #64748b; padding: 2rem; width: 100%; }
          .card-container { width: 9.75rem; height: 10rem; cursor: pointer; perspective: 1000px; }
          .card-container[data-hidden='true'] { visibility: hidden; }
          .card-flipper { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
          .card-face { position: absolute; width: 100%; height: 100%; border-radius: 1rem; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; text-align: center; box-shadow: 0 4px 15px var(--card-shadow-color); box-sizing: border-box; }
          .card-front { background-color: var(--card-front-bg); border: 1px solid var(--card-front-border); align-items: center; justify-content: center; padding: 0.5rem; }
          .card-front .icon { margin-bottom: 0.5rem; color: var(--icon-color); }
          .card-front .icon svg { width: 32px; height: 32px; }
          .card-front h3 { font-size: 1rem; font-weight: 700; color: var(--term-front-color); margin: 0; line-height: 1.2; }
          .card-back { background-color: var(--card-back-bg); border: 1px solid var(--card-back-border); transform: rotateY(180deg); padding: 0.75rem; text-align: left; justify-content: flex-start; }
          .card-back h4 { font-size: 12px; font-weight: 700; margin: 0 0 0.25rem 0; color: var(--term-back-color); }
          .card-back p { font-size: 13px; font-weight: 500; line-height: 1.3; color: var(--definition-color); margin: 0; flex: 1 1 0%; min-height: 0; overflow-y: auto;}
          .custom-scrollbar::-webkit-scrollbar { width: 2.5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgb(90, 162, 194); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.4); border-radius: 10px; }
          .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.4) rgb(90, 162, 194); }
          .pagination-controls { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 0.5rem 0; }
          .pagination-controls button { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background-color: white; color: #334155; font-weight: 600; border: none; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
          .pagination-controls button:hover:not(:disabled) { background-color: #f1f5f9; }
          .pagination-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
          .pagination-controls span { color: #475569; font-weight: 500; }
          .backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); opacity: 0; z-index: 40; display: none; }
          .focused-card-container { position: fixed; cursor: pointer; z-index: 50; display: none; transform-origin: top left; }
        </style>
      </head>
      <body>
        <div class="page-wrapper">
          <header class="header">
            <h1>Glosario Visual de Conceptos</h1>
            <div class="search-container">
              <div class="icon">${searchIconSvg}</div>
              <input type="search" id="glossary-search" placeholder="Buscar Concepto" />
            </div>
          </header>
          <div class="grid-container" id="grid-container">${glossaryEntries.map(generateCardHTML).join('')}
            <p class="no-results" id="no-results">No se encontraron resultados.</p>
          </div>
        </div>
        <div class="pagination-controls" id="pagination-controls" style="display: none;">
          <button id="prev-page">${chevronLeftSvg} Anterior</button>
          <span id="page-info"></span>
          <button id="next-page">Siguiente ${chevronRightSvg}</button>
        </div>
        <div id="backdrop" class="backdrop"></div>
        <div id="focused-card-container" class="focused-card-container"></div>
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            const ITEMS_PER_PAGE = 10;
            let currentPage = 1;
            const allCards = Array.from(document.querySelectorAll('.card-container'));
            const searchInput = document.getElementById('glossary-search');
            const noResultsEl = document.getElementById('no-results');
            const paginationControls = document.getElementById('pagination-controls');
            const prevButton = document.getElementById('prev-page');
            const nextButton = document.getElementById('next-page');
            const pageInfo = document.getElementById('page-info');
            const backdrop = document.getElementById('backdrop');
            const focusedCardContainer = document.getElementById('focused-card-container');
            let focusedCardElement = null;
            let filteredCards = allCards;

            function closeFocus() {
              if (!focusedCardElement) return;
              const originalCard = focusedCardElement;
              const startRect = originalCard.getBoundingClientRect();
              gsap.to(focusedCardContainer.querySelector('.card-flipper'), {
                rotationY: 0,
                duration: 0.7,
                ease: 'power3.inOut'
              });
              const tl = gsap.timeline({
                onComplete: () => {
                  originalCard.removeAttribute('data-hidden');
                  focusedCardContainer.style.display = 'none';
                  backdrop.style.display = 'none';
                  focusedCardContainer.innerHTML = '';
                  focusedCardElement = null;
                }
              });
              tl.to(backdrop, { opacity: 0, duration: 0.5 });
              tl.to(focusedCardContainer, {
                top: startRect.top + 'px',
                left: startRect.left + 'px',
                scale: 1,
                duration: 0.5,
                ease: 'power3.inOut',
              }, 0);
            }

            function openFocus(card) {
              if (focusedCardElement) return;
              focusedCardElement = card;
              card.setAttribute('data-hidden', 'true');
              focusedCardContainer.innerHTML = card.innerHTML;
              const p = focusedCardContainer.querySelector('p');
              if (p) p.addEventListener('click', e => e.stopPropagation());
              focusedCardContainer.addEventListener('click', closeFocus);
              const startRect = card.getBoundingClientRect();
              const scale = 2.5;
              const targetTop = window.innerHeight / 2 - (startRect.height * scale) / 2;
              const targetLeft = window.innerWidth / 2 - (startRect.width * scale) / 2;
              gsap.set(focusedCardContainer, {
                display: 'block',
                top: startRect.top + 'px',
                left: startRect.left + 'px',
                width: startRect.width + 'px',
                height: startRect.height + 'px',
                scale: 1,
              });
              backdrop.style.display = 'block';
              const tl = gsap.timeline();
              tl.to(backdrop, { opacity: 1, duration: 0.5 });
              tl.to(focusedCardContainer, {
                top: targetTop + 'px',
                left: targetLeft + 'px',
                scale: scale,
                duration: 0.5,
                ease: 'power3.inOut'
              }, 0);
              gsap.to(focusedCardContainer.querySelector('.card-flipper'), {
                rotationY: 180,
                duration: 0.7,
                ease: 'power3.inOut'
              });
            }
            
            backdrop.addEventListener('click', closeFocus);
            allCards.forEach(card => card.addEventListener('click', () => openFocus(card)));

            function renderPage() {
              const totalCards = filteredCards.length;
              const totalPages = Math.ceil(totalCards / ITEMS_PER_PAGE);
              if (totalCards === 0) {
                noResultsEl.style.display = 'block';
                paginationControls.style.display = 'none';
              } else {
                noResultsEl.style.display = 'none';
                paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
              }
              allCards.forEach(card => card.style.display = 'none');
              const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
              const pageCards = filteredCards.slice(startIndex, startIndex + ITEMS_PER_PAGE);
              pageCards.forEach(card => card.style.display = 'block');
              if (totalPages > 0) pageInfo.textContent = \`Página \${currentPage} de \${totalPages}\`;
              else pageInfo.textContent = '';
              prevButton.disabled = currentPage === 1;
              nextButton.disabled = currentPage === totalPages;
            }

            function handleSearch() {
              const query = searchInput.value.toLowerCase().trim();
              filteredCards = allCards.filter(card => card.dataset.term.includes(query) || card.dataset.definition.includes(query));
              currentPage = 1;
              renderPage();
            }

            searchInput.addEventListener('input', handleSearch);
            prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(); } });
            nextButton.addEventListener('click', () => { if (currentPage < Math.ceil(filteredCards.length / ITEMS_PER_PAGE)) { currentPage++; renderPage(); } });
            renderPage();
          });
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visual-glossary.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [glossaryEntries, colors]);


  return (
    <main className="main-container min-h-screen w-full flex items-center justify-center font-sans relative overflow-hidden" style={{backgroundColor: '#eef3f5'}}>
        <StyleEditor colors={colors} setColors={setColors} isVisible={showGrid} />

        <div ref={inputWrapperRef} className="input-wrapper absolute inset-0 z-20 flex items-center justify-center p-4">
            <div className="w-full flex flex-col items-center">
                <GlossaryInput onSubmit={handleGenerate} isLoading={isLoading} />
                {error && (
                    <div className="mt-4 p-4 bg-red-200 border border-red-400 text-red-800 rounded-lg max-w-2xl w-full text-center">
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>
        </div>
        
        <div ref={gridWrapperRef} className="grid-wrapper absolute inset-0 z-10 w-full h-full flex items-center justify-center p-4">
          <div className="w-full h-full max-w-7xl mx-auto flex flex-col gap-4">
             {showGrid && (
              <div className="flex-shrink-0 flex justify-between items-center gap-4 p-4 rounded-t-lg" style={{ backgroundColor: colors.containerBg }}>
                 <div className="flex items-center gap-4">
                  <button onClick={handleReset} className="py-2 px-5 bg-fuchsia-600 text-white font-bold rounded-lg hover:bg-fuchsia-500 transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg shadow-fuchsia-600/30">
                    Back to Start
                  </button>
                  <button onClick={handleDownload} className="py-2 px-5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg shadow-cyan-600/30">
                    Download HTML
                  </button>
                </div>
              </div>
            )}
            <div 
              className="flex-grow w-full overflow-y-auto"
              style={{ backgroundColor: colors.containerBg, ...(showGrid && {borderTop: '1px solid #d1dce5', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }) }}
            >
              {showGrid && (
                <div className="sticky top-0 z-10 p-4 bg-inherit border-b border-slate-300/80">
                  <div className="relative max-w-md mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="search"
                      placeholder="Buscar Concepto"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
              {paginatedEntries.length > 0 ? (
                <GlossaryGrid
                    entries={paginatedEntries}
                    colors={colors}
                    onCardClick={handleCardClick}
                    cardRefs={cardRefs}
                    flippedStates={flippedStates}
                    startIndex={startIndex}
                    focusedIndex={focusedIndex}
                 />
              ) : (
                showGrid && <div className="flex items-center justify-center h-full text-slate-500 text-xl p-8"><p>No results found for "{searchQuery}"</p></div>
              )}
            </div>
            
            {showGrid && totalPages > 1 && (
              <div className="flex-shrink-0 flex justify-center items-center gap-4 py-2">
                 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-2 py-2 px-4 bg-white text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span className="text-slate-600 font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-2 py-2 px-4 bg-white text-slate-700 font-semibold rounded-lg shadow-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {focusedIndex !== null && (
            <>
                <div 
                    ref={backdropRef} 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
                    style={{ opacity: 0 }}
                    onClick={handleCloseFocus}
                />
                <div
                    ref={focusedCardContainerRef}
                    className="fixed z-50"
                    style={{ transformOrigin: 'top left' }}
                >
                    <GlossaryCard
                        {...glossaryEntries[focusedIndex]}
                        colors={colors}
                        isFlipped={flippedStates[focusedIndex]}
                        onClick={handleCloseFocus}
                    />
                </div>
            </>
        )}
    </main>
  );
};

export default App;
