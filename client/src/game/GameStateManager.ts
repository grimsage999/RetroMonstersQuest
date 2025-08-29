/**
 * Centralized Game State Manager
 * Prevents UI layering issues and ensures clean state transitions
 */

export enum GamePhase {
  TITLE = 'title',
  PLAYING = 'playing',
  PAUSED = 'paused',
  LEVEL_COMPLETE = 'levelComplete',
  LEVEL_TRANSITION = 'levelTransition',
  GAME_OVER = 'gameOver',
  VICTORY = 'victory',
  CUTSCENE = 'cutscene'
}

export interface GameStateTransition {
  from: GamePhase;
  to: GamePhase;
  valid: boolean;
}

export class GameStateManager {
  private currentPhase: GamePhase;
  private previousPhase: GamePhase | null = null;
  private transitionInProgress: boolean = false;
  private stateListeners: ((phase: GamePhase) => void)[] = [];
  private transitionTimeout: number | null = null;

  // Define valid state transitions to prevent invalid states
  private validTransitions: Map<GamePhase, GamePhase[]> = new Map([
    [GamePhase.TITLE, [GamePhase.PLAYING, GamePhase.CUTSCENE]],
    [GamePhase.PLAYING, [GamePhase.PAUSED, GamePhase.LEVEL_COMPLETE, GamePhase.GAME_OVER, GamePhase.VICTORY]],
    [GamePhase.PAUSED, [GamePhase.PLAYING, GamePhase.TITLE]],
    [GamePhase.LEVEL_COMPLETE, [GamePhase.LEVEL_TRANSITION, GamePhase.TITLE]],
    [GamePhase.LEVEL_TRANSITION, [GamePhase.CUTSCENE, GamePhase.PLAYING]],
    [GamePhase.GAME_OVER, [GamePhase.TITLE]],
    [GamePhase.VICTORY, [GamePhase.TITLE]],
    [GamePhase.CUTSCENE, [GamePhase.PLAYING]]
  ]);

  constructor(initialPhase: GamePhase = GamePhase.TITLE) {
    this.currentPhase = initialPhase;
  }

  /**
   * Get current game phase
   */
  getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Get previous game phase
   */
  getPreviousPhase(): GamePhase | null {
    return this.previousPhase;
  }

  /**
   * Check if transition is valid
   */
  canTransitionTo(newPhase: GamePhase): boolean {
    const validStates = this.validTransitions.get(this.currentPhase);
    return validStates ? validStates.includes(newPhase) : false;
  }

  /**
   * Transition to a new phase with validation
   */
  transitionTo(newPhase: GamePhase): boolean {
    // Prevent transitions during ongoing transition
    if (this.transitionInProgress) {
      console.warn(`Cannot transition to ${newPhase}: transition already in progress`);
      return false;
    }

    // Validate transition
    if (!this.canTransitionTo(newPhase)) {
      console.error(`Invalid state transition: ${this.currentPhase} -> ${newPhase}`);
      return false;
    }

    // Perform transition
    this.transitionInProgress = true;
    this.previousPhase = this.currentPhase;
    this.currentPhase = newPhase;

    console.log(`Game state transition: ${this.previousPhase} -> ${this.currentPhase}`);

    // Notify listeners
    this.notifyListeners();

    // Reset transition flag after a brief delay (track timeout)
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    this.transitionTimeout = window.setTimeout(() => {
      this.transitionInProgress = false;
      this.transitionTimeout = null;
    }, 100);

    return true;
  }

  /**
   * Force transition (use sparingly, only for error recovery)
   */
  forceTransitionTo(newPhase: GamePhase): void {
    console.warn(`FORCE transitioning from ${this.currentPhase} to ${newPhase}`);
    this.previousPhase = this.currentPhase;
    this.currentPhase = newPhase;
    this.transitionInProgress = false;
    this.notifyListeners();
  }

  /**
   * Check if in a specific phase
   */
  isInPhase(phase: GamePhase): boolean {
    return this.currentPhase === phase;
  }

  /**
   * Check if game is in any of the specified phases
   */
  isInAnyPhase(...phases: GamePhase[]): boolean {
    return phases.includes(this.currentPhase);
  }

  /**
   * Register a state change listener
   */
  addListener(listener: (phase: GamePhase) => void): void {
    this.stateListeners.push(listener);
  }

  /**
   * Remove a state change listener
   */
  removeListener(listener: (phase: GamePhase) => void): void {
    const index = this.stateListeners.indexOf(listener);
    if (index > -1) {
      this.stateListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.stateListeners.forEach(listener => {
      listener(this.currentPhase);
    });
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    // Clear any pending transition timeout
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
    
    this.previousPhase = this.currentPhase;
    this.currentPhase = GamePhase.TITLE;
    this.transitionInProgress = false;
    this.notifyListeners();
  }

  /**
   * Get state info for debugging
   */
  getDebugInfo(): string {
    return `Current: ${this.currentPhase}, Previous: ${this.previousPhase}, Transitioning: ${this.transitionInProgress}`;
  }
}