/**
 * Optimized Renderer - Maintains original aesthetic while boosting performance
 * Pre-renders sprites to ImageData for 60fps gameplay
 */
export class OptimizedRenderer {
  private static cache = new Map<string, HTMLCanvasElement>();

  public static renderOptimizedCookie(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const key = 'cookie';
    let sprite = this.cache.get(key);
    
    if (!sprite) {
      sprite = this.createCookieSprite();
      this.cache.set(key, sprite);
    }
    
    // Single drawImage call maintains exact visual quality at 60fps
    ctx.drawImage(sprite, x, y);
    
    // Add glow effect (preserved from original)
    ctx.save();
    ctx.shadowColor = '#DAA520';
    ctx.shadowBlur = 3;
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, sprite.width + 2, sprite.height + 2);
    ctx.restore();
  }

  public static renderOptimizedEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, type: string, frame: number, hasGlow?: boolean): void {
    const key = `${type}_${frame}`;
    let sprite = this.cache.get(key);
    
    if (!sprite) {
      sprite = this.createEnemySprite(type, frame);
      this.cache.set(key, sprite);
    }
    
    if (hasGlow) {
      const glowIntensity = Math.sin(Date.now() * 0.01) * 2 + 3;
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = glowIntensity;
    }
    
    // Single drawImage call maintains exact visual quality at 60fps
    ctx.drawImage(sprite, x, y);
  }

  private static createCookieSprite(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // EXACT same pixel art from original - no visual changes
    const cookiePixels = [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [1,2,3,2,2,3,2,1],
      [1,2,2,2,2,2,2,1],
      [1,2,2,3,3,2,2,1],
      [1,2,2,2,2,2,2,1],
      [0,1,2,2,2,2,1,0],
      [0,0,1,1,1,1,0,0],
    ];
    
    const colors = ['transparent', '#CD853F', '#DEB887', '#8B4513'];
    const scale = 4;
    
    canvas.width = 8 * scale;
    canvas.height = 8 * scale;
    ctx.imageSmoothingEnabled = false;
    
    // Pre-render once for massive performance gain
    for (let row = 0; row < cookiePixels.length; row++) {
      for (let col = 0; col < cookiePixels[row].length; col++) {
        const colorIndex = cookiePixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    }
    
    return canvas;
  }

  private static createEnemySprite(type: string, frame: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Use EXACT same pixel data from original Enemy class
    let pixels: number[][];
    let colors: string[];
    
    if (type === 'cia') {
      pixels = frame === 0 ? this.getCIAFrame1() : this.getCIAFrame2();
      colors = ['transparent', '#000000', '#fdbcb4', '#333333', '#ffffff', '#1a1a1a', '#ff0000'];
    } else if (type === 'army') {
      pixels = frame === 0 ? this.getArmyFrame1() : this.getArmyFrame2();
      colors = ['transparent', '#228b22', '#fdbcb4', '#000000', '#1f5f1f'];
    } else {
      // Default fallback
      pixels = [[1,1],[1,1]];
      colors = ['transparent', '#FF0000'];
    }
    
    const scale = 3;
    canvas.width = 16 * scale;
    canvas.height = 16 * scale;
    ctx.imageSmoothingEnabled = false;
    
    // Pre-render sprite once for massive performance gain
    for (let row = 0; row < pixels.length; row++) {
      for (let col = 0; col < pixels[row].length; col++) {
        const colorIndex = pixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    }
    
    return canvas;
  }

  private static getCIAFrame1(): number[][] {
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
      [0,1,2,2,2,2,2,2,2,2,1,0,0,0,0,0],
      [0,1,2,3,2,2,2,2,3,2,1,0,0,0,0,0],
      [0,1,2,3,3,2,2,3,3,2,1,0,0,0,0,0],
      [0,1,2,2,1,2,2,1,2,2,1,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
      [0,0,0,1,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,0,1,1,5,6,6,5,1,1,0,0,0,0,0,0],
      [0,1,1,1,5,6,6,5,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,6,6,1,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,1,1,0,0,0,0,0,0,0],
      [0,1,1,1,1,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
    ];
  }

  private static getCIAFrame2(): number[][] {
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
      [0,1,2,2,2,2,2,2,2,2,1,0,0,0,0,0],
      [0,1,2,3,2,2,2,2,3,2,1,0,0,0,0,0],
      [0,1,2,3,3,2,2,3,3,2,1,0,0,0,0,0],
      [0,1,2,2,1,2,2,1,2,2,1,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
      [0,0,0,1,4,4,4,4,1,0,0,0,0,0,0,0],
      [0,0,1,1,5,6,6,5,1,1,0,0,0,0,0,0],
      [0,1,1,1,5,6,6,5,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,6,6,1,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    ];
  }

  private static getArmyFrame1(): number[][] {
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,1,1,2,1,1,1,1,2,1,1,0,0,0,0,0],
      [0,1,1,2,3,2,2,3,2,1,1,0,0,0,0,0],
      [0,1,1,2,2,2,2,2,2,1,1,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,1,1,0,0,0,0,0,0,0],
      [0,1,1,1,1,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
    ];
  }

  private static getArmyFrame2(): number[][] {
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,1,1,2,1,1,1,1,2,1,1,0,0,0,0,0],
      [0,1,1,2,3,2,2,3,2,1,1,0,0,0,0,0],
      [0,1,1,2,2,2,2,2,2,1,1,0,0,0,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    ];
  }

  public static clearCache(): void {
    this.cache.clear();
  }
}