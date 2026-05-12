import sharp from "sharp";
import fs from "fs";
import path from "path";
import { CATEGORIES, DISPLAY_NAMES, type NoiseType } from "./categories";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SinglePrediction {
  category: string;
  displayName: string;
  confidence: number;
  index: number;
}

interface InferenceResult {
  prediction: SinglePrediction;
  allPredictions: SinglePrediction[];
  top5: SinglePrediction[];
}

interface ImageTestResult {
  imageId: string;
  imagePath: string;
  trueCategory: string;
  trueDisplayName: string;
  cleanPrediction: SinglePrediction;
  noisyPredictions: Record<string, { prediction: SinglePrediction; flipped: boolean; confidenceDrop: number }>;
}

interface AggregatedMetric {
  noiseType: string;
  flipRate: number;
  avgConfidenceClean: number;
  avgConfidenceNoisy: number;
  avgConfidenceDrop: number;
  stabilityScore: number;
  totalFlips: number;
  totalImages: number;
}

interface IntensityPoint {
  intensity: number;
  avgConfidence: number;
  flipRate: number;
}

interface NoiseTestResult {
  results: ImageTestResult[];
  aggregatedMetrics: AggregatedMetric[];
  intensityCurve: IntensityPoint[];
  overallMetrics: {
    totalImages: number;
    overallFlipRate: number;
    avgConfidenceDrop: number;
    bestNoiseType: string;
    worstNoiseType: string;
    overallStabilityScore: number;
  };
  modelInfo: {
    architecture: string;
    categories: number;
    inputSize: string;
    pretrained: string;
    description: string;
  };
  realInference: boolean;
}

// ─── ONNX Session Management ────────────────────────────────────────────────

let onnxSession: any = null;
let modelMetadata: any = null;
let sessionLoading = false;
let sessionLoadFailed = false;

const MODEL_PATH = path.join(process.cwd(), "model", "resnet18_aircraft.onnx");
const METADATA_PATH = path.join(process.cwd(), "model", "model_metadata.json");
const DATASET_PATH = path.join(process.cwd(), "dataset");

/**
 * Load model metadata from JSON file
 */
function loadMetadata() {
  if (modelMetadata) return modelMetadata;

  try {
    if (fs.existsSync(METADATA_PATH)) {
      const raw = fs.readFileSync(METADATA_PATH, "utf-8");
      modelMetadata = JSON.parse(raw);
      return modelMetadata;
    }
  } catch (e) {
    console.warn("Failed to load model metadata:", e);
  }

  // Default metadata
  modelMetadata = {
    architecture: "ResNet18",
    num_classes: 20,
    input_size: [1, 3, 224, 224],
    pretrained: "ImageNet",
    categories: CATEGORIES,
    training_epochs: 50,
    best_accuracy: 0.947,
    description: "ResNet18 transfer learning model for aircraft type classification",
  };
  return modelMetadata;
}

/**
 * Lazy-load the ONNX Runtime session
 */
async function loadSession(): Promise<boolean> {
  if (sessionLoading) {
    // Wait for existing load
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (onnxSession) return true;
      if (sessionLoadFailed) return false;
    }
    return false;
  }

  sessionLoading = true;

  try {
    if (!fs.existsSync(MODEL_PATH)) {
      console.warn("ONNX model not found at:", MODEL_PATH);
      sessionLoadFailed = true;
      return false;
    }

    const ort = await import("onnxruntime-node");
    onnxSession = await ort.InferenceSession.create(MODEL_PATH);
    console.log("ONNX session loaded successfully");
    return true;
  } catch (e) {
    console.warn("Failed to load ONNX model:", e);
    sessionLoadFailed = true;
    return false;
  } finally {
    sessionLoading = false;
  }
}

/**
 * Check if the ONNX session is available
 */
async function isOnnxAvailable(): Promise<boolean> {
  if (onnxSession) return true;
  return loadSession();
}

/**
 * Preprocess an image for ResNet18 inference:
 * 1. Resize to 224x224
 * 2. Normalize ImageNet-style (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
 * 3. Convert HWC to CHW
 */
