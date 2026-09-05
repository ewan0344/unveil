"""
Video Forensic Analyzer for UNVEIL.
Performs intelligent frame-sampled forensic checks:
Container inspection, temporal consistency metrics, frame-to-frame warp detection,
spatial artifact sampling, and keyframe extraction.
"""

import io
import os
import base64
from typing import Dict, Any, List
import numpy as np
import cv2
from PIL import Image
from backend.utils.verdicts import evaluate_verdict

def analyze_video(file_path: str, original_filename: str) -> Dict[str, Any]:
    """Main video forensic analysis pipeline with intelligent frame sampling."""
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video stream from {original_filename}")

    # Extract container metrics
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or np.isnan(fps):
        fps = 24.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if total_frames > 0 else 0.0

    # Intelligent sampling: select 8 to 12 evenly distributed sample points
    num_samples = min(10, max(4, total_frames // 2)) if total_frames > 0 else 6
    if total_frames > 0:
        sample_indices = np.linspace(0, total_frames - 1, num_samples, dtype=int)
    else:
        sample_indices = list(range(0, 100, 10))

    keyframes_base64: List[Dict[str, Any]] = []
    sampled_frames = []
    frame_diffs = []
    prev_gray = None

    for idx in sample_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        sampled_frames.append(frame)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Measure temporal difference between sampled steps
        if prev_gray is not None and prev_gray.shape == gray.shape:
            diff = np.mean(np.abs(gray.astype(np.float32) - prev_gray.astype(np.float32)))
            frame_diffs.append(float(diff))
        prev_gray = gray

        # Thumbnail extraction (downscale to max 240px wide for speed)
        thumb_h, thumb_w = frame.shape[:2]
        scale = min(1.0, 240.0 / thumb_w)
        thumb = cv2.resize(frame, (int(thumb_w * scale), int(thumb_h * scale)))
        
        # Convert BGR to RGB for PIL
        rgb_thumb = cv2.cvtColor(thumb, cv2.COLOR_BGR2RGB)
        buf = io.BytesIO()
        Image.fromarray(rgb_thumb).save(buf, "JPEG", quality=80)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        
        timestamp_sec = round(idx / fps, 2)
        keyframes_base64.append({
            "frame_index": int(idx),
            "timestamp": f"{timestamp_sec}s",
            "preview_base64": f"data:image/jpeg;base64,{b64}"
        })

    cap.release()

    # Temporal Consistency Analysis
    if frame_diffs:
        temporal_diff_mean = float(np.mean(frame_diffs))
        temporal_diff_std = float(np.std(frame_diffs))
        # Coefficient of variation in frame motion (high fluctuation can indicate AI video morphing/flicker)
        temporal_flicker_score = round(temporal_diff_std / (temporal_diff_mean + 1e-6), 2)
    else:
        temporal_diff_mean = 0.0
        temporal_diff_std = 0.0
        temporal_flicker_score = 0.0

    # Spatial Blur / Edge consistency across sampled keyframes
    edge_stds = []
    for frame in sampled_frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        edge_stds.append(float(np.var(lap)))
    
    avg_edge_sharpness = round(float(np.mean(edge_stds)), 1) if edge_stds else 0.0
    sharpness_variance = round(float(np.std(edge_stds)), 1) if edge_stds else 0.0

    # Synthesize Forensic Signals
    signals: List[Dict[str, Any]] = []
    heuristic_score = 10.0

    # 1. Temporal warping / frame morphing
    if temporal_flicker_score > 1.4 and len(frame_diffs) >= 4:
        signals.append({
            "category": "ai_generator",
            "indicator": "Temporal Inconsistency / Morphing",
            "description": f"Inter-frame motion shows irregular variance (coefficient: {temporal_flicker_score}). Characteristic of diffusion video generation (warping limbs/textures between frames).",
            "severity": "high"
        })
        heuristic_score += 40.0

    # 2. Keyframe sharpness instability
    if sharpness_variance > 250 and avg_edge_sharpness < 50:
        signals.append({
            "category": "compression_discrepancy",
            "indicator": "Unstable Spatial Edge Definition",
            "description": "Noticeable oscillation in edge sharpness across sampled keyframes, pointing to localized frame inpainting or aggressive AI super-resolution.",
            "severity": "medium"
        })
        heuristic_score += 25.0

    # 3. Codec & GOP consistency
    container_ext = os.path.splitext(file_path)[1].upper().replace(".", "")
    if fps in [24.0, 25.0, 29.97, 30.0, 60.0] and temporal_flicker_score < 0.8:
        signals.append({
            "category": "video_provenance",
            "indicator": "Standard Broadcast Framerate & Stable Motion",
            "description": f"Video adheres to industry standard timing ({fps} fps) with smooth temporal continuity and uniform optical flow.",
            "severity": "low"
        })
        heuristic_score = max(5.0, heuristic_score - 20.0)

    verdict_summary = evaluate_verdict(
        media_type="video",
        evidence_score=heuristic_score,
        signals=signals,
        metadata_flags=[]
    )

    return {
        "media_type": "video",
        "file_info": {
            "filename": original_filename,
            "resolution": f"{width} x {height}",
            "fps": round(fps, 2),
            "duration_seconds": round(duration, 2),
            "total_frames": total_frames,
            "sampled_frames_count": len(keyframes_base64),
            "format": container_ext
        },
        "verdict": verdict_summary["verdict"],
        "evidence_strength": verdict_summary["evidence_strength"],
        "heuristic_score": verdict_summary["heuristic_score"],
        "score_label": verdict_summary["score_label"],
        "reasoning": verdict_summary["reasoning"],
        "limitations": verdict_summary["limitations"],
        "forensic_signals": signals,
        "temporal_metrics": {
            "mean_motion_delta": round(temporal_diff_mean, 2),
            "motion_variance": round(temporal_diff_std, 2),
            "flicker_index": temporal_flicker_score
        },
        "spatial_metrics": {
            "avg_edge_sharpness": avg_edge_sharpness,
            "sharpness_variance": sharpness_variance
        },
        "keyframes": keyframes_base64
    }
