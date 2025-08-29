/**
 * UI State Controller
 * Manages all UI transitions with proper timing to prevent overlaps
 * Ensures clean separation between game states and UI elements
 */

export interface UITransitionConfig {
  gameOverDelay: number;        // Delay before showing game over screen
  levelCardDuration: number;    // How long level card displays
  transitionBuffer: number;      // Buffer time between transitions
  cutsceneDuration: number;      // Duration of cutscenes
  victoryDelay: number;          // Delay before victory screen
}

export class UIStateController {
  private activeUI: 'none' | 'cutscene' | 'levelCard' | 'gameOver' | 'victory' | 'transition' = 'none';
  private transitionQueue: (() => void)[] = [];
  private isProcessing: boolean = false;
  private config: UITransitionConfig;
  private blockInputUntil: number = 0;
  private activeTimeouts: Set<number> = new Set();
  
  constructor() {
    this.config = {
      gameOverDelay: 1500,      // 1.5 seconds to see death before game over
      levelCardDuration: 2000,   // 2 seconds for level card
      transitionBuffer: 500,     // 0.5 second buffer between states
      cutsceneDuration: 3000,    // 3 seconds for cutscenes
      victoryDelay: 1000         // 1 second before victory screen
    };
  }
  
  /**
   * Queue a UI transition with proper timing
   */
  public queueTransition(
    type: 'cutscene' | 'levelCard' | 'gameOver' | 'victory',
    callback: () => void,
    customDelay?: number
  ): void {
    // Prevent overlapping transitions
    if (this.isProcessing) {
      console.log(`UIStateController: Queuing ${type} transition`);
      this.transitionQueue.push(() => this.executeTransition(type, callback, customDelay));
      return;
    }
    
    this.executeTransition(type, callback, customDelay);
  }
  
  /**
   * Execute a transition with proper timing
   */
  private executeTransition(
    type: 'cutscene' | 'levelCard' | 'gameOver' | 'victory',
    callback: () => void,
    customDelay?: number
  ): void {
    this.isProcessing = true;
    this.activeUI = type;
    
    // Block input during transitions
    this.blockInputUntil = Date.now() + this.getTransitionDuration(type, customDelay);
    
    console.log(`UIStateController: Starting ${type} transition`);
    
    // Add buffer before starting transition (track timeouts)
    const bufferTimeout = window.setTimeout(() => {
      callback();
      
      // Schedule cleanup after transition completes
      const cleanupTimeout = window.setTimeout(() => {
        this.completeTransition();
        this.activeTimeouts.delete(cleanupTimeout);
      }, this.getTransitionDuration(type, customDelay));
      
      this.activeTimeouts.add(cleanupTimeout);
      this.activeTimeouts.delete(bufferTimeout);
    }, this.config.transitionBuffer);
    
    this.activeTimeouts.add(bufferTimeout);
  }
  
  /**
   * Get duration for specific transition type
   */
  private getTransitionDuration(type: string, customDelay?: number): number {
    if (customDelay !== undefined) return customDelay;
    
    switch (type) {
      case 'cutscene':
        return this.config.cutsceneDuration;
      case 'levelCard':
        return this.config.levelCardDuration;
      case 'gameOver':
        return this.config.gameOverDelay;
      case 'victory':
        return this.config.victoryDelay;
      default:
        return 1000;
    }
  }
  
  /**
   * Complete current transition and process queue
   */
  private completeTransition(): void {
    console.log(`UIStateController: Completed ${this.activeUI} transition`);
    this.activeUI = 'none';
    this.isProcessing = false;
    
    // Process next queued transition
    if (this.transitionQueue.length > 0) {
      const nextTransition = this.transitionQueue.shift();
      if (nextTransition) {
        // Add small delay between transitions
        const queueTimeout = window.setTimeout(() => {
          nextTransition();
          this.activeTimeouts.delete(queueTimeout);
        }, this.config.transitionBuffer);
        
        this.activeTimeouts.add(queueTimeout);
      }
    }
  }
  
  /**
   * Check if input should be blocked
   */
  public isInputBlocked(): boolean {
    return Date.now() < this.blockInputUntil;
  }
  
  /**
   * Check if specific UI is active
   */
  public isUIActive(type: string): boolean {
    return this.activeUI === type;
  }
  
  /**
   * Force clear all transitions (emergency reset)
   */
  public forceReset(): void {
    console.warn('UIStateController: Force resetting all transitions');
    
    // Clear all active timeouts to prevent memory leaks
    Array.from(this.activeTimeouts).forEach(timeout => {
      clearTimeout(timeout);
    });
    this.activeTimeouts.clear();
    
    this.activeUI = 'none';
    this.isProcessing = false;
    this.transitionQueue = [];
    this.blockInputUntil = 0;
  }
  
  /**
   * Get current state for debugging
   */
  public getDebugInfo(): string {
    return `Active: ${this.activeUI}, Processing: ${this.isProcessing}, Queue: ${this.transitionQueue.length}`;
  }
}