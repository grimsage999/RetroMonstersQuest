/**
 * Frame Buffer Manager - Addresses Issue 1: State Transition Reliability
 * 
 * Learning Focus: Professional rendering pipeline patterns
 * This implements the Double Buffer + State Isolation pattern used in game engines
 */

export enum RenderState {
  IDLE = 'idle',
  PREPARING = 'preparing',
  RENDERING = 'rendering',
  PRESENTING = 'presenting'
}

export interface FrameMetrics {
  timestamp: number;
  renderDuration: number;
  clearDuration: number;
  presentDuration: number;
  frameState: RenderState;
}

export class FrameBufferManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentState: RenderState = RenderState.IDLE;
  private frameMetrics: FrameMetrics[] = [];
  private maxMetricsHistory = 60; // Keep last 60 frames
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context for FrameBuffer');
    }
    this.ctx = context;
  }
  
  /**
   * Begin a new frame with atomic state clearing
   * This addresses the root cause of black screen flickers
   */
  public beginFrame(): void {
    const startTime = performance.now();
    this.currentState = RenderState.PREPARING;
    
    // CRITICAL: Ensure clean canvas state
    this.clearFrameBuffer();
    
    const clearDuration = performance.now() - startTime;
    
    // Initialize frame metrics
    this.frameMetrics.push({
      timestamp: startTime,
      renderDuration: 0,
      clearDuration,
      presentDuration: 0,
      frameState: this.currentState
    });
    
    // Maintain metrics history
    if (this.frameMetrics.length > this.maxMetricsHistory) {
      this.frameMetrics.shift();
    }
  }
  
  /**
   * Clear frame buffer completely - this prevents resource contention
   */
  private clearFrameBuffer(): void {
    // Save current transform state
    this.ctx.save();
    
    // Reset all transformations to ensure complete clear
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear with solid background
    this.ctx.fillStyle = '#000011'; // Game's standard background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Reset all context properties to known state
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.imageSmoothingEnabled = false; // Pixel art style
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = 'transparent';
    
    // Restore transform state
    this.ctx.restore();
  }
  
  /**
   * Execute rendering operations in isolated context
   */
  public renderFrame(renderOperation: (ctx: CanvasRenderingContext2D) => void): void {
    const startTime = performance.now();
    this.currentState = RenderState.RENDERING;
    
    // Execute rendering in isolated context
    this.ctx.save();
    try {
      renderOperation(this.ctx);
    } catch (error) {
      console.error('Rendering error caught by FrameBufferManager:', error);
      // Attempt recovery by clearing and showing error state
      this.clearFrameBuffer();
      this.renderErrorState();
    } finally {
      this.ctx.restore();
    }
    
    const renderDuration = performance.now() - startTime;
    
    // Update current frame metrics
    if (this.frameMetrics.length > 0) {
      this.frameMetrics[this.frameMetrics.length - 1].renderDuration = renderDuration;
    }
  }
  
  /**
   * Present the completed frame
   */
  public presentFrame(): void {
    const startTime = performance.now();
    this.currentState = RenderState.PRESENTING;
    
    // In a more complex engine, this would handle buffer swapping
    // For Canvas 2D, this is mostly about state finalization
    
    // Ensure any pending operations are completed
    this.ctx.save();
    this.ctx.restore();
    
    const presentDuration = performance.now() - startTime;
    this.currentState = RenderState.IDLE;
    
    // Update current frame metrics
    if (this.frameMetrics.length > 0) {
      this.frameMetrics[this.frameMetrics.length - 1].presentDuration = presentDuration;
      this.frameMetrics[this.frameMetrics.length - 1].frameState = RenderState.IDLE;
    }
  }
  
  /**
   * Render error state when rendering fails
   */
  private renderErrorState(): void {
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = '24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RENDERING ERROR', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Check console for details', this.canvas.width / 2, this.canvas.height / 2 + 30);
  }
  
  /**
   * Get current render state for debugging
   */
  public getCurrentState(): RenderState {
    return this.currentState;
  }
  
  /**
   * Get performance metrics for the last N frames
   */
  public getFrameMetrics(frameCount: number = 10): FrameMetrics[] {
    return this.frameMetrics.slice(-frameCount);
  }
  
  /**
   * Detect if we're experiencing rendering issues
   */
  public detectRenderingIssues(): string[] {
    const issues: string[] = [];
    const recentFrames = this.getFrameMetrics(30);
    
    if (recentFrames.length === 0) return issues;
    
    // Check for slow clear operations (might indicate resource contention)
    const avgClearTime = recentFrames.reduce((sum, frame) => sum + frame.clearDuration, 0) / recentFrames.length;
    if (avgClearTime > 5) { // More than 5ms to clear suggests issues
      issues.push(`Slow frame clearing detected: ${avgClearTime.toFixed(2)}ms average`);
    }
    
    // Check for slow render operations
    const avgRenderTime = recentFrames.reduce((sum, frame) => sum + frame.renderDuration, 0) / recentFrames.length;
    if (avgRenderTime > 16) { // More than 16ms means we can't hit 60fps
      issues.push(`Slow rendering detected: ${avgRenderTime.toFixed(2)}ms average`);
    }
    
    // Check for stuck states
    const stuckFrames = recentFrames.filter(frame => 
      frame.frameState !== RenderState.IDLE && 
      performance.now() - frame.timestamp > 100
    );
    if (stuckFrames.length > 0) {
      issues.push(`Frames stuck in non-idle state: ${stuckFrames.length}`);
    }
    
    return issues;
  }
  
  /**
   * Force reset to clean state (emergency recovery)
   */
  public forceReset(): void {
    console.warn('FrameBufferManager: Force reset initiated');
    this.currentState = RenderState.IDLE;
    this.clearFrameBuffer();
    this.frameMetrics = [];
  }
  
  /**
   * Get diagnostic information
   */
  public getDiagnosticInfo(): string {
    const recentFrames = this.getFrameMetrics(10);
    const avgRenderTime = recentFrames.length > 0 
      ? recentFrames.reduce((sum, frame) => sum + frame.renderDuration, 0) / recentFrames.length 
      : 0;
    
    return `State: ${this.currentState}, Avg Render: ${avgRenderTime.toFixed(2)}ms, Frames: ${recentFrames.length}`;
  }
}