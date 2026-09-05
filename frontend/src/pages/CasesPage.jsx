import React, { useState, useEffect } from 'react';
import { BENCHMARK_CASES, getSavedReports } from '../services/sampleCases';
import { Search, Filter, ArrowRight, Clock, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function CasesPage({ onSelectReport, onLoadBenchmarkCase }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'image' | 'audio' | 'video'
  const [searchQuery, setSearchQuery] = useState('');
  const [savedCases, setSavedCases] = useState([]);

  useEffect(() => {
    setSavedCases(getSavedReports());
  }, []);

  // Combine benchmark cases with user's saved session cases
  const allCases = [
    ...savedCases.map(c => ({
      id: c.analysis_id,
      title: c.file_info?.filename || 'User Investigation',
      type: c.media_type,
      date: 'Recent Session',
      verdict: c.verdict,
      evidenceStrength: c.evidence_strength,
      heuristicScore: c.heuristic_score,
      summary: c.reasoning,
      isUserCase: true,
      rawData: c
    })),
    ...BENCHMARK_CASES.map(b => ({ ...b, isUserCase: false }))
  ];

  const filteredCases = allCases.filter(c => {
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.verdict.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'POTENTIALLY AI-GENERATED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'POTENTIALLY MANIPULATED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LIKELY AUTHENTIC':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const handleCaseClick = (c) => {
    if (c.isUserCase && c.rawData) {
      onSelectReport(c.rawData);
    } else {
      onLoadBenchmarkCase(c.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-orange-400 font-bold">
              Archive & Benchmarks
            </span>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
              Investigative Case Files
            </h1>
            <p className="text-sm text-white/60 font-body max-w-xl">
              Examine real forensic dossiers from synthetic generators, optical sensors, and audio vocoders. Click any dossier to inspect complete forensic signals and ELA heatmaps.
            </p>
          </div>

          <div className="font-mono text-xs text-white/50">
            Total Dossiers: <strong className="text-white">{filteredCases.length}</strong>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#111216] border border-white/10">
          
          {/* Modality Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['all', 'image', 'audio', 'video'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3.5 py-1.5 rounded-lg font-mono text-xs uppercase font-bold transition-all ${
                  filterType === type
                    ? 'bg-white text-black shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search cases or verdicts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white font-mono placeholder:text-white/30 focus:border-orange-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Case Dossier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCases.map((c, idx) => (
            <div
              key={idx}
              onClick={() => handleCaseClick(c)}
              className="editorial-card p-6 bg-[#13141a] border border-white/10 hover:border-white/30 cursor-pointer group transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Meta Top Line */}
                <div className="flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold uppercase text-[10px]">
                      {c.type}
                    </span>
                    {c.isUserCase && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px]">
                        User Session
                      </span>
                    )}
                  </div>
                  <span className="text-white/40">{c.date}</span>
                </div>

                {/* Case Title */}
                <h3 className="font-display font-bold text-xl text-white group-hover:text-orange-400 transition-colors">
                  {c.title}
                </h3>

                {/* Case Summary */}
                <p className="text-xs text-white/60 font-body leading-relaxed line-clamp-2">
                  {c.summary}
                </p>
              </div>

              {/* Verdict Footer */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={`px-2.5 py-1 rounded-md border font-bold ${getVerdictBadge(c.verdict)}`}>
                    {c.verdict}
                  </span>
                  <span className="text-white/40 hidden sm:inline">
                    Strength: <strong className="text-white">{c.evidenceStrength}</strong>
                  </span>
                </div>

                <span className="font-mono text-xs text-orange-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                  <span>View Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
