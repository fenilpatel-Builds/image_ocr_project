/**
 * High-performance Browser-Side Image Preprocessing Pipeline for Local Tesseract OCR
 * All operations execute 100% locally on HTML5 Canvas without sending image data over network.
 */

// Helper to load image source (File, Blob, or URL) into HTMLImageElement
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for preprocessing: ' + err));

    if (src instanceof Blob || src instanceof File) {
      img.src = URL.createObjectURL(src);
    } else {
      img.src = src;
    }
  });
}

// 1. Resize image to optimal OCR dimensions (sweet spot for character height is ~25-35px)
export function createResizedCanvas(img, targetDim = 1100, maxDimension = 2400) {
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  // Adaptive Super-Resolution Scaling:
  // If the image is low-resolution or a small web thumbnail (< 900px), upscale it by 3x-4x with high quality smoothing
  // so that character x-heights reach Tesseract's optimal 25-35 pixel recognition sweet spot!
  const maxCurrent = Math.max(width, height);
  if (maxCurrent > 0 && maxCurrent < 900) {
    const scaleFactor = Math.min(4, Math.max(2, Math.round(targetDim / maxCurrent)));
    width = Math.round(width * scaleFactor);
    height = Math.round(height * scaleFactor);
  } else if (width > maxDimension || height > maxDimension) {
    // If image is excessively large, scale down to prevent WebAssembly memory limits
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

// 2. Grayscale conversion using standard photometric luminance formula
export function applyGrayscale(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    // 0.299R + 0.587G + 0.114B
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// 3. Contrast enhancement & normalization (linear contrast with midpoint 128)
export function applyContrast(canvas, contrast = 1.08, brightness = 0) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let factor = Number(contrast) || 1.0;
  // If passed as percentage (e.g. 15 for +15%), convert to multiplier (1.15)
  if (factor > 3) {
    factor = 1 + (factor / 100);
  } else if (factor < 0) {
    factor = Math.max(0.1, 1 + (factor / 100));
  }

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, Math.round((data[i] - 128) * factor + 128 + brightness)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round((data[i + 1] - 128) * factor + 128 + brightness)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round((data[i + 2] - 128) * factor + 128 + brightness)));
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// 4. Noise reduction using 3x3 smoothing
export function applyDenoise(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          sum += copy[idx];
        }
      }
      const targetIdx = (y * width + x) * 4;
      const avg = Math.round(sum / 9);
      data[targetIdx] = avg;
      data[targetIdx + 1] = avg;
      data[targetIdx + 2] = avg;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// 5. Sharpening filter using 3x3 Laplacian kernel
export function applySharpen(canvas, intensity = 0.4) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  // Kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const top = ((y - 1) * width + x) * 4;
      const bottom = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      const orig = copy[idx];
      const laplacian = 5 * orig - (copy[top] + copy[bottom] + copy[left] + copy[right]);
      const sharp = Math.min(255, Math.max(0, orig * (1 - intensity) + laplacian * intensity));

      data[idx] = sharp;
      data[idx + 1] = sharp;
      data[idx + 2] = sharp;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// 6. Otsu's Automated Global Threshold Binarization
export function applyOtsuBinarization(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Build histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  const totalPixels = width * height;
  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * histogram[t];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let optimalThreshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const betweenVariance = wB * wF * (mB - mF) * (mB - mF);
    if (betweenVariance > maxVariance) {
      maxVariance = betweenVariance;
      optimalThreshold = t;
    }
  }

  // Apply calculated threshold
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] > optimalThreshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);
  return { canvas, threshold: optimalThreshold };
}

