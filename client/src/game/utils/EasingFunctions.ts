/**
 * Easing Functions Utility
 * Provides smooth animation curves for transitions
 */

export type EasingFunction = (t: number) => number;

export class EasingFunctions {
  // Quadratic easing
  static easeInQuad: EasingFunction = (t: number) => t * t;
  
  static easeOutQuad: EasingFunction = (t: number) => 1 - (1 - t) * (1 - t);
  
  static easeInOutQuad: EasingFunction = (t: number) => 
    t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  
  // Cubic easing for smoother transitions
  static easeInCubic: EasingFunction = (t: number) => t * t * t;
  
  static easeOutCubic: EasingFunction = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
  
  static easeInOutCubic: EasingFunction = (t: number) => 
    t < 0.5 ? 4 * t * t * t : 1 - 4 * (1 - t) * (1 - t) * (1 - t);

  // Utility method to clamp values
  static clamp(value: number, min: number = 0, max: number = 1): number {
    return Math.max(min, Math.min(max, value));
  }

  // Apply easing with automatic clamping
  static apply(easingFn: EasingFunction, progress: number): number {
    return easingFn(this.clamp(progress));
  }
}