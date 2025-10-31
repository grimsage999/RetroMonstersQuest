import { logger } from './Logger';
/**
 * Command Input System - Addresses Issue 2: Input Event Isolation
 * 
 * Learning Focus: Event system architecture patterns
 * This implements the Command Pattern + Event Queue used in professional games
 */

import { GamePhase } from './GameStateManager';

export enum GameCommand {
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down', 
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  DASH = 'dash',
  FIRE_PRIMARY = 'fire_primary',
  FIRE_SECONDARY = 'fire_secondary',
  PAUSE = 'pause',
  SKIP_CUTSCENE = 'skip_cutscene'
}

export interface InputCommand {
  command: GameCommand;
  timestamp: number;
  pressed: boolean; // true for press, false for release
  source: 'keyboard' | 'touch' | 'gamepad';
  originalEvent?: KeyboardEvent; // For debugging
}

export interface InputFilter {
  accepts(command: InputCommand): boolean;
  priority: number; // Higher priority filters are checked first
  name: string;
}

/**
 * State-based input filters - this solves the "event leaking" problem
 */
class CutsceneInputFilter implements InputFilter {
  priority = 100;
  name = 'cutscene';
  
  accepts(command: InputCommand): boolean {
    // During cutscenes, only allow skip commands
    return command.command === GameCommand.SKIP_CUTSCENE;
  }
}

class PlayingInputFilter implements InputFilter {
  priority = 50;
  name = 'playing';
  
  accepts(command: InputCommand): boolean {
    // During gameplay, allow all movement and combat commands
    return [
      GameCommand.MOVE_UP,
      GameCommand.MOVE_DOWN,
      GameCommand.MOVE_LEFT,
      GameCommand.MOVE_RIGHT,
      GameCommand.DASH,
      GameCommand.FIRE_PRIMARY,
      GameCommand.FIRE_SECONDARY,
      GameCommand.PAUSE
    ].includes(command.command);
  }
}

class TransitionInputFilter implements InputFilter {
  priority = 200; // Highest priority - blocks almost everything during transitions
  name = 'transition';
  
  accepts(command: InputCommand): boolean {
    // During transitions, block all commands
    return false;
  }
}

class MenuInputFilter implements InputFilter {
  priority = 75;
  name = 'menu';
  
  accepts(command: InputCommand): boolean {
    // Menus have their own set of allowed commands
    return [
      GameCommand.MOVE_UP,
      GameCommand.MOVE_DOWN,
      GameCommand.FIRE_PRIMARY // Select
    ].includes(command.command);
  }
}

export class CommandInputSystem {
  private eventQueue: InputCommand[] = [];
  private commandHistory: InputCommand[] = [];
  private maxHistorySize = 100;
  private keyDownHandler?: (e: KeyboardEvent) => void;
  private keyUpHandler?: (e: KeyboardEvent) => void;
  
  private inputFilters: Map<GamePhase, InputFilter[]> = new Map([
    [GamePhase.TITLE, [new MenuInputFilter()]],
    [GamePhase.PLAYING, [new PlayingInputFilter()]],
    [GamePhase.CUTSCENE, [new CutsceneInputFilter()]],
    [GamePhase.LEVEL_TRANSITION, [new TransitionInputFilter()]],
    [GamePhase.GAME_OVER, [new MenuInputFilter()]],
    [GamePhase.VICTORY, [new MenuInputFilter()]],
    [GamePhase.PAUSED, [new MenuInputFilter()]]
  ]);
  
  private keyToCommandMap: Map<string, GameCommand> = new Map([
    ['ArrowUp', GameCommand.MOVE_UP],
    ['KeyW', GameCommand.MOVE_UP],
    ['ArrowDown', GameCommand.MOVE_DOWN],
    ['KeyS', GameCommand.MOVE_DOWN],
    ['ArrowLeft', GameCommand.MOVE_LEFT],
    ['KeyA', GameCommand.MOVE_LEFT],
    ['ArrowRight', GameCommand.MOVE_RIGHT],
    ['KeyD', GameCommand.MOVE_RIGHT],
    ['ShiftLeft', GameCommand.DASH],
    ['ShiftRight', GameCommand.DASH],
    ['Space', GameCommand.FIRE_PRIMARY],
    ['KeyX', GameCommand.FIRE_SECONDARY],
    ['Escape', GameCommand.PAUSE],
    ['Enter', GameCommand.SKIP_CUTSCENE]
  ]);
  
  private currentGamePhase: GamePhase = GamePhase.TITLE;
  private commandExecutors: Map<GameCommand, (command: InputCommand) => void> = new Map();
  
  constructor() {
    this.setupDOMListeners();
  }
  
