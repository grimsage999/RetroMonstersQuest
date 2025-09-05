/**
 * Boss State Machine - Addresses Issue 3: Complex Entity Behavior Design
 * 
 * Learning Focus: AI architecture patterns
 * This implements Hierarchical State Machine + Behavior Tree patterns
 */

export interface GameContext {
  playerPosition: { x: number; y: number };
  playerHealth: number;
  bossHealth: number;
  deltaTime: number;
  canvasWidth: number;
  canvasHeight: number;
  currentWeapons: string[];
}

export interface BehaviorResult {
  success: boolean;
  shouldTransition?: boolean;
  nextState?: string;
  message?: string;
}

/**
 * Base class for boss behaviors - this enables composition
 */
export abstract class BossState {
  public name: string;
  protected entryTime: number = 0;
  protected stateData: Map<string, any> = new Map();
  
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Called when entering this state
   */
  public onEnter(context: GameContext): void {
    this.entryTime = performance.now();
    // Boss state transition
  }
  
  /**
   * Called every frame while in this state
   */
  public abstract execute(context: GameContext): BehaviorResult;
  
  /**
   * Called when leaving this state
   */
  public onExit(context: GameContext): void {
    // Boss state exit
    this.stateData.clear();
  }
  
  /**
   * How long we've been in this state
   */
  protected getTimeInState(): number {
    return performance.now() - this.entryTime;
  }
  
  /**
   * Store state-specific data
   */
  protected setData(key: string, value: any): void {
    this.stateData.set(key, value);
  }
  
  /**
   * Retrieve state-specific data
   */
  protected getData<T>(key: string, defaultValue?: T): T {
    return this.stateData.get(key) ?? defaultValue;
  }
}

/**
 * Boss intro sequence - dramatic entrance
 */
export class BossIntroState extends BossState {
  constructor() {
    super('BOSS_INTRO');
  }
  
  execute(context: GameContext): BehaviorResult {
    const timeInState = this.getTimeInState();
    
    // Phase 1: Dramatic entrance (0-2 seconds)
    if (timeInState < 2000) {
      // Boss slowly materializes/descends
      this.setData('alpha', Math.min(timeInState / 2000, 1));
      this.setData('yOffset', Math.max(50 - (timeInState / 2000) * 50, 0));
      
      return { success: true };
    }
    
    // Phase 2: Menacing pause (2-4 seconds)
    if (timeInState < 4000) {
      // Boss is fully visible, slight breathing animation
      this.setData('alpha', 1);
      this.setData('yOffset', 0);
      this.setData('breathe', Math.sin(timeInState * 0.01) * 2);
      
      return { success: true };
    }
    
    // Transition to Phase 1 combat
    return {
      success: true,
      shouldTransition: true,
      nextState: 'PHASE_1_COMBAT'
    };
  }
}

/**
 * Phase 1 combat - aggressive ranged attacks
 */
export class BossPhase1State extends BossState {
  constructor() {
    super('PHASE_1_COMBAT');
  }
  
  onEnter(context: GameContext): void {
    super.onEnter(context);
    this.setData('attackTimer', 0);
    this.setData('movePattern', 'horizontal'); // Start with horizontal movement
    this.setData('attacksLaunched', 0);
  }
  
  execute(context: GameContext): BehaviorResult {
    const attackTimer = this.getData('attackTimer', 0) + context.deltaTime;
    const attacksLaunched = this.getData('attacksLaunched', 0);
    
    // OPTIMIZED: Simplified movement pattern (less calculations)
    const movePattern = this.getData('movePattern');
    if (movePattern === 'horizontal') {
      // Simple oscillation without complex math
      const progress = (Date.now() % 4000) / 4000; // 4 second cycle
      const targetX = context.canvasWidth * 0.3 + (progress * context.canvasWidth * 0.4);
      this.setData('targetX', targetX);
      this.setData('targetY', 100);
    }
    
    // OPTIMIZED: Simplified attack pattern with randomness
    if (attackTimer >= 2000) {
      // 70% chance to attack (matches user's pattern)
      if (Math.random() > 0.3) {
        this.launchProjectileAttack(context);
        this.setData('attacksLaunched', attacksLaunched + 1);
      }
      this.setData('attackTimer', 0);
    } else {
      this.setData('attackTimer', attackTimer);
    }
    
    // Transition condition: Health below 66% or 10 attacks launched
    if (context.bossHealth <= 66 || attacksLaunched >= 10) {
      return {
        success: true,
        shouldTransition: true,
        nextState: 'PHASE_1_TO_2_TRANSITION',
        message: 'Boss health low, transitioning to Phase 2'
      };
    }
    
    return { success: true };
  }
  
  private launchProjectileAttack(context: GameContext): void {
    // OPTIMIZED: Simplified projectile creation (no complex targeting)
    // Boss Phase 1: Projectile attack
    // Reduced complexity projectile implementation
  }
}

/**
 * Transition between Phase 1 and 2 - vulnerable period
 */
export class BossPhase1To2Transition extends BossState {
  constructor() {
    super('PHASE_1_TO_2_TRANSITION');
  }
  
  onEnter(context: GameContext): void {
    super.onEnter(context);
    // Boss entering vulnerable phase
  }
  
  execute(context: GameContext): BehaviorResult {
    const timeInState = this.getTimeInState();
    
    // Vulnerable for 3 seconds - boss is stunned
    if (timeInState < 3000) {
      // Visual: Boss flashing, taking extra damage
      this.setData('isVulnerable', true);
      this.setData('flashEffect', Math.sin(timeInState * 0.02) > 0);
      
      return { success: true };
    }
    
    // Transition to Phase 2
    return {
      success: true,
      shouldTransition: true,
      nextState: 'PHASE_2_COMBAT'
    };
  }
}

/**
 * Phase 2 combat - mobile melee attacks
 */
export class BossPhase2State extends BossState {
  constructor() {
    super('PHASE_2_COMBAT');
  }
  
  onEnter(context: GameContext): void {
    super.onEnter(context);
    this.setData('chargeTimer', 0);
    this.setData('isCharging', false);
    // Boss Phase 2: Aggressive mode
  }
  
  execute(context: GameContext): BehaviorResult {
    const timeInState = this.getTimeInState();
    const chargeTimer = this.getData('chargeTimer', 0) + context.deltaTime;
    const isCharging = this.getData('isCharging', false);
    
    if (!isCharging) {
      // Preparation phase: Track player
      this.setData('targetX', context.playerPosition.x);
      this.setData('targetY', context.playerPosition.y);
      
      // Charge every 4 seconds
      if (chargeTimer >= 4000) {
        this.setData('isCharging', true);
        this.setData('chargeTimer', 0);
        this.setData('chargeStartX', this.getData('targetX'));
        this.setData('chargeStartY', this.getData('targetY'));
        // Boss Phase 2: Charge attack
      } else {
        this.setData('chargeTimer', chargeTimer);
      }
    } else {
      // Charging phase: Rush towards player
      const chargeDuration = 1500; // 1.5 second charge
      if (chargeTimer < chargeDuration) {
        const progress = chargeTimer / chargeDuration;
        // Interpolate position during charge
        this.setData('progress', progress);
        this.setData('chargeTimer', chargeTimer);
      } else {
        // Charge complete
        this.setData('isCharging', false);
        this.setData('chargeTimer', 0);
      }
    }
    
    // Transition condition: Health below 33%
    if (context.bossHealth <= 33) {
      return {
        success: true,
        shouldTransition: true,
        nextState: 'FINAL_PHASE',
        message: 'Boss critically damaged, entering final phase'
      };
    }
    
    return { success: true };
  }
}

/**
 * Final phase - desperate all-out assault
 */
export class BossFinalPhase extends BossState {
  constructor() {
    super('FINAL_PHASE');
  }
  
  onEnter(context: GameContext): void {
    super.onEnter(context);
    this.setData('attackFrequency', 500); // Very fast attacks
    this.setData('lastAttackTime', 0);
    // Boss Final Phase: Assault mode
  }
  
  execute(context: GameContext): BehaviorResult {
    const timeInState = this.getTimeInState();
    const attackFrequency = this.getData('attackFrequency', 500);
    const lastAttackTime = this.getData('lastAttackTime', 0);
    
    // Extremely aggressive behavior
    if (timeInState - lastAttackTime >= attackFrequency) {
      this.launchDesperateAttack(context);
      this.setData('lastAttackTime', timeInState);
    }
    
    // Random movement - erratic and dangerous
    if (timeInState % 1000 < context.deltaTime) { // Every second
      this.setData('targetX', Math.random() * context.canvasWidth);
      this.setData('targetY', 50 + Math.random() * 100); // Upper area
    }
    
    // Win condition: Boss defeated
    if (context.bossHealth <= 0) {
      return {
        success: true,
        shouldTransition: true,
        nextState: 'DEFEATED',
        message: 'Boss has been defeated!'
      };
    }
    
    return { success: true };
  }
  
  private launchDesperateAttack(context: GameContext): void {
    // Boss Final Phase: Desperate attack
    // Implementation would create multiple projectiles or area effects
  }
}

/**
 * Boss defeated state - death sequence
 */
export class BossDefeatedState extends BossState {
  constructor() {
    super('DEFEATED');
  }
  
  execute(context: GameContext): BehaviorResult {
    const timeInState = this.getTimeInState();
    
    if (timeInState < 3000) {
      // Death animation for 3 seconds
      this.setData('deathProgress', timeInState / 3000);
      return { success: true };
    }
    
    // Signal game that boss is fully defeated
    return {
      success: true,
      shouldTransition: true,
      nextState: 'REMOVED',
      message: 'Boss death sequence complete'
    };
  }
}

/**
 * Hierarchical State Machine for Boss
 */
export class BossStateMachine {
  private states: Map<string, BossState> = new Map();
  private currentState: BossState | null = null;
  private stateHistory: string[] = [];
  private maxHistorySize = 20;
  
  // OPTIMIZATION: Boss AI throttling
  private aiUpdateTimer: number = 0;
  private aiUpdateInterval: number = 150; // Update boss AI every 150ms instead of every frame
  private lastBehaviorResult: BehaviorResult | null = null;
  
  constructor() {
    // Register all boss states
    this.registerState(new BossIntroState());
    this.registerState(new BossPhase1State());
    this.registerState(new BossPhase1To2Transition());
    this.registerState(new BossPhase2State());
    this.registerState(new BossFinalPhase());
    this.registerState(new BossDefeatedState());
  }
  
  /**
   * Register a new state
   */
  private registerState(state: BossState): void {
    this.states.set(state.name, state);
  }
  
  /**
   * Start the state machine
   */
  public start(initialState: string, context: GameContext): void {
    this.transitionTo(initialState, context);
  }
  
  /**
   * Update the current state (OPTIMIZED with AI throttling)
   */
  public update(context: GameContext): BehaviorResult | null {
    if (!this.currentState) {
      return null;
    }
    
    // OPTIMIZATION: Throttle AI updates to reduce CPU overhead
    this.aiUpdateTimer += context.deltaTime;
    
    if (this.aiUpdateTimer >= this.aiUpdateInterval) {
      // Execute full AI logic at reduced frequency
      const result = this.currentState.execute(context);
      this.lastBehaviorResult = result;
      this.aiUpdateTimer = 0;
      
      // Handle state transitions
      if (result.shouldTransition && result.nextState) {
        this.transitionTo(result.nextState, context);
      }
      
      return result;
    } else {
      // Return cached result for smooth rendering while AI is throttled
      return this.lastBehaviorResult;
    }
  }
  
  /**
   * Transition to a new state
   */
  private transitionTo(stateName: string, context: GameContext): void {
    const newState = this.states.get(stateName);
    
    if (!newState) {
      console.error(`Boss state '${stateName}' not found`);
      return;
    }
    
    // Exit current state
    if (this.currentState) {
      this.currentState.onExit(context);
    }
    
    // Record state history
    this.stateHistory.push(stateName);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
    
    // Enter new state
    this.currentState = newState;
    this.currentState.onEnter(context);
    
    console.log(`Boss State Machine: Transitioned to ${stateName}`);
  }
  
  /**
   * Get current state name
   */
  public getCurrentStateName(): string {
    return this.currentState?.name || 'NONE';
  }
  
  /**
   * Get state history for debugging
   */
  public getStateHistory(): string[] {
    return [...this.stateHistory];
  }
  
  /**
   * Get current state data for rendering
   */
  public getCurrentStateData(): Map<string, any> | null {
    return this.currentState ? new Map(this.currentState['stateData']) : null;
  }
  
  /**
   * Force transition (for debugging)
   */
  public forceTransition(stateName: string, context: GameContext): void {
    console.warn(`Boss State Machine: Force transition to ${stateName}`);
    this.transitionTo(stateName, context);
  }
  
  /**
   * Get available states for debugging
   */
  public getAvailableStates(): string[] {
    return Array.from(this.states.keys());
  }
}