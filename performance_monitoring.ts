/**
 * PERFORMANCE MONITORING IMPLEMENTATION
 * Enhanced performance monitoring for mini-boss scenarios
 */

import { logger } from './Logger';

export interface PerformanceMetrics {
  frameTime: number;
  fps: number;
  entitiesCount: number;
  collisionChecks: number;
  renderTime: number;
  memoryUsage?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private frameTimes: number[] = [];
  private readonly maxHistory: number = 60; // Last 60 frames
  private lastFrameTime: number = 0;
  private startTime: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  
  constructor() {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
  }
  
  public startFrame(): void {
    this.lastFrameTime = performance.now();
  }
  
  public endFrame(metrics: Omit<PerformanceMetrics, 'fps'>): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.frameTimes.push(frameTime);
    
    // Calculate FPS every 10 frames to reduce overhead
    this.frameCount++;
    let fps = 0;
    if (this.frameCount % 10 === 0) {
      const timeElapsed = currentTime - this.lastFpsUpdate;
      if (timeElapsed > 0) {
        fps = (this.frameCount * 1000) / timeElapsed; // Average FPS over last 10 frames
      }
      this.lastFpsUpdate = currentTime;
    }
    
    // Add metrics with calculated FPS
    this.metrics.push({
      ...metrics,
      fps,
      frameTime
    });
    
    // Keep only recent history
    if (this.metrics.length > this.maxHistory) {
      this.metrics.shift();
      this.frameTimes.shift();
    }
  }
  
  public getRecentAverage(): PerformanceMetrics | null {
    if (this.metrics.length === 0) {
      return null;
    }
    
    const recentMetrics = this.metrics.slice(-10); // Last 10 frames
    if (recentMetrics.length === 0) {
      return null;
    }
    
    const sum = recentMetrics.reduce((acc, metric) => ({
      frameTime: acc.frameTime + metric.frameTime,
      fps: acc.fps + (metric.fps || 0),
      entitiesCount: acc.entitiesCount + metric.entitiesCount,
      collisionChecks: acc.collisionChecks + metric.collisionChecks,
      renderTime: acc.renderTime + metric.renderTime
    }), { frameTime: 0, fps: 0, entitiesCount: 0, collisionChecks: 0, renderTime: 0 });
    
    const count = recentMetrics.length;
    const avgFps = sum.fps > 0 ? sum.fps / count : this.estimateFps();
    
    return {
      frameTime: sum.frameTime / count,
      fps: avgFps,
      entitiesCount: sum.entitiesCount / count,
      collisionChecks: sum.collisionChecks / count,
      renderTime: sum.renderTime / count
    };
  }
  
  private estimateFps(): number {
    if (this.frameTimes.length < 2) return 0;
    
    const recentFrameTimes = this.frameTimes.slice(-10);
    const avgFrameTime = recentFrameTimes.reduce((a, b) => a + b, 0) / recentFrameTimes.length;
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }
  
  public detectPerformanceIssues(): { isLowFps: boolean; isHighEntityCount: boolean; isSlowRendering: boolean } {
    const avgMetrics = this.getRecentAverage();
    if (!avgMetrics) {
      return { isLowFps: false, isHighEntityCount: false, isSlowRendering: false };
    }
    
    return {
      isLowFps: avgMetrics.fps < 30, // Below 30 FPS is problematic
      isHighEntityCount: avgMetrics.entitiesCount > 50, // Threshold may vary
      isSlowRendering: avgMetrics.renderTime > 8 // Rendering taking more than 8ms
    };
  }
  
  public getMetricsReport(): string {
    const avgMetrics = this.getRecentAverage();
    if (!avgMetrics) {
      return "No performance data available";
    }
    
    const issues = this.detectPerformanceIssues();
    const issuesList = [];
    if (issues.isLowFps) issuesList.push(`FPS below 30 (${avgMetrics.fps.toFixed(1)})`);
    if (issues.isHighEntityCount) issuesList.push(`High entity count (${avgMetrics.entitiesCount.toFixed(1)})`);
    if (issues.isSlowRendering) issuesList.push(`Slow rendering (${avgMetrics.renderTime.toFixed(2)}ms)`);
    
    const issuesStr = issuesList.length > 0 ? `ISSUES: ${issuesList.join(', ')}` : "Performance OK";
    
    return `Performance Report: ${issuesStr}
  - Avg FPS: ${avgMetrics.fps.toFixed(1)}
  - Avg Frame Time: ${avgMetrics.frameTime.toFixed(2)}ms
  - Entities: ${avgMetrics.entitiesCount.toFixed(1)}
  - Collision Checks: ${avgMetrics.collisionChecks.toFixed(1)}
  - Render Time: ${avgMetrics.renderTime.toFixed(2)}ms`;
  }
}

// Specialized profiler for mini-boss scenarios
export class MiniBossPerformanceProfiler {
  private bossTimings: Map<string, { startTimes: number[], durations: number[] }> = new Map();
  private activeBossStartTimes: Map<string, number> = new Map();
  
  public startBossScenario(bossType: string, id: string): void {
    const key = `${bossType}_${id}`;
    const startTime = performance.now();
    this.activeBossStartTimes.set(key, startTime);
    
    if (!this.bossTimings.has(bossType)) {
      this.bossTimings.set(bossType, { startTimes: [], durations: [] });
    }
    this.bossTimings.get(bossType)!.startTimes.push(startTime);
  }
  
  public endBossScenario(bossType: string, id: string): void {
    const key = `${bossType}_${id}`;
    const startTime = this.activeBossStartTimes.get(key);
    
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      const bossData = this.bossTimings.get(bossType);
      
      if (bossData) {
        bossData.durations.push(duration);
        // Remove from active tracking
        this.activeBossStartTimes.delete(key);
      }
    }
  }
  
  public getBossPerformanceReport(): string {
    let report = "Mini-Boss Performance Report:\n";
    
    for (const [bossType, data] of this.bossTimings.entries()) {
      if (data.durations.length > 0) {
        const avgDuration = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
        const minDuration = Math.min(...data.durations);
        const maxDuration = Math.max(...data.durations);
        
        report += `- ${bossType}: Avg: ${avgDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms, Instances: ${data.durations.length}\n`;
      }
    }
    
    if (report === "Mini-Boss Performance Report:\n") {
      report += "No mini-boss performance data collected";
    }
    
    return report;
  }
  
  public reset(): void {
    this.bossTimings.clear();
    this.activeBossStartTimes.clear();
  }
}

// Integration with current game systems
export class EnhancedGameEnginePerformance {
  private performanceMonitor: PerformanceMonitor = new PerformanceMonitor();
  private bossProfiler: MiniBossPerformanceProfiler = new MiniBossPerformanceProfiler();
  private lastRenderTime: number = 0;
  private collisionChecksThisFrame: number = 0;
  private entitiesThisFrame: number = 0;
  
  // Call at the beginning of each frame
  public startPerformanceFrame(): void {
    this.performanceMonitor.startFrame();
    this.collisionChecksThisFrame = 0;
  }
  
  // Call at the end of each frame
  public endPerformanceFrame(entitiesCount: number): void {
    const currentRenderTime = performance.now() - this.lastRenderTime;
    
    this.performanceMonitor.endFrame({
      entitiesCount: entitiesCount,
      collisionChecks: this.collisionChecksThisFrame,
      renderTime: currentRenderTime
    });
  }
  
  // Call when doing collision checks to track count
  public recordCollisionCheck(): void {
    this.collisionChecksThisFrame++;
  }
  
  // Call when rendering starts
  public startRender(): void {
    this.lastRenderTime = performance.now();
  }
  
  // Check for performance issues and log warnings
  public checkPerformanceAndLog(): void {
    const issues = this.performanceMonitor.detectPerformanceIssues();
    if (issues.isLowFps || issues.isHighEntityCount || issues.isSlowRendering) {
      logger.warn(this.performanceMonitor.getMetricsReport());
    }
  }
  
  // Get performance report
  public getPerformanceReport(): string {
    return this.performanceMonitor.getMetricsReport() + "\n" + 
           this.bossProfiler.getBossPerformanceReport();
  }
}