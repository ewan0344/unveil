"""
Comprehensive Multi-Domain Image Forensic Analyzer for UNVEIL.
Calculates empirical mathematical measurements across 6 independent domains:
1. Noise Consistency & Sensor Shot-Noise Physics
2. Frequency Domain (2D FFT Radial Power Spectrum Decay & Lattice Spikes)
3. Gradient Statistics & Local Sharpness Disparity
4. Resampling & Pixel-Level Periodic Interpolation
5. Compression & Error Level Analysis (ELA)
6. Metadata & Hardware Provenance
"""

import io
import os
import base64
from typing import Dict, Any, List, Tuple
import numpy as np
import cv2
from PIL import Image, ExifTags
from backend.analyzers.gemini_analyzer import analyze_with_gemini_vision

KNOWN_AI_SOFTWARE_MARKERS = [
    "stable diffusion", "midjourney", "dall-e", "comfyui", "novelai",
    "automatic1111", "firefly", "adobe firefly", "bing image creator",
    "flux.1", "playground", "sdxl"
]

def extract_metadata_and_exif(pil_img: Image.Image) -> Dict[str, Any]:
    """Extracts EXIF hardware tags, exposure parameters, and embedded software/workflow chunks."""
    exif_data = {}
    software_markers = []
    has_camera_hardware = False
    exposure_details = []

    try:
        raw_exif = pil_img.getexif()
        if raw_exif:
            # Root EXIF tags
            for tag_id, val in raw_exif.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                if isinstance(val, (bytes, bytearray)):
                    continue
                val_str = str(val).strip()
                if len(val_str) > 200:
                    val_str = val_str[:197] + "..."
                exif_data[tag_name] = val_str

                val_lower = val_str.lower()
                for keyword in KNOWN_AI_SOFTWARE_MARKERS:
                    if keyword in val_lower:
                        software_markers.append(f"AI generator tag found in EXIF: '{keyword}'")

            # Sub-IFD tags (Exif, GPSInfo) where exposure parameters live
            for ifd_id in [ExifTags.IFD.Exif, ExifTags.IFD.GPSInfo]:
                try:
                    sub_ifd = raw_exif.get_ifd(ifd_id)
                    for tag_id, val in sub_ifd.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        if isinstance(val, (bytes, bytearray)):
                            continue
                        val_str = str(val).strip()
                        if len(val_str) > 200:
                            val_str = val_str[:197] + "..."
                        exif_data[tag_name] = val_str
                except Exception:
                    pass

            hardware_keys = ["Make", "Model", "LensModel", "FNumber", "ExposureTime", "ISOSpeedRatings", "FocalLength", "DateTimeOriginal"]
            if any(k in exif_data for k in hardware_keys):
                has_camera_hardware = True

            if "Make" in exif_data and "Model" in exif_data:
                exposure_details.append(f"{exif_data['Make']} {exif_data['Model']}")
            elif "Model" in exif_data:
                exposure_details.append(exif_data["Model"])
            if "ExposureTime" in exif_data:
                exposure_details.append(f"1/{round(1.0/float(exif_data['ExposureTime']))}s" if float(exif_data['ExposureTime']) < 1 else f"{exif_data['ExposureTime']}s")
            if "FNumber" in exif_data:
                exposure_details.append(f"f/{exif_data['FNumber']}")
            if "ISOSpeedRatings" in exif_data:
                exposure_details.append(f"ISO {exif_data['ISOSpeedRatings']}")
    except Exception:
        pass

    # Check PNG text chunks (frequently present in ComfyUI / WebUI generation)
    if hasattr(pil_img, "text") and isinstance(pil_img.text, dict):
        for k, v in pil_img.text.items():
            if isinstance(v, str):
                v_lower = v.lower()
                for keyword in KNOWN_AI_SOFTWARE_MARKERS:
                    if keyword in v_lower:
                        software_markers.append(f"Generator marker in PNG chunk '{k}': '{keyword}'")
                if any(term in k.lower() for term in ["prompt", "workflow", "parameters", "generation_data"]):
                    software_markers.append(f"Embedded synthetic generation parameter block: '{k}'")

    return {
        "tags": exif_data,
        "has_camera_hardware": has_camera_hardware,
        "software_markers": list(set(software_markers)),
        "exposure_details": exposure_details,
        "tag_count": len(exif_data)
    }

