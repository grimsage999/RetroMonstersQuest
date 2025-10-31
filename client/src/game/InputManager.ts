import { logger } from './Logger';
export class InputManager {
  private keys: Set<string> = new Set();

  public handleKeyDown(key: string) {
    this.keys.add(key);
  }

  public handleKeyUp(key: string) {
    this.keys.delete(key);
  }

  public isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  public reset() {
    // Prevent race conditions by creating new set instead of clearing
    const oldSize = this.keys.size;
    if (oldSize > 0) {
      logger.debug('InputManager: Clearing', oldSize, 'keys');
    }
    
    // Atomic operation to prevent race conditions
    this.keys = new Set();
  }
}
