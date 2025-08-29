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
    // Prevent race conditions by checking if we're in the middle of processing
    if (this.keys.size > 0) {
      console.log('InputManager: Clearing', this.keys.size, 'keys');
    }
    this.keys.clear();
  }
}
