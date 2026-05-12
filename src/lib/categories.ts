export const CATEGORIES = [
  "airshow_aircraft",
  "amphibious_aircraft",
  "biplane",
  "cargo_aircraft",
  "commercial_airplane",
  "crop_duster",
  "drone",
  "experimental_aircraft",
  "fighter_jet",
  "glider",
  "helicopter",
  "hot_air_balloon",
  "light_aircraft",
  "military_transport",
  "private_jet",
  "reconnaissance_aircraft",
  "seaplane",
  "space_aircraft",
  "stealth_aircraft",
  "supersonic_aircraft",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const NOISE_TYPES = ["gaussian", "uniform", "laplacian", "cauchy"] as const;
export type NoiseType = (typeof NOISE_TYPES)[number];

export const DISPLAY_NAMES: Record<string, string> = {
  airshow_aircraft: "Airshow Aircraft",
  amphibious_aircraft: "Amphibious Aircraft",
  biplane: "Biplane",
  cargo_aircraft: "Cargo Aircraft",
  commercial_airplane: "Commercial Airplane",
  crop_duster: "Crop Duster",
  drone: "Drone",
  experimental_aircraft: "Experimental Aircraft",
  fighter_jet: "Fighter Jet",
  glider: "Glider",
  helicopter: "Helicopter",
  hot_air_balloon: "Hot Air Balloon",
  light_aircraft: "Light Aircraft",
  military_transport: "Military Transport",
  private_jet: "Private Jet",
  reconnaissance_aircraft: "Reconnaissance Aircraft",
  seaplane: "Seaplane",
  space_aircraft: "Space Aircraft",
  stealth_aircraft: "Stealth Aircraft",
  supersonic_aircraft: "Supersonic Aircraft",
};

export const NOISE_INFO: Record<
  string,
  {
    color: string;
    lightColor: string;
    bgClass: string;
    textClass: string;
    impactRank: number;
    description: string;
  }
> = {
  gaussian: {
    color: "#3b82f6",
    lightColor: "#60a5fa",
    bgClass: "bg-blue-500/20",
    textClass: "text-blue-400",
    impactRank: 1,
    description:
      "Gaussian (normal distribution) noise simulates sensor noise, thermal interference, and natural signal corruption commonly found in real-world imaging systems.",
  },
  uniform: {
    color: "#22c55e",
    lightColor: "#4ade80",
    bgClass: "bg-green-500/20",
    textClass: "text-green-400",
    impactRank: 4,
    description:
      "Uniform distribution noise provides a flat probability of noise values across a range, modeling quantization errors and digital conversion artifacts.",
  },
  laplacian: {
    color: "#f59e0b",
    lightColor: "#fbbf24",
    bgClass: "bg-amber-500/20",
    textClass: "text-amber-400",
    impactRank: 2,
    description:
      "Laplacian noise produces sharp impulse-like disturbances, simulating salt-and-pepper noise, transmission errors, and sensor dropouts.",
  },
  cauchy: {
    color: "#ef4444",
    lightColor: "#f87171",
    bgClass: "bg-red-500/20",
    textClass: "text-red-400",
    impactRank: 3,
    description:
      "Cauchy noise has heavy tails causing extreme outlier values, modeling severe signal corruption, electromagnetic interference, and adversarial perturbations.",
  },
};

export function getDisplayName(category: string): string {
  return DISPLAY_NAMES[category] || category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatConfidence(value: number, decimals = 3): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
