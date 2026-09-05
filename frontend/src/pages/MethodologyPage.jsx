import React from 'react';
import { Search, Brain, GitFork, ShieldCheck, ArrowRight, Layers, FileCheck } from 'lucide-react';

export default function MethodologyPage({ setActivePage }) {
  return (
    <div className="min-h-screen bg-[#0a0b0e] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header Block */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
            <span>Investigative Standards</span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
            The UNVEIL Methodology
          </h1>
          <p className="font-display text-xl sm:text-2xl text-white/80 italic">
            “Reveal what’s behind the media.”
          </p>
          <p className="text-base sm:text-lg text-white/60 font-body leading-relaxed">
            Media forensics is not a binary game of true or false. It is the scientific measurement of structural inconsistencies, compression artifacts, and hardware sensor traces. UNVEIL structures verification into four disciplined stages.
          </p>
        </div>

        {/* The 4 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Pillar 1: DETECT */}
          <div className="editorial-card p-8 bg-[#121319] border border-white/10 space-y-4 relative overflow-hidden">
            <div className="font-mono text-4xl font-black text-orange-500/40">01</div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-2xl text-white">
                DETECT
              </h3>
              <p className="font-mono text-xs uppercase tracking-wider text-orange-400">
                Identify Forensic Signals
              </p>
            </div>
            <p className="text-sm text-white/70 leading-relaxed font-body">
              We apply multi-domain mathematical transforms to the raw bitstream. For imagery, this includes Error Level Analysis (ELA) to identify disparate JPEG compression histories, noise floor variance mapping to isolate over-smoothed diffusion patches, and 2D Fourier transforms to catch deconvolution grid peaks.
            </p>
            <div className="pt-2 font-mono text-xs text-white/40">
              Keywords: ELA, PRNU Noise Floor, 2D FFT, Vocoder Brickwall Cutoff, Optical Flow
            </div>
          </div>

          {/* Pillar 2: EXPLAIN */}
          <div className="editorial-card p-8 bg-[#121319] border border-white/10 space-y-4 relative overflow-hidden">
            <div className="font-mono text-4xl font-black text-[#2ED573]/40">02</div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-2xl text-white">
                EXPLAIN
              </h3>
              <p className="font-mono text-xs uppercase tracking-wider text-[#2ED573]">
                Translate Technical Findings
              </p>
            </div>
            <p className="text-sm text-white/70 leading-relaxed font-body">
              Raw spectral data is meaningless without context. UNVEIL demystifies forensic indicators into clear, transparent English. We explain exactly why a signal was triggered—whether it is a vocoder cutoff characteristic of cloned audio or benign multi-pass compression from social media reposts.
            </p>
            <div className="pt-2 font-mono text-xs text-white/40">
              Keywords: Plain-English Rationale, Signal Breakdown, Transparent Reasoning
            </div>
          </div>

          {/* Pillar 3: TRACE */}
          <div className="editorial-card p-8 bg-[#121319] border border-white/10 space-y-4 relative overflow-hidden">
            <div className="font-mono text-4xl font-black text-[#82B1FF]/40">03</div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-2xl text-white">
                TRACE
              </h3>
              <p className="font-mono text-xs uppercase tracking-wider text-[#82B1FF]">
                Examine Provenance & Hardware
              </p>
            </div>
            <p className="text-sm text-white/70 leading-relaxed font-body">
              We inspect structural container headers and EXIF markers for physical camera sensors, lens geometry, or known AI generation parameters (e.g. ComfyUI workflows, Stable Diffusion seeds, NovelAI chunks). When metadata is stripped, we explicitly highlight the absence of provenance.
            </p>
            <div className="pt-2 font-mono text-xs text-white/40">
              Keywords: EXIF Hardware Signature, C2PA Content Credentials, Container Headers
            </div>
          </div>

          {/* Pillar 4: VERIFY */}
          <div className="editorial-card p-8 bg-[#121319] border border-white/10 space-y-4 relative overflow-hidden">
            <div className="font-mono text-4xl font-black text-white/20">04</div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-2xl text-white">
                VERIFY
              </h3>
              <p className="font-mono text-xs uppercase tracking-wider text-white/70">
                Empower Informed Fact-Checking
              </p>
            </div>
            <p className="text-sm text-white/70 leading-relaxed font-body">
              UNVEIL rejects black-box certainty scores. Our verdicts (POTENTIALLY AI-GENERATED, POTENTIALLY MANIPULATED, LIKELY AUTHENTIC, INCONCLUSIVE) pair with explicit evidence strength metrics, equipping journalists, researchers, and citizens with the proof they need before publishing or sharing.
            </p>
            <div className="pt-2 font-mono text-xs text-white/40">
              Keywords: Evidence Strength, Honest Verdicts, Newsroom Standard
            </div>
          </div>

        </div>

        {/* CTA Banner */}
        <div className="p-10 rounded-2xl bg-gradient-to-r from-orange-950/40 via-black to-black border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="font-display font-black text-2xl text-white">
              Ready to verify a piece of media?
            </h3>
            <p className="font-mono text-xs text-white/60">
              Test an image, audio clip, or video against our forensic verification pipeline.
            </p>
          </div>
          <button
            onClick={() => setActivePage('analyze')}
            className="px-8 py-3.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-display font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 shrink-0"
          >
            Launch Workspace →
          </button>
        </div>

      </div>
    </div>
  );
}
