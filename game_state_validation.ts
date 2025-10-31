/**
 * GAME STATE VALIDATION SYSTEM
 * Implements validation to prevent invalid transitions and maintain game stability
 */

import { logger } from './Logger';

export enum GamePhase {
  TITLE = 'title',
  CUTSCENE = 'cutscene',
  PLAYING = 'playing',
  LEVEL_TRANSITION = 'levelTransition',
  LEVEL_COMPLETE = 'levelComplete',
  GAME_OVER = 'gameOver',
  VICTORY = 'victory',
  PAUSED = 'paused'
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  phase: GamePhase;
  cookiesCollected: number;
  totalCookies: number;
  canDash?: boolean;
  // Additional state properties can be added here
}

export interface GameStateTransition {
  from: GamePhase;
  to: GamePhase;
  condition?: (currentState: GameState) => boolean;
  action?: (prevState: GameState, newState: GameState) => void;
}

export class GameStateValidator {
  /**
   * Validates if a state transition is allowed
   */
  public static isValidTransition(from: GamePhase, to: GamePhase, state?: GameState): boolean {
    const validTransitions = this.getValidTransitions(from);
    
    return validTransitions.some(transition => {
      if (transition.to !== to) return false;
      
      // If there's a condition, check if it's satisfied
      if (transition.condition && state) {
        return transition.condition(state);
      }
      
      return true;
    });
  }

  /**
   * Get all valid transitions from a given phase
   */
  private static getValidTransitions(from: GamePhase): GameStateTransition[] {
    const transitions: Record<GamePhase, GameStateTransition[]> = {
      [GamePhase.TITLE]: [
        { from: GamePhase.TITLE, to: GamePhase.CUTSCENE },
        { from: GamePhase.TITLE, to: GamePhase.TITLE } // Allow refresh
      ],
      
      [GamePhase.CUTSCENE]: [
        { from: GamePhase.CUTSCENE, to: GamePhase.PLAYING },
        { from: GamePhase.CUTSCENE, to: GamePhase.TITLE }
      ],
      
      [GamePhase.PLAYING]: [
        { from: GamePhase.PLAYING, to: GamePhase.GAME_OVER },
        { from: GamePhase.PLAYING, to: GamePhase.VICTORY },
        { from: GamePhase.PLAYING, to: GamePhase.LEVEL_COMPLETE },
        { from: GamePhase.PLAYING, to: GamePhase.LEVEL_TRANSITION },
        { from: GamePhase.PLAYING, to: GamePhase.PAUSED },
        { from: GamePhase.PLAYING, to: GamePhase.PLAYING }, // For internal updates
        { from: GamePhase.PLAYING, to: GamePhase.CUTSCENE } // For special cutscenes
      ],
      
      [GamePhase.LEVEL_TRANSITION]: [
        { from: GamePhase.LEVEL_TRANSITION, to: GamePhase.PLAYING },
        { from: GamePhase.LEVEL_TRANSITION, to: GamePhase.CUTSCENE },
        { from: GamePhase.LEVEL_TRANSITION, to: GamePhase.TITLE }
      ],
      
      [GamePhase.LEVEL_COMPLETE]: [
        { from: GamePhase.LEVEL_COMPLETE, to: GamePhase.PLAYING }, // Next level
        { from: GamePhase.LEVEL_COMPLETE, to: GamePhase.TITLE },
        { from: GamePhase.LEVEL_COMPLETE, to: GamePhase.VICTORY }
      ],
      
      [GamePhase.GAME_OVER]: [
        { from: GamePhase.GAME_OVER, to: GamePhase.TITLE }
      ],
      
      [GamePhase.VICTORY]: [
        { from: GamePhase.VICTORY, to: GamePhase.TITLE }
      ],
      
      [GamePhase.PAUSED]: [
        { from: GamePhase.PAUSED, to: GamePhase.PLAYING },
        { from: GamePhase.PAUSED, to: GamePhase.TITLE }
      ]
    };
    
    return transitions[from] || [];
  }

  /**
   * Validates the integrity of a game state
   */
  public static validateState(state: GameState): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate numeric values
    if (typeof state.score !== 'number' || state.score < 0) {
      errors.push(`Invalid score: ${state.score}. Must be non-negative number.`);
    }
    
    if (typeof state.lives !== 'number' || state.lives < 0) {
      errors.push(`Invalid lives: ${state.lives}. Must be non-negative number.`);
    }
    
    if (typeof state.level !== 'number' || state.level < 1) {
      errors.push(`Invalid level: ${state.level}. Must be positive number.`);
    }
    
    if (typeof state.cookiesCollected !== 'number' || state.cookiesCollected < 0) {
      errors.push(`Invalid cookiesCollected: ${state.cookiesCollected}. Must be non-negative number.`);
    }
    