async function preprocessImage(imagePathOrBuffer: string | Buffer): Promise<Float32Array> {
  const INPUT_SIZE = 224;
  const MEAN = [0.485, 0.456, 0.406];
  const STD = [0.229, 0.224, 0.225];

  let imageBuffer: Buffer;
  if (typeof imagePathOrBuffer === "string") {
    imageBuffer = fs.readFileSync(imagePathOrBuffer);
  } else {
    imageBuffer = imagePathOrBuffer;
  }

  // Resize to 224x224 and get raw RGB pixels
  const { data, info } = await sharp(imageBuffer)
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const numPixels = INPUT_SIZE * INPUT_SIZE;

  // Convert HWC → CHW with normalization
  const float32Data = new Float32Array(3 * numPixels);

  for (let i = 0; i < numPixels; i++) {
    float32Data[i] = (pixels[i * 3] / 255.0 - MEAN[0]) / STD[0]; // R channel
    float32Data[numPixels + i] = (pixels[i * 3 + 1] / 255.0 - MEAN[1]) / STD[1]; // G channel
    float32Data[2 * numPixels + i] = (pixels[i * 3 + 2] / 255.0 - MEAN[2]) / STD[2]; // B channel
  }

  return float32Data;
}

/**
 * Apply softmax to logits
 */
function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sumExps);
}

/**
 * Run ONNX inference on a single image
 */
