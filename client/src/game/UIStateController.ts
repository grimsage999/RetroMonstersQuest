/**
 * UI State Controller
 * Manages all UI transitions with proper timing to prevent overlaps
 * Ensures clean separation between game states and UI elements
 */

export interface UITransitionConfig {
  gameOverDelay: number;
  levelCardDuration: number;
  transitionBuffer: number;
  cutsceneDuration: number;
  victoryDelay: number;
}

export type UITransitionType = 'cutscene' | 'levelCard' | 'gameOver' | 'victory';
export type UIState = 'none' | UITransitionType | 'transition';

export class UIStateController {
  private activeUI: UIState = 'none';
  private transitionQueue: (() => void)[] = [];
  private isProcessing: boolean = false;
  private config: UITransitionConfig;
  private blockInputUntil: number = 0;
  private activeTimeouts: Set<number> = new Set();
  
  constructor() {
    this.config = {
      gameOverDelay: 1200,      // Slightly faster response to death
      levelCardDuration: 1800,   // Optimized level card timing
      transitionBuffer: 200,     // Reduced buffer for smoother flow
      cutsceneDuration: 2500,    // Slightly faster cutscenes
      victoryDelay: 800          // Quicker victory feedback
    };
  }
  
  /**
   * Queue a UI transition with proper timing
   */
  public queueTransition(
    type: UITransitionType,
    callback: () => void,
    customDelay?: number
  ): void {
    // Atomic check and set to prevent race conditions
    if (this.isProcessing) {
      // Queuing transition
      // Use atomic operation to prevent race conditions
      const queuedTransition = () => this.executeTransition(type, callback, customDelay);
      this.transitionQueue.push(queuedTransition);
      return;
    }
    
    // Set processing flag immediately before starting
    this.isProcessing = true;
    this.executeTransition(type, callback, customDelay);
  }
  
  /**
   * Execute a transition with proper timing
   */
  private executeTransition(
    type: UITransitionType,
    callback: () => void,
    customDelay?: number
  ): void {
    // isProcessing already set in queueTransition for race condition prevention
    this.activeUI = type;
    
    // Block input during transitions
    this.blockInputUntil = Date.now() + this.getTransitionDuration(type, customDelay);
    
    // Starting transition
    
    // Simplified timeout management
    this.createTimeout(() => {
      callback();
      this.createTimeout(() => {
        this.completeTransition();
      }, this.getTransitionDuration(type, customDelay));
    }, this.config.transitionBuffer);
  }
  
  /**
   * Helper method for safe timeout creation
   */
  private createTimeout(callback: () => void, delay: number): void {
    try {
      const timeout = window.setTimeout(() => {
        callback();
        this.activeTimeouts.delete(timeout);
      }, delay);
      this.activeTimeouts.add(timeout);
    } catch (error) {
      // Failed to create timeout
      // Fallback: execute immediately
      callback();
    }
  }
  
  /**
   * Get duration for specific transition type
   */
  private getTransitionDuration(type: UITransitionType, customDelay?: number): number {
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