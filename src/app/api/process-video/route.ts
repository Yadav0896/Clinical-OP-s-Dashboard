import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const FRAMES_DIR = path.join(process.cwd(), "frames");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get("video") as File;
    const nvidiaApiKey = formData.get("nvidiaApiKey") as string;
    const guideTitle = (formData.get("guideTitle") as string) || "Onboarding Guide";
    const fps = parseFloat((formData.get("fps") as string) || "0.2");

    if (!videoFile || !nvidiaApiKey) {
      return NextResponse.json({ error: "Video file and NVIDIA API key are required" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(FRAMES_DIR, { recursive: true });

    const videoPath = path.join(UPLOAD_DIR, `video_${Date.now()}.mp4`);
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(videoPath, videoBuffer);

    try {
      const sessionId = `session_${Date.now()}`;
      const sessionFramesDir = path.join(FRAMES_DIR, sessionId);
      await mkdir(sessionFramesDir, { recursive: true });

      // Step 1: Extract frames
      const fpsArg = fps > 0 ? fps : 0.2;
      await execAsync(
        `ffmpeg -i "${videoPath}" -vf "fps=${fpsArg}" -q:v 2 "${path.join(sessionFramesDir, "frame_%04d.jpg")}" -y 2>/dev/null`
      );

      const { readdir } = await import("fs/promises");
      let frameFiles = (await readdir(sessionFramesDir))
        .filter((f: string) => f.endsWith(".jpg"))
        .sort();

      if (frameFiles.length > 30) {
        const step = Math.ceil(frameFiles.length / 30);
        frameFiles = frameFiles.filter((_: string, i: number) => i % step === 0);
      }

      if (frameFiles.length === 0) {
        return NextResponse.json({ error: "No frames could be extracted from the video" }, { status: 400 });
      }

      // Step 2: Analyze frames with NVIDIA Vision API
      const analysisResults: { frame: string; description: string; timestamp: string }[] = [];

      for (let i = 0; i < frameFiles.length; i++) {
        const framePath = path.join(sessionFramesDir, frameFiles[i]);
        const frameBuffer = await readFile(framePath);
        const base64Frame = frameBuffer.toString("base64");

        const timestamp = frameFiles[i].match(/frame_(\d+)\.jpg/)?.[1];
        const timestampSeconds = timestamp ? (parseInt(timestamp) / fpsArg).toFixed(1) : `${i}`;

        try {
          const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${nvidiaApiKey}`,
            },
            body: JSON.stringify({
              model: "nvidia/llama-3.1-vision-90b-instruct",
              messages: [
                {
                  role: "system",
                  content: `You are analyzing screenshots from a video to create an onboarding guide. For each screenshot, provide a clear description of what is shown including UI elements, steps being performed, important text or labels, and the purpose of this step. Be descriptive but concise.`,
                },
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Analyze this screenshot from an onboarding video. Describe what the user sees, what action they should take, and any important UI elements or text." },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Frame}` } },
                  ],
                },
              ],
              max_tokens: 500,
              temperature: 0.3,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const description = data.choices?.[0]?.message?.content || "Could not analyze this frame.";
            analysisResults.push({ frame: frameFiles[i], description, timestamp: timestampSeconds });
          } else {
            const errText = await response.text();
            console.error(`NVIDIA API error frame ${i}:`, errText);
            analysisResults.push({ frame: frameFiles[i], description: `[Analysis failed - Frame ${i + 1}]`, timestamp: timestampSeconds });
          }
        } catch (err) {
          console.error(`Error analyzing frame ${i}:`, err);
          analysisResults.push({ frame: frameFiles[i], description: `[Error processing frame ${i + 1}]`, timestamp: timestampSeconds });
        }
      }

      // Step 3: Generate structured guide
      let guideContent = "";
      try {
        const analysisText = analysisResults.map((r, i) => `Frame ${i + 1} (${r.timestamp}s): ${r.description}`).join("\n\n");

        const guideResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${nvidiaApiKey}`,
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-405b-instruct",
            messages: [
              {
                role: "system",
                content: `You are a professional technical writer creating an onboarding guide. Create a well-structured guide with:
${guideTitle}
===
# INTRODUCTION
2-3 sentences explaining what this guide covers.
# STEP-BY-STEP GUIDE
For each major step:
## Step N: [Step Title]
**What you will see:** [Description]
**What to do:** [Action]
**Key elements:** [Important buttons, fields, or options]
**Tips:** [Helpful tips or warnings]
# SUMMARY
Brief summary of the entire process.
Use markdown formatting.`,
              },
              { role: "user", content: `Create an onboarding guide titled "${guideTitle}" based on these video screenshot analyses:\n\n${analysisText}` },
            ],
            max_tokens: 4000,
            temperature: 0.4,
          }),
        });

        if (guideResponse.ok) {
          const guideData = await guideResponse.json();
          guideContent = guideData.choices?.[0]?.message?.content || buildFallbackGuide(guideTitle, analysisResults);
        } else {
          guideContent = buildFallbackGuide(guideTitle, analysisResults);
        }
      } catch {
        guideContent = buildFallbackGuide(guideTitle, analysisResults);
      }

      // Step 4: Generate DOCX and PDF
      const docxPath = path.join(UPLOAD_DIR, `${sessionId}.docx`);
      const pdfPath = path.join(UPLOAD_DIR, `${sessionId}.pdf`);
      await generateDocx(guideContent, docxPath);
      await generatePdf(guideContent, pdfPath);

      // Build frame previews
      const framePreviews: string[] = [];
      for (const fr of frameFiles.slice(0, 30)) {
        const fp = path.join(sessionFramesDir, fr);
        if (existsSync(fp)) {
          const buf = await readFile(fp);
          framePreviews.push(`data:image/jpeg;base64,${buf.toString("base64")}`);
        }
      }

      return NextResponse.json({
        success: true,
        sessionId,
        guideContent,
        frameCount: frameFiles.length,
        analyses: analysisResults,
        framePreviews,
      });
    } finally {
      try { await unlink(videoPath); } catch {}
    }
  } catch (error) {
    console.error("Processing error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function buildFallbackGuide(title: string, analyses: { frame: string; description: string; timestamp: string }[]): string {
  let md = `# ${title}\n\n## Introduction\n\nThis onboarding guide walks you through the key steps shown in the video. A total of ${analyses.length} screenshots were analyzed.\n\n## Step-by-Step Guide\n\n`;
  analyses.forEach((a, i) => {
    md += `### Step ${i + 1} (at ${a.timestamp}s)\n\n${a.description}\n\n`;
  });
  md += `## Summary\n\nThis guide covers ${analyses.length} key steps from the video. Follow each step carefully to complete the onboarding process.\n`;
  return md;
}

