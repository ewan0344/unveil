import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Cpu, Eye, Activity, FileText, CheckCircle2 } from 'lucide-react';
import { BENCHMARK_CASES } from '../services/sampleCases';

export default function LandingPage({ setActivePage, onSelectBenchmark }) {
  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: VISUAL INSPIRATION WITH EXACT GIRL AS CENTERPIECE         */}
      {/* ========================================================================= */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        
        {/* Main Editorial Hero Container */}
        <div className="relative rounded-3xl overflow-hidden bg-[#111217] border border-white/10 shadow-2xl">
          
          {/* Visual Centerpiece: The exact girl image from the reference */}
          <div className="relative w-full min-h-[460px] md:min-h-[560px] flex flex-col justify-end overflow-hidden">
            
            {/* The Girl Photo - Authentic Reference Centerpiece with NO old website buttons or pills */}
            <img
              src="/assets/unveil_girl_core.jpg"
              alt="UNVEIL Forensic Visual Reference"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none filter brightness-95 contrast-105"
            />

            {/* Editorial Vignette & Contrast Layers */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e]/50 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none"></div>

            {/* Digital Forensics Overlay HUD (Top Right & Left) */}
            <div className="absolute top-6 left-6 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 font-mono text-[11px] text-white/80">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span>FORENSIC VERIFICATION SUITE</span>
            </div>

            <div className="absolute top-6 right-6 hidden md:flex items-center gap-3 font-mono text-[11px] text-white/60 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
              <span>PRNU Sensor Noise: <strong>Monitored</strong></span>
              <span>•</span>
              <span>2D FFT Lattice: <strong>Active</strong></span>
            </div>

            {/* Hero Main Content Block */}
            <div className="relative z-10 p-6 sm:p-10 md:p-12 space-y-6 max-w-4xl">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-POWERED MEDIA VERIFICATION</span>
              </div>

              {/* Monumental Headline */}
              <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-tight text-white uppercase leading-none select-none">
                UNVEIL
              </h1>

              {/* Tagline */}
              <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white/95 italic leading-tight">
                “Reveal what’s behind the media.”
              </h2>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-white/80 font-body leading-relaxed max-w-2xl">
                Investigate images, audio, and video for signs of AI generation or manipulation before trusting or sharing them.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={() => setActivePage('analyze')}
                  className="px-8 py-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-display font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5"
                >
                  <span>ANALYZE MEDIA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActivePage('methodology')}
                  className="px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <span>HOW IT WORKS</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. THREE INVESTIGATIVE MODES (IMAGE, AUDIO, VIDEO)                        */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-orange-400 font-bold">
              Core Capabilities
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white mt-1">
              Multi-Modal Forensic Modalities
            </h2>
          </div>
          <p className="text-sm font-mono text-white/50 max-w-md">
            Empirical measurements examining sensor physics, frequency deconvolution, and temporal continuity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          
          {/* Card 1: IMAGE */}
          <div className="editorial-card p-6 bg-[#121319] border border-white/10 hover:border-orange-500/50 flex flex-col justify-between group transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono font-bold text-lg">
                IMG
              </div>
              <h3 className="font-display font-bold text-2xl text-white group-hover:text-orange-400 transition-colors">
                Image Forensics
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-body">
                Evaluates physical Poisson shot-noise correlation, 2D FFT radial power decay exponent, gradient sharpness disparity, and 8x8 DCT Error Level Analysis (ELA).
              </p>
              <ul className="font-mono text-xs text-white/50 space-y-1.5 pt-2">
                <li>• Sensor Shot-Noise Correlation</li>
                <li>• 2D Fourier Lattice Spikes</li>
                <li>• Gradient Kurtosis Disparity</li>
                <li>• EXIF Hardware Provenance</li>
              </ul>
            </div>

            <button
              onClick={() => setActivePage('analyze')}
              className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-orange-400 group-hover:text-orange-300 font-bold"
            >
              <span>Analyze Image Media</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 2: AUDIO */}
          <div className="editorial-card p-6 bg-[#121319] border border-white/10 hover:border-emerald-500/50 flex flex-col justify-between group transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-lg">
                AUD
              </div>
              <h3 className="font-display font-bold text-2xl text-white group-hover:text-emerald-400 transition-colors">
                Audio Forensics
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-body">
                Detects neural vocoder brickwall cutoff filters (16kHz / 22kHz truncation typical of FastSpeech & ElevenLabs), zero-floor silence gaps, and waveform phase jumps.
              </p>
              <ul className="font-mono text-xs text-white/50 space-y-1.5 pt-2">
                <li>• Neural Vocoder Filter Cutoffs</li>
                <li>• Mathematical Zero-Floor Silence</li>
                <li>• Spectral Centroid & Rolloff</li>
                <li>• Waveform Envelope Discontinuities</li>
              </ul>
            </div>

            <button
              onClick={() => setActivePage('analyze')}
              className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-emerald-400 group-hover:text-emerald-300 font-bold"
            >
              <span>Analyze Audio Media</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 3: VIDEO */}
          <div className="editorial-card p-6 bg-[#121319] border border-white/10 hover:border-sky-500/50 flex flex-col justify-between group transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-lg">
                VID
              </div>
              <h3 className="font-display font-bold text-2xl text-white group-hover:text-sky-400 transition-colors">
                Video Forensics
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-body">
                Stratified keyframe sampling, frame-to-frame optical flow delta, temporal flicker index quantification, and spatial edge definition stability.
              </p>
              <ul className="font-mono text-xs text-white/50 space-y-1.5 pt-2">
                <li>• Stratified Keyframe Extraction</li>
                <li>• Temporal Consistency Index</li>
                <li>• Spatial Sharpness Stability</li>
                <li>• Codec & GOP Structure Integrity</li>
              </ul>
            </div>

            <button
              onClick={() => setActivePage('analyze')}
              className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-sky-400 group-hover:text-sky-300 font-bold"
            >
              <span>Analyze Video Media</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. EDITORIAL INVESTIGATIVE COLUMN                                         */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111216] border border-white/10 relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-orange-400 font-bold">
                Scientific Integrity Notice
              </span>
              <h3 className="font-display font-bold text-3xl sm:text-4xl text-white">
                Observation vs. Interpretation
              </h3>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed font-body">
                Commercial detectors that output fake certainty numbers (like "98.4% AI-generated") collapse under real-world scrutiny. Real media verification requires isolating measurable physical traces and providing clear human reasoning.
              </p>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed font-body">
                UNVEIL separates mathematical <strong>Observations</strong> (exact noise variance, frequency slope beta, ELA discrepancies) from <strong>Interpretations</strong>, ensuring fact-checkers understand what the data truly indicates.
              </p>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-widest text-white/60 font-bold">
                Honest Verification Categories
              </h4>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 flex items-center justify-between">
                  <span>POTENTIALLY AI-GENERATED</span>
                  <span className="text-[10px] text-red-400">Multiple Concurring Anomalies</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 flex items-center justify-between">
                  <span>POTENTIALLY MANIPULATED</span>
                  <span className="text-[10px] text-amber-400">Local Splicing / ELA Discrepancy</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                  <span>LIKELY AUTHENTIC</span>
                  <span className="text-[10px] text-emerald-400">Optical Sensor Provenance</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-between">
                  <span>INCONCLUSIVE</span>
                  <span className="text-[10px] text-slate-400">Degraded or Ambiguous Data</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CURATED BENCHMARK DOSSIERS                                             */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-white/50 font-bold">
              Benchmark Archive
            </span>
            <h2 className="font-display font-black text-3xl text-white mt-1">
              Curated Forensic Case Files
            </h2>
          </div>
          <button
            onClick={() => setActivePage('cases')}
            className="text-xs font-mono text-orange-400 hover:text-orange-300 underline underline-offset-4"
          >
            Browse Full Case Archive →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {BENCHMARK_CASES.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectBenchmark(item.id)}
              className="editorial-card p-5 bg-[#121318] border border-white/10 hover:border-white/30 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-white/50 pb-3 border-b border-white/5">
                <span className="uppercase text-orange-400 font-bold">[{item.type}]</span>
                <span>{item.date}</span>
              </div>

              <div className="py-4 space-y-2">
                <h4 className="font-display font-bold text-lg text-white group-hover:text-orange-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-[11px] text-white/70">
                  {item.verdict}
                </span>
                <span className="text-xs font-mono text-orange-400 group-hover:translate-x-1 transition-transform">
                  Inspect →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
