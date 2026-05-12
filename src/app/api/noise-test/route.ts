import { NextRequest, NextResponse } from "next/server";
import { runNoiseTest } from "@/lib/onnx-inference";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageCount = 50, noiseTypes = ["gaussian", "uniform", "laplacian", "cauchy"], intensity = 30 } = body;

    // Validate inputs
    if (typeof imageCount !== "number" || imageCount < 1 || imageCount > 500) {
      return NextResponse.json(
        { error: "imageCount must be between 1 and 500" },
        { status: 400 }
      );
    }

    if (!Array.isArray(noiseTypes) || noiseTypes.length === 0) {
      return NextResponse.json(
        { error: "noiseTypes must be a non-empty array" },
        { status: 400 }
      );
    }

    const validNoiseTypes = ["gaussian", "uniform", "laplacian", "cauchy"];
    for (const nt of noiseTypes) {
      if (!validNoiseTypes.includes(nt)) {
        return NextResponse.json(
          { error: `Invalid noise type: ${nt}. Must be one of: ${validNoiseTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (typeof intensity !== "number" || intensity < 1 || intensity > 100) {
      return NextResponse.json(
        { error: "intensity must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Run the noise robustness test
    const testResults = await runNoiseTest(imageCount, noiseTypes, intensity);

    return NextResponse.json(testResults, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Noise test API error:", error);
    return NextResponse.json(
      {
        error: "Failed to run noise test",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Aircraft Noise Robustness Testing API",
    endpoints: {
      POST: "/api/noise-test - Run noise robustness test",
    },
    parameters: {
      imageCount: "number (1-500, default: 50)",
      noiseTypes: "string[] (gaussian, uniform, laplacian, cauchy)",
      intensity: "number (1-100, default: 30)",
    },
  });
}
