import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* 1.  OpenAI client                                                  */
/* ------------------------------------------------------------------ */

// Use environment variable instead of hard‑coded API key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/* ------------------------------------------------------------------ */
/* 2.  Zod schema for structured output                               */
/* ------------------------------------------------------------------ */

export const PackagingAnalysisSchema = z.object({
  attentionScore: z.number()
    .describe("Overall attention score (1‑10) based on visual hierarchy, focal point strength, and eye‑tracking patterns"),
  colorImpact: z.number()
    .describe("Impact of color choices (1‑10) evaluating contrast, palette cohesion, and emotional resonance"),
  readability: z.number()
    .describe("Readability of on‑pack text (1‑10) assessing font choice, sizing, contrast, and information hierarchy"),
  brandVisibility: z.number()
    .describe("Brand/logo visibility (1‑10) measuring prominence, placement, and memorability"),
  suggestions: z.array(z.string())
    .describe("Specific, actionable design improvement suggestions"),
  analysis: z.string()
    .describe("Comprehensive analysis of the packaging design with specific strengths and weaknesses")
});

export type PackagingAnalysis = z.infer<typeof PackagingAnalysisSchema> & {
  overallScore: number;
};

/* ------------------------------------------------------------------ */
/* 3.  Utility – File ➜ base‑64 string                                */
/* ------------------------------------------------------------------ */

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]; // strip prefix
      res(base64);
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

/* ------------------------------------------------------------------ */
/* 4.  Vision request with structured output                          */
/* ------------------------------------------------------------------ */

export const analyzePackageDesign = async (
  imageBase64: string
): Promise<PackagingAnalysis> => {
  try {
    // System prompt
    const systemPrompt = `
You are a packaging design expert. Your goal is to evaluate consumer product packaging and provide actionable insights.

Evaluate the packaging based on:
- Attention attraction (scoring 1-10)
- Color impact (scoring 1-10)
- Text readability (scoring 1-10)
- Brand visibility (scoring 1-10)

Consider factors such as visual hierarchy, color psychology, typography effectiveness, and brand prominence.

Provide specific improvement suggestions that would measurably increase the package's effectiveness.
`;

    const response = await openai.responses.parse({
      model: "o3",                       // switched to o3
      reasoning: {
        effort: "high",
        summary: "auto"
      },
      input: [
        {
          role: "system",
          content: [
            { type: "input_text", text: systemPrompt }
          ]
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Analyze this packaging design and provide an expert evaluation." },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"          // explicitly request high‑resolution vision
              }
            
          ]
        }
      ],
      text: {
        format: zodTextFormat(PackagingAnalysisSchema, "packageAnalysis")
      }
    });

    // Calculate the overall score as the average of the individual scores
    const parsedResponse = response.output_parsed;
    const overallScore = calculateOverallScore(parsedResponse);

    console.log("Response details:", response);

    return {
      ...parsedResponse,
      overallScore
    };
  } catch (err) {
    console.error("OpenAI vision error:", err);
    /* graceful fallback so UI still renders */
    const fallbackScore = 5;
    return {
      attentionScore: fallbackScore,
      colorImpact: fallbackScore,
      readability: fallbackScore,
      brandVisibility: fallbackScore,
      overallScore: fallbackScore,
      suggestions: ["AI analysis failed – returned simulated scores."],
      analysis: "Could not retrieve structured output from the model."
    };
  }
};

// Helper function to calculate the overall score
function calculateOverallScore(
  analysis: z.infer<typeof PackagingAnalysisSchema>
): number {
  const { attentionScore, colorImpact, readability, brandVisibility } = analysis;
  const average = (attentionScore + colorImpact + readability + brandVisibility) / 4;
  return Math.round(average * 10) / 10;
}
