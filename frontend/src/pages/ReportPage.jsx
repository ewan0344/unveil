import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Printer,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Activity,
  Layers,
  Cpu,
  Brain,
  Sliders,
  FileCheck
} from 'lucide-react';
import ElaViewer from '../components/ElaViewer';
import AudioSpectrogram from '../components/AudioSpectrogram';
import KeyframeTimeline from '../components/KeyframeTimeline';

export default function ReportPage({ report, onNewAnalysis, onBack }) {
  if (!report) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <p className="font-mono text-white/50 text-sm">No analysis dossier loaded.</p>
          <button
            onClick={onNewAnalysis}
            className="px-6 py-2.5 rounded-full bg-orange-500 text-white font-mono text-xs font-bold"
          >
            Start New Verification
          </button>
        </div>
      </div>
    );
  }

  const {
    media_type,
    file_info = {},
    verdict,
    evidence_strength,
    heuristic_score,
    score_label,
    reasoning,
    limitations = [],
    measurements = [],
    forensic_signals = [],
    exif_metadata = {},
    ela_analysis,
    noise_analysis,
    frequency_analysis,
    waveform_data,
    spectral_analysis,
    integrity_metrics,
    temporal_metrics,
    spatial_metrics,
    keyframes,
    preview_object_url,
    analysis_id,
    ai_assisted_assessment
  } = report;

  // Visual styling for Verdict categories
  const getVerdictStyle = () => {
    switch (verdict) {
      case 'POTENTIALLY AI-GENERATED':
        return {
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
          titleColor: 'text-red-400',
          borderColor: 'border-red-500/30'
        };
      case 'POTENTIALLY MANIPULATED':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          titleColor: 'text-amber-400',
          borderColor: 'border-amber-500/30'
        };
      case 'LIKELY AUTHENTIC':
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          titleColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30'
        };
      default:
        return {
          badgeBg: 'bg-slate-700/50 text-slate-300 border-slate-600',
          titleColor: 'text-slate-300',
          borderColor: 'border-slate-700'
        };
    }
  };

  const style = getVerdictStyle();

  const getAnomalyBadge = (anomaly) => {
    switch (anomaly) {
      case 'High':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'Elevated':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Moderate':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `unveil_dossier_${analysis_id || 'case'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-mono text-xs text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onNewAnalysis}
              className="px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-mono text-xs font-bold transition-all shadow-md"
            >
              New Analysis
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. PRIMARY VERDICT BANNER                                                 */}
        {/* ========================================================================= */}
        <div className={`editorial-card p-6 sm:p-8 bg-[#111217] border ${style.borderColor} space-y-6 shadow-2xl`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 font-mono text-[11px] uppercase tracking-wider text-white font-bold">
                  {media_type} Forensics
                </span>
                
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-white/70">
                  Evidence Strength: <strong className="text-white">{evidence_strength}</strong>
                </span>

                <span className="font-mono text-[11px] text-white/40">
                  Case ID: {analysis_id ? analysis_id.slice(0, 8) : 'dossier'}
                </span>
              </div>

              {/* Honest Verdict Title */}
              <h1 className={`font-display font-black text-3xl sm:text-5xl tracking-tight uppercase ${style.titleColor}`}>
                {verdict}
              </h1>

              {/* Internal Heuristic Score Badge */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/50 border border-white/10 font-mono text-xs">
                  <span className="text-white/50">Internal Forensic Metric:</span>
                  <span className="text-orange-400 font-bold">{heuristic_score} / 100</span>
                </div>
                <p className="font-mono text-[11px] text-white/40 mt-1 italic">
                  {score_label}
                </p>
              </div>
            </div>

            {/* Artifact Specs Badge */}
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs space-y-1.5 min-w-[220px]">
              <div className="text-white/40 uppercase text-[10px] tracking-wider pb-1 border-b border-white/5">
                Analyzed Artifact
              </div>
              <div className="text-white font-bold truncate max-w-[200px]" title={file_info.filename}>
                {file_info.filename || 'media_file'}
              </div>
              {file_info.dimensions && (
                <div className="text-white/60">Resolution: {file_info.dimensions}</div>
              )}
              {file_info.duration_seconds && (
                <div className="text-white/60">Duration: {file_info.duration_seconds}s</div>
              )}
              {file_info.format && (
                <div className="text-white/60">Format: {file_info.format}</div>
              )}
            </div>

          </div>

          {/* "Why this verdict was reached" */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <h3 className="font-mono text-xs uppercase tracking-widest text-white/50 font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              <span>Why this verdict was reached</span>
            </h3>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-body bg-black/30 p-4 rounded-xl border border-white/5">
              {reasoning}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. LAYER 1: FORENSIC ANALYSIS (MEASURED PHYSICAL & MATHEMATICAL DOMAINS)  */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-xs text-orange-400 font-bold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>Forensic Analysis (Primary Empirical Layer)</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-white mt-0.5">
                Independent Forensic Measurements
              </h2>
            </div>
            <span className="font-mono text-xs text-white/50">
              {measurements.length} Domains Evaluated
            </span>
          </div>

          {/* Measurements Cards Grid: Distinctly Exposing OBSERVATION vs INTERPRETATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {measurements.map((m, idx) => (
              <div
                key={idx}
                className="editorial-card p-5 bg-[#121319] border border-white/10 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-white">{m.domain}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold border ${getAnomalyBadge(m.anomaly)}`}>
                      {m.anomaly} Anomaly
                    </span>
                  </div>

                  {/* OBSERVATION */}
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 font-mono text-xs text-white/80 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-orange-400/90 font-bold block">
                      Observation
                    </span>
                    <p className="text-white/80">{m.observation}</p>
                  </div>

                  {/* INTERPRETATION */}
                  <div className="font-mono text-xs text-white/60 space-y-1 pt-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold block">
                      Forensic Interpretation
                    </span>
                    <p className="leading-relaxed">{m.interpretation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. LAYER 2: AI-ASSISTED VISUAL ASSESSMENT (SECONDARY LAYER)               */}
        {/* ========================================================================= */}
        <div className="editorial-card p-6 bg-[#101217] border border-sky-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-sky-400 font-bold block">
                  Secondary Layer
                </span>
                <h3 className="font-display font-bold text-lg text-white">
                  AI-Assisted Visual Assessment (Gemini Vision)
                </h3>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] ${
              ai_assisted_assessment?.available
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-white/5 text-white/40 border border-white/10'
            }`}>
              {ai_assisted_assessment?.status || 'Offline'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-white/70 font-body leading-relaxed">
            {ai_assisted_assessment?.summary || "AI-assisted visual assessment provides semantic critique of lighting, anatomy, and rendering textures when enabled. The primary empirical forensic measurements operate independently."}
          </p>

          {ai_assisted_assessment?.available && ai_assisted_assessment?.visual_inconsistencies?.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-sky-300 font-bold block">
                Observed Visual Contradictions:
              </span>
              <ul className="space-y-1 font-mono text-xs text-white/80 list-disc list-inside">
                {ai_assisted_assessment.visual_inconsistencies.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 font-mono text-[11px] text-white/40 border-t border-white/5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>Distinction: Forensic measurements examine digital bitstream physics; AI-assisted analysis evaluates visual semantic plausibility.</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. INTERACTIVE FORENSIC VISUALIZATION SUITE                               */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-xl text-white">
            Forensic Inspection Tools
          </h3>

          {/* IMAGE: ELA Slider */}
          {media_type === 'image' && (
            <ElaViewer
              originalSrc={preview_object_url || '/samples/ai_portrait.jpg'}
              elaSrc={ela_analysis?.preview_base64}
              metrics={ela_analysis}
            />
          )}

          {/* AUDIO: Spectrogram & Waveform */}
          {media_type === 'audio' && (
            <AudioSpectrogram
              audioSrc={preview_object_url || '/samples/synthetic_voice.wav'}
              waveformData={waveform_data}
              spectralData={spectral_analysis}
              integrityData={integrity_metrics}
            />
          )}

          {/* VIDEO: Keyframes */}
          {media_type === 'video' && (
            <KeyframeTimeline
              keyframes={keyframes}
              temporalMetrics={temporal_metrics}
              spatialMetrics={spatial_metrics}
            />
          )}
        </div>

        {/* ========================================================================= */}
        {/* 5. METADATA & CONTAINER PROVENANCE TABLE                                  */}
        {/* ========================================================================= */}
        <div className="editorial-card p-6 bg-[#111217] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-display font-bold text-lg text-white">
              Container & EXIF Header Provenance
            </h3>
            <span className="font-mono text-xs text-white/50">
              {Object.keys(exif_metadata).length} Headers Extracted
            </span>
          </div>

          {Object.keys(exif_metadata).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              {Object.entries(exif_metadata).slice(0, 12).map(([k, v], idx) => (
                <div key={idx} className="p-2.5 rounded bg-black/40 border border-white/5">
                  <span className="text-white/40 block text-[10px]">{k}</span>
                  <span className="text-white font-medium truncate block">{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-black/30 border border-white/5 font-mono text-xs text-white/50 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Zero hardware camera EXIF metadata detected. (Observation note: Web uploads, social media re-encodings, and direct AI generations omit physical sensor headers).
              </span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. SCIENTIFIC LIMITATIONS                                                 */}
        {/* ========================================================================= */}
        <div className="editorial-card p-6 bg-[#0e0f13] border border-white/10 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Forensic Limitations & Integrity Notice</span>
          </div>
          <ul className="space-y-1.5 font-mono text-xs text-white/60 list-disc list-inside">
            {limitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
