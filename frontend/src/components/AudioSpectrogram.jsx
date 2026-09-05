import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertTriangle, CheckCircle2, Activity, Info } from 'lucide-react';

export default function AudioSpectrogram({ audioSrc, waveformData = [], spectralData = {}, integrityData = {} }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 1);
    }
  };

  const handleSeek = (fraction) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = fraction * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const hasVocoder = spectralData?.has_vocoder_cutoff;
  const cutoffFreq = spectralData?.cutoff_hz || 16000;

  return (
    <div className="editorial-card p-6 bg-[#121318] border border-white/10 space-y-6">
      {/* Hidden audio element if source available */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#2ED573] font-bold">
            Forensic Signal 02
          </span>
          <h3 className="font-display font-bold text-xl text-white">
            Acoustic Waveform & Spectral Forensics
          </h3>
        </div>

        {hasVocoder ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Neural Vocoder Cutoff Detected ({cutoffFreq} Hz)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Broadband Acoustic Dispersion</span>
          </div>
        )}
      </div>

      {/* 1. Waveform Interactive Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-xs text-white/50">
          <span>Waveform Envelope</span>
          <span>{currentTime.toFixed(1)}s / {duration ? `${duration.toFixed(1)}s` : '—'}</span>
        </div>

        <div className="relative h-28 bg-black/60 rounded-xl border border-white/10 p-3 flex items-center gap-1 overflow-hidden">
          {/* Waveform Bars */}
          {waveformData.length > 0 ? (
            waveformData.map((val, idx) => {
              const progress = duration > 0 ? currentTime / duration : 0;
              const barFraction = idx / waveformData.length;
              const isPast = barFraction <= progress;

              return (
                <div
                  key={idx}
                  onClick={() => handleSeek(barFraction)}
                  className="flex-1 h-full flex items-center justify-center cursor-pointer group"
                >
                  <div
                    className={`w-full rounded-sm transition-all ${
                      isPast
                        ? 'bg-[#2ED573]'
                        : 'bg-white/25 group-hover:bg-white/50'
                    }`}
                    style={{ height: `${Math.max(8, val * 100)}%` }}
                  ></div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center font-mono text-xs text-white/40">
              Generating waveform profile...
            </div>
          )}

          {/* Scrub line indicator */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#2ED573] pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            ></div>
          )}
        </div>

        {/* Audio controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={togglePlay}
            disabled={!audioSrc}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Playback' : 'Play Audio'}</span>
          </button>
          <span className="font-mono text-xs text-white/40">
            Click on waveform bars to seek
          </span>
        </div>
      </div>

      {/* 2. Frequency Spectral Energy Distribution */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between font-mono text-xs text-white/50">
          <span>Frequency Spectrum Energy Distribution (20 Hz - 22,050 Hz)</span>
          <span className="text-white/60">Fast Fourier Transform</span>
        </div>

        {/* Frequency Energy Bars */}
        <div className="h-20 bg-black/40 rounded-xl border border-white/10 p-3 flex items-end gap-2">
          {(spectralData?.spectrum_bars || [20, 45, 60, 80, 75, 65, 50, 40, 30, 25, 15, 10, 5, 2, 1, 0]).map((val, idx) => {
            const isHighBand = idx >= 11; // High frequencies > 16kHz
            const isCutoff = hasVocoder && isHighBand;

            return (
              <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    isCutoff
                      ? 'bg-red-500/30 border-t-2 border-red-500'
                      : 'bg-gradient-to-t from-emerald-500/40 to-emerald-400'
                  }`}
                  style={{ height: `${Math.max(4, val)}%` }}
                ></div>
                <span className="font-mono text-[8px] text-white/30 hidden sm:block">
                  {idx === 0 ? '100' : idx === 8 ? '8k' : idx === 11 ? '16k' : idx === 15 ? '22k' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Spectral Centroid</span>
          <span className="text-base font-bold text-white">
            {spectralData?.centroid_hz ? `${spectralData.centroid_hz} Hz` : '—'}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">95% Rolloff Frequency</span>
          <span className="text-base font-bold text-white">
            {spectralData?.rolloff_hz ? `${spectralData.rolloff_hz} Hz` : '—'}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Dead Silence Ratio</span>
          <span className={`text-base font-bold ${integrityData?.silence_ratio > 0.08 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {integrityData?.silence_ratio !== undefined ? `${(integrityData.silence_ratio * 100).toFixed(1)}%` : '—'}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono">
          <span className="text-[11px] text-white/40 block">Splice Discontinuities</span>
          <span className="text-base font-bold text-white">
            {integrityData?.splice_discontinuities ?? 0}
          </span>
        </div>
      </div>

      {/* Forensic interpretation guidance */}
      <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/60 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#2ED573] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Acoustic Forensic Note:</strong> Physical microphones capture pervasive atmospheric room reflections and thermal circuit noise across all frequencies. Neural speech generators and voice-cloning vocoders (FastSpeech, ElevenLabs, VITS) operate within bandlimited mel-spectrograms (often 16 kHz or 22.05 kHz). Abrupt disappearance of energy above 16 kHz or absolute mathematical silence (0.0000 amplitude) between words strongly indicates synthetic rendering.
        </div>
      </div>
    </div>
  );
}