  /**
   * Set up global DOM listeners - these capture ALL input
   */
  private setupDOMListeners(): void {
    // Create handlers that can be removed later to prevent memory leaks
    this.keyDownHandler = (e) => {
      // CRITICAL: Prevent default browser behavior FIRST to stop scrolling
      if (this.keyToCommandMap.has(e.code)) {
        e.preventDefault();
      }
      this.captureKeyboardInput(e, true);
    };
    this.keyUpHandler = (e) => {
      // Also prevent on keyup for consistency
      if (this.keyToCommandMap.has(e.code)) {
        e.preventDefault();
      }
      this.captureKeyboardInput(e, false);
    };
    
    // Global keyboard capture with graceful error handling
    try {
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
      } else {
        // SSR or restricted environment - game will rely on mobile controls
        this.keyDownHandler = undefined;
        this.keyUpHandler = undefined;
      }
    } catch (error) {
      // Failed to add listeners - game may still work with mobile/touch controls
      this.keyDownHandler = undefined;
      this.keyUpHandler = undefined;
    }
  }
  
  /**
   * Capture raw DOM input and translate to game commands
   */
  private captureKeyboardInput(event: KeyboardEvent, pressed: boolean): void {
    const gameCommand = this.keyToCommandMap.get(event.code);
    
    if (gameCommand) {
      const inputCommand: InputCommand = {
        command: gameCommand,
        timestamp: Math.max(0, performance.now()), // Bounds check for timestamp
        pressed,
        source: 'keyboard',
        originalEvent: event
      };
      
      // Atomic operations to prevent race conditions
      try {
        // Add to queue for processing
        this.eventQueue.push(inputCommand);
        
        // Add to history for debugging (with bounds check)
        if (this.maxHistorySize > 0) {
          this.commandHistory.push(inputCommand);
          if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
          }
        }
      } catch (error) {
        // Silent error handling for production
      }
    }
  }
  
  /**
   * Update current game phase - this changes which commands are accepted
   */
  public setGamePhase(phase: GamePhase): void {
    if (this.currentGamePhase !== phase) {
      logger.info(`CommandInputSystem: Phase transition ${this.currentGamePhase} -> ${phase}`);
      this.currentGamePhase = phase;
      
      // Clear any queued events from previous phase
      const oldQueueSize = this.eventQueue.length;
      this.eventQueue = [];
      
      if (oldQueueSize > 0) {
        logger.info(`CommandInputSystem: Cleared ${oldQueueSize} queued events for phase transition`);
      }
    }
  }
  
  /**
   * Register command executor - this is how game systems respond to commands
   */
  public registerCommandExecutor(command: GameCommand, executor: (cmd: InputCommand) => void): void {
    this.commandExecutors.set(command, executor);
  }
  
  /**
   * Process event queue - this is where the filtering happens
   */
  public processEventQueue(): void {
    const filters = this.inputFilters.get(this.currentGamePhase) || [];
    
    // Sort filters by priority (highest first)
    filters.sort((a, b) => b.priority - a.priority);
    
    // Process events atomically to prevent race conditions
    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = []; // Clear queue atomically
    
    for (const command of eventsToProcess) {
      // Check if any filter accepts this command
      let commandAccepted = false;
      
      for (const filter of filters) {
        if (filter.accepts(command)) {
          commandAccepted = true;
          logger.info(`Command ${command.command} accepted by ${filter.name} filter`);
          
          // Execute the command
          const executor = this.commandExecutors.get(command.command);
          if (executor) {
            try {
              executor(command);
            } catch (error) {
              logger.error(`Error executing command ${command.command}:`, error);
            }
          }
          break;
        }
      }
      
      if (!commandAccepted) {
        logger.info(`Command ${command.command} rejected in phase ${this.currentGamePhase}`);
      }
    }
  }
  
  /**
   * Add custom input filter (for special game modes)
   */
  public addFilter(phase: GamePhase, filter: InputFilter): void {
    const existingFilters = this.inputFilters.get(phase) || [];
    existingFilters.push(filter);
    this.inputFilters.set(phase, existingFilters);
  }
  
  /**
   * Cleanup - removes event listeners to prevent memory leaks
   */
  public cleanup(): void {
    try {
      if (this.keyDownHandler) {
        document.removeEventListener('keydown', this.keyDownHandler);
        this.keyDownHandler = undefined;
      }
      if (this.keyUpHandler) {
        document.removeEventListener('keyup', this.keyUpHandler);
        this.keyUpHandler = undefined;
      }
      
      logger.info('CommandInputSystem: Event listeners cleaned up');
    } catch (error) {
      logger.error('CommandInputSystem: Failed to cleanup event listeners:', error);
      // Continue cleanup despite errors - set handlers to undefined anyway
      this.keyDownHandler = undefined;
      this.keyUpHandler = undefined;
    }
  }
}