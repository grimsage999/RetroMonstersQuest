/**
 * High-performance sprite cache system
 * Pre-renders sprites to eliminate nested fillRect loops
 */
export class SpriteCache {
  private static instance: SpriteCache | null = null;
  private cache: Map<string, HTMLCanvasElement> = new Map();

  public static getInstance(): SpriteCache {
    if (!SpriteCache.instance) {
      SpriteCache.instance = new SpriteCache();
    }
    return SpriteCache.instance;
  }

  public getSprite(key: string): HTMLCanvasElement | null {
    return this.cache.get(key) || null;
  }

  public createCookieSprite(): HTMLCanvasElement {
    if (this.cache.has('cookie')) {
      return this.cache.get('cookie')!;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Cookie pixel art (8x8) - optimized pre-rendering
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
    
    const colors = [
      'transparent', '#CD853F', '#DEB887', '#8B4513'
    ];
    
    const scale = 4;
    canvas.width = 8 * scale;
    canvas.height = 8 * scale;
    ctx.imageSmoothingEnabled = false;
    
    // Pre-render once instead of every frame
    for (let row = 0; row < cookiePixels.length; row++) {
      for (let col = 0; col < cookiePixels[row].length; col++) {
        const colorIndex = cookiePixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    }
    
    this.cache.set('cookie', canvas);
    return canvas;
  }

  public createEnemySprite(enemyType: string, frame: number = 0): HTMLCanvasElement {
    const key = `${enemyType}_${frame}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    let pixels: number[][];
    let colors: string[];
    let scale = 3;

    // CIA Agent pixels (optimized)
    if (enemyType === 'cia') {
      pixels = [
        [0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0],
        [0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0],
        [0,2,2,3,2,2,3,2,0,0,0,0,0,0,0,0],
        [0,2,2,2,1,1,2,2,0,0,0,0,0,0,0,0],
        [0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0],
        [0,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0],
        [0,0,5,5,6,5,5,0,0,0,0,0,0,0,0,0],
        [0,0,5,5,5,5,5,0,0,0,0,0,0,0,0,0],
        [0,0,0,5,5,5,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,5,0,5,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0],
      ];
      colors = ['transparent', '#ffdbac', '#D2691E', '#333333', '#ffffff', '#1a1a1a', '#ff0000'];
    } else if (enemyType === 'army') {
      pixels = [
        [0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0],
        [0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0],
        [0,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0],
        [0,2,2,1,2,2,1,2,0,0,0,0,0,0,0,0],
        [0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0],
        [0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0],
        [0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0],
        [0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0],
        [0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,3,0,3,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0],
      ];
      colors = ['transparent', '#8B4513', '#ffdbac', '#228B22'];
    } else {
      // Default sprite
      pixels = [[1,1],[1,1]];
      colors = ['transparent', '#FF0000'];
      scale = 8;
    }

    canvas.width = 16 * scale;
    canvas.height = 11 * scale;
    ctx.imageSmoothingEnabled = false;
    
    // Pre-render sprite once
    for (let row = 0; row < pixels.length; row++) {
      for (let col = 0; col < pixels[row].length; col++) {
        const colorIndex = pixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    }
    
    this.cache.set(key, canvas);
    return canvas;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}