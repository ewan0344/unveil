"""
URL Media Downloader and Dispatcher for UNVEIL.
Safely fetches remote public media with SSRF protection, size caps, and delegates to analyzers.
"""

import os
import urllib.request
import urllib.parse
from typing import Dict, Any
from fastapi import HTTPException
from backend.utils.security import is_safe_url, safe_temp_file, MAX_FILE_SIZE_BYTES
from backend.analyzers.image_analyzer import analyze_image
from backend.analyzers.audio_analyzer import analyze_audio
from backend.analyzers.video_analyzer import analyze_video

def fetch_and_analyze_url(media_url: str) -> Dict[str, Any]:
    """Downloads public media URL and routes to appropriate analyzer."""
    if not media_url or not media_url.strip():
        raise HTTPException(status_code=400, detail="Missing media URL.")

    clean_url = media_url.strip()
    if not is_safe_url(clean_url):
        raise HTTPException(
            status_code=400,
            detail="Forbidden URL. Only public HTTP/HTTPS URLs targeting valid public hosts are allowed."
        )

    # Determine likely category from path extension or HEAD request
    parsed = urllib.parse.urlparse(clean_url)
    ext = os.path.splitext(parsed.path)[1].lower()
    
    # Request headers mimicking standard browser
    headers = {"User-Agent": "UNVEIL-Forensics-Bot/1.0 (+https://unveil.verification)"}
    req = urllib.request.Request(clean_url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            content_type = response.headers.get("Content-Type", "").lower().split(";")[0].strip()
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="Remote media file exceeds 50MB limit.")

            # Identify target category
            category = "unknown"
            suffix = ext or ".dat"
            if "image" in content_type or ext in [".jpg", ".jpeg", ".png", ".webp"]:
                category = "image"
                suffix = ext if ext in [".jpg", ".jpeg", ".png", ".webp"] else ".jpg"
            elif "audio" in content_type or ext in [".wav", ".mp3", ".ogg"]:
                category = "audio"
                suffix = ext if ext in [".wav", ".mp3", ".ogg"] else ".wav"
            elif "video" in content_type or ext in [".mp4", ".webm", ".mov"]:
                category = "video"
                suffix = ext if ext in [".mp4", ".webm", ".mov"] else ".mp4"
            else:
                raise HTTPException(
                    status_code=415,
                    detail=f"Unsupported remote media Content-Type: '{content_type}'. Must be image, audio, or video."
                )

            # Stream download with byte cap
            downloaded = bytearray()
            while True:
                chunk = response.read(65536)
                if not chunk:
                    break
                downloaded.extend(chunk)
                if len(downloaded) > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(status_code=413, detail="Remote media stream exceeded 50MB limit.")

            # Write to safe temp file and analyze
            with safe_temp_file(suffix=suffix) as temp_path:
                with open(temp_path, "wb") as f:
                    f.write(downloaded)

                orig_name = os.path.basename(parsed.path) or f"remote_media{suffix}"
                if category == "image":
                    return analyze_image(temp_path, orig_name)
                elif category == "audio":
                    return analyze_audio(temp_path, orig_name)
                elif category == "video":
                    return analyze_video(temp_path, orig_name)
                else:
                    raise HTTPException(status_code=400, detail="Could not determine media category.")

    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=e.code, detail=f"Remote server returned HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to remote host: {str(e.reason)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing remote media: {str(e)}")
