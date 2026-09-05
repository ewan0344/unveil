"""
Verdicts and Evidence Evaluation Engine for UNVEIL.
Enforces honest, non-deceptive media verification standards.
"""

from typing import List, Dict, Any, Optional

VERDICT_AI = "POTENTIALLY AI-GENERATED"
VERDICT_MANIPULATED = "POTENTIALLY MANIPULATED"
VERDICT_AUTHENTIC = "LIKELY AUTHENTIC"
VERDICT_INCONCLUSIVE = "INCONCLUSIVE"

STRENGTH_STRONG = "STRONG"
STRENGTH_MODERATE = "MODERATE"
STRENGTH_LOW = "LOW"
STRENGTH_INSUFFICIENT = "INSUFFICIENT"

def evaluate_verdict(
    media_type: str,
    evidence_score: float, # Raw score 0.0 - 100.0 (internal heuristic)
    signals: List[Dict[str, Any]],
    metadata_flags: List[str],
    has_exif_camera: bool = False,
    is_truncated_or_empty: bool = False
) -> Dict[str, Any]:
    """
    Evaluates forensic signals into an honest assessment.
    Never outputs deceptive probability percentages.
    """
    if is_truncated_or_empty or len(signals) == 0:
        return {
            "verdict": VERDICT_INCONCLUSIVE,
            "evidence_strength": STRENGTH_INSUFFICIENT,
            "heuristic_score": round(evidence_score, 1),
            "score_label": "Internal forensic evidence score — not a scientifically validated probability.",
            "reasoning": "The provided media lacks sufficient technical data or resolution to establish a reliable forensic baseline.",
            "limitations": [
                "Low file resolution or extreme compression limits high-frequency error analysis.",
                "Absence of structural metadata precludes camera sensor or hardware provenance verification."
            ]
        }

    # Count signal severity
    high_anomalies = sum(1 for s in signals if s.get("severity") == "high")
    medium_anomalies = sum(1 for s in signals if s.get("severity") == "medium")
    low_anomalies = sum(1 for s in signals if s.get("severity") == "low")

    # Determine Evidence Strength
    if high_anomalies >= 2 or (high_anomalies >= 1 and medium_anomalies >= 2):
        strength = STRENGTH_STRONG
    elif high_anomalies >= 1 or medium_anomalies >= 2:
        strength = STRENGTH_MODERATE
    elif medium_anomalies >= 1 or low_anomalies >= 2:
        strength = STRENGTH_LOW
    else:
        strength = STRENGTH_INSUFFICIENT if evidence_score < 15 else STRENGTH_LOW

    # Distinguish AI generation vs Manipulation vs Authentic
    ai_specific_detected = any(s.get("category") == "ai_generator" for s in signals)
    splice_or_resample = any(s.get("category") in ["compression_discrepancy", "resampling_artifact", "audio_splice"] for s in signals)

    reasons = []
    limitations = [
        "Forensic heuristics detect mathematical and structural anomalies, not definitive intent.",
        "Social media platforms often re-encode, re-compress, and strip metadata from authentic media, which can induce compression noise mimicking tampering.",
        "Modern generative models continuously evolve, and newer synthesis techniques may exhibit subtle or absent spectral artifacts."
    ]

    if ai_specific_detected and high_anomalies >= 1:
        verdict = VERDICT_AI
        reasons.append(
            "Distinct structural and frequency anomalies characteristic of generative models were identified. "
            "These include anomalous spectral/frequency spikes, uncharacteristic lack of sensor noise, or known synthetic generation headers."
        )
    elif high_anomalies >= 1 or (medium_anomalies >= 2 and splice_or_resample):
        verdict = VERDICT_MANIPULATED
        reasons.append(
            "Local inconsistency detected across forensic layers, such as localized Error Level Analysis (ELA) divergence, "
            "compression quantization mismatch, or temporal/phase discontinuities. These indicators are consistent with localized editing, splicing, or re-saving."
        )
    elif high_anomalies == 0 and medium_anomalies == 0 and low_anomalies <= 1:
        if has_exif_camera or evidence_score < 25:
            verdict = VERDICT_AUTHENTIC
            strength = STRENGTH_MODERATE if has_exif_camera else STRENGTH_LOW
            reasons.append(
                "Uniform compression characteristics, natural noise distribution, and standard container properties were observed across all tested domains. "
                "No localized tampering signatures or generative frequency artifacts were detected."
            )
        else:
            verdict = VERDICT_INCONCLUSIVE
            strength = STRENGTH_LOW
            reasons.append(
                "While no overt tampering or synthesis patterns were detected, the media lacks definitive hardware sensor provenance "
                "or has undergone platform re-compression that obscures fine forensic signals."
            )
    else:
        verdict = VERDICT_INCONCLUSIVE
        strength = STRENGTH_LOW
        reasons.append(
            "Mixed or ambiguous forensic signals were observed. Some variations in compression or noise were found, "
            "but they remain within the boundary of benign multi-pass compression or standard post-processing."
        )

    # Compile detailed explanation
    narrative = " ".join(reasons)

    return {
        "verdict": verdict,
        "evidence_strength": strength,
        "heuristic_score": round(max(0.0, min(100.0, evidence_score)), 1),
        "score_label": "Internal forensic evidence score — not a scientifically validated probability.",
        "reasoning": narrative,
        "limitations": limitations
    }
