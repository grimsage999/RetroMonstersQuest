/**
 * Sprite Batcher for optimized rendering
 * Groups similar sprites to reduce draw calls
 */
export interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  type: string;
  rotation?: number;
}

export class SpriteBatcher {
  private ctx: CanvasRenderingContext2D;
  private batches: Map<string, Sprite[]>;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.batches = new Map();
  }

  /**
   * Clear all batches
   */
  clear(): void {
    this.batches.clear();
  }

  /**
   * Add a sprite to the batch
   */
  addSprite(sprite: Sprite): void {
    const key = `${sprite.type}_${sprite.color || 'default'}`;
    
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
    }
    
    const batch = this.batches.get(key);
    if (batch) {
      batch.push(sprite);
    }
  }

  /**
   * Render all batched sprites
   */
  render(): number {
    let drawCalls = 0;

    this.batches.forEach((sprites, key) => {
      if (sprites.length === 0) return;

      // Extract type and color from key
      const [type, color] = key.split('_');
      
      this.ctx.save();
      
      // Set common properties for this batch
      if (color !== 'default') {
        this.ctx.fillStyle = color;
      }

      // Render based on sprite type
      switch (type) {
        case 'enemy':
          this.renderEnemyBatch(sprites);
          break;
        case 'cookie':
          this.renderCookieBatch(sprites);
          break;
        // Bullet rendering removed for performance
        default:
          this.renderGenericBatch(sprites);
      }

      this.ctx.restore();
      drawCalls++;
    });

    return drawCalls;
  }

  /**
   * Render a batch of enemy sprites
   */
  private renderEnemyBatch(sprites: Sprite[]): void {
    // Use a single path for all enemies of the same type
    this.ctx.beginPath();
    
    sprites.forEach(sprite => {
      this.ctx.rect(sprite.x, sprite.y, sprite.width, sprite.height);
    });
    
    this.ctx.fill();
  }

  /**
   * Render a batch of cookie sprites
   */
  private renderCookieBatch(sprites: Sprite[]): void {
    // Cookies are circles, batch them together
    this.ctx.beginPath();
    
    sprites.forEach(sprite => {
      const centerX = sprite.x + sprite.width / 2;
      const centerY = sprite.y + sprite.height / 2;
      const radius = sprite.width / 2;
      
      this.ctx.moveTo(centerX + radius, centerY);
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    });
    
    this.ctx.fill();
  }

  // Bullet rendering method removed for performance

  /**
   * Generic batch rendering for other sprite types
   */
  private renderGenericBatch(sprites: Sprite[]): void {
    sprites.forEach(sprite => {
      this.ctx.fillRect(sprite.x, sprite.y, sprite.width, sprite.height);
    });
  }

  /**
   * Get batch statistics
   */
  getStats(): { batchCount: number; totalSprites: number; avgSpritesPerBatch: number } {
    let totalSprites = 0;
    
    this.batches.forEach(sprites => {
      totalSprites += sprites.length;
    });

    const batchCount = this.batches.size;
    const avgSpritesPerBatch = batchCount > 0 ? totalSprites / batchCount : 0;

    return {
      batchCount,
      totalSprites,
      avgSpritesPerBatch: Math.round(avgSpritesPerBatch * 100) / 100
    };
  }
}