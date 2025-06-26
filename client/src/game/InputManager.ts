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
    this.keys.clear();
  }
}