def measure_noise_physics(gray: np.ndarray) -> Dict[str, Any]:
    """
    Evaluates sensor noise physics using Poisson shot-noise principles and texture variation.
    In optical camera sensors, noise variance scales positively with illumination (shot noise: Var ~ I),
    flat regions retain an organic sensor noise floor, and real textures have natural variation.
    In synthetic generative models, noise is decoupled, smooth areas are unnaturally flat,
    and texture variation lacks physical diversity.
    """
    h, w = gray.shape
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    global_noise_std = float(np.std(lap))

    # Partition into patches (16x16 grid)
    grid = 16
    gh, gw = max(8, h // grid), max(8, w // grid)
    patch_means = []
    patch_vars = []
    all_patch_laps = []
    all_patch_vars = []

    for i in range(grid):
        for j in range(grid):
            p_gray = gray[i*gh:(i+1)*gh, j*gw:(j+1)*gw]
            p_lap = lap[i*gh:(i+1)*gh, j*gw:(j+1)*gw]
            if p_gray.size > 25:
                p_var = float(np.var(p_gray))
                p_lap_std = float(np.std(p_lap))
                all_patch_vars.append(p_var)
                all_patch_laps.append(p_lap_std)
                # Select flat regions (var < 800) to measure sensor noise floor without edge interference
                if p_var < 800:
                    patch_means.append(float(np.mean(p_gray)))
                    patch_vars.append(p_lap_std)

    all_patch_vars_arr = np.array(all_patch_vars)
    all_patch_laps_arr = np.array(all_patch_laps)
    min_patch_noise = float(np.min(all_patch_laps_arr)) if len(all_patch_laps_arr) > 0 else 0.0
    
    # Texture dynamic range (90th percentile to 10th percentile of local patch variance)
    p90_var = float(np.percentile(all_patch_vars_arr, 90)) if len(all_patch_vars_arr) > 0 else 1.0
    p10_var = float(np.percentile(all_patch_vars_arr, 10)) if len(all_patch_vars_arr) > 0 else 1.0
    texture_dynamic_range = float(p90_var / (p10_var + 0.1))

    # Calculate Pearson correlation between brightness and noise in flat-to-mid surfaces
    if len(patch_means) >= 8 and np.std(patch_means) > 1.0:
        correlation = float(np.corrcoef(patch_means, patch_vars)[0, 1])
        if np.isnan(correlation):
            correlation = 0.0
    else:
        correlation = 0.0

    # Calibrate anomaly level:
    # A real photo can have smooth sky or post-processing; only flag synthetic if flat regions are mathematically depleted
    # or synthetic noise is unnaturally decoupled AND texture lacks natural depth.
    is_unnaturally_depleted = min_patch_noise < 0.35 and global_noise_std < 2.5
    is_synthetic_uniform = texture_dynamic_range < 1.4 and correlation < 0.15 and global_noise_std < 8.0

    if is_unnaturally_depleted and is_synthetic_uniform:
        anomaly = "High"
    elif is_unnaturally_depleted or is_synthetic_uniform:
        anomaly = "Elevated"
    elif correlation < 0.10 and texture_dynamic_range < 2.0:
        anomaly = "Moderate"
    else:
        anomaly = "Low"

    return {
        "global_noise_std": round(global_noise_std, 2),
        "min_patch_noise": round(min_patch_noise, 2),
        "shot_noise_correlation": round(correlation, 3),
        "texture_dynamic_range": round(texture_dynamic_range, 2),
        "anomaly": anomaly,
        "observation": f"Residual noise std = {global_noise_std:.2f}; Shot-noise correlation with luminance R = {correlation:.3f}; Texture dynamic range = {texture_dynamic_range:.1f}; Flat surface floor = {min_patch_noise:.2f}.",
        "interpretation": (
            "Residual noise is decoupled from pixel illumination and micro-surfaces exhibit unnatural mathematical smoothness, characteristic of synthetic denoising."
            if anomaly in ["High", "Elevated"] else
            "Subtle divergence in noise scaling across illumination levels observed."
            if anomaly == "Moderate" else
            "Noise variance and texture depth correlate naturally with optical scene physics and sensor photon capture."
        )
    }

def measure_frequency_spectrum(gray: np.ndarray) -> Dict[str, Any]:
    """
    2D Fourier Power Spectrum Analysis.
    Measures the radial power decay exponent beta (natural photos have beta ~ 1.70 - 2.90).
    Detects periodic lattice harmonic peaks caused by neural upsamplers and VAE decoders.
    Applies Hanning windowing to prevent artificial boundary discontinuity leakage.
    """
    h, w = gray.shape
    sz = min(512, h, w)
    cy, cx = h // 2, w // 2
    crop = gray[cy - sz//2 : cy + sz//2, cx - sz//2 : cx + sz//2].astype(np.float64)

    # 2D Hanning window to avoid boundary step leakage
    win2d = np.outer(np.hanning(sz), np.hanning(sz))
    windowed = (crop - np.mean(crop)) * win2d
    f = np.fft.fftshift(np.fft.fft2(windowed))
    power_spectrum = np.abs(f) ** 2

    cc = sz // 2
    y, x = np.ogrid[:sz, :sz]
    r = np.round(np.sqrt((x - cc)**2 + (y - cc)**2)).astype(int)

    # Radial power spectral profile (optical frequencies)
    r_min = max(6, sz // 32)
    r_max = int(sz * 0.42)
    r_bins = np.arange(r_min, r_max)
    radial_energy = []
    for rad in r_bins:
        vals = power_spectrum[r == rad]
        radial_energy.append(np.mean(vals) if len(vals) > 0 else 1e-6)

    log_r = np.log(r_bins)
    log_p = np.log(np.array(radial_energy) + 1e-9)
    slope, _ = np.polyfit(log_r, log_p, 1)
    beta = float(-slope)

    # Detect isolated harmonic lattice peaks from deconvolution/upsamplers
    ps_log = np.log(power_spectrum + 1e-9)
    blurred_ps = cv2.blur(ps_log, (9, 9))
    excess = ps_log - blurred_ps
    mask_high = (r >= sz // 16) & (r <= sz * 0.42)
    lattice_spikes = int(np.sum((excess > 3.0) & mask_high))

    # Anomaly evaluation:
    # Multiple camera scenes (nature, landscapes, flowers) legitimately have beta up to 3.0 or low for sensor noise.
    # What truly distinguishes synthetic generation is harmonic lattice grid peaks from deconvolution.
    if lattice_spikes > 45:
        anomaly = "High"
    elif lattice_spikes > 20 or (beta > 3.20 and lattice_spikes > 10):
        anomaly = "Elevated"
    elif lattice_spikes > 10:
        anomaly = "Moderate"
    else:
        anomaly = "Low"

    return {
        "spectral_decay_beta": round(beta, 2),
        "lattice_spikes_count": lattice_spikes,
        "anomaly": anomaly,
        "observation": f"Radial power decay slope beta = {beta:.2f}; High-frequency harmonic lattice peaks = {lattice_spikes}.",
        "interpretation": (
            f"Pronounced harmonic lattice peaks ({lattice_spikes}) detected across 2D frequency spectrum, characteristic of neural deconvolution grids."
            if anomaly in ["High", "Elevated"] else
            f"Minor spectral harmonic spikes ({lattice_spikes}) observed within frequency bands."
            if anomaly == "Moderate" else
            "Frequency spectrum follows continuous, physically natural optical power law decay without synthetic lattice spikes."
        )
    }

def measure_gradient_and_sharpness(gray: np.ndarray) -> Dict[str, Any]:
    """
    Measures gradient distribution and micro-sharpness disparity.
    Real optical cameras produce broad, continuous gradient distributions (kurtosis typically < 90).
    Generative models frequently produce hyper-concentrated gradient peaks (kurtosis > 110)
    or extreme disparity between focal edges and flat adjacent surfaces.
    """
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(gx**2 + gy**2)

    p99 = float(np.percentile(grad_mag, 99))
    p50 = float(np.percentile(grad_mag, 50)) + 1e-6
    sharpness_ratio = float(p99 / p50)

    # Kurtosis of gradient distribution
    mean_g = np.mean(grad_mag)
    std_g = np.std(grad_mag) + 1e-6
    kurtosis = float(np.mean(((grad_mag - mean_g) / std_g) ** 4))

    # Real photos with deep depth-of-field or sharp macro subjects have kurtosis up to 90.
    # In natural optical photos with a clear blue sky (like sunflowers or mountain peaks), P99/P50 can be large
    # because the sky has almost 0 gradient while the petal has high gradient. That is completely natural optical bokeh.
    # In synthetic diffusion, extreme kurtosis (> 110) appears together with deconvolution artifacts.
    if kurtosis > 110.0:
        anomaly = "High"
    elif kurtosis > 75.0 or (kurtosis > 55.0 and sharpness_ratio > 20.0):
        anomaly = "Elevated"
    elif kurtosis > 45.0:
        anomaly = "Moderate"
    else:
        anomaly = "Low"

    return {
        "gradient_kurtosis": round(kurtosis, 2),
        "sharpness_disparity_ratio": round(sharpness_ratio, 2),
        "anomaly": anomaly,
        "observation": f"Gradient distribution kurtosis = {kurtosis:.1f}; Edge sharpness disparity ratio (P99/P50) = {sharpness_ratio:.1f}.",
        "interpretation": (
            "Extreme gradient concentration and unnatural focal boundary transitions characteristic of synthetic rendering."
            if anomaly in ["High", "Elevated"] else
            "Elevated gradient tail observed across focal transitions."
            if anomaly == "Moderate" else
            "Continuous, physically natural optical depth-of-field and realistic edge transitions."
        )
    }

def measure_resampling_periodicity(gray: np.ndarray) -> Dict[str, Any]:
    """
    Detects periodic pixel interpolation and upsampling artifacts using second-derivative spectral analysis.
    Distinguishes legitimate standard 8-pixel JPEG block grid harmonics from non-JPEG synthetic upsampling kernels.
    """
    d2 = np.abs(gray[:, 2:] - 2.0 * gray[:, 1:-1] + gray[:, :-2])
    profile = np.mean(d2, axis=0)
    
    if len(profile) > 64:
        # High-pass filter profile to remove slow illumination gradients
        ksize = 15
        lowpass = cv2.boxFilter(profile, -1, (ksize, 1)).flatten()
        hp_profile = profile - lowpass

        # Compute 1D Fourier spectrum of high-pass derivative profile
        fft_1d = np.abs(np.fft.rfft(hp_profile))
        freqs = np.fft.rfftfreq(len(hp_profile))

        # Filter out standard 8x8 JPEG block boundary frequencies (0.125, 0.25, 0.375, 0.50)
        # Normal camera JPEGs always exhibit 8-pixel periodicity from block quantization
        non_jpeg_mask = np.ones(len(freqs), dtype=bool)
        for jf in [0.125, 0.25, 0.375, 0.5]:
            non_jpeg_mask &= (np.abs(freqs - jf) > 0.02)
        non_jpeg_mask[:3] = False  # skip DC and near-DC

        if np.sum(non_jpeg_mask) > 0:
            peak_val = float(np.max(fft_1d[non_jpeg_mask]))
            mean_val = float(np.mean(fft_1d[non_jpeg_mask])) + 1e-6
            resamp_ratio = float(peak_val / mean_val)
        else:
            resamp_ratio = 1.0
    else:
        resamp_ratio = 1.0

    # Calibrate: natural photos with resizing can exhibit mild ratio up to 7-8.
    # Neural upsampling and latent deconvolution generate strong, narrow harmonic peaks (> 11.0).
    if resamp_ratio > 14.0:
        anomaly = "High"
    elif resamp_ratio > 9.5:
        anomaly = "Elevated"
    elif resamp_ratio > 7.0:
        anomaly = "Moderate"
    else:
        anomaly = "Low"

    return {
        "resampling_correlation_ratio": round(resamp_ratio, 2),
        "anomaly": anomaly,
        "observation": f"Non-JPEG periodic resampling spectral ratio = {resamp_ratio:.2f}.",
        "interpretation": (
            "Detected pronounced non-JPEG periodic interpolation grid indicative of synthetic spatial upscaling or latent deconvolution."
            if anomaly in ["High", "Elevated"] else
            "Minor periodic micro-structural variation within acceptable limits of standard resampling or resizing."
            if anomaly == "Moderate" else
            "No periodic pixel-level interpolation signatures detected outside standard compression grids."
        )
    }

def perform_ela(image_path: str, quality: int = 90) -> Dict[str, Any]:
    """
    Performs Error Level Analysis (ELA).
    Recompresses image and computes block-level error divergence.
    """
    orig = Image.open(image_path).convert("RGB")
    buf = io.BytesIO()
    orig.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    recomp = Image.open(buf).convert("RGB")

    orig_arr = np.array(orig, dtype=np.int16)
    recomp_arr = np.array(recomp, dtype=np.int16)
    diff = np.abs(orig_arr - recomp_arr)

    mean_err = float(np.mean(diff))
    max_err = float(np.max(diff))
    std_err = float(np.std(diff))

    amp = np.clip(diff * 15, 0, 255).astype(np.uint8)
    ela_img = Image.fromarray(amp)
    if ela_img.width > 1200 or ela_img.height > 1200:
        ela_img.thumbnail((1200, 1200))
    out_b = io.BytesIO()
    ela_img.save(out_b, "JPEG", quality=85)
    b64 = base64.b64encode(out_b.getvalue()).decode("utf-8")

    # Measure 8x8 block discrepancy
    h, w, _ = diff.shape
    bh, bw = max(8, h // 8), max(8, w // 8)
    block_means = []
    for r in range(8):
        for c in range(8):
            b = diff[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            if b.size > 0:
                block_means.append(np.mean(b))
    block_discrepancy = float(np.std(block_means)) if block_means else 0.0

    if block_discrepancy > 3.6:
        anomaly = "High"
    elif block_discrepancy > 2.2:
        anomaly = "Elevated"
    elif mean_err < 0.9 or block_discrepancy > 1.3:
        anomaly = "Moderate"
    else:
        anomaly = "Low"

    return {
        "mean_error": round(mean_err, 2),
        "max_error": round(max_err, 2),
        "block_discrepancy": round(block_discrepancy, 2),
        "anomaly": anomaly,
        "preview_base64": f"data:image/jpeg;base64,{b64}",
        "observation": f"ELA mean error = {mean_err:.2f}; Max delta = {max_err:.1f}; Inter-block error discrepancy = {block_discrepancy:.2f}.",
        "interpretation": (
            "Significant localized variance in compression error levels across spatial blocks, indicating potential multi-source splicing or localized edits."
            if block_discrepancy > 2.8 else
            "Low overall error residual with uniform grid alignment, typical of synthetic direct export or uniform compression."
            if anomaly == "Moderate" else
            "Uniform compression error distribution across the entire image grid."
        )
    }

def analyze_image(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Main image forensic pipeline.
    Combines multi-domain empirical measurements, honest evidence-fusion verdict synthesis,
    and optional secondary AI visual assessment.
    """
    pil_img = Image.open(file_path)
    width, height = pil_img.size
    format_name = pil_img.format or os.path.splitext(file_path)[1].upper().replace(".", "")
    color_mode = pil_img.mode

    img_bgr = cv2.imread(file_path)
    if img_bgr is None:
        pil_rgb = pil_img.convert("RGB")
        img_bgr = cv2.cvtColor(np.array(pil_rgb), cv2.COLOR_RGB2BGR)

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float64)

    # 1. Measure all 6 independent forensic domains
    metadata_res = extract_metadata_and_exif(pil_img)
    noise_res = measure_noise_physics(gray)
    freq_res = measure_frequency_spectrum(gray)
    grad_res = measure_gradient_and_sharpness(gray)
    resamp_res = measure_resampling_periodicity(gray)
    ela_res = perform_ela(file_path)

    # 2. Build structured measurements table (always exposing 6 empirical categories)
    measurements = [
        {
            "domain": "Noise Consistency & Sensor Physics",
            "anomaly": noise_res["anomaly"],
            "observation": noise_res["observation"],
            "interpretation": noise_res["interpretation"]
        },
        {
            "domain": "Frequency Spectrum (2D FFT)",
            "anomaly": freq_res["anomaly"],
            "observation": freq_res["observation"],
            "interpretation": freq_res["interpretation"]
        },
        {
            "domain": "Gradient & Sharpness Statistics",
            "anomaly": grad_res["anomaly"],
            "observation": grad_res["observation"],
            "interpretation": grad_res["interpretation"]
        },
        {
            "domain": "Resampling & Interpolation",
            "anomaly": resamp_res["anomaly"],
            "observation": resamp_res["observation"],
            "interpretation": resamp_res["interpretation"]
        },
        {
            "domain": "Compression & ELA Residuals",
            "anomaly": ela_res["anomaly"],
            "observation": ela_res["observation"],
            "interpretation": ela_res["interpretation"]
        },
        {
            "domain": "Metadata & Hardware Provenance",
            "anomaly": "Elevated" if metadata_res["software_markers"] else "Low" if metadata_res["has_camera_hardware"] else "Moderate",
            "observation": (
                f"Camera hardware EXIF {'verified' if metadata_res['has_camera_hardware'] else 'absent'}; "
                f"{len(metadata_res['software_markers'])} synthetic generator markers identified."
            ),
            "interpretation": (
                "Verified physical camera sensor metadata present." if metadata_res["has_camera_hardware"] else
                "Known generative model parameter markers detected in container chunks." if metadata_res["software_markers"] else
                "No physical camera hardware metadata detected. (Observation note: web uploads and messaging apps routinely strip EXIF)."
            )
        }
    ]

    # 3. Multi-Signal Evidence Fusion
    # We evaluate TWO independent weight streams:
    # A. Synthetic Evidence: multiple consistent anomalies across frequency, noise, and gradient domains
    # B. Authentic Evidence: positive physical signatures (texture dynamic range, sensor noise floor, Poisson correlation, absence of lattice/resampling grids, EXIF hardware)

    synthetic_evidence_points = 0.0
    synthetic_factors = []

    # Frequency Domain Synthetic Cues
    if freq_res["lattice_spikes_count"] > 45:
        synthetic_evidence_points += 3.5
        synthetic_factors.append(f"high-frequency harmonic deconvolution peaks ({freq_res['lattice_spikes_count']})")
    elif freq_res["lattice_spikes_count"] > 20:
        synthetic_evidence_points += 2.0
        synthetic_factors.append(f"periodic lattice harmonic spikes ({freq_res['lattice_spikes_count']})")

    # Resampling Synthetic Cues (non-JPEG periodic grids)
    if resamp_res["resampling_correlation_ratio"] > 14.0:
        synthetic_evidence_points += 3.0
        synthetic_factors.append(f"pronounced non-JPEG resampling grid (ratio {resamp_res['resampling_correlation_ratio']})")
    elif resamp_res["resampling_correlation_ratio"] > 9.5:
        synthetic_evidence_points += 1.5
        synthetic_factors.append(f"periodic spatial upsampling correlation (ratio {resamp_res['resampling_correlation_ratio']})")

    # Gradient & Sharpness Synthetic Cues
    if grad_res["gradient_kurtosis"] > 110.0:
        synthetic_evidence_points += 2.5
        synthetic_factors.append(f"extreme gradient kurtosis ({grad_res['gradient_kurtosis']})")
    elif grad_res["gradient_kurtosis"] > 70.0:
        synthetic_evidence_points += 1.5
        synthetic_factors.append(f"elevated gradient kurtosis ({grad_res['gradient_kurtosis']})")

    if grad_res["sharpness_disparity_ratio"] > 28.0 and grad_res["gradient_kurtosis"] > 60.0:
        synthetic_evidence_points += 2.0
        synthetic_factors.append(f"hyper-sharp focal boundary disparity ({grad_res['sharpness_disparity_ratio']})")

    # Noise & Sensor Physics Synthetic Cues
    if noise_res["anomaly"] == "High":
        synthetic_evidence_points += 3.0
        synthetic_factors.append("unnaturally depleted flat surface noise and decoupled shot-noise scaling")
    elif noise_res["anomaly"] == "Elevated":
        synthetic_evidence_points += 1.5
        synthetic_factors.append("synthetic noise floor uniformity")

    # Explicit Generator Metadata (ComfyUI, WebUI, Midjourney tags)
    if metadata_res["software_markers"]:
        synthetic_evidence_points += 4.5
        synthetic_factors.append(f"generator tags: {', '.join(metadata_res['software_markers'][:2])}")

    # Authentic Physical Capture Evidence Stream
    authentic_evidence_points = 0.0
    authentic_factors = []

    # Camera hardware / exposure parameters in EXIF (strong bonus, but NOT required)
    if metadata_res["has_camera_hardware"]:
        authentic_evidence_points += 3.5
        details = ", ".join(metadata_res["exposure_details"][:2]) if metadata_res["exposure_details"] else "verified camera hardware tags"
        authentic_factors.append(f"EXIF optical provenance ({details})")

    # Natural texture depth and variation across surfaces
    if noise_res.get("texture_dynamic_range", 1.0) >= 3.0:
        authentic_evidence_points += 2.5
        authentic_factors.append(f"natural texture dynamic range ({noise_res['texture_dynamic_range']})")
    elif noise_res.get("texture_dynamic_range", 1.0) >= 2.0:
        authentic_evidence_points += 1.5
        authentic_factors.append("realistic surface texture variation")

    # Continuous optical frequency decay without synthetic harmonic lattice spikes
    if freq_res["lattice_spikes_count"] <= 8:
        authentic_evidence_points += 2.0
        authentic_factors.append("continuous optical frequency power decay without deconvolution spikes")

    # Absence of non-JPEG periodic resampling / upscaling grids
    if resamp_res["resampling_correlation_ratio"] <= 7.0:
        authentic_evidence_points += 1.5
        authentic_factors.append("natural spatial pixel distribution without artificial upsampling grids")

    # Natural optical gradients and depth-of-field roll-off
    if grad_res["gradient_kurtosis"] < 50.0:
        authentic_evidence_points += 1.5
        authentic_factors.append("smooth optical depth-of-field and realistic edge transitions")

    # Poisson shot-noise scaling with scene illumination
    if noise_res["shot_noise_correlation"] > 0.20:
        authentic_evidence_points += 1.5
        authentic_factors.append(f"sensor photon shot-noise correlation with luminance (R = {noise_res['shot_noise_correlation']})")

    # Organic sensor noise floor in smooth surfaces
    if noise_res["min_patch_noise"] > 0.8:
        authentic_evidence_points += 1.0
        authentic_factors.append("organic sensor noise floor preserved in flat areas")

    # Internal evidence heuristic metric (0 - 100)
    # Scaled to represent confidence in synthetic vs authentic physical origin
    base_score = 50.0 + (synthetic_evidence_points * 7.0) - (authentic_evidence_points * 5.0)
    if metadata_res["software_markers"]:
        base_score = max(base_score, 82.0)
    score = max(5.0, min(95.0, round(base_score, 1)))

    # Balanced Decision Logic:
    # 1. POTENTIALLY AI-GENERATED: Requires multiple consistent synthetic signals (score >= 4.0 points and dominant)
    # 2. LIKELY AUTHENTIC: Supported by natural camera capture evidence and no strong synthetic indicators
    # 3. POTENTIALLY MANIPULATED: Localized compression discrepancy without overall synthetic generation
    # 4. INCONCLUSIVE: Mixed, balanced, or insufficient evidence

    high_count = sum(1 for m in measurements if m["anomaly"] == "High")
    elevated_count = sum(1 for m in measurements if m["anomaly"] == "Elevated")
    moderate_count = sum(1 for m in measurements if m["anomaly"] == "Moderate")

    is_ai_indicated = (
        bool(metadata_res["software_markers"]) or
        (synthetic_evidence_points >= 4.0 and synthetic_evidence_points > authentic_evidence_points + 1.0)
    )

    is_authentic_indicated = (
        authentic_evidence_points >= 4.0 and
        synthetic_evidence_points <= 1.5 and
        high_count == 0 and
        not metadata_res["software_markers"]
    )

    is_manipulated_indicated = (
        ela_res["anomaly"] in ["High", "Elevated"] and
        ela_res["block_discrepancy"] > 2.8 and
        not is_ai_indicated and
        not is_authentic_indicated
    )

    reasons = []

    if is_ai_indicated:
        verdict = "POTENTIALLY AI-GENERATED"
        strength = "STRONG" if (synthetic_evidence_points >= 6.5 or metadata_res["software_markers"]) else "MODERATE"
        reasons.append(
            f"Several independent forensic signals are consistent with synthetic image generation, including "
            f"{', '.join(synthetic_factors[:3])}."
        )
        if authentic_factors:
            reasons.append(f"Secondary optical checks noted {', '.join(authentic_factors[:2])}, but converging synthetic indicators remain decisive.")
    elif is_authentic_indicated:
        verdict = "LIKELY AUTHENTIC"
        strength = "STRONG" if authentic_evidence_points >= 7.0 else "MODERATE"
        reasons.append(
            f"Natural sensor-noise characteristics and consistent image statistics are compatible with camera capture. "
            f"Positive indicators include {', '.join(authentic_factors[:3])}. No strong synthetic indicators were detected."
        )
    elif is_manipulated_indicated:
        verdict = "POTENTIALLY MANIPULATED"
        strength = "MODERATE"
        reasons.append(
            f"Localized compression inconsistency detected across 8x8 spatial blocks (ELA block discrepancy: {ela_res['block_discrepancy']}). "
            f"This divergence is consistent with multi-source splicing or localized editing rather than full synthetic generation."
        )
    else:
        verdict = "INCONCLUSIVE"
        strength = "LOW"
        reasons.append(
            f"Forensic measurements show balanced or mixed variations (synthetic evidence: {synthetic_evidence_points:.1f} pts, "
            f"authentic physical evidence: {authentic_evidence_points:.1f} pts). "
            f"The observed characteristics are consistent with benign multi-pass compression, resizing, or social media re-encoding."
        )

    # 4. Optional Secondary AI Visual Assessment Layer
    gemini_assessment = analyze_with_gemini_vision(file_path)

    signals = []
    for m in measurements:
        if m["anomaly"] in ["High", "Elevated", "Moderate"]:
            signals.append({
                "indicator": m["domain"],
                "severity": m["anomaly"].lower(),
                "description": m["observation"] + " " + m["interpretation"]
            })

    return {
        "media_type": "image",
        "file_info": {
            "filename": original_filename,
            "dimensions": f"{width} x {height}",
            "format": format_name,
            "color_space": color_mode,
            "megapixels": round((width * height) / 1_000_000, 2)
        },
        "verdict": verdict,
        "evidence_strength": strength,
        "heuristic_score": round(score, 1),
        "score_label": "Internal forensic evidence score — not a scientifically validated probability.",
        "reasoning": " ".join(reasons),
        "limitations": [
            "Forensic measurements reflect mathematical and physical inconsistencies, not definitive legal proof.",
            "Web compression algorithms (JPEG/WebP) on social platforms can alter high-frequency profiles.",
            "Emerging neural architectures continue to reduce deconvolution and noise artifacts."
        ],
        "measurements": measurements,
        "forensic_signals": signals,
        "exif_metadata": metadata_res["tags"],
        "ela_analysis": ela_res,
        "noise_analysis": noise_res,
        "frequency_analysis": freq_res,
        "gradient_analysis": grad_res,
        "resampling_analysis": resamp_res,
        "ai_assisted_assessment": gemini_assessment
    }
