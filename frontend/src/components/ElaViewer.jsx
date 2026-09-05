import React, { useState, useRef, useEffect } from 'react';
import { Eye, Sliders, Info, SplitSquareVertical } from 'lucide-react';

export default function ElaViewer({ originalSrc, elaSrc, metrics }) {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handlePointerMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const onMove = (e) => handlePointerMove(e);
    const onUp = () => handlePointerUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return (
    <div className="editorial-card p-6 bg-[#121318] border border-white/10 space-y-4">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-orange-400 font-bold">
              Forensic Signal 01
            </span>
          </div>
          <h3 className="font-display font-bold text-xl text-white">
            Error Level Analysis (ELA)
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-white/10 text-xs font-mono">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1.5 rounded transition-all ${
              viewMode === 'slider' ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'
            }`}
          >
            Split Slider
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded transition-all ${
              viewMode === 'side-by-side' ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          className="relative h-[380px] sm:h-[480px] w-full rounded-xl overflow-hidden cursor-ew-resize select-none bg-black border border-white/10"
        >
          {/* Base Layer: ELA */}
          <img
            src={elaSrc || originalSrc}
            alt="ELA Heatmap"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/80 border border-white/20 font-mono text-[11px] text-orange-400 font-bold">
            ELA Heatmap (Error Amplified 15x)
          </div>

          {/* Top Layer: Original Clipped */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={originalSrc}
              alt="Original Media"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%', maxWidth: 'none' }}
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 border border-white/20 font-mono text-[11px] text-white font-bold">
              Original Media
            </div>
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 shadow-[0_0_12px_rgba(255,87,34,0.8)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xl border-2 border-black">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="font-mono text-xs text-white/60 block">Original Source</span>
            <div className="h-[320px] rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
              <img src={originalSrc} alt="Original Source" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-mono text-xs text-orange-400 block">Error Level Analysis (15x Amplified)</span>
            <div className="h-[320px] rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
              <img src={elaSrc || originalSrc} alt="ELA Source" className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Mean Error</span>
          <span className="text-base font-bold text-white">{metrics?.mean_error ?? '—'}</span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Max Pixel Error</span>
          <span className="text-base font-bold text-white">{metrics?.max_error ?? '—'}</span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Block Discrepancy</span>
          <span className={`text-base font-bold ${metrics?.block_discrepancy > 4.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {metrics?.block_discrepancy ?? '—'}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Quantization Uniformity</span>
          <span className="text-base font-bold text-white">
            {metrics?.block_discrepancy > 4.0 ? 'Disparate' : 'Cohesive'}
          </span>
        </div>
      </div>

      {/* Forensic interpretation guidance */}
      <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/60 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Forensic Note:</strong> Error Level Analysis measures how much pixels change when re-saved at a known 90% JPEG quality. In an unmodified physical photo, high-frequency textured areas and uniform areas degrade predictably. If parts of the image glow with sharp contrast while adjacent areas remain dark, it suggests differing compression histories (e.g. composited layers or localized AI inpainting).
        </div>
      </div>
    </div>
  );
}
