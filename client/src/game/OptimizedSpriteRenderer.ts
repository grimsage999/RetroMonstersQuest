/**
 * CRITICAL PERFORMANCE FIX: Optimized Sprite Renderer
 * Replaces expensive pixel-by-pixel fillRect calls with efficient canvas operations
 */
export class OptimizedSpriteRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteCache: Map<string, ImageData> = new Map();
  
  constructor() {
    // Create offscreen canvas for sprite pre-rendering
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false; // Critical for pixel art
  }
  
  /**
   * CRITICAL: Pre-render sprite to ImageData for maximum performance
   * This converts the nested loop pixel rendering to a single putImageData call
   */
  preRenderSprite(spritePixels: number[][], colors: string[], scale: number, spriteId: string): ImageData {
    // Check cache first
    if (this.spriteCache.has(spriteId)) {
      return this.spriteCache.get(spriteId)!;
    }
    
    const width = spritePixels[0].length * scale;
    const height = spritePixels.length * scale;
    
    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Create ImageData for direct pixel manipulation (fastest approach)
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;
    
    // Convert color strings to RGB values (cache this for even better performance)
    const rgbColors = colors.map(color => this.hexToRgb(color));
    
    // Render sprite to ImageData (much faster than fillRect)
    for (let row = 0; row < spritePixels.length; row++) {
      for (let col = 0; col < spritePixels[row].length; col++) {
        const colorIndex = spritePixels[row][col];
        if (colorIndex > 0 && rgbColors[colorIndex]) {
          const rgb = rgbColors[colorIndex];
          
          // Scale up the pixel
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const pixelX = col * scale + sx;
              const pixelY = row * scale + sy;
              const index = (pixelY * width + pixelX) * 4;
              
              data[index] = rgb.r;     // Red
              data[index + 1] = rgb.g; // Green
              data[index + 2] = rgb.b; // Blue
              data[index + 3] = 255;   // Alpha
            }
          }
        }
      }
    }
    
    // Cache the result
    this.spriteCache.set(spriteId, imageData);
    return imageData;
  }
  
  /**
   * CRITICAL: Render pre-cached sprite with single putImageData call
   * This replaces 256+ fillRect calls with 1 putImageData call
   */
  renderSprite(ctx: CanvasRenderingContext2D, imageData: ImageData, x: number, y: number) {
    // Create temporary canvas for the sprite
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Put the image data on temp canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw the temp canvas to main canvas (hardware accelerated)
    ctx.drawImage(tempCanvas, x, y);
  }
  
  /**
   * EMERGENCY: Fallback optimized pixel rendering if ImageData fails
   * Still much better than original nested fillRect calls
   */
  renderSpriteOptimized(ctx: CanvasRenderingContext2D, spritePixels: number[][], colors: string[], scale: number, x: number, y: number) {
    // Batch fillRect calls by color to reduce context switches
    const colorBatches: { [color: string]: { x: number, y: number, width: number, height: number }[] } = {};
    
    for (let row = 0; row < spritePixels.length; row++) {
      for (let col = 0; col < spritePixels[row].length; col++) {
        const colorIndex = spritePixels[row][col];
        if (colorIndex > 0) {
          const color = colors[colorIndex];
          if (!colorBatches[color]) {
            colorBatches[color] = [];
          }
          
          colorBatches[color].push({
            x: x + col * scale,
            y: y + row * scale,
            width: scale,
            height: scale
          });
        }
      }
    }
    
    // Render each color batch at once
    for (const color in colorBatches) {
      ctx.fillStyle = color;
      for (const rect of colorBatches[color]) {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    }
  }
  
  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  clearCache() {
    this.spriteCache.clear();
  }
  
  getCacheSize(): number {
    return this.spriteCache.size;
  }
}