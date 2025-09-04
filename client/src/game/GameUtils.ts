
export class GameUtils {
  /**
   * Check collision between two rectangular bounds
   */
  static checkCollision(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  /**
   * Sanitize position values to prevent NaN/Infinity issues
   */
  static sanitizePosition(x: number, y: number): { x: number; y: number } {
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0
    };
  }

  /**
   * Clamp value between min and max
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Calculate distance between two points
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Normalize vector
   */
  static normalize(x: number, y: number): { x: number; y: number } {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return { x: x / magnitude, y: y / magnitude };
  }

  /**
   * Generate random number between min and max
   */
  static randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Create bounds object from position and size
   */
  static createBounds(x: number, y: number, width: number, height: number) {
    return { x, y, width, height };
  }
}
