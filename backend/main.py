"""
UNVEIL Media Verification Platform — FastAPI Application Backend.
Provides authenticated, safe digital forensics endpoints for Image, Audio, Video, and URL media.
"""

import os
import sys
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any, List

# Ensure parent directory is in sys.path so 'backend.*' imports resolve in all deployment environments
_parent_dir = str(Path(__file__).resolve().parent.parent)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

from pydantic import BaseModel, HttpUrl
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.utils.security import (
    validate_file_metadata,
    validate_magic_bytes,
    safe_temp_file,
    MAX_FILE_SIZE_BYTES
)
from backend.analyzers.image_analyzer import analyze_image
from backend.analyzers.audio_analyzer import analyze_audio
from backend.analyzers.video_analyzer import analyze_video
from backend.analyzers.url_analyzer import fetch_and_analyze_url

app = FastAPI(
    title="UNVEIL Forensics API",
    description="Digital Media Forensics & AI Generation Detection Platform",
    version="1.0.0"
)

# CORS configuration
# Allows requests from local dev servers, any *.vercel.app domain, and configured environment origins
_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "").strip()

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

for _entry in (_frontend_url, _allowed_origins_env):
    if _entry:
        for _origin in _entry.split(","):
            _cleaned = _origin.strip().rstrip("/")
            if _cleaned and _cleaned not in ALLOWED_ORIGINS:
                ALLOWED_ORIGINS.append(_cleaned)

# If CORS_ALLOW_ALL is enabled (default) or wildcard in origins, allow all origins
_has_wildcard = "*" in ALLOWED_ORIGINS or os.environ.get("CORS_ALLOW_ALL", "true").lower() in ("true", "1")

if _has_wildcard:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

class UrlAnalysisRequest(BaseModel):
    url: str

# Request validation error handler to capture exact field error details
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"[422 Validation Error] Path: {request.url.path} Errors: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": f"Validation error: {exc.errors()}"}
    )

from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": str(exc.detail)}
    )

# Generic exception handler to protect internal stack traces
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException) or isinstance(exc, StarletteHTTPException):
        print(f"[HTTP {exc.status_code}] {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": str(exc.detail)}
        )
    print(f"[500 Error] {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An error occurred during forensic media processing. Ensure the file is not corrupted or truncated."
        }
    )

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "UNVEIL Forensics Engine",
        "version": "1.0.0",
        "supported_modalities": ["image", "audio", "video", "url"]
    }

@app.post("/api/analyze/image")
async def handle_analyze_image(file: UploadFile = File(...)):
    """Processes uploaded image for forensic signals, EXIF tampering, and ELA."""
    filename, ext = validate_file_metadata(file, "image")
    
    with safe_temp_file(suffix=ext) as temp_path:
        total_read = 0
        header_bytes = b""
        with open(temp_path, "wb") as f:
            while chunk := await file.read(65536):
                total_read += len(chunk)
                if total_read > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum allowed upload size (50MB)."
                    )
                if not header_bytes:
                    header_bytes = chunk[:32]
                f.write(chunk)

        if total_read == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if not validate_magic_bytes(header_bytes, "image"):
            raise HTTPException(status_code=415, detail="File header does not match a valid image format.")

        try:
            result = analyze_image(temp_path, filename)
            result["analysis_id"] = str(uuid.uuid4())
            return {"success": True, "data": result}
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to inspect image: {str(e)}")

@app.post("/api/analyze/audio")
async def handle_analyze_audio(file: UploadFile = File(...)):
    """Processes uploaded audio for vocoder cutoffs, spectral anomalies, and splices."""
    filename, ext = validate_file_metadata(file, "audio")

    with safe_temp_file(suffix=ext) as temp_path:
        total_read = 0
        header_bytes = b""
        with open(temp_path, "wb") as f:
            while chunk := await file.read(65536):
                total_read += len(chunk)
                if total_read > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum allowed upload size (50MB)."
                    )
                if not header_bytes:
                    header_bytes = chunk[:32]
                f.write(chunk)

        if total_read == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        if not validate_magic_bytes(header_bytes, "audio"):
            raise HTTPException(status_code=415, detail="File header does not match a valid audio format.")

        try:
            result = analyze_audio(temp_path, filename)
            result["analysis_id"] = str(uuid.uuid4())
            return {"success": True, "data": result}
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to inspect audio: {str(e)}")

@app.post("/api/analyze/video")
async def handle_analyze_video(file: UploadFile = File(...)):
    """Processes uploaded video with intelligent keyframe sampling and temporal analysis."""
    filename, ext = validate_file_metadata(file, "video")

    with safe_temp_file(suffix=ext) as temp_path:
        total_read = 0
        header_bytes = b""
        with open(temp_path, "wb") as f:
            while chunk := await file.read(65536):
                total_read += len(chunk)
                if total_read > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum allowed upload size (50MB)."
                    )
                if not header_bytes:
                    header_bytes = chunk[:32]
                f.write(chunk)

        if total_read == 0:
            raise HTTPException(status_code=400, detail="Uploaded video file is empty.")

        if not validate_magic_bytes(header_bytes, "video"):
            raise HTTPException(status_code=415, detail="File header does not match a valid video container.")

        try:
            result = analyze_video(temp_path, filename)
            result["analysis_id"] = str(uuid.uuid4())
            return {"success": True, "data": result}
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to inspect video: {str(e)}")

@app.post("/api/analyze/url")
async def handle_analyze_url(payload: UrlAnalysisRequest):
    """Fetches media from a public URL and runs the corresponding forensic analyzer."""
    result = fetch_and_analyze_url(payload.url)
    result["analysis_id"] = str(uuid.uuid4())
    result["source_url"] = payload.url
    return {"success": True, "data": result}

@app.get("/api/samples")
async def get_sample_cases():
    """Returns metadata for pre-configured benchmark cases for instant 1-click testing."""
    return [
        {
            "id": "sample-ai-portrait",
            "name": "Synthetic Diffusion Portrait",
            "type": "image",
            "description": "Latent diffusion synthetic generation test with smooth noise floor and frequency deconvolution artifacts.",
            "file_name": "ai_portrait.jpg"
        },
        {
            "id": "sample-camera-photo",
            "name": "Hardware Optical Capture",
            "type": "image",
            "description": "Authentic camera sensor capture with natural PRNU noise and standard quantization tables.",
            "file_name": "camera_photo.jpg"
        },
        {
            "id": "sample-synthetic-voice",
            "name": "Neural Vocoder Speech",
            "type": "audio",
            "description": "AI-generated synthetic voice clone featuring 16kHz brickwall cutoff and zero-floor pauses.",
            "file_name": "synthetic_voice.wav"
        },
        {
            "id": "sample-acoustic-recording",
            "name": "Acoustic Ambient Field Audio",
            "type": "audio",
            "description": "Authentic physical microphone recording with natural room resonance and full spectrum energy.",
            "file_name": "acoustic_recording.wav"
        },
        {
            "id": "sample-synthetic-clip",
            "name": "Synthesized Video Loop",
            "type": "video",
            "description": "Generated video motion sequence exhibiting subtle inter-frame morphing and jitter.",
            "file_name": "synthetic_clip.mp4"
        }
    ]

@app.post("/api/analyze/sample/{sample_id}")
async def handle_analyze_sample(sample_id: str):
    sample_dir = Path(__file__).resolve().parent / "sample_cases"
    sample_map = {
        "sample-ai-portrait": ("image", str(sample_dir / "ai_portrait.jpg"), "ai_portrait.jpg"),
        "sample-camera-photo": ("image", str(sample_dir / "camera_photo.jpg"), "camera_photo.jpg"),
        "sample-synthetic-voice": ("audio", str(sample_dir / "synthetic_voice.wav"), "synthetic_voice.wav"),
        "sample-acoustic-recording": ("audio", str(sample_dir / "acoustic_recording.wav"), "acoustic_recording.wav"),
        "sample-synthetic-clip": ("video", str(sample_dir / "synthetic_clip.mp4"), "synthetic_clip.mp4"),
    }

    if sample_id not in sample_map:
        raise HTTPException(status_code=404, detail="Benchmark sample not found.")

    category, path, filename = sample_map[sample_id]
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Sample file {filename} not located on server.")

    if category == "image":
        res = analyze_image(path, filename)
    elif category == "audio":
        res = analyze_audio(path, filename)
    elif category == "video":
        res = analyze_video(path, filename)
    else:
        raise HTTPException(status_code=400, detail="Invalid sample category.")

    res["analysis_id"] = str(uuid.uuid4())
    res["is_benchmark_sample"] = True
    return {"success": True, "data": res}
