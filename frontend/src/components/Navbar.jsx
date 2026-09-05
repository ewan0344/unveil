import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, backendStatus }) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0a0b0e]/85 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: UNVEIL Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('landing')}
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="UNVEIL Home"
          >
            <div className="w-9 h-9 rounded-full bg-white text-black font-display font-black text-sm flex items-center justify-center tracking-tighter group-hover:scale-105 transition-transform shadow-lg">
              U·V
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-black text-xl tracking-tight text-white leading-none">
                UNVEIL
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/50 leading-tight">
                Forensics Lab
              </span>
            </div>
          </button>

          {/* Backend Status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${backendStatus?.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-white/60">
              {backendStatus?.healthy ? 'Engine Online' : 'Engine Ready'}
            </span>
          </div>
        </div>

        {/* Right: The ONLY navigation on the platform */}
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main Navigation">
          <button
            onClick={() => setActivePage('landing')}
            className={`font-mono text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg font-bold transition-all ${
              activePage === 'landing'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => setActivePage('analyze')}
            className={`font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-lg font-bold transition-all ${
              activePage === 'analyze'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            Analyze Media
          </button>

          <button
            onClick={() => setActivePage('methodology')}
            className={`font-mono text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg font-bold transition-all ${
              activePage === 'methodology'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Methodology
          </button>

          <button
            onClick={() => setActivePage('cases')}
            className={`font-mono text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg font-bold transition-all ${
              activePage === 'cases'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Cases Archive
          </button>
        </nav>

      </div>
    </header>
  );
}