async function runInferenceOnSession(imageData: Float32Array): Promise<InferenceResult> {
  const metadata = loadMetadata();
  const categories: string[] = metadata.categories || CATEGORIES;

  const inputTensor = {
    dims: [1, 3, 224, 224],
    type: "float32" as const,
    data: imageData,
  };

  const feeds: Record<string, any> = {};
  const inputNames = onnxSession.inputNames;
  feeds[inputNames[0]] = inputTensor;

  const output = await onnxSession.run(feeds);
  const outputName = onnxSession.outputNames[0];
  const logits = Array.from(output[outputName].data as Float32Array);

  const probabilities = softmax(logits);

  // Build predictions sorted by confidence
  const allPredictions: SinglePrediction[] = probabilities
    .map((prob, idx) => ({
      category: categories[idx] || `class_${idx}`,
      displayName: DISPLAY_NAMES[categories[idx]] || categories[idx],
      confidence: prob,
      index: idx,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    prediction: allPredictions[0],
    allPredictions,
    top5: allPredictions.slice(0, 5),
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Run inference on a single image file
 */
export async function runInference(imagePath: string): Promise<InferenceResult | null> {
  const available = await isOnnxAvailable();
  if (!available) return null;

  try {
    const preprocessed = await preprocessImage(imagePath);
    return await runInferenceOnSession(preprocessed);
  } catch (e) {
    console.error("Inference failed for", imagePath, e);
    return null;
  }
}

/**
 * Run inference on a raw image buffer
 */
export async function runInferenceOnBuffer(
  imageBuffer: Buffer
): Promise<InferenceResult | null> {
  const available = await isOnnxAvailable();
  if (!available) return null;

  try {
    const preprocessed = await preprocessImage(imageBuffer);
    return await runInferenceOnSession(preprocessed);
  } catch (e) {
    console.error("Buffer inference failed:", e);
    return null;
  }
}

/**
 * Add noise to an image file, return the noisy buffer
 */
export async function addNoiseToImage(
  imagePath: string,
  noiseType: NoiseType,
  intensity: number
): Promise<Buffer | null> {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const { generateNoisyImage } = await import("./noise-engine");
    return await generateNoisyImage(imageBuffer, noiseType, intensity);
  } catch (e) {
    console.error("Noise injection failed:", e);
    return null;
  }
}

/**
 * Sample random images from the dataset directory
 */
export function sampleImages(count: number, seed: number = 42): Array<{ path: string; category: string }> {
  const images: Array<{ path: string; category: string }> = [];

  if (!fs.existsSync(DATASET_PATH)) {
    return images;
  }

  // Simple seeded PRNG (Mulberry32)
  function seededRandom(s: number) {
    return function () {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rng = seededRandom(seed);

  // Scan all category directories
  const dirs = fs.readdirSync(DATASET_PATH);
  for (const dir of dirs) {
    const dirPath = path.join(DATASET_PATH, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => /\.(jpg|jpeg|png|webp|bmp)$/i.test(f));

    for (const file of files) {
      images.push({
        path: path.join(dirPath, file),
        category: dir,
      });
    }
  }

  // Fisher-Yates shuffle with seeded RNG
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }

  return images.slice(0, count);
}

/**
 * Calculate aggregated metrics for a noise type
 */
function calculateMetrics(
  results: ImageTestResult[],
  noiseType: string
): AggregatedMetric {
  const items = results
    .map((r) => r.noisyPredictions[noiseType])
    .filter(Boolean);

  if (items.length === 0) {
    return {
      noiseType,
      flipRate: 0,
      avgConfidenceClean: 0,
      avgConfidenceNoisy: 0,
      avgConfidenceDrop: 0,
      stabilityScore: 100,
      totalFlips: 0,
      totalImages: 0,
    };
  }

  const totalFlips = items.filter((i) => i.flipped).length;
  const flipRate = (totalFlips / items.length) * 100;
  const avgConfidenceClean =
    results.reduce((s, r) => s + r.cleanPrediction.confidence, 0) / results.length;
  const avgConfidenceNoisy =
    items.reduce((s, i) => s + i.prediction.confidence, 0) / items.length;
  const avgConfidenceDrop = items.reduce((s, i) => s + i.confidenceDrop, 0) / items.length;
  const stabilityScore = Math.max(0, 100 - flipRate - avgConfidenceDrop * 100);

  return {
    noiseType,
    flipRate,
    avgConfidenceClean,
    avgConfidenceNoisy,
    avgConfidenceDrop,
    stabilityScore,
    totalFlips,
    totalImages: items.length,
  };
}

/**
 * Run a full noise robustness test
 */
export async function runNoiseTest(
  imageCount: number = 50,
  noiseTypes: string[] = ["gaussian", "uniform", "laplacian", "cauchy"],
  intensity: number = 30
): Promise<NoiseTestResult> {
  const metadata = loadMetadata();
  const available = await isOnnxAvailable();

  if (available) {
    return await runRealTest(imageCount, noiseTypes, intensity, metadata);
  } else {
    console.log("ONNX not available, using simulated results");
    return generateSimulatedResults(imageCount, noiseTypes, intensity, metadata);
  }
}

/**
 * Run real inference test using ONNX model and dataset
 */
async function runRealTest(
  imageCount: number,
  noiseTypes: string[],
  intensity: number,
  metadata: any
): Promise<NoiseTestResult> {
  const images = sampleImages(imageCount);

  if (images.length === 0) {
    return generateSimulatedResults(imageCount, noiseTypes, intensity, metadata);
  }

  const results: ImageTestResult[] = [];
  const { generateNoisyImage } = await import("./noise-engine");

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    // Clean inference
    const cleanResult = await runInference(img.path);
    if (!cleanResult) continue;

    const noisyPredictions: ImageTestResult["noisyPredictions"] = {};

    // Noisy inference for each noise type
    for (const nt of noiseTypes) {
      const noisyBuffer = await generateNoisyImage(
        fs.readFileSync(img.path),
        nt as NoiseType,
        intensity
      );
      const noisyResult = await runInferenceOnBuffer(noisyBuffer);

      if (noisyResult) {
        const flipped = noisyResult.prediction.category !== cleanResult.prediction.category;
        noisyPredictions[nt] = {
          prediction: noisyResult.prediction,
          flipped,
          confidenceDrop: cleanResult.prediction.confidence - noisyResult.prediction.confidence,
        };
      }
    }

    results.push({
      imageId: `IMG-${String(i + 1).padStart(4, "0")}`,
      imagePath: img.path,
      trueCategory: img.category,
      trueDisplayName: DISPLAY_NAMES[img.category] || img.category,
      cleanPrediction: cleanResult.prediction,
      noisyPredictions,
    });
  }

  // Calculate aggregated metrics
  const aggregatedMetrics = noiseTypes.map((nt) => calculateMetrics(results, nt));

  // Overall metrics
  const overallFlipRate = aggregatedMetrics.reduce((s, m) => s + m.flipRate, 0) / noiseTypes.length;
  const avgConfidenceDrop =
    aggregatedMetrics.reduce((s, m) => s + m.avgConfidenceDrop, 0) / noiseTypes.length;
  const overallStabilityScore = Math.max(0, 100 - overallFlipRate - avgConfidenceDrop * 100);

  const sorted = [...aggregatedMetrics].sort((a, b) => a.flipRate - b.flipRate);

  // Intensity curve (sample a few points)
  const intensityCurve = await generateIntensityCurve(images, noiseTypes);

  return {
    results,
    aggregatedMetrics,
    intensityCurve,
    overallMetrics: {
      totalImages: results.length,
      overallFlipRate,
      avgConfidenceDrop,
      bestNoiseType: sorted[0]?.noiseType || "unknown",
      worstNoiseType: sorted[sorted.length - 1]?.noiseType || "unknown",
      overallStabilityScore,
    },
    modelInfo: {
      architecture: metadata.architecture || "ResNet18",
      categories: metadata.num_classes || 20,
      inputSize: Array.isArray(metadata.input_size) ? metadata.input_size.join("×") : "224×224",
      pretrained: metadata.pretrained || "ImageNet",
      description: metadata.description || "Aircraft classification model",
    },
    realInference: true,
  };
}

/**
 * Generate intensity curve data (for a subset of images)
 */
async function generateIntensityCurve(
  images: Array<{ path: string; category: string }>,
  noiseTypes: string[]
): Promise<IntensityPoint[]> {
  const intensities = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const curve: IntensityPoint[] = [];
  const { generateNoisyImage } = await import("./noise-engine");

  // Use subset for speed
  const subset = images.slice(0, Math.min(10, images.length));

  for (const intensity of intensities) {
    let totalConfidence = 0;
    let totalFlips = 0;
    let totalRuns = 0;

    for (const img of subset) {
      for (const nt of noiseTypes) {
        try {
          const cleanResult = await runInference(img.path);
          if (!cleanResult) continue;

          const noisyBuffer = await generateNoisyImage(
            fs.readFileSync(img.path),
            nt as NoiseType,
            intensity
          );
          const noisyResult = await runInferenceOnBuffer(noisyBuffer);
          if (!noisyResult) continue;

          totalConfidence += noisyResult.prediction.confidence;
          if (noisyResult.prediction.category !== cleanResult.prediction.category) {
            totalFlips++;
          }
          totalRuns++;
        } catch {
          // skip failures
        }
      }
    }

    curve.push({
      intensity,
      avgConfidence: totalRuns > 0 ? totalConfidence / totalRuns : 0,
      flipRate: totalRuns > 0 ? (totalFlips / totalRuns) * 100 : 0,
    });
  }

  return curve;
}

// ─── Simulated Results (Demo Mode) ──────────────────────────────────────────

function generateSimulatedResults(
  imageCount: number,
  noiseTypes: string[],
  intensity: number,
  metadata: any
): NoiseTestResult {
  // Noise type impact profiles (higher = more disruptive)
  const impactProfiles: Record<string, { flipBase: number; confDropBase: number; scale: number }> = {
    gaussian: { flipBase: 3, confDropBase: 0.02, scale: 0.8 },
    uniform: { flipBase: 1, confDropBase: 0.01, scale: 0.5 },
    laplacian: { flipBase: 5, confDropBase: 0.03, scale: 1.0 },
    cauchy: { flipBase: 8, confDropBase: 0.05, scale: 1.5 },
  };

  const actualCount = Math.min(imageCount, 50);
  const results: ImageTestResult[] = [];

  for (let i = 0; i < actualCount; i++) {
    const trueCategory = CATEGORIES[i % CATEGORIES.length];
    const cleanConfidence = 0.75 + Math.random() * 0.24;
    const cleanPrediction = {
      category: trueCategory,
      displayName: DISPLAY_NAMES[trueCategory] || trueCategory,
      confidence: cleanConfidence,
      index: CATEGORIES.indexOf(trueCategory),
    };

    const noisyPredictions: ImageTestResult["noisyPredictions"] = {};

    for (const nt of noiseTypes) {
      const profile = impactProfiles[nt] || impactProfiles.gaussian;
      const intensityFactor = (intensity / 100) * profile.scale;
      const flipChance = profile.flipBase * intensityFactor;

      const flipped = Math.random() * 100 < flipChance;
      const confidenceDrop = profile.confDropBase * (intensity / 50) * (0.5 + Math.random());

      let noisyCategory: string;
      if (flipped) {
        do {
          noisyCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        } while (noisyCategory === trueCategory);
      } else {
        noisyCategory = trueCategory;
      }

      const noisyConfidence = Math.max(0.01, cleanConfidence - confidenceDrop + (Math.random() * 0.02 - 0.01));

      noisyPredictions[nt] = {
        prediction: {
          category: noisyCategory,
          displayName: DISPLAY_NAMES[noisyCategory] || noisyCategory,
          confidence: noisyConfidence,
          index: (CATEGORIES as readonly string[]).indexOf(noisyCategory),
        },
        flipped,
        confidenceDrop: Math.max(0, confidenceDrop),
      };
    }

    results.push({
      imageId: `IMG-${String(i + 1).padStart(4, "0")}`,
      imagePath: `/dataset/${trueCategory}/img_${i + 1}.jpg`,
      trueCategory,
      trueDisplayName: DISPLAY_NAMES[trueCategory] || trueCategory,
      cleanPrediction,
      noisyPredictions,
    });
  }

  // Aggregated metrics
  const aggregatedMetrics = noiseTypes.map((nt) => calculateMetrics(results, nt));

  const overallFlipRate = aggregatedMetrics.reduce((s, m) => s + m.flipRate, 0) / noiseTypes.length;
  const avgConfidenceDrop =
    aggregatedMetrics.reduce((s, m) => s + m.avgConfidenceDrop, 0) / noiseTypes.length;
  const overallStabilityScore = Math.max(0, 100 - overallFlipRate - avgConfidenceDrop * 100);

  const sorted = [...aggregatedMetrics].sort((a, b) => a.flipRate - b.flipRate);

  // Simulated intensity curve
  const intensityCurve = generateSimulatedIntensityCurve(noiseTypes, intensity);

  return {
    results,
    aggregatedMetrics,
    intensityCurve,
    overallMetrics: {
      totalImages: results.length,
      overallFlipRate,
      avgConfidenceDrop,
      bestNoiseType: sorted[0]?.noiseType || "unknown",
      worstNoiseType: sorted[sorted.length - 1]?.noiseType || "unknown",
      overallStabilityScore,
    },
    modelInfo: {
      architecture: metadata.architecture || "ResNet18",
      categories: metadata.num_classes || 20,
      inputSize: "224×224×3",
      pretrained: metadata.pretrained || "ImageNet",
      description: metadata.description || "Aircraft classification model",
    },
    realInference: false,
  };
}

function generateSimulatedIntensityCurve(
  noiseTypes: string[],
  currentIntensity: number
): IntensityPoint[] {
  const intensities = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const baseConfidence = 0.92;
  const profiles: Record<string, { decay: number; flipRateBase: number }> = {
    gaussian: { decay: 0.004, flipRateBase: 0.3 },
    uniform: { decay: 0.002, flipRateBase: 0.15 },
    laplacian: { decay: 0.005, flipRateBase: 0.5 },
    cauchy: { decay: 0.008, flipRateBase: 0.8 },
  };

  return intensities.map((intensity) => {
    // Average across noise types
    let totalConf = 0;
    let totalFlip = 0;

    for (const nt of noiseTypes) {
      const p = profiles[nt] || profiles.gaussian;
      const normalizedInt = intensity / 100;
      const conf = Math.max(0.08, baseConfidence - p.decay * intensity + 0.005 * Math.sin(intensity));
      const flip = p.flipRateBase * normalizedInt * normalizedInt * 100;
      totalConf += conf;
      totalFlip += flip;
    }

    return {
      intensity,
      avgConfidence: totalConf / noiseTypes.length,
      flipRate: totalFlip / noiseTypes.length,
    };
  });
}

export type { NoiseTestResult, ImageTestResult, AggregatedMetric, IntensityPoint };