    if (typeof state.totalCookies !== 'number' || state.totalCookies < 0) {
      errors.push(`Invalid totalCookies: ${state.totalCookies}. Must be non-negative number.`);
    }
    
    // Validate cookies collected doesn't exceed total
    if (state.cookiesCollected > state.totalCookies) {
      errors.push(`Cookies collected (${state.cookiesCollected}) exceeds total (${state.totalCookies})`);
    }
    
    // Validate phase is valid
    const validPhases = Object.values(GamePhase);
    if (!validPhases.includes(state.phase)) {
      errors.push(`Invalid phase: ${state.phase}. Must be one of: ${validPhases.join(', ')}`);
    }
    
    // Validate lives against initial configuration
    if (state.lives > 10) { // Assuming max lives is 10
      errors.push(`Lives (${state.lives}) seems too high. Max is likely 10.`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates a transition request
   */
  public static validateTransition(currentState: GameState, targetPhase: GamePhase): { isValid: boolean; error?: string } {
    const validationResult = this.validateState(currentState);
    if (!validationResult.isValid) {
      return {
        isValid: false,
        error: `Current state is invalid: ${validationResult.errors.join('; ')}`
      };
    }
    
    // Check if transition is allowed
    if (!this.isValidTransition(currentState.phase, targetPhase, currentState)) {
      return {
        isValid: false,
        error: `Invalid transition from ${currentState.phase} to ${targetPhase}`
      };
    }
    
    // Additional context-specific validation
    switch (targetPhase) {
      case GamePhase.VICTORY:
        // Must have completed the final level
        if (currentState.level < 5 || currentState.cookiesCollected < currentState.totalCookies) {
          return {
            isValid: false,
            error: `Cannot transition to VICTORY without completing all levels`
          };
        }
        break;
        
      case GamePhase.GAME_OVER:
        // Player must have 0 lives
        if (currentState.lives > 0) {
          return {
            isValid: false,
            error: `Cannot transition to GAME_OVER with ${currentState.lives} lives remaining`
          };
        }
        break;
        
      case GamePhase.LEVEL_COMPLETE:
        // Must have collected all cookies
        if (currentState.cookiesCollected < currentState.totalCookies) {
          return {
            isValid: false,
            error: `Cannot transition to LEVEL_COMPLETE without collecting all ${currentState.totalCookies} cookies`
          };
        }
        break;
        
      case GamePhase.LEVEL_TRANSITION:
        // This is typically valid as it's an intermediate state
        break;
        
      default:
        // Other transitions may have their own validation rules
        break;
    }
    
    return { isValid: true };
  }

  /**
   * Sanitize a game state to ensure it's safe to use
   */
  public static sanitizeState(state: Partial<GameState>): GameState {
    // Create a base state with safe defaults
    const sanitized: GameState = {
      score: typeof state.score === 'number' && state.score >= 0 ? state.score : 0,
      lives: typeof state.lives === 'number' && state.lives >= 0 ? Math.min(state.lives, 10) : 3, // Cap at 10, default to 3
      level: typeof state.level === 'number' && state.level >= 1 ? state.level : 1,
      phase: (state.phase && Object.values(GamePhase).includes(state.phase)) ? state.phase : GamePhase.TITLE,
      cookiesCollected: typeof state.cookiesCollected === 'number' && state.cookiesCollected >= 0 ? state.cookiesCollected : 0,
      totalCookies: typeof state.totalCookies === 'number' && state.totalCookies >= 0 ? state.totalCookies : 0,
      canDash: typeof state.canDash === 'boolean' ? state.canDash : true
    };
    
    // Ensure cookies collected doesn't exceed total
    if (sanitized.cookiesCollected > sanitized.totalCookies) {
      sanitized.cookiesCollected = sanitized.totalCookies;
    }
    
    return sanitized;
  }
}

/**
 * Enhanced State Manager with validation
 */
export class ValidatedStateManager {
  private state: GameState;
  private history: GameState[] = [];
  private readonly maxHistorySize: number = 50;
  private onStateChange: (state: GameState) => void;

  constructor(initialState?: Partial<GameState>, onStateChange?: (state: GameState) => void) {
    this.state = initialState 
      ? GameStateValidator.sanitizeState(initialState) 
      : GameStateValidator.sanitizeState({ phase: GamePhase.TITLE });
    
    this.onStateChange = onStateChange || (() => {});
    
    // Validate initial state
    const validationResult = GameStateValidator.validateState(this.state);
    if (!validationResult.isValid) {
      logger.warn('Initial state validation errors:', validationResult.errors);
    }
  }

  /**
   * Get current state
   */
  public getState(): GameState {
    return { ...this.state };
  }

  /**
   * Transition to a new phase with validation
   */
  public transitionTo(phase: GamePhase, updates?: Partial<GameState>): boolean {
    const validationResult = GameStateValidator.validateTransition(this.state, phase);
    
    if (!validationResult.isValid) {
      logger.error(`State transition validation failed: ${validationResult.error}`);
      return false;
    }
    
    // Create new state by merging updates
    const newState: GameState = {
      ...this.state,
      ...updates,
      phase
    };
    
    // Sanitize the new state
    const sanitizedState = GameStateValidator.sanitizeState(newState);
    
    // Validate the sanitized state
    const postValidation = GameStateValidator.validateState(sanitizedState);
    if (!postValidation.isValid) {
      logger.error('New state validation failed after sanitization:', postValidation.errors);
      return false;
    }
    
    // Add to history
    this.history.push({ ...this.state });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift(); // Remove oldest state
    }
    
    // Update state
    this.state = sanitizedState;
    
    // Notify listeners
    this.onStateChange(this.state);
    
    logger.debug(`State transition: ${this.state.phase} -> ${phase}`);
    return true;
  }

  /**
   * Update state properties without changing phase
   */
  public update(updates: Partial<GameState>): boolean {
    const newState: GameState = {
      ...this.state,
      ...updates
    };
    
    // Sanitize the new state
    const sanitizedState = GameStateValidator.sanitizeState(newState);
    
    // Validate the sanitized state
    const validationResult = GameStateValidator.validateState(sanitizedState);
    if (!validationResult.isValid) {
      logger.error('State update validation failed:', validationResult.errors);
      return false;
    }
    
    // Add to history
    this.history.push({ ...this.state });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Update state
    this.state = sanitizedState;
    
    // Notify listeners
    this.onStateChange(this.state);
    
    return true;
  }

  /**
   * Rollback to previous state
   */
  public rollback(): boolean {
    if (this.history.length === 0) {
      logger.warn('Cannot rollback: no history available');
      return false;
    }
    
    this.state = this.history.pop()!;
    
    // Notify listeners
    this.onStateChange(this.state);
    
    logger.info('State rolled back');
    return true;
  }

  /**
   * Get state history (most recent first)
   */
  public getHistory(): GameState[] {
    return [...this.history].reverse();
  }

  /**
   * Force transition (bypass some validations - use with caution)
   */
  public forceTransition(phase: GamePhase, updates?: Partial<GameState>): void {
    const newState: GameState = {
      ...this.state,
      ...updates,
      phase
    };
    
    // Sanitize the new state
    this.state = GameStateValidator.sanitizeState(newState);
    
    logger.warn(`Forced state transition to: ${phase}`);
    
    // Notify listeners
    this.onStateChange(this.state);
  }

  /**
   * Reset to initial state
   */
  public reset(): void {
    this.state = GameStateValidator.sanitizeState({ phase: GamePhase.TITLE });
    this.history = [];
    
    logger.info('State manager reset');
    
    // Notify listeners
    this.onStateChange(this.state);
  }

  /**
   * Validate current state and fix if needed
   */
  public validateAndRepair(): boolean {
    const validationResult = GameStateValidator.validateState(this.state);
    
    if (validationResult.isValid) {
      return true;
    }
    
    logger.warn('Current state validation failed, attempting repair:', validationResult.errors);
    
    // Sanitize to repair
    this.state = GameStateValidator.sanitizeState(this.state);
    
    // Re-validate after repair
    const repairValidation = GameStateValidator.validateState(this.state);
    if (!repairValidation.isValid) {
      logger.error('State repair failed:', repairValidation.errors);
      return false;
    }
    
    logger.info('State repaired successfully');
    this.onStateChange(this.state);
    return true;
  }
}

/**
 * Game state validation middleware for use with GameEngine
 */
export class GameStateValidationMiddleware {
  private stateManager: ValidatedStateManager;
  private enabled: boolean = true;

  constructor(stateManager: ValidatedStateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Enable or disable validation
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Wrap a transition call with validation
   */
  public async validatedTransition(phase: GamePhase, updates?: Partial<GameState>): Promise<boolean> {
    if (!this.enabled) {
      // If validation is disabled, just perform the transition
      return this.stateManager.transitionTo(phase, updates);
    }

    try {
      // Perform with validation
      return await this.stateManager.transitionTo(phase, updates);
    } catch (error) {
      logger.error(`Transition failed:`, error);
      return false;
    }
  }

  /**
   * Wrap a state update with validation
   */
  public async validatedUpdate(updates: Partial<GameState>): Promise<boolean> {
    if (!this.enabled) {
      // If validation is disabled, just perform the update
      return this.stateManager.update(updates);
    }

    try {
      // Perform with validation
      return await this.stateManager.update(updates);
    } catch (error) {
      logger.error(`State update failed:`, error);
      return false;
    }
  }
}