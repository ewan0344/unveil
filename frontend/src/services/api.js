/**
 * UNVEIL API Service Layer
 * Uses import.meta.env.VITE_API_URL with fallback to deployed Render backend:
 * https://unveil-1-ff5a.onrender.com
 */

const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://unveil-1-ff5a.onrender.com').trim().replace(/\/$/, '');
const API_BASE_URL = RAW_BACKEND_URL.endsWith('/api') ? RAW_BACKEND_URL : `${RAW_BACKEND_URL}/api`;

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { healthy: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { healthy: true, data };
  } catch (err) {
    return { healthy: false, error: err.message || 'Network unreachable' };
  }
}

export async function analyzeImageFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/analyze/image`, {
    method: 'POST',
    body: formData,
  });

  const body = await res.json();
  if (!res.ok || !body.success) {
    const errorMsg = body.error || (typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)) || `Image analysis failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return body.data;
}

export async function analyzeAudioFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/analyze/audio`, {
    method: 'POST',
    body: formData,
  });

  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Audio analysis failed with status ${res.status}`);
  }
  return body.data;
}

export async function analyzeVideoFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/analyze/video`, {
    method: 'POST',
    body: formData,
  });

  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Video analysis failed with status ${res.status}`);
  }
  return body.data;
}

export async function analyzeMediaUrl(url) {
  const res = await fetch(`${API_BASE_URL}/analyze/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Remote URL analysis failed with status ${res.status}`);
  }
  return body.data;
}

export async function getSampleCases() {
  const res = await fetch(`${API_BASE_URL}/samples`);
  if (!res.ok) throw new Error('Failed to load sample cases');
  return res.json();
}

export async function analyzeSampleCase(sampleId) {
  const res = await fetch(`${API_BASE_URL}/analyze/sample/${sampleId}`, {
    method: 'POST',
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || 'Failed to analyze benchmark case');
  }
  return body.data;
}
