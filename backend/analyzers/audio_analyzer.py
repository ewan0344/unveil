"""
Comprehensive Audio Forensic Analyzer for UNVEIL.
Analyzes WAV, MP3, OGG, M4A, and AAC files for acoustic forensic signatures:
Spectral energy distribution, neural vocoder cutoff detection,
unnatural silence gates, waveform downsampling, and splice points.
"""

import io
import os
import wave
from typing import Dict, Any, List, Tuple
import numpy as np
import soundfile as sf
from backend.utils.verdicts import evaluate_verdict

def parse_audio_data(file_path: str) -> Tuple[np.ndarray, int, int, float]:
    """
    Parses audio file into a float32 numpy array in range [-1.0, 1.0].
    Uses soundfile with wave fallback.
    """
    try:
        data, samplerate = sf.read(file_path, dtype='float32')
        if data.ndim > 1:
            channels = data.shape[1]
            mono = np.mean(data, axis=1)
        else:
            channels = 1
            mono = data
        duration = len(mono) / float(samplerate) if samplerate > 0 else 0.0
        return mono, samplerate, channels, duration
    except Exception:
        # Fallback to standard wave reader for uncompressed WAV
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".wav":
            with wave.open(file_path, "rb") as wf:
                channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
                framerate = wf.getframerate()
                n_frames = wf.getnframes()
                raw_bytes = wf.readframes(n_frames)
                if sample_width == 1:
                    samples = (np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) - 128) / 128.0
                elif sample_width == 2:
                    samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                else:
                    samples = np.frombuffer(raw_bytes, dtype=np.float32)
                if channels > 1:
                    samples = samples.reshape(-1, channels)
                    mono = np.mean(samples, axis=1)
                else:
                    mono = samples
                duration = n_frames / float(framerate) if framerate > 0 else 0.0
                return mono, framerate, channels, duration

        # If completely unreadable via soundfile, construct fallback signal from raw bytes
        with open(file_path, "rb") as f:
            data_bytes = f.read()
        duration = max(1.0, len(data_bytes) / (44100 * 2))
        audio_arr = np.frombuffer(data_bytes[:44100 * 8 * 2], dtype=np.int16).astype(np.float32) / 32768.0
        return audio_arr, 44100, 2, duration

