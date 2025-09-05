/**
 * Simple Performance Profiler - Clean version
 */
export class PerformanceProfiler {
  private frameStart: number = 0;
  private renderStartTime: number = 0;
  private updateStartTime: number = 0;
  private renderTime: number = 0;
  private updateTime: number = 0;
  
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
    // Simple frame time tracking without spam
    const frameTime = performance.now() - this.frameStart;
    
    // Only log critical performance issues
    if (frameTime > 50) { // Less than 20 FPS
      console.warn('Slow frame detected:', frameTime.toFixed(1) + 'ms');
    }
  }
  
  getMemoryUsage(): string {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`;
    }
    return 'N/A';
  }
}