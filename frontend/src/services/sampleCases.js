/**
 * Benchmark Case Files for UNVEIL
 * Provides instant exploration of representative synthetic and authentic media artifacts.
 */

export const BENCHMARK_CASES = [
  {
    id: "sample-ai-portrait",
    title: "Latent Diffusion Synthetic Portrait",
    type: "image",
    date: "2026-08-14",
    verdict: "POTENTIALLY AI-GENERATED",
    evidenceStrength: "MODERATE",
    heuristicScore: 40.0,
    summary: "Generated portrait displaying micro-surface noise depletion, periodic deconvolution frequency lattice, and missing camera hardware EXIF tags.",
    keySignal: "High-frequency lattice peaks & over-smoothed noise floor",
    thumbnail: "/samples/ai_portrait.jpg"
  },
  {
    id: "sample-camera-photo",
    title: "Optical Hardware Sensor Capture",
    type: "image",
    date: "2026-08-28",
    verdict: "LIKELY AUTHENTIC",
    evidenceStrength: "LOW",
    heuristicScore: 5.0,
    summary: "Physical optical photograph exhibiting natural Poisson photon sensor noise, consistent JPEG block quantization, and verified sensor geometry.",
    keySignal: "Uniform PRNU sensor noise & organic quantization",
    thumbnail: "/samples/camera_photo.jpg"
  },
  {
    id: "sample-synthetic-voice",
    title: "Neural Vocoder Audio Clone",
    type: "audio",
    date: "2026-09-01",
    verdict: "POTENTIALLY AI-GENERATED",
    evidenceStrength: "MODERATE",
    heuristicScore: 45.0,
    summary: "Synthesized speech featuring a 16 kHz brickwall cutoff filter typical of neural vocoders, and artificial zero-noise silence during pauses.",
    keySignal: "16kHz brickwall attenuation & dead-silence gates",
    thumbnail: null
  },
  {
    id: "sample-acoustic-recording",
    title: "Physical Microphone Field Audio",
    type: "audio",
    date: "2026-09-02",
    verdict: "LIKELY AUTHENTIC",
    evidenceStrength: "LOW",
    heuristicScore: 5.0,
    summary: "Natural acoustic room recording preserving broad-spectrum environmental noise floor up to the Nyquist limit, with continuous reverberation.",
    keySignal: "Continuous acoustic room tone & organic decay",
    thumbnail: null
  },
  {
    id: "sample-synthetic-clip",
    title: "AI Video Motion Sequence",
    type: "video",
    date: "2026-09-03",
    verdict: "LIKELY AUTHENTIC",
    evidenceStrength: "LOW",
    heuristicScore: 5.0,
    summary: "Sample video test loop evaluated for temporal optical flow consistency and spatial edge stability.",
    keySignal: "Temporal flow stability analysis",
    thumbnail: null
  }
];

export function getSavedReports() {
  try {
    const raw = localStorage.getItem("unveil_saved_reports");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveReportToHistory(report) {
  try {
    const existing = getSavedReports();
    // Add to front and limit to 20 items
    const filtered = existing.filter(r => r.analysis_id !== report.analysis_id);
    const updated = [report, ...filtered].slice(0, 20);
    localStorage.setItem("unveil_saved_reports", JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to persist report to local storage:", e);
  }
}
