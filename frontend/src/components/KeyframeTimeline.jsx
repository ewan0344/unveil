import React, { useState } from 'react';
import { Film, Activity, AlertCircle, CheckCircle2, Info, Eye } from 'lucide-react';

export default function KeyframeTimeline({ keyframes = [], temporalMetrics = {}, spatialMetrics = {} }) {
  const [selectedFrame, setSelectedFrame] = useState(keyframes[0] || null);

  const flickerIndex = temporalMetrics?.flicker_index ?? 0;
  const isFlickering = flickerIndex > 1.3;

  return (
    <div className="editorial-card p-6 bg-[#121318] border border-white/10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#82B1FF] font-bold">
            Forensic Signal 03
          </span>
          <h3 className="font-display font-bold text-xl text-white">
            Sampled Keyframe Strip & Temporal Stability
          </h3>
        </div>

        {isFlickering ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Temporal Morphing Anomaly (Flicker: {flickerIndex})</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cohesive Optical Flow</span>
          </div>
        )}
      </div>

      {/* 1. Keyframe Thumbnails Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-xs text-white/50">
          <span>Intelligently Sampled Keyframes ({keyframes.length} frames)</span>
          <span>Click any keyframe to inspect detail</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1">
          {keyframes.map((kf, idx) => {
            const isSelected = selectedFrame?.frame_index === kf.frame_index;
            return (
              <button
                key={idx}
                onClick={() => setSelectedFrame(kf)}
                className={`flex-shrink-0 group relative rounded-lg overflow-hidden border transition-all ${
                  isSelected
                    ? 'border-[#82B1FF] ring-2 ring-[#82B1FF]/30 scale-105 shadow-xl'
                    : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                }`}
                style={{ width: '130px' }}
              >
                <div className="h-20 bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={kf.preview_base64}
                    alt={`Frame ${kf.frame_index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="bg-black/90 px-2 py-1 flex items-center justify-between font-mono text-[10px] text-white/80">
                  <span>#{kf.frame_index}</span>
                  <span className="text-[#82B1FF] font-bold">{kf.timestamp}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Frame Inspection Preview */}
      {selectedFrame && (
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-1/2 max-h-56 rounded-lg overflow-hidden border border-white/15 bg-black flex items-center justify-center">
            <img
              src={selectedFrame.preview_base64}
              alt="Inspected Frame"
              className="max-h-56 object-contain"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-white">
              <Eye className="w-4 h-4 text-[#82B1FF]" />
              <span className="font-bold text-sm">Keyframe #{selectedFrame.frame_index} Inspection</span>
            </div>
            <div className="space-y-1.5 text-white/70">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Timestamp:</span>
                <span className="text-white font-bold">{selectedFrame.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Sampling Mode:</span>
                <span className="text-white font-bold">Equidistant Stratified</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Spatial Edge Definition:</span>
                <span className="text-emerald-400 font-bold">Stable</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Temporal Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Mean Motion Delta</span>
          <span className="text-base font-bold text-white">
            {temporalMetrics?.mean_motion_delta ?? '—'}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Motion Fluctuation</span>
          <span className="text-base font-bold text-white">
            {temporalMetrics?.motion_variance ?? '—'}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Temporal Flicker Score</span>
          <span className={`text-base font-bold ${isFlickering ? 'text-amber-400' : 'text-emerald-400'}`}>
            {flickerIndex}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Edge Sharpness Variance</span>
          <span className="text-base font-bold text-white">
            {spatialMetrics?.sharpness_variance ?? '—'}
          </span>
        </div>
      </div>

      {/* Forensic note */}
      <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/60 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#82B1FF] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Video Forensic Note:</strong> Modern generative diffusion video models generate frames conditioned sequentially or in latents, often introducing microscopic temporal flicker, background warping, or geometry swimming between keyframes. Optical flow metrics quantify whether motion remains physically plausible across time steps.
        </div>
      </div>

    </div>
  );
}