// 7. Deskew Angle Detection using Projection Profile Variance
export function detectDeskewAngle(canvas, maxAngle = 10, step = 0.5) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = Math.min(canvas.width, 800);
  const h = Math.min(canvas.height, 800);

  // Create temporary scaled canvas for fast angle calculation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  tempCtx.drawImage(canvas, 0, 0, w, h);

  let bestAngle = 0;
  let maxVariance = -1;

  for (let angle = -maxAngle; angle <= maxAngle; angle += step) {
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = w;
    rotCanvas.height = h;
    const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });

    rotCtx.save();
    rotCtx.translate(w / 2, h / 2);
    rotCtx.rotate((angle * Math.PI) / 180);
    rotCtx.drawImage(tempCanvas, -w / 2, -h / 2);
    rotCtx.restore();

    const imgData = rotCtx.getImageData(0, 0, w, h).data;
    // Calculate horizontal projection profile (sum of dark pixels per row)
    const rowCounts = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      let darkCount = 0;
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (imgData[idx] < 128) darkCount++;
      }
      rowCounts[y] = darkCount;
    }

    // Calculate variance of horizontal projection
    let mean = 0;
    for (let y = 0; y < h; y++) mean += rowCounts[y];
    mean /= h;

    let variance = 0;
    for (let y = 0; y < h; y++) {
      const diff = rowCounts[y] - mean;
      variance += diff * diff;
    }

    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

// 8. Rotate canvas by arbitrary angle in degrees
export function rotateCanvas(canvas, degrees) {
  if (Math.abs(degrees) < 0.1) return canvas;

  const rads = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rads));
  const cos = Math.abs(Math.cos(rads));

  const newWidth = Math.round(canvas.width * cos + canvas.height * sin);
  const newHeight = Math.round(canvas.height * cos + canvas.width * sin);

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = newWidth;
  rotCanvas.height = newHeight;
  const ctx = rotCanvas.getContext('2d');

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, newWidth, newHeight);

  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rads);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return rotCanvas;
}

// 9. Full Preprocessing Pipeline
export async function runPreprocessingPipeline(imageSource, userOptions = {}) {
  const t0 = performance.now();
  const options = {
    grayscale: true,
    contrast: 1.08,
    brightness: 0,
    denoise: false,
    sharpen: false, // Default false to prevent JPEG ringing artifacts
    binarize: false, // Keep false by default; let Tesseract LSTM handle anti-aliasing
    autoDeskew: false, // Default false to avoid false rotation from clipart/illustrations
    manualRotation: 0,
    ...userOptions
  };

  const img = await loadImage(imageSource);
  let canvas = createResizedCanvas(img);

  // Manual rotation if user specified (90, 180, 270)
  if (options.manualRotation) {
    canvas = rotateCanvas(canvas, options.manualRotation);
  }

  // Grayscale
  if (options.grayscale) {
    applyGrayscale(canvas);
  }

  // Contrast & Normalization
  if (options.contrast !== 1.0 || options.brightness !== 0) {
    applyContrast(canvas, options.contrast, options.brightness);
  }

  // Denoise
  if (options.denoise) {
    applyDenoise(canvas);
  }

  // Sharpen
  if (options.sharpen) {
    applySharpen(canvas, 0.45);
  }

  // Auto-deskew if requested
  let detectedAngle = 0;
  if (options.autoDeskew) {
    detectedAngle = detectDeskewAngle(canvas);
    if (Math.abs(detectedAngle) >= 0.5) {
      canvas = rotateCanvas(canvas, -detectedAngle);
    }
  }

  // Binarization (Otsu)
  let thresholdUsed = null;
  if (options.binarize) {
    const res = applyOtsuBinarization(canvas);
    thresholdUsed = res.threshold;
  }

  const t1 = performance.now();
  const processingTimeMs = Math.round(t1 - t0);

  // Convert canvas to Data URL and lossless PNG Blob
  const processedDataUrl = canvas.toDataURL('image/png');
  const processedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

  return {
    canvas,
    processedDataUrl,
    processedBlob,
    detectedAngle,
    thresholdUsed,
    processingTimeMs,
    width: canvas.width,
    height: canvas.height
  };
}
