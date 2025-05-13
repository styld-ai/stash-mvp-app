import * as tf from '@tensorflow/tfjs';

/**
 * Loads an image from a URL and converts it to a tensor.
 * @param url URL or data URL of the image
 * @returns Promise resolving to an RGB tensor with shape [height, width, 3]
 */
export async function loadImageAsTensor(url: string): Promise<tf.Tensor3D> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Convert to tensor: [height, width, RGBA]
        const data = Float32Array.from(imageData.data).map(v => v / 255);
        const rgba = tf.tensor(data, [img.height, img.width, 4]);
        
        // Remove alpha channel
        const rgb = rgba.slice([0, 0, 0], [-1, -1, 3]);
        
        resolve(rgb);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Computes a simplified saliency map based on local contrast and color distinctiveness.
 * This is an alternative to spectral residual that doesn't require FFT.
 * @param imageUrl URL or data URL of the image
 * @returns Promise resolving to a data URL of the saliency heatmap
 */
export async function computeSaliencyMap(imageUrl: string): Promise<string> {
  try {
    // Load image as tensor
    const imgRGB = await loadImageAsTensor(imageUrl);
    
    // Reference image dimensions for output
    const height = imgRGB.shape[0];
    const width = imgRGB.shape[1];
    
    // Wrap calculation in tidy to manage memory
    const saliencyMap = tf.tidy(() => {
      // 1. Convert to grayscale
      const [r, g, b] = tf.split(imgRGB, 3, 2);
      const gray = r.mul(0.299).add(g.mul(0.587)).add(b.mul(0.114)).squeeze();
      
      // 2. Calculate local contrast using a difference of Gaussians approach
      // First, create a blurred version - approximating a Gaussian blur
      const blurred1 = tf.avgPool(
        gray.expandDims(2).expandDims(0),
        [3, 3],
        [1, 1],
        'same'
      ).squeeze([0, 2]);
      
      // Create a more blurred version
      const blurred2 = tf.avgPool(
        blurred1.expandDims(2).expandDims(0), 
        [5, 5], 
        [1, 1], 
        'same'
      ).squeeze([0, 2]);
      
      // Difference of Gaussians to highlight edges and salient regions
      const dog = tf.abs(blurred1.sub(blurred2));
      
      // 3. Color uniqueness component
      // Calculate color distance from mean color
      const meanR = r.mean();
      const meanG = g.mean();
      const meanB = b.mean();
      
      // Distance of each pixel color from the mean
      const colorDistance = tf.sqrt(
        r.sub(meanR).square()
          .add(g.sub(meanG).square())
          .add(b.sub(meanB).square())
      ).squeeze();
      
      // 4. Combine contrast and color components
      const saliency = dog.mul(0.5).add(colorDistance.mul(0.5));
      
      // 5. Normalize to [0, 1]
      const normMin = saliency.min();
      const normMax = saliency.max();
      return saliency.sub(normMin).div(normMax.sub(normMin).add(1e-5));
    });
    
    // Convert the saliency map to a heatmap overlay
    const result = await saliencyMapToHeatmap(saliencyMap, imageUrl, height, width);
    
    // Clean up
    tf.dispose(imgRGB);
    tf.dispose(saliencyMap);
    
    return result;
  } catch (err) {
    console.error('Error computing saliency map:', err);
    throw err;
  }
}

/**
 * Converts a saliency map tensor to a colorful heatmap and overlays it on the original image.
 * @param saliencyMap The [height, width] tensor with values in [0,1]
 * @param originalUrl The original image URL for overlay
 * @param height Image height
 * @param width Image width
 * @returns Data URL of the heatmap
 */
async function saliencyMapToHeatmap(
  saliencyMap: tf.Tensor2D, 
  originalUrl: string,
  height: number,
  width: number
): Promise<string> {
  // Create canvas for the heatmap
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Get the raw data from tensor
  const saliencyData = await saliencyMap.data();
  
  // Create image data for the heatmap
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  // Apply colormap (similar to jet/rainbow)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const pixelIndex = i * 4;
      
      // Get saliency value [0,1]
      const value = saliencyData[i];
      
      // Apply heatmap coloring
      if (value > 0.6) {
        // red-yellow for high saliency
        data[pixelIndex] = 255;
        data[pixelIndex + 1] = Math.floor(((value - 0.6) * 255) / 0.4);
        data[pixelIndex + 2] = 0;
      } else {
        // blue-cyan-green for lower saliency
        data[pixelIndex] = 0;
        data[pixelIndex + 1] = Math.floor((value * 255) / 0.6);
        data[pixelIndex + 2] = Math.floor(((0.6 - value) * 255) / 0.6);
      }
      
      // Set alpha proportional to saliency
      data[pixelIndex + 3] = Math.floor(180 * value);
    }
  }
  
  // Put the heatmap on the canvas
  ctx.putImageData(imageData, 0, 0);
  
  // Overlay original image with reduced opacity
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      ctx.globalAlpha = 0.7;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    
    img.onerror = () => {
      // If overlay fails, just return the heatmap
      console.warn('Failed to overlay original image, returning heatmap only');
      resolve(canvas.toDataURL('image/jpeg'));
    };
    
    img.src = originalUrl;
  });
}

/**
 * Test function to verify TensorFlow.js is working correctly
 */
export async function testTensorflowIntegration() {
  console.log("TensorFlow.js version:", tf.version.tfjs);
  console.log("Backend:", tf.getBackend());
  
  // Simple operation test
  const a = tf.tensor1d([1, 2, 3]);
  const b = tf.tensor1d([4, 5, 6]);
  const result = a.add(b);
  
  console.log("Simple operation result:", await result.array());
  
  // Clean up tensors
  tf.dispose([a, b, result]);
  
  return "TensorFlow.js test completed successfully!";
}