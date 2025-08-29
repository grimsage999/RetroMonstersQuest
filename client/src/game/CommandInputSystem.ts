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
  FIRE_PRIMARY = 'fire_primary',
  FIRE_SECONDARY = 'fire_secondary',
  PAUSE = 'pause',
  SKIP_CUTSCENE = 'skip_cutscene',
  DEBUG_DIAGNOSTIC = 'debug_diagnostic'
}

export interface InputCommand {
  command: GameCommand;
  timestamp: number;
  pressed: boolean; // true for press, false for release
  source: 'keyboard' | 'touch' | 'gamepad';
  originalEvent?: any; // For debugging
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
    return command.command === GameCommand.SKIP_CUTSCENE ||
           command.command === GameCommand.DEBUG_DIAGNOSTIC;
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
      GameCommand.FIRE_PRIMARY,
      GameCommand.FIRE_SECONDARY,
      GameCommand.PAUSE,
      GameCommand.DEBUG_DIAGNOSTIC
    ].includes(command.command);
  }
}

class TransitionInputFilter implements InputFilter {
  priority = 200; // Highest priority - blocks almost everything during transitions
  name = 'transition';
  
  accepts(command: InputCommand): boolean {
    // During transitions, only allow debug commands
    return command.command === GameCommand.DEBUG_DIAGNOSTIC;
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
      GameCommand.FIRE_PRIMARY, // Select
      GameCommand.DEBUG_DIAGNOSTIC
    ].includes(command.command);
  }
}

export class CommandInputSystem {
  private eventQueue: InputCommand[] = [];
  private commandHistory: InputCommand[] = [];
  private maxHistorySize = 100;
  
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
    ['Space', GameCommand.FIRE_PRIMARY],
    ['KeyX', GameCommand.FIRE_SECONDARY],
    ['Escape', GameCommand.PAUSE],
    ['Enter', GameCommand.SKIP_CUTSCENE],
    ['KeyC', GameCommand.DEBUG_DIAGNOSTIC]
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
    // Global keyboard capture
    document.addEventListener('keydown', (e) => this.captureKeyboardInput(e, true));
    document.addEventListener('keyup', (e) => this.captureKeyboardInput(e, false));
    
    // Prevent default browser behaviors for game keys
    document.addEventListener('keydown', (e) => {
      if (this.keyToCommandMap.has(e.code)) {
        e.preventDefault();
      }
    });
  }
  
  /**
   * Capture raw DOM input and translate to game commands
   */
  private captureKeyboardInput(event: KeyboardEvent, pressed: boolean): void {
    const gameCommand = this.keyToCommandMap.get(event.code);
    
    if (gameCommand) {
      const inputCommand: InputCommand = {
        command: gameCommand,
        timestamp: performance.now(),
        pressed,
        source: 'keyboard',
        originalEvent: event
      };
      
      // Add to queue for processing
      this.eventQueue.push(inputCommand);
      
      // Add to history for debugging
      this.commandHistory.push(inputCommand);
      if (this.commandHistory.length > this.maxHistorySize) {
        this.commandHistory.shift();
      }
    }
  }
  
  /**
   * Update current game phase - this changes which commands are accepted
   */
  public setGamePhase(phase: GamePhase): void {
    if (this.currentGamePhase !== phase) {
      console.log(`CommandInputSystem: Phase transition ${this.currentGamePhase} -> ${phase}`);
      this.currentGamePhase = phase;
      
      // Clear any queued events from previous phase
      const oldQueueSize = this.eventQueue.length;
      this.eventQueue = [];
      
      if (oldQueueSize > 0) {
        console.log(`CommandInputSystem: Cleared ${oldQueueSize} queued events for phase transition`);
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
    
    while (this.eventQueue.length > 0) {
      const command = this.eventQueue.shift()!;
      
      // Check if any filter accepts this command
      let commandAccepted = false;
      
      for (const filter of filters) {
        if (filter.accepts(command)) {
          commandAccepted = true;
          console.log(`Command ${command.command} accepted by ${filter.name} filter`);
          
          // Execute the command
          const executor = this.commandExecutors.get(command.command);
          if (executor) {
            try {
              executor(command);
            } catch (error) {
              console.error(`Error executing command ${command.command}:`, error);
            }
          }
          break;
        }
      }
      
      if (!commandAccepted) {
        console.log(`Command ${command.command} rejected in phase ${this.currentGamePhase}`);
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
   * Get current input state for debugging
   */
  public getDebugInfo(): any {
    return {
      currentPhase: this.currentGamePhase,
      queueSize: this.eventQueue.length,
      lastCommands: this.commandHistory.slice(-5),
      activeFilters: this.inputFilters.get(this.currentGamePhase)?.map(f => f.name) || []
    };
  }
  
  /**
   * Get command history for debugging
   */
  public getCommandHistory(count: number = 20): InputCommand[] {
    return this.commandHistory.slice(-count);
  }
  
  /**
   * Detect input leaking issues
   */
  public detectInputLeakage(): string[] {
    const issues: string[] = [];
    
    // Check for large queue buildup
    if (this.eventQueue.length > 10) {
      issues.push(`Large input queue: ${this.eventQueue.length} commands pending`);
    }
    
    // Check for rapid repeated commands (might indicate stuck keys)
    const recentCommands = this.commandHistory.slice(-10);
    const commandCounts = new Map<GameCommand, number>();
    
    recentCommands.forEach(cmd => {
      commandCounts.set(cmd.command, (commandCounts.get(cmd.command) || 0) + 1);
    });
    
    commandCounts.forEach((count, command) => {
      if (count > 5) { // Same command more than 5 times in last 10
        issues.push(`Possible stuck key: ${command} repeated ${count} times`);
      }
    });
    
    return issues;
  }
  
  /**
   * Emergency reset - clear all queued input
   */
  public emergencyReset(): void {
    console.warn('CommandInputSystem: Emergency reset initiated');
    this.eventQueue = [];
    this.commandHistory = [];
  }
}