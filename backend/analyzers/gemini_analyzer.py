"""
Secondary AI-Assisted Visual Assessment Layer for UNVEIL.
Uses Google Gemini API when configured to provide semantic visual critique (anatomy, lighting, textures).
Designed as an optional secondary layer that complements the empirical mathematical forensics.
"""

import os
import base64
import json
from typing import Dict, Any, Optional
import urllib.request
import urllib.error

def analyze_with_gemini_vision(image_path: str) -> Dict[str, Any]:
    """
    Performs secondary visual critique using Gemini Vision if API key is available.
    Returns structured visual findings, or a clear offline/unconfigured state.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return {
            "available": False,
            "status": "Unconfigured (Offline)",
            "summary": "AI-assisted visual assessment is optional. Set GEMINI_API_KEY in your environment to enable secondary semantic critique.",
            "visual_inconsistencies": [],
            "anatomical_integrity": "Not evaluated (offline)",
            "lighting_physics": "Not evaluated (offline)"
        }

    try:
        # Read image bytes and encode to base64
        with open(image_path, "rb") as f:
            img_bytes = f.read()
        b64_data = base64.b64encode(img_bytes).decode("utf-8")
        
        # Determine mime type
        ext = os.path.splitext(image_path)[1].lower()
        mime_type = "image/jpeg"
        if ext == ".png":
            mime_type = "image/png"
        elif ext == ".webp":
            mime_type = "image/webp"

        prompt = (
            "You are a media forensics expert assisting an investigative newsroom. "
            "Inspect this image strictly for visual signs of AI generation or digital manipulation. "
            "Analyze: 1) Anatomical details (hands, eyes, ears, hair boundary consistency), "
            "2) Lighting and shadow physics (light source contradictions, reflection geometry), "
            "3) Texture coherence (skin microtexture, fabric continuity, background melting). "
            "Provide an objective, non-deceptive assessment. "
            "Return your response ONLY in valid JSON format with keys: "
            "'visual_inconsistencies' (list of observed anomalies, or empty if none), "
            "'anatomical_integrity' (brief observation), "
            "'lighting_physics' (brief observation), "
            "'overall_visual_assessment' (2-3 sentences explaining visual plausibility)."
        )

        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"]
        last_error = None

        for model_name in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": prompt},
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": b64_data
                                    }
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.2,
                        "response_mime_type": "application/json"
                    }
                }

                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=12) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    candidate = res_data.get("candidates", [{}])[0]
                    part_text = candidate.get("content", {}).get("parts", [{}])[0].get("text", "{}")
                    parsed = json.loads(part_text)
                    
                    return {
                        "available": True,
                        "status": "Completed",
                        "model": model_name,
                        "summary": parsed.get("overall_visual_assessment", "Visual critique completed."),
                        "visual_inconsistencies": parsed.get("visual_inconsistencies", []),
                        "anatomical_integrity": parsed.get("anatomical_integrity", "Plausible"),
                        "lighting_physics": parsed.get("lighting_physics", "Consistent")
                    }
            except Exception as err:
                last_error = err
                continue

        if last_error:
            raise last_error

    except Exception as e:
        return {
            "available": False,
            "status": "Unavailable",
            "summary": f"Could not reach Gemini Vision service ({str(e)[:80]}). Primary forensic analysis remains fully active.",
            "visual_inconsistencies": [],
            "anatomical_integrity": "Not evaluated",
            "lighting_physics": "Not evaluated"
        }
