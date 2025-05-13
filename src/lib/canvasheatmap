/**
 * Simple Canvas-based attention heatmap generator
 * No external dependencies required
 */

/**
 * Generates an attention heatmap for an image
 * @param url URL or data URL of the image
 * @returns Promise resolving to a data URL of the heatmap
 */
export function generateAttentionHeatmap(url) {
    return new Promise((resolve, reject) => {
      try {
        // Create image element
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = function() {
          try {
            // Create canvas
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            
            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Create heatmap
            const heatmapData = new Uint8ClampedArray(data.length);
            
            // Calculate center for center bias
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
            
            // Generate heatmap
            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                
                // Basic center bias
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy) / maxDist;
                let heat = 1 - distance * 0.6;
                
                // Add top bias
                if (y < canvas.height / 3) {
                  heat += 0.2;
                }
                
                // Add small random variation
                heat += Math.random() * 0.2;
                
                // Clamp to [0, 1]
                heat = Math.max(0, Math.min(1, heat));
                
                // Apply color map (blue -> cyan -> green -> yellow -> red)
                if (heat > 0.6) {
                  // Red to yellow
                  heatmapData[i] = 255;
                  heatmapData[i + 1] = Math.floor(((heat - 0.6) * 255) / 0.4);
                  heatmapData[i + 2] = 0;
                } else {
                  // Blue to cyan to green
                  heatmapData[i] = 0;
                  heatmapData[i + 1] = Math.floor((heat * 255) / 0.6);
                  heatmapData[i + 2] = Math.floor(((0.6 - heat) * 255) / 0.6);
                }
                
                // Set alpha (transparency)
                heatmapData[i + 3] = Math.floor(128 * heat);
              }
            }
            
            // Put heatmap on canvas
            ctx.putImageData(new ImageData(heatmapData, canvas.width, canvas.height), 0, 0);
            
            // Overlay original image
            ctx.globalAlpha = 0.7;
            ctx.drawImage(img, 0, 0);
            
            // Return as data URL
            resolve(canvas.toDataURL("image/jpeg"));
          } catch (err) {
            console.error("Error generating heatmap:", err);
            reject(err);
          }
        };
        
        img.onerror = function(err) {
          console.error("Failed to load image:", err);
          reject(new Error("Failed to load image"));
        };
        
        img.src = url;
      } catch (err) {
        console.error("Error in heatmap generation:", err);
        reject(err);
      }
    });
  }