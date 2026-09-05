/**
 * UNVEIL API Service Layer
 * Uses import.meta.env.VITE_API_URL with fallback to deployed Render backend:
 * https://unveil-1-ff5a.onrender.com
 */

const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://unveil-1-ff5a.onrender.com').trim().replace(/\/$/, '');
const API_BASE_URL = RAW_BACKEND_URL.endsWith('/api') ? RAW_BACKEND_URL : `${RAW_BACKEND_URL}/api`;

console.log(`[UNVEIL API Config] Configured API Base URL: ${API_BASE_URL}`);

/**
 * Safely parses fetch responses:
 * 1. Checks HTTP status and Content-Type header
 * 2. Reads raw text before JSON.parse to prevent "Unexpected end of JSON input"
 * 3. Gracefully extracts error messages from HTML/empty/plain text responses
 */
async function safeFetchJson(url, options = {}, endpointName = 'API Request') {
  console.log(`[UNVEIL API Request] ${options.method || 'GET'} -> ${url}`);
  
  let res;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    console.error(`[UNVEIL API Network Error] ${endpointName} failed:`, networkErr);
    throw new Error(`Network connection failed: could not reach backend at ${API_BASE_URL}. (${networkErr.message})`);
  }

  const status = res.status;
  const contentType = res.headers.get('content-type') || '';
  console.log(`[UNVEIL API Response] ${endpointName} -> HTTP ${status} [${contentType}]`);

  const rawText = await res.text();

  // Check for empty body
  if (!rawText || !rawText.trim()) {
    console.error(`[UNVEIL API Error] ${endpointName} received empty response body with HTTP ${status}`);
    throw new Error(`Backend returned an empty response (HTTP ${status}). Ensure the server is active and upload size is within limits.`);
  }

  // Attempt JSON parse
  let body;
  try {
    body = JSON.parse(rawText);
  } catch (jsonErr) {
    console.error(`[UNVEIL API Error] Failed to parse JSON from ${endpointName}. Raw response preview:`, rawText.slice(0, 300));
    
    // Check if HTML (e.g., proxy 502/504 or Vercel rewrite)
    if (contentType.includes('text/html') || rawText.trim().startsWith('<')) {
      const titleMatch = rawText.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : `HTTP ${status}`;
      throw new Error(`Server returned HTML instead of JSON (${title}). Check backend service status.`);
    }

    throw new Error(`Server returned non-JSON response (HTTP ${status}): ${rawText.slice(0, 150)}`);
  }

  // Check backend application error flag
  if (!res.ok || (body && body.success === false)) {
    const errorMsg = body?.error || (typeof body?.detail === 'string' ? body.detail : JSON.stringify(body?.detail)) || `Request failed with HTTP status ${status}`;
    throw new Error(errorMsg);
  }

  return body.data !== undefined ? body.data : body;
}

export async function checkBackendHealth() {
  try {
    const data = await safeFetchJson(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) }, 'Health Check');
    return { healthy: true, data };
  } catch (err) {
    return { healthy: false, error: err.message || 'Network unreachable' };
  }
}

export async function analyzeImageFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return await safeFetchJson(`${API_BASE_URL}/analyze/image`, {
    method: 'POST',
    body: formData,
  }, 'Image Analysis');
}

export async function analyzeAudioFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return await safeFetchJson(`${API_BASE_URL}/analyze/audio`, {
    method: 'POST',
    body: formData,
  }, 'Audio Analysis');
}

export async function analyzeVideoFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return await safeFetchJson(`${API_BASE_URL}/analyze/video`, {
    method: 'POST',
    body: formData,
  }, 'Video Analysis');
}

export async function analyzeMediaUrl(url) {
  return await safeFetchJson(`${API_BASE_URL}/analyze/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }, 'URL Media Analysis');
}

export async function getSampleCases() {
  return await safeFetchJson(`${API_BASE_URL}/samples`, {}, 'Get Benchmark Samples');
}

export async function analyzeSampleCase(sampleId) {
  return await safeFetchJson(`${API_BASE_URL}/analyze/sample/${sampleId}`, {
    method: 'POST',
  }, `Benchmark Sample Analysis (${sampleId})`);
}