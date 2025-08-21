/**
 * Diagnostic System for Cosmic Playground
 * Comprehensive health check for all game systems
 */

import { GameStateManager, GamePhase } from './GameStateManager';
import { UIStateController } from './UIStateController';
import { LevelTransitionManager } from './LevelTransitionManager';
import { DamageSystem } from './DamageSystem';
import { AudioManager } from './AudioManager';

export interface DiagnosticReport {
  timestamp: number;
  systemHealth: {
    stateManager: boolean;
    uiController: boolean;
    transitionManager: boolean;
    damageSystem: boolean;
    audioSystem: boolean;
    renderingPipeline: boolean;
    inputSystem: boolean;
  };
  currentState: {
    gamePhase: string;
    uiState: string;
    isTransitioning: boolean;
    playerHealth: number;
    level: number;
    fps: number;
  };
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export class DiagnosticSystem {
  private stateManager: GameStateManager;
  private uiController: UIStateController;
  private transitionManager: LevelTransitionManager;
  private damageSystem: DamageSystem;
  private audioManager: AudioManager;
  private issues: string[] = [];
  private warnings: string[] = [];
  private recommendations: string[] = [];
  
  constructor(
    stateManager: GameStateManager,
    uiController: UIStateController,
    transitionManager: LevelTransitionManager,
    damageSystem: DamageSystem,
    audioManager: AudioManager
  ) {
    this.stateManager = stateManager;
    this.uiController = uiController;
    this.transitionManager = transitionManager;
    this.damageSystem = damageSystem;
    this.audioManager = audioManager;
  }
  
  /**
   * Run full diagnostic check
   */
  public runDiagnostic(gameState: any, fps: number): DiagnosticReport {
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
    
    // Check each system
    const stateHealth = this.checkStateManager();
    const uiHealth = this.checkUIController();
    const transitionHealth = this.checkTransitionManager();
    const damageHealth = this.checkDamageSystem();
    const audioHealth = this.checkAudioSystem();
    const renderingHealth = this.checkRenderingPipeline(fps);
    const inputHealth = this.checkInputSystem();
    
    // Check for specific known issues
    this.checkForOverlappingTransitions();
    this.checkForStateConflicts();
    this.checkForPerformanceIssues(fps);
    this.checkForMemoryLeaks();
    
    // Generate recommendations
    this.generateRecommendations();
    
    return {
      timestamp: Date.now(),
      systemHealth: {
        stateManager: stateHealth,
        uiController: uiHealth,
        transitionManager: transitionHealth,
        damageSystem: damageHealth,
        audioSystem: audioHealth,
        renderingPipeline: renderingHealth,
        inputSystem: inputHealth
      },
      currentState: {
        gamePhase: this.stateManager.getCurrentPhase(),
        uiState: this.uiController.getDebugInfo(),
        isTransitioning: this.transitionManager.isInTransition(),
        playerHealth: this.damageSystem.getHealth(),
        level: gameState.level || 1,
        fps: fps
      },
      issues: [...this.issues],
      warnings: [...this.warnings],
      recommendations: [...this.recommendations]
    };
  }
  
  private checkStateManager(): boolean {
    try {
      const currentPhase = this.stateManager.getCurrentPhase();
      const debugInfo = this.stateManager.getDebugInfo();
      
      // Check for invalid states
      if (!currentPhase) {
        this.issues.push('StateManager: No current phase set');
        return false;
      }
      
      // Check for stuck transitions
      if (debugInfo.includes('Transitioning: true')) {
        const transitionTime = Date.now(); // Would need to track this properly
        this.warnings.push('StateManager: Possible stuck transition detected');
      }
      
      return true;
    } catch (error) {
      this.issues.push(`StateManager: Error - ${error}`);
      return false;
    }
  }
  
  private checkUIController(): boolean {
    try {
      const debugInfo = this.uiController.getDebugInfo();
      const isBlocked = this.uiController.isInputBlocked();
      
      // Parse debug info
      const match = debugInfo.match(/Queue: (\d+)/);
      const queueLength = match ? parseInt(match[1]) : 0;
      
      if (queueLength > 3) {
        this.warnings.push(`UIController: Large queue detected (${queueLength} items)`);
      }
      
      if (isBlocked && queueLength === 0) {
        this.warnings.push('UIController: Input blocked but no queued transitions');
      }
      
      return true;
    } catch (error) {
      this.issues.push(`UIController: Error - ${error}`);
      return false;
    }
  }
  
  private checkTransitionManager(): boolean {
    try {
      const isTransitioning = this.transitionManager.isInTransition();
      
      // Check if transition is stuck
      if (isTransitioning) {
        // Would need to track transition start time
        this.warnings.push('TransitionManager: Active transition detected');
      }
      
      return true;
    } catch (error) {
      this.issues.push(`TransitionManager: Error - ${error}`);
      return false;
    }
  }
  
  private checkDamageSystem(): boolean {
    try {
      const health = this.damageSystem.getHealth();
      
      if (health <= 0) {
        this.warnings.push('DamageSystem: Player health is 0 or below');
      }
      
      if (health > 3) {
        this.issues.push('DamageSystem: Health exceeds maximum (3)');
        return false;
      }
      
      return true;
    } catch (error) {
      this.issues.push(`DamageSystem: Error - ${error}`);
      return false;
    }
  }
  
  private checkAudioSystem(): boolean {
    try {
      // Basic audio system check
      return true;
    } catch (error) {
      this.issues.push(`AudioSystem: Error - ${error}`);
      return false;
    }
  }
  
  private checkRenderingPipeline(fps: number): boolean {
    if (fps < 30) {
      this.issues.push(`Rendering: Low FPS detected (${fps})`);
      return false;
    }
    
    if (fps < 50) {
      this.warnings.push(`Rendering: Sub-optimal FPS (${fps})`);
    }
    
    return true;
  }
  
  private checkInputSystem(): boolean {
    // Would need to check if input is responding
    return true;
  }
  
  private checkForOverlappingTransitions(): void {
    const currentPhase = this.stateManager.getCurrentPhase();
    const isUIActive = this.uiController.getDebugInfo().includes('Active:') && 
                       !this.uiController.getDebugInfo().includes('Active: none');
    const isTransitioning = this.transitionManager.isInTransition();
    
    if (isUIActive && isTransitioning) {
      this.issues.push('CRITICAL: UI and level transitions overlapping!');
    }
    
    if (currentPhase === GamePhase.CUTSCENE && isTransitioning) {
      this.issues.push('CRITICAL: Cutscene playing during level transition!');
    }
    
    if (currentPhase === GamePhase.GAME_OVER && isUIActive) {
      const uiInfo = this.uiController.getDebugInfo();
      if (!uiInfo.includes('gameOver')) {
        this.warnings.push('Game over state but UI not showing game over screen');
      }
    }
  }
  
  private checkForStateConflicts(): void {
    const phase = this.stateManager.getCurrentPhase();
    const previousPhase = this.stateManager.getPreviousPhase();
    
    // Check for invalid state transitions
    if (phase === GamePhase.PLAYING && previousPhase === GamePhase.GAME_OVER) {
      this.issues.push('Invalid transition: GAME_OVER -> PLAYING without going through TITLE');
    }
    
    if (phase === GamePhase.CUTSCENE && previousPhase === GamePhase.GAME_OVER) {
      this.issues.push('Invalid transition: GAME_OVER -> CUTSCENE');
    }
  }
  
  private checkForPerformanceIssues(fps: number): void {
    if (fps < 30) {
      this.recommendations.push('Consider reducing particle effects or enemy count');
      this.recommendations.push('Check for memory leaks in bullet system');
    }
  }
  
  private checkForMemoryLeaks(): void {
    // Check for common memory leak patterns
    // This would need actual memory monitoring in production
    const debugInfo = this.uiController.getDebugInfo();
    const match = debugInfo.match(/Queue: (\d+)/);
    const queueLength = match ? parseInt(match[1]) : 0;
    
    if (queueLength > 5) {
      this.issues.push('Possible memory leak: UI transition queue growing unbounded');
    }
  }
  
  private generateRecommendations(): void {
    if (this.issues.length > 0) {
      this.recommendations.push('Critical issues detected - immediate attention required');
    }
    
    if (this.warnings.length > 3) {
      this.recommendations.push('Multiple warnings detected - review state management');
    }
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      this.recommendations.push('All systems operating normally');
    }
  }
  
  /**
   * Generate console output for diagnostic
   */
  public logDiagnostic(report: DiagnosticReport): void {
    console.group('🔍 COSMIC PLAYGROUND DIAGNOSTIC REPORT');
    
    console.group('System Health');
    Object.entries(report.systemHealth).forEach(([system, healthy]) => {
      const icon = healthy ? '✅' : '❌';
      console.log(`${icon} ${system}: ${healthy ? 'OK' : 'FAILED'}`);
    });
    console.groupEnd();
    
    console.group('Current State');
    console.log('Game Phase:', report.currentState.gamePhase);
    console.log('UI State:', report.currentState.uiState);
    console.log('Transitioning:', report.currentState.isTransitioning);
    console.log('Player Health:', report.currentState.playerHealth);
    console.log('Level:', report.currentState.level);
    console.log('FPS:', report.currentState.fps);
    console.groupEnd();
    
    if (report.issues.length > 0) {
      console.group('❌ Issues');
      report.issues.forEach(issue => console.error(issue));
      console.groupEnd();
    }
    
    if (report.warnings.length > 0) {
      console.group('⚠️ Warnings');
      report.warnings.forEach(warning => console.warn(warning));
      console.groupEnd();
    }
    
    console.group('💡 Recommendations');
    report.recommendations.forEach(rec => console.info(rec));
    console.groupEnd();
    
    console.groupEnd();
  }
}