/**
 * CRITICAL PERFORMANCE FIX: Background Rendering Cache
 * Caches expensive background calculations and gradients to avoid recalculating every frame
 */
export class BackgroundCache {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private gradientCache: Map<string, CanvasGradient> = new Map();
  
  /**
   * CRITICAL: Get or create cached background canvas
   * Avoids expensive gradient and shape calculations every frame
   */
  getCachedBackground(
    backgroundType: string, 
    width: number, 
    height: number, 
    renderer: (ctx: CanvasRenderingContext2D) => void
  ): HTMLCanvasElement {
    const key = `${backgroundType}_${width}_${height}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    // Create new cached background
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false; // Pixel art optimization
    
    // Render background once and cache it
    renderer(ctx);
    
    this.cache.set(key, canvas);
    return canvas;
  }
  
  /**
   * CRITICAL: Cache gradients to avoid recreating them every frame
   */
  getCachedGradient(
    key: string,
    ctx: CanvasRenderingContext2D,
    gradientFactory: () => CanvasGradient
  ): CanvasGradient {
    if (this.gradientCache.has(key)) {
      return this.gradientCache.get(key)!;
    }
    
    const gradient = gradientFactory();
    this.gradientCache.set(key, gradient);
    return gradient;
  }
  
  /**
   * Clear cache when canvas size changes
   */
  clearCache() {
    this.cache.clear();
    this.gradientCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      backgroundCount: this.cache.size,
      gradientCount: this.gradientCache.size
    };
  }
}