async function generateDocx(content: string, outputPath: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const lines = content.split("\n");
  const children: any[] = [];

  for (const line of lines) {
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      children.push(new Paragraph({ children: [new TextRun({ text: line.replace("# ", ""), bold: true, size: 48 })], heading: HeadingLevel.TITLE, spacing: { after: 400 } }));
    } else if (line.startsWith("## ")) {
      children.push(new Paragraph({ children: [new TextRun({ text: line.replace("## ", ""), bold: true, size: 36 })], heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 } }));
    } else if (line.startsWith("### ")) {
      children.push(new Paragraph({ children: [new TextRun({ text: line.replace("### ", ""), bold: true, size: 28 })], heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    } else if (line.startsWith("---")) {
      children.push(new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 200 } }));
    } else if (line.trim()) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const runs = parts.map((p) => (p.startsWith("**") && p.endsWith("**") ? new TextRun({ text: p.replace(/\*\*/g, ""), bold: true, size: 24 }) : new TextRun({ text: p, size: 24 })));
      children.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  await writeFile(outputPath, buffer);
}

async function generatePdf(content: string, outputPath: string) {
  const PDFDocument = await import("pdfkit");
  const fs = await import("fs");
  const pdf = new PDFDocument.default({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 } });
  const stream = fs.createWriteStream(outputPath);
  pdf.pipe(stream);

  const lines = content.split("\n");
  let y = 50;

  function checkPage(needed: number) {
    if (y + needed > 750) { pdf.addPage(); y = 50; }
  }

  for (const line of lines) {
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      checkPage(60); pdf.fontSize(24).font("Helvetica-Bold").text(line.replace("# ", ""), 50, y); y += 40;
    } else if (line.startsWith("## ")) {
      checkPage(40); y += 10; pdf.fontSize(18).font("Helvetica-Bold").text(line.replace("## ", ""), 50, y); y += 30;
    } else if (line.startsWith("### ")) {
      checkPage(30); y += 5; pdf.fontSize(14).font("Helvetica-Bold").text(line.replace("### ", ""), 50, y); y += 22;
    } else if (line.startsWith("---")) {
      y += 15;
    } else if (line.trim()) {
      const cleanLine = line.replace(/\*\*/g, "");
      checkPage(20);
      pdf.fontSize(11).font("Helvetica").text(cleanLine, 50, y, { width: 495 });
      y += pdf.heightOfString(cleanLine, { width: 495 }) + 8;
    } else {
      y += 8;
    }
  }

  pdf.end();
  return new Promise((resolve) => { stream.on("finish", resolve); });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const format = searchParams.get("format");

  if (!sessionId || !format) {
    return NextResponse.json({ error: "sessionId and format are required" }, { status: 400 });
  }

  const ext = format === "pdf" ? "pdf" : "docx";
  const filePath = path.join(UPLOAD_DIR, `${sessionId}.${ext}`);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileBuffer = await readFile(filePath);
  const mimeType = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="onboarding_guide.${ext}"`,
    },
  });
}
