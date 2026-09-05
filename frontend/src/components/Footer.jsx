import React from 'react';
import { Shield, AlertCircle, ExternalLink } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="border-t border-white/10 bg-black/90 text-white/70 py-16 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        
        {/* Brand & Mission */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white text-black font-display font-black text-xs flex items-center justify-center">
              U·V
            </div>
            <span className="font-display font-black text-xl text-white tracking-tight">
              UNVEIL
            </span>
          </div>
          <p className="font-display text-lg text-white font-medium italic">
            “Reveal what’s behind the media.”
          </p>
          <p className="text-sm text-white/60 leading-relaxed max-w-md">
            An open forensic standard for digital media verification. Built for investigative newsrooms, independent researchers, and fact-checkers examining synthetic anomalies across image, audio, and video formats.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              Non-Deceptive Forensic Principles
            </span>
          </div>
        </div>

        {/* Navigation columns */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-mono text-xs uppercase tracking-widest text-white font-semibold">
            Forensic Workspace
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => setActivePage('analyze')} className="hover:text-white transition-colors">
                Image Error Level Analysis
              </button>
            </li>
            <li>
              <button onClick={() => setActivePage('analyze')} className="hover:text-white transition-colors">
                Audio Spectral & Vocoder Audit
              </button>
            </li>
            <li>
              <button onClick={() => setActivePage('analyze')} className="hover:text-white transition-colors">
                Video Frame Sampling & Flow
              </button>
            </li>
            <li>
              <button onClick={() => setActivePage('cases')} className="hover:text-white transition-colors">
                Investigative Benchmark Archive
              </button>
            </li>
          </ul>
        </div>

        {/* Disclosure & Standards */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="font-mono text-xs uppercase tracking-widest text-white font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Integrity & Scientific Disclosure
          </h4>
          <p className="text-xs text-white/50 leading-relaxed">
            UNVEIL measures empirical mathematical artifacts (compression block errors, noise floor uniformity, spectral cutoff filters, and frame warping). We categorically reject fabricated certainty percentages. All assessments represent investigative indicators to guide human fact-checking.
          </p>
          <div className="pt-2 font-mono text-xs text-white/40">
            Internal forensic evidence score — not a scientifically validated probability.
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40">
        <div>© 2026 UNVEIL VERIFICATION PLATFORM. DESKTOP-FIRST DIGITAL FORENSICS.</div>
        <div className="flex items-center gap-4">
          <button onClick={() => setActivePage('methodology')} className="hover:text-white underline underline-offset-4">
            Methodology & Whitepaper
          </button>
          <span>•</span>
          <span>Zero Data Retention</span>
        </div>
      </div>
    </footer>
  );
}