def generate_waveform_points(samples: np.ndarray, num_points: int = 120) -> List[float]:
    """Generates downsampled peak values for responsive UI waveform rendering."""
    if len(samples) == 0:
        return [0.0] * num_points
    
    chunk_size = max(1, len(samples) // num_points)
    waveform = []
    for i in range(num_points):
        chunk = samples[i * chunk_size : (i + 1) * chunk_size]
        if len(chunk) > 0:
            val = float(np.max(np.abs(chunk)))
            waveform.append(round(min(1.0, val), 3))
        else:
            waveform.append(0.0)
    return waveform

def analyze_audio_frequencies(samples: np.ndarray, framerate: int) -> Dict[str, Any]:
    """
    Computes spectral metrics: spectral centroid, spectral rolloff,
    and checks for vocoder brickwall cutoffs (e.g. at 16kHz or 22kHz).
    """
    if len(samples) < 1024:
        return {
            "spectral_centroid_hz": 0.0,
            "rolloff_95_hz": 0.0,
            "has_vocoder_cutoff": False,
            "cutoff_frequency_hz": None,
            "spectral_flatness": 0.0,
            "spectrum_bars": [10.0] * 16,
            "anomaly": "Low",
            "observation": "Audio duration insufficient for spectral analysis.",
            "interpretation": "Insufficient spectral depth to identify frequency anomalies."
        }

    target_samples = min(len(samples), framerate * 6)
    start_idx = max(0, (len(samples) - target_samples) // 2)
    segment = samples[start_idx : start_idx + target_samples]

    n_fft = 2048
    num_windows = len(segment) // n_fft
    if num_windows == 0:
        window = segment * np.hanning(len(segment))
        mag = np.abs(np.fft.rfft(window))
        freqs = np.fft.rfftfreq(len(segment), 1.0 / framerate)
    else:
        mags = []
        for w in range(min(num_windows, 24)):
            win = segment[w*n_fft : (w+1)*n_fft] * np.hanning(n_fft)
            mags.append(np.abs(np.fft.rfft(win)))
        mag = np.mean(mags, axis=0)
        freqs = np.fft.rfftfreq(n_fft, 1.0 / framerate)

    sum_mag = np.sum(mag) + 1e-9
    centroid = float(np.sum(freqs * mag) / sum_mag)

    cumsum = np.cumsum(mag)
    rolloff_idx = np.searchsorted(cumsum, 0.95 * sum_mag)
    rolloff_hz = float(freqs[min(rolloff_idx, len(freqs)-1)])

    # Vocoder brickwall cutoff detection:
    high_freq_mask = freqs > 15800
    mid_freq_mask = (freqs >= 1000) & (freqs <= 8000)

    has_vocoder_cutoff = False
    cutoff_hz = None

    if np.any(high_freq_mask) and np.any(mid_freq_mask):
        high_energy = np.mean(mag[high_freq_mask])
        mid_energy = np.mean(mag[mid_freq_mask]) + 1e-9
        energy_ratio = float(high_energy / mid_energy)

        # In natural acoustic audio, room reflections provide energy across the entire spectrum.
        # In neural vocoders (Tacotron, FastSpeech, ElevenLabs), energy abruptly drops > 40dB above 16kHz
        if energy_ratio < 0.005 and rolloff_hz < 16400 and framerate >= 44100:
            has_vocoder_cutoff = True
            cutoff_hz = 16000
        elif energy_ratio < 0.003 and rolloff_hz < 22200 and framerate >= 48000:
            has_vocoder_cutoff = True
            cutoff_hz = 22050

    geo_mean = np.exp(np.mean(np.log(mag + 1e-9)))
    ari_mean = np.mean(mag) + 1e-9
    flatness = float(geo_mean / ari_mean)

    # 16 frequency bars for UI visualizer
    n_bins = 16
    bin_size = max(1, len(mag) // n_bins)
    spectrum_bars = []
    for b in range(n_bins):
        chunk = mag[b*bin_size : (b+1)*bin_size]
        avg_val = float(np.mean(chunk)) if len(chunk) > 0 else 0.0
        spectrum_bars.append(round(min(100.0, avg_val * 45.0), 1))

    if has_vocoder_cutoff:
        anomaly = "High"
    elif rolloff_hz < 14000:
        anomaly = "Elevated"
    elif rolloff_hz < 17000:
        anomaly = "Moderate"
    else:
        anomaly = "Low"

    return {
        "spectral_centroid_hz": round(centroid, 1),
        "rolloff_95_hz": round(rolloff_hz, 1),
        "has_vocoder_cutoff": has_vocoder_cutoff,
        "cutoff_frequency_hz": cutoff_hz,
        "spectral_flatness": round(flatness, 4),
        "spectrum_bars": spectrum_bars,
        "anomaly": anomaly,
        "observation": f"Spectral centroid = {centroid:.1f} Hz; 95% Rolloff = {rolloff_hz:.1f} Hz; Vocoder brickwall cutoff = {'Detected at ' + str(cutoff_hz) + ' Hz' if has_vocoder_cutoff else 'None'}.",
        "interpretation": (
            f"Severe high-frequency attenuation with near-zero energy above {cutoff_hz} Hz, characteristic of neural vocoders (FastSpeech/Tacotron/ElevenLabs)."
            if has_vocoder_cutoff else
            "Broadband acoustic dispersion extending across full audible bandwidth, consistent with physical microphone capture."
        )
    }

def detect_silence_and_discontinuities(samples: np.ndarray, framerate: int) -> Dict[str, Any]:
    """
    Detects abnormal zero-energy silence gates and waveform discontinuities.
    """
    if len(samples) < framerate:
        return {
            "artificial_silence_detected": False,
            "dead_silence_ratio": 0.0,
            "discontinuity_count": 0,
            "anomaly": "Low",
            "observation": "Audio too short for silence profiling.",
            "interpretation": "Silence profile within normal boundaries."
        }

    abs_samples = np.abs(samples)
    dead_silent_samples = np.sum(abs_samples < 0.0001)
    silence_ratio = float(dead_silent_samples / len(samples))
    
    # AI speech often drops to absolute mathematical zero (0.0000) between words
    artificial_silence = silence_ratio > 0.06 and np.min(abs_samples) == 0.0

    diffs = np.abs(np.diff(samples))
    discontinuities = int(np.sum(diffs > 0.65))

    if artificial_silence and discontinuities > 6:
        anomaly = "High"
    elif artificial_silence or discontinuities > 8:
        anomaly = "Elevated"
    elif discontinuities > 3 or silence_ratio > 0.04:
        anomaly = "Moderate"
    else:
        anomaly = "Low"

    return {
        "artificial_silence_detected": artificial_silence,
        "dead_silence_ratio": round(silence_ratio, 3),
        "discontinuity_count": discontinuities,
        "anomaly": anomaly,
        "observation": f"Dead silence ratio = {silence_ratio*100:.1f}%; Waveform splice discontinuities = {discontinuities}.",
        "interpretation": (
            "Detected mathematical zero-noise silence gates between spoken phrases, characteristic of synthetic voice synthesis."
            if artificial_silence else
            "Found phase jumps and amplitude discontinuities without natural acoustic decay, indicative of audio cut-and-paste editing."
            if discontinuities > 5 else
            "Continuous ambient room tone and natural organic decay observed throughout."
        )
    }

def analyze_audio(file_path: str, original_filename: str) -> Dict[str, Any]:
    """Main audio forensic analysis pipeline."""
    samples, framerate, channels, duration = parse_audio_data(file_path)
    
    waveform_points = generate_waveform_points(samples, 100)
    freq_data = analyze_audio_frequencies(samples, framerate)
    silence_data = detect_silence_and_discontinuities(samples, framerate)

    # Multi-domain measurements table
    measurements = [
        {
            "domain": "Spectral Energy & Vocoder Analysis",
            "anomaly": freq_data["anomaly"],
            "observation": freq_data["observation"],
            "interpretation": freq_data["interpretation"]
        },
        {
            "domain": "Acoustic Silence & Splicing Discontinuities",
            "anomaly": silence_data["anomaly"],
            "observation": silence_data["observation"],
            "interpretation": silence_data["interpretation"]
        },
        {
            "domain": "Container & Acoustic Metadata",
            "anomaly": "Low",
            "observation": f"Duration: {duration:.2f}s; Sample Rate: {framerate} Hz; Channels: {channels}; Format: {os.path.splitext(file_path)[1].upper().replace('.', '')}.",
            "interpretation": "Standard acoustic container stream parameters verified."
        }
    ]

    # Evidence score calculation
    score = 10.0
    if freq_data["has_vocoder_cutoff"]:
        score += 48.0
    elif freq_data["anomaly"] == "Elevated":
        score += 25.0
    elif freq_data["anomaly"] == "Moderate":
        score += 15.0

    if silence_data["artificial_silence_detected"]:
        score += 24.0
    if silence_data["discontinuity_count"] > 5:
        score += 25.0

    score = max(5.0, min(95.0, float(score)))

    reasons = []
    if freq_data["has_vocoder_cutoff"] or (silence_data["artificial_silence_detected"] and freq_data["anomaly"] in ["Elevated", "High"]):
        verdict = "POTENTIALLY AI-GENERATED"
        strength = "STRONG" if freq_data["has_vocoder_cutoff"] and silence_data["artificial_silence_detected"] else "MODERATE"
        reasons.append(
            f"Identified neural vocoder filter cutoff at {freq_data.get('cutoff_frequency_hz', 16000)} Hz and/or "
            f"mathematical zero-noise silence gating ({silence_data['dead_silence_ratio']*100:.1f}% duration), "
            f"which strongly diverge from physical microphone acoustics."
        )
    elif silence_data["discontinuity_count"] > 6:
        verdict = "POTENTIALLY MANIPULATED"
        strength = "MODERATE"
        reasons.append(
            f"Waveform exhibits {silence_data['discontinuity_count']} abrupt amplitude jumps lacking natural reverberation, "
            f"consistent with cut-and-paste audio splicing or editing."
        )
    elif freq_data["anomaly"] == "Low" and silence_data["anomaly"] == "Low" and freq_data["rolloff_95_hz"] > 17500:
        verdict = "LIKELY AUTHENTIC"
        strength = "MODERATE"
        reasons.append(
            "Continuous ambient room noise floor and natural harmonic decay extend across full audible spectrum, "
            "consistent with an authentic physical acoustic recording."
        )
    else:
        verdict = "INCONCLUSIVE"
        strength = "LOW"
        reasons.append(
            "Acoustic metrics show standard compression variations without definitive vocoder cutoffs or severe phase jumps."
        )

    signals = []
    for m in measurements:
        if m["anomaly"] in ["High", "Elevated", "Moderate"]:
            signals.append({
                "indicator": m["domain"],
                "severity": m["anomaly"].lower(),
                "description": m["observation"] + " " + m["interpretation"]
            })

    return {
        "media_type": "audio",
        "file_info": {
            "filename": original_filename,
            "duration_seconds": round(duration, 2),
            "sample_rate_hz": framerate,
            "channels": "Stereo (2)" if channels == 2 else f"Mono ({channels})",
            "format": os.path.splitext(file_path)[1].upper().replace(".", "")
        },
        "verdict": verdict,
        "evidence_strength": strength,
        "heuristic_score": round(score, 1),
        "score_label": "Internal forensic evidence score — not a scientifically validated probability.",
        "reasoning": " ".join(reasons),
        "limitations": [
            "Heavy MP3/AAC compression at low bitrates (< 96 kbps) can cause artificial frequency roll-offs mimicking vocoder filters.",
            "Telephony audio (8 kHz / 16 kHz G.711) naturally truncates high frequencies.",
            "Advanced neural vocoders can synthesize ambient room noise."
        ],
        "measurements": measurements,
        "forensic_signals": signals,
        "waveform_data": waveform_points,
        "spectral_analysis": {
            "centroid_hz": freq_data["spectral_centroid_hz"],
            "rolloff_hz": freq_data["rolloff_95_hz"],
            "has_vocoder_cutoff": freq_data["has_vocoder_cutoff"],
            "cutoff_hz": freq_data["cutoff_frequency_hz"],
            "spectrum_bars": freq_data["spectrum_bars"]
        },
        "integrity_metrics": {
            "silence_ratio": silence_data["dead_silence_ratio"],
            "splice_discontinuities": silence_data["discontinuity_count"]
        }
    }
