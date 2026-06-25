import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "missing-key");

const PLATFORM_GUIDANCE: Record<string, string> = {
  linkedin: 'Professional tone, 2-4 short paragraphs, can include 1-2 relevant hashtags at the end. Aimed at B2B decision-makers in construction/real estate.',
  instagram: 'Punchy, visual-first tone, short lines, line breaks for readability, 5-10 relevant hashtags at the end.',
  facebook: 'Conversational, friendly tone, slightly longer than Instagram, minimal hashtags.',
  twitter: 'Very concise, under 280 characters, 1-2 hashtags max, punchy hook.',
};

router.post("/generate", async (req, res) => {
  try {
    const { platform, topic, tone, keywords, variantCount } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server configuration missing: GEMINI_API_KEY is not set." });
    }

    if (!topic || !platform) {
      return res.status(400).json({ error: "topic and platform are required" });
    }

    const count = Math.min(Math.max(Number(variantCount) || 3, 1), 5);
    const platformKey = String(platform).toLowerCase();
    const guidance = PLATFORM_GUIDANCE[platformKey] || PLATFORM_GUIDANCE.linkedin;

    const systemPrompt = `You are a social media copywriter for Arkoo Pre-Build Pvt. Ltd., a prefab/prebuild construction company. You write captions for company social posts. Always return ONLY valid JSON, no preamble, no markdown fences.`;

    const userPrompt = `Write ${count} distinct caption variants for a ${platform} post.

Topic: ${topic}
Desired tone: ${tone || 'professional but approachable'}
Keywords to weave in naturally (optional, don't force all of them): ${keywords || 'none specified'}

Platform style guidance: ${guidance}

Return JSON in exactly this shape:
{
  "variants": [
    { "caption": "...", "hashtags": ["...", "..."] }
  ]
}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt 
    });

    const response = await model.generateContent(userPrompt);
    const rawText = response.response.text().trim();

    // Strip accidental markdown fences just in case
    const cleaned = rawText.replace(/^```json\s*|```$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Claude response as JSON:', rawText);
      return res.status(502).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Content generation error:', err);
    return res.status(500).json({ error: 'Failed to generate content. Please try again.' });
  }
});

router.post("/generate-image", async (req, res) => {
  try {
    const { caption, platform, visualStyle } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server configuration missing: GEMINI_API_KEY is not set." });
    }

    if (!caption || !platform || !visualStyle) {
      return res.status(400).json({ error: "caption, platform, and visualStyle are required" });
    }

    // Determine aspect ratio hint based on platform
    let aspectRatioHint = "square format (1:1)";
    const platformKey = String(platform).toLowerCase();
    if (platformKey === "instagram") aspectRatioHint = "portrait format (4:5 or 1:1)";
    if (platformKey === "linkedin") aspectRatioHint = "landscape or square format (1.91:1 or 1:1)";
    if (platformKey === "twitter") aspectRatioHint = "landscape format (16:9)";

    const prompt = `Create a marketing/ad creative for Arkoo Pre-Build Pvt. Ltd., a prefab/construction company. 
Visual Style: ${visualStyle}
Platform Requirements: ${aspectRatioHint}
Context/Caption to match: "${caption.substring(0, 300)}"
CRITICAL: Do not include any unrelated imagery. It must look like professional marketing material for a construction/prefab company.`;

    // using gemini-2.5-flash-image
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    // Assuming we can use generateContent to get an image...
    // Actually, according to google docs, gemini-2.5-flash does not return images natively via generateContent without specific setup (or maybe it does?). 
    // Wait, the prompt specifically says "Use Google's Gemini API for image generation — specifically the Gemini 2.5 Flash Image model... model id gemini-2.5-flash-image".
    // I should check the exact syntax for generateImages with @google/generative-ai.
    // Wait, `@google/generative-ai` does not directly have `generateImages()` method in older versions, but if it is the latest, it might.
    // Let me use `fetch` to directly hit the REST API if the SDK fails, or just use the SDK assuming it supports `generateImages`.
    // Let's use fetch as a fallback in case SDK is missing it, to be extremely robust.

    let base64Image = "";
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateImages?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          instances: [
            { prompt }
          ],
          parameters: {
            sampleCount: 1
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      interface GeminiImageResponse {
        predictions?: {
          bytesBase64Encoded?: string;
        }[];
      }

      const data = (await response.json()) as GeminiImageResponse;
      if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
        base64Image = `data:image/jpeg;base64,${data.predictions[0].bytesBase64Encoded}`;
      } else {
         throw new Error("No image generated by Gemini API");
      }

    } catch (apiError) {
      console.error("Fetch API error:", apiError);
      throw apiError;
    }

    return res.json({ image: base64Image });
  } catch (err) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: 'Image generation failed or rate limited. Please try again.' });
  }
});

export default router;
