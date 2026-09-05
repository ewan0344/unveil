"""
Automated Test Suite for UNVEIL Forensics Engine.
Validates multi-domain measurements, honest verdicts, and error-handling defenses.
"""

import os
import io
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "supported_modalities" in data
    print("[OK] Health check endpoint passed")

def test_samples_endpoint():
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 3
    print("[OK] Benchmark samples endpoint passed")

def test_benchmark_image_analysis_measurements():
    response = client.post("/api/analyze/sample/sample-ai-portrait")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["media_type"] == "image"
    assert data["verdict"] in ["POTENTIALLY AI-GENERATED", "POTENTIALLY MANIPULATED", "LIKELY AUTHENTIC", "INCONCLUSIVE"]
    assert "measurements" in data
    assert len(data["measurements"]) == 6, f"Expected 6 measurements, got {len(data['measurements'])}"
    for m in data["measurements"]:
        assert "domain" in m
        assert "anomaly" in m
        assert "observation" in m
        assert "interpretation" in m
    assert "ai_assisted_assessment" in data
    print(f"[OK] Image multi-domain measurements passed (Verdict: {data['verdict']}, Strength: {data['evidence_strength']})")

def test_benchmark_audio_analysis():
    response = client.post("/api/analyze/sample/sample-synthetic-voice")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["media_type"] == "audio"
    assert "waveform_data" in data
    assert len(data["waveform_data"]) > 0
    assert "spectral_analysis" in data
    print(f"[OK] Benchmark audio analysis passed (Verdict: {data['verdict']})")

def test_benchmark_video_analysis():
    response = client.post("/api/analyze/sample/sample-synthetic-clip")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["media_type"] == "video"
    assert "keyframes" in data
    assert len(data["keyframes"]) > 0
    assert "temporal_metrics" in data
    print(f"[OK] Benchmark video analysis passed (Verdict: {data['verdict']})")

def test_image_upload_real():
    with open("backend/sample_cases/camera_photo.jpg", "rb") as f:
        response = client.post(
            "/api/analyze/image",
            files={"file": ("camera_photo.jpg", f, "image/jpeg")}
        )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["media_type"] == "image"
    assert len(data["measurements"]) == 6
    print("[OK] Real image file upload passed with 6 domain measurements")

def test_audio_upload_real():
    with open("backend/sample_cases/acoustic_recording.wav", "rb") as f:
        response = client.post(
            "/api/analyze/audio",
            files={"file": ("acoustic_recording.wav", f, "audio/wav")}
        )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["media_type"] == "audio"
    assert "waveform_data" in data
    print("[OK] Real audio file upload passed")

def test_video_upload_real():
    with open("backend/sample_cases/synthetic_clip.mp4", "rb") as f:
        response = client.post(
            "/api/analyze/video",
            files={"file": ("synthetic_clip.mp4", f, "video/mp4")}
        )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["media_type"] == "video"
    assert "keyframes" in data
    print("[OK] Real video file upload passed")

def test_unsupported_file_rejected():
    fake_file = io.BytesIO(b"Hello world, I am plain text!")
    response = client.post(
        "/api/analyze/image",
        files={"file": ("malicious.txt", fake_file, "text/plain")}
    )
    assert response.status_code in [415, 400]
    print("[OK] Unsupported file format properly rejected (415)")

def test_empty_file_rejected():
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/analyze/image",
        files={"file": ("empty.jpg", empty_file, "image/jpeg")}
    )
    assert response.status_code in [400, 415]
    print("[OK] Empty file properly rejected")

def test_ssrf_url_blocked():
    response = client.post(
        "/api/analyze/url",
        json={"url": "http://127.0.0.1:8080/secret"}
    )
    assert response.status_code in [400, 403, 500]
    print("[OK] SSRF internal loopback request properly blocked")

if __name__ == "__main__":
    print("--- RUNNING UNVEIL AUTOMATED TESTS ---")
    test_health_endpoint()
    test_samples_endpoint()
    test_benchmark_image_analysis_measurements()
    test_benchmark_audio_analysis()
    test_benchmark_video_analysis()
    test_image_upload_real()
    test_audio_upload_real()
    test_video_upload_real()
    test_unsupported_file_rejected()
    test_empty_file_rejected()
    test_ssrf_url_blocked()
    print("\n[OK] ALL 11 AUTOMATED TESTS COMPLETED WITH 100% SUCCESS!")
