/**
 * CRITICAL PERFORMANCE PROFILER
 * Emergency implementation to identify exact rendering bottlenecks
 */
export class PerformanceProfiler {
  private frameStart: number = 0;
  private renderTime: number = 0;
  private updateTime: number = 0;
  private frameCount: number = 0;
  private totalFrameTime: number = 0;
  private slowFrames: number = 0;
  private memoryBaseline: number = 0;
  
  // Critical performance thresholds
  private readonly TARGET_FRAME_TIME = 16.67; // 60 FPS
  private readonly SLOW_FRAME_THRESHOLD = 20; // 50 FPS
  
  startFrame() {
    this.frameStart = performance.now();
  }
  
  startRender() {
    this.renderStartTime = performance.now();
  }
  
  endRender() {
    this.renderTime = performance.now() - this.renderStartTime;
  }
  
  startUpdate() {
    this.updateStartTime = performance.now();
  }
  
  endUpdate() {
    this.updateTime = performance.now() - this.updateStartTime;
  }
  
  endFrame() {
    const frameTime = performance.now() - this.frameStart;
    this.frameCount++;
    this.totalFrameTime += frameTime;
    
    // Track slow frames
    if (frameTime > this.SLOW_FRAME_THRESHOLD) {
      this.slowFrames++;
      
      // CRITICAL: Log slow frame details immediately
      if (frameTime > 33) { // Extremely slow (< 30 FPS)
        console.error(`🚨 CRITICAL SLOW FRAME: ${frameTime.toFixed(2)}ms`, {
          renderTime: this.renderTime.toFixed(2),
          updateTime: this.updateTime.toFixed(2),
          memoryUsage: this.getMemoryUsage()
        });
      }
    }
    
    // Report every 60 frames (1 second at 60 FPS)
    if (this.frameCount % 60 === 0) {
      this.reportPerformance();
    }
  }
  
  private reportPerformance() {
    const avgFrameTime = this.totalFrameTime / this.frameCount;
    const currentFPS = 1000 / avgFrameTime;
    const slowFramePercentage = (this.slowFrames / this.frameCount) * 100;
    
    console.log(`📊 PERFORMANCE REPORT:`, {
      fps: currentFPS.toFixed(1),
      avgFrameTime: avgFrameTime.toFixed(2),
      slowFrames: `${slowFramePercentage.toFixed(1)}%`,
      renderTime: this.renderTime.toFixed(2),
      updateTime: this.updateTime.toFixed(2),
      memoryMB: this.getMemoryUsage()
    });
    
    // CRITICAL: Alert if performance is below target
    if (currentFPS < 45) {
      console.error(`🚨 PERFORMANCE CRITICAL: FPS ${currentFPS.toFixed(1)} (Target: 60)`);
    }
  }
  
  private getMemoryUsage(): string {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`;
    }
    return 'N/A';
  }
  
  private renderStartTime: number = 0;
  private updateStartTime: number = 0;
  
  // Reset statistics
  reset() {
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.slowFrames = 0;
  }
  
  // Get current performance metrics
  getMetrics() {
    return {
      currentFPS: this.frameCount > 0 ? 1000 / (this.totalFrameTime / this.frameCount) : 0,
      avgFrameTime: this.frameCount > 0 ? this.totalFrameTime / this.frameCount : 0,
      slowFramePercentage: this.frameCount > 0 ? (this.slowFrames / this.frameCount) * 100 : 0,
      lastRenderTime: this.renderTime,
      lastUpdateTime: this.updateTime
    };
  }
}