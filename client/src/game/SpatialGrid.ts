/**
 * Spatial Grid for optimized collision detection
 * Divides the game world into cells to reduce collision checks
 */
export class SpatialGrid {
  private grid: Map<string, Set<object>>;
  private cellSize: number;
  private width: number;
  private height: number;

  constructor(width: number, height: number, cellSize: number = 100) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Clear all entities from the grid
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Get the grid key for a position
   */
  private getKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    return `${gridX},${gridY}`;
  }

  /**
   * Get all keys that an entity's bounds overlap
   */
  private getKeysForBounds(x: number, y: number, width: number, height: number): string[] {
    const keys: string[] = [];
    const startX = Math.floor(x / this.cellSize);
    const endX = Math.floor((x + width) / this.cellSize);
    const startY = Math.floor(y / this.cellSize);
    const endY = Math.floor((y + height) / this.cellSize);

    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        keys.push(`${gx},${gy}`);
      }
    }
    return keys;
  }

  /**
   * Insert an entity into the grid
   */
  insert(entity: object, x: number, y: number, width: number = 1, height: number = 1): void {
    const keys = this.getKeysForBounds(x, y, width, height);
    
    for (const key of keys) {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(entity);
    }
  }

  /**
   * Get potential collision candidates for a given bounds
   */
  getPotentialCollisions(x: number, y: number, width: number = 1, height: number = 1): any[] {
    const candidates = new Set<any>();
    const keys = this.getKeysForBounds(x, y, width, height);

    for (const key of keys) {
      const cell = this.grid.get(key);
      if (cell) {
        cell.forEach(entity => candidates.add(entity));
      }
    }

    return Array.from(candidates);
  }

  /**
   * Remove an entity from the grid (call before updating position)
   */
  remove(entity: any, x: number, y: number, width: number = 1, height: number = 1): void {
    const keys = this.getKeysForBounds(x, y, width, height);
    
    for (const key of keys) {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(entity);
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
    }
  }

  /**
   * Debug: Get grid statistics
   */
  getStats(): { cellCount: number; totalEntities: number; avgEntitiesPerCell: number } {
    let totalEntities = 0;
    this.grid.forEach(cell => {
      totalEntities += cell.size;
    });

    const cellCount = this.grid.size;
    const avgEntitiesPerCell = cellCount > 0 ? totalEntities / cellCount : 0;

    return {
      cellCount,
      totalEntities,
      avgEntitiesPerCell: Math.round(avgEntitiesPerCell * 100) / 100
    };
  }
}