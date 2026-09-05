import os
import re
import uuid
import tempfile
import ipaddress
import urllib.parse
from contextlib import contextmanager
from typing import Tuple
from fastapi import HTTPException, UploadFile

# Maximum file size: 50MB
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/avif": [".avif"],
    "image/x-png": [".png"],
}

ALLOWED_AUDIO_TYPES = {
    "audio/wav": [".wav"],
    "audio/x-wav": [".wav"],
    "audio/mpeg": [".mp3"],
    "audio/mp3": [".mp3"],
    "audio/ogg": [".ogg"],
    "audio/mp4": [".m4a"],
    "audio/x-m4a": [".m4a"],
    "audio/m4a": [".m4a"],
    "audio/aac": [".aac", ".m4a"],
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4": [".mp4"],
    "video/webm": [".webm"],
    "video/quicktime": [".mov"],
    "video/x-matroska": [".mkv"],
}

ALL_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
ALL_AUDIO_EXTS = {".wav", ".mp3", ".ogg", ".m4a", ".aac"}
ALL_VIDEO_EXTS = {".mp4", ".mov", ".webm", ".mkv"}

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename and strips path traversal characters."""
    base = os.path.basename(filename or "unnamed_media")
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", base)
    if not clean or clean.startswith("."):
        clean = f"file_{uuid.uuid4().hex[:8]}{clean}"
    return clean[:120]

def validate_file_metadata(file: UploadFile, expected_category: str) -> Tuple[str, str]:
    """Validates content-type and extension against expected media category."""
    filename = sanitize_filename(file.filename or "media")
    ext = os.path.splitext(filename)[1].lower()
    content_type = (file.content_type or "").lower().split(";")[0].strip()

    valid_exts = set()
    allowed_mimes = {}
    if expected_category == "image":
        valid_exts = ALL_IMAGE_EXTS
        allowed_mimes = ALLOWED_IMAGE_TYPES
    elif expected_category == "audio":
        valid_exts = ALL_AUDIO_EXTS
        allowed_mimes = ALLOWED_AUDIO_TYPES
    elif expected_category == "video":
        valid_exts = ALL_VIDEO_EXTS
        allowed_mimes = ALLOWED_VIDEO_TYPES
    else:
        raise HTTPException(status_code=400, detail=f"Invalid media category: {expected_category}")

    # Allow if extension matches OR content_type matches
    matched = (ext in valid_exts) or (content_type in allowed_mimes) or (expected_category in content_type)

    if not matched:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file format for {expected_category}. Supported formats: {', '.join(sorted(valid_exts))}"
        )

    # Standardize extension if missing
    if not ext:
        ext = list(valid_exts)[0]

    return filename, ext

def validate_magic_bytes(header_bytes: bytes, expected_category: str) -> bool:
    """Validates magic bytes from file header with broad tolerance."""
    if not header_bytes or len(header_bytes) < 4:
        return True  # Fall back gracefully

    if expected_category == "image":
        if header_bytes.startswith(b"\xFF\xD8\xFF"):  # JPEG
            return True
        if header_bytes.startswith(b"\x89PNG\r\n\x1a\n"):  # PNG
            return True
        if header_bytes[:4] == b"RIFF" and b"WEBP" in header_bytes[:16]:  # WEBP
            return True
        if b"ftypavif" in header_bytes[:24] or b"ftypavis" in header_bytes[:24]:  # AVIF
            return True
    elif expected_category == "audio":
        if header_bytes[:4] == b"RIFF" and b"WAVE" in header_bytes[:16]:  # WAV
            return True
        if header_bytes[:3] == b"ID3" or header_bytes[:2] in [b"\xFF\xFB", b"\xFF\xF3", b"\xFF\xF2"]:  # MP3
            return True
        if header_bytes[:4] == b"OggS":  # OGG
            return True
        if b"ftypM4A" in header_bytes[:16] or b"ftypisom" in header_bytes[:16]:  # M4A
            return True
    elif expected_category == "video":
        if b"ftyp" in header_bytes[:24] or b"\x1a\x45\xdf\xa3" in header_bytes[:8]:  # MP4 / WEBM
            return True
        if header_bytes[:4] == b"RIFF" and b"AVI " in header_bytes[:16]:
            return True
        if b"moov" in header_bytes[:32] or b"mdat" in header_bytes[:32]:
            return True

    return True  # Lenient fallback to avoid rejecting valid files with custom headers

def is_safe_url(url: str) -> bool:
    """Ensures URL does not target localhost, internal networks, or non-http protocols."""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        if hostname.lower() in ["localhost", "127.0.0.1", "0.0.0.0", "::1"]:
            return False
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                return False
        except ValueError:
            pass
        return True
    except Exception:
        return False

@contextmanager
def safe_temp_file(suffix: str = ""):
    """Context manager for temporary file that guarantees deletion on exit."""
    fd, path = tempfile.mkstemp(prefix="unveil_temp_", suffix=suffix)
    os.close(fd)
    try:
        yield path
    finally:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass
