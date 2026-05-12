import sharp from "sharp";

type NoiseType = "gaussian" | "uniform" | "laplacian" | "cauchy";

/**
 * Box-Muller transform for generating gaussian random numbers
 */
function gaussianRandom(mean: number, stddev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1 || 1e-10)) * Math.cos(2.0 * Math.PI * u2);
  return z * stddev + mean;
}

/**
 * Generate a Laplacian-distributed random number
 */
function laplacianRandom(mu: number, b: number): number {
  const u = Math.random() - 0.5;
  return mu - b * Math.sign(u || 1e-10) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Generate a Cauchy-distributed random number
 */
function cauchyRandom(x0: number, gamma: number): number {
  const u = Math.random();
  return x0 + gamma * Math.tan(Math.PI * (u - 0.5));
}

/**
 * Generate a uniform random number in range [min, max]
 */
function uniformRandom(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Scale intensity (0-100) to noise amplitude based on noise type
 */
function getAmplitude(noiseType: NoiseType, intensity: number): number {
  const normalized = intensity / 100;
  switch (noiseType) {
    case "gaussian":
      return normalized * 80; // standard deviation
    case "uniform":
      return normalized * 128; // range [-128, 128]
    case "laplacian":
      return normalized * 60; // scale parameter
    case "cauchy":
      return normalized * 0.5; // scale parameter (very aggressive)
    default:
      return normalized * 50;
  }
}

/**
 * Apply noise to a raw pixel buffer (RGBA format)
 */
function applyNoiseToBuffer(
  pixels: Uint8Array,
  noiseType: NoiseType,
  intensity: number
): void {
  const amplitude = getAmplitude(noiseType, intensity);

  for (let i = 0; i < pixels.length; i += 4) {
    // Skip alpha channel (i+3)
    for (let c = 0; c < 3; c++) {
      let noise: number;
      let value: number;

      switch (noiseType) {
        case "gaussian":
          noise = gaussianRandom(0, amplitude);
          value = pixels[i + c] + noise;
          break;
        case "uniform":
          noise = uniformRandom(-amplitude, amplitude);
          value = pixels[i + c] + noise;
          break;
        case "laplacian":
          noise = laplacianRandom(0, amplitude);
          value = pixels[i + c] + noise;
          break;
        case "cauchy": {
          // Cauchy can produce extreme values; clip them
          noise = cauchyRandom(0, amplitude);
          if (Math.abs(noise) > amplitude * 10) {
            noise = Math.sign(noise) * amplitude * 10;
          }
          value = pixels[i + c] + noise;
          break;
        }
        default:
          continue;
      }

      // Clamp to [0, 255]
      pixels[i + c] = Math.max(0, Math.min(255, Math.round(value)));
    }
  }
}

/**
 * Generate a noisy image from an input buffer.
 *
 * @param inputBuffer - The original image buffer (e.g., PNG/JPEG bytes)
 * @param noiseType - Type of noise to apply
 * @param intensity - Noise intensity from 0 to 100
 * @returns Buffer containing the noisy image (PNG format)
 */
export async function generateNoisyImage(
  inputBuffer: Buffer,
  noiseType: NoiseType,
  intensity: number
): Promise<Buffer> {
  // Decode the image to raw RGBA pixels
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  // Apply noise in-place
  applyNoiseToBuffer(pixels, noiseType, intensity);

  // Encode back to PNG
  return sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Get raw RGBA pixel data from an image buffer
 */
export async function getImagePixels(
  inputBuffer: Buffer
): Promise<{ pixels: Uint8Array; width: number; height: number }> {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  };
}

/**
 * Create a noisy image buffer from raw pixel data
 */
export async function pixelsToBuffer(
  pixels: Uint8Array,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(Buffer.from(pixels), {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

export type { NoiseType };
