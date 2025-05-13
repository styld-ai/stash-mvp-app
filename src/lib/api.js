import { toast } from "@/hooks/use-toast";
import {
  analyzePackageDesign,
  fileToBase64
} from "./openai";
import { generateAttentionHeatmap } from "./canvasHeatmap";

/* ---------- Public function -------------------------------------- */

export const analyzeImages = async (images) => {
  toast({
    title: "Analyzing images",
    description: "Running AI vision model…"
  });

  return Promise.all(
    images.map(async (image) => {
      try {
        /* 1️⃣  Generate attention heatmap */
        let heatmapSrc;
        try {
          // Try main heatmap generator
          heatmapSrc = await generateAttentionHeatmap(image.preview);
        } catch (err) {
          console.error("Heatmap generation failed:", err);
          
          toast({
            title: "Heatmap processing issue",
            description: "Using fallback visualization method.",
            variant: "destructive"
          });
          
          // Use fallback
          heatmapSrc = await generateSimulatedHeatmap(image.preview);
        }

        /* 2️⃣  OpenAI analysis */
        const base64 = await fileToBase64(image.file);
        let analysis;

        try {
          analysis = await analyzePackageDesign(base64);
        } catch (err) {
          console.error("OpenAI analysis failed:", err);
          toast({
            title: "AI analysis failed",
            description: "Showing simulated scores instead.",
            variant: "destructive"
          });
          
          // Generate fallback scores
          const fallbackScore = Math.round((4 + Math.random() * 5.5) * 10) / 10;
          analysis = {
            attentionScore: fallbackScore,
            colorImpact: fallbackScore,
            readability: fallbackScore,
            brandVisibility: fallbackScore,
            overallScore: fallbackScore,
            suggestions: generateSuggestions(fallbackScore),
            analysis: "Simulated analysis due to API error."
          };
        }

        /* 3️⃣  return combined result for UI */
        return {
          imageId: image.id,
          originalSrc: image.preview,
          heatmapSrc,
          attentionScore: analysis.attentionScore,
          colorImpact: analysis.colorImpact,
          readability: analysis.readability,
          brandVisibility: analysis.brandVisibility,
          overallScore: analysis.overallScore,
          suggestions: analysis.suggestions,
          aiAnalysis: analysis.analysis
        };
      } catch (err) {
        console.error("Unexpected analysis error:", err);
        
        // Final fallback with minimal result
        const fallbackScore = 5.0;
        
        toast({
          title: "Analysis partially failed",
          description: "Some features may be limited. Please try again.",
          variant: "destructive"
        });
        
        return {
          imageId: image.id,
          originalSrc: image.preview,
          heatmapSrc: image.preview, // Just use original image if all else fails
          attentionScore: fallbackScore,
          colorImpact: fallbackScore,
          readability: fallbackScore,
          brandVisibility: fallbackScore,
          overallScore: fallbackScore,
          suggestions: ["Unable to generate analysis. Please try again."],
          aiAnalysis: "Analysis failed. Please try uploading a different image."
        };
      }
    })
  );
};

/* ---------- Helpers ---------------------------------------------- */

/* Simple fallback heatmap */
const generateSimulatedHeatmap = (url) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = function() {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) {
          reject(new Error("No 2D context"));
          return;
        }

        // Draw original
        ctx.drawImage(img, 0, 0);
        
        // Create a simple center-weighted heatmap
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            
            // Simple center + top weighting
            const dx = x - cx;
            const dy = y - cy;
            const distance = Math.sqrt(dx * dx + dy * dy) / (canvas.width / 2);
            const topBoost = y < (canvas.height / 3) ? 0.3 : 0;
            
            let heat = (1 - distance) * 0.7 + topBoost + Math.random() * 0.1;
            heat = Math.max(0, Math.min(1, heat));
            
            // Apply color map
            if (heat > 0.6) {
              data[i] = 255;  // red
              data[i + 1] = Math.floor(((heat - 0.6) * 255) / 0.4);  // green
              data[i + 2] = 0;  // blue
            } else {
              data[i] = 0;  // red
              data[i + 1] = Math.floor((heat * 255) / 0.6);  // green
              data[i + 2] = Math.floor(((0.6 - heat) * 255) / 0.6);  // blue
            }
            
            data[i + 3] = Math.floor(128 * heat);  // alpha
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Overlay original with transparency
        ctx.globalAlpha = 0.7;
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas.toDataURL("image/jpeg"));
      } catch (err) {
        console.error("Error in fallback heatmap:", err);
        reject(err);
      }
    };

    img.onerror = function() {
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
};

/* Suggestion generator */
const generateSuggestions = (score) => {
  const ideas = [
    "Increase contrast between product name and background.",
    "Use a larger font for key claims.",
    "Position the logo in the top third for maximum noticeability.",
    "Reduce visual clutter to focus attention on core message.",
    "Consider higher-saturation colors for stronger shelf pop.",
    "Add negative space around hero elements.",
    "Try a distinctive die-cut or silhouette.",
    "Apply the rule of thirds to layout.",
    "Add texture contrast to make elements pop.",
    "Re-evaluate hierarchy based on consumer priorities."
  ];
  const shuffled = ideas.sort(() => 0.5 - Math.random());
  const n = Math.max(2, Math.min(5, Math.round(10 - score)));
  return shuffled.slice(0, n);
};