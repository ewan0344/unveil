import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Search, Cpu, FileSearch, ShieldAlert, BarChart3 } from 'lucide-react';

const STAGES = [
  { id: 1, title: "Inspecting file container", desc: "Validating magic bytes, stream boundaries, and format integrity", icon: FileSearch },
  { id: 2, title: "Analyzing metadata & headers", desc: "Parsing EXIF hardware signatures, software tags, and codec profiles", icon: Search },
  { id: 3, title: "Examining forensic signals", desc: "Computing ELA recompression deltas, noise floors, and spectral distributions", icon: Cpu },
  { id: 4, title: "Checking consistency", desc: "Evaluating spatial/temporal cohesion, vocoder cutoffs, or frame warping", icon: ShieldAlert },
  { id: 5, title: "Preparing verification report", desc: "Synthesizing evidence strength, transparent reasoning, and limitations", icon: BarChart3 },
];

export default function AnalysisProgress({ currentStage = 1, mediaType = "image" }) {
  return (
    <div className="w-full max-w-2xl mx-auto editorial-card p-8 bg-[#0f1014] border border-orange-500/30 shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-orange-400 font-bold">
              Forensics Pipeline Active
            </span>
          </div>
          <h3 className="font-display font-black text-2xl text-white mt-1">
            Analyzing {mediaType.toUpperCase()} Media
          </h3>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs text-white/40">Step {currentStage} of 5</span>
          <div className="font-mono text-sm text-white font-bold">{Math.round((currentStage / 5) * 100)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden my-6">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-emerald-400 to-sky-400 transition-all duration-500 ease-out"
          style={{ width: `${(currentStage / 5) * 100}%` }}
        ></div>
      </div>

      {/* Stepper list */}
      <div className="space-y-4">
        {STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-white/10 border-orange-500/60 shadow-lg scale-[1.01]'
                  : isDone
                  ? 'bg-white/[0.02] border-emerald-500/20 text-white/80'
                  : 'bg-transparent border-transparent text-white/30'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/5 text-white/30 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-display font-bold ${isCurrent ? 'text-white' : isDone ? 'text-white/90' : 'text-white/40'}`}>
                    {stage.title}
                  </h4>
                  {isCurrent && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-orange-400 px-2 py-0.5 rounded bg-orange-500/10">
                      Processing
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-white/50 mt-0.5">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 text-center font-mono text-xs text-white/40">
        Empirical calculations running locally. No data retained or fed into third-party AI training.
      </div>
    </div>
  );
}
