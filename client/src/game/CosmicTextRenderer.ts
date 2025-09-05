
/**
 * Cosmic Text Renderer
 * Creates vibrant graffiti-style text effects for Cosmic Playground
 * Inspired by retro arcade aesthetics with bold outlines and glows
 */

import { GAME_CONFIG } from './GameConfig';

export interface TextStyle {
  FONT_SIZE: number;
  OUTLINE_WIDTH: number;
  SHADOW_OFFSET: number;
  GLOW_INTENSITY: number;
  PRIMARY_COLOR: string;
  OUTLINE_COLOR: string;
  SHADOW_COLOR: string;
  GLOW_COLOR: string;
}

export class CosmicTextRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Render cosmic graffiti-style text with multiple effects
   */
  public renderCosmicText(
    text: string,
    x: number,
    y: number,
    styleType: keyof typeof GAME_CONFIG.TEXT_STYLES,
    pulsePhase: number = 0
  ): void {
    const style = GAME_CONFIG.TEXT_STYLES[styleType];
    const ctx = this.ctx;

    // Save context
    ctx.save();

    // Set ultra-chunky bubble font with maximum weight
    ctx.font = `900 ${style.FONT_SIZE}px "Comic Sans MS", "Marker Felt", "Chalkduster", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Create pulsing effect for extra impact
    const pulseFactor = 1 + Math.sin(pulsePhase) * 0.15; // More pronounced pulse
    const adjustedFontSize = style.FONT_SIZE * pulseFactor;
    ctx.font = `900 ${adjustedFontSize}px "Comic Sans MS", "Marker Felt", "Chalkduster", cursive`;

    // 1. Render deep 3D dimensional shadow layers (like COWZ/YOPPI examples)
    const shadowDepth = 8; // Deep dimensional shadow
    for (let depth = shadowDepth; depth > 0; depth--) {
      ctx.globalAlpha = 0.7 - (depth * 0.06); // Gradual fade
      ctx.fillStyle = this.darkenColor(style.SHADOW_COLOR, depth * 0.1);
      ctx.fillText(text, x + depth, y + depth);
    }

    // 2. Render bright outer glow for pop
    for (let i = 0; i < style.GLOW_INTENSITY; i++) {
      ctx.shadowColor = style.GLOW_COLOR;
      ctx.shadowBlur = style.GLOW_INTENSITY + i * 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = style.GLOW_COLOR;
      ctx.globalAlpha = 0.15;
      ctx.fillText(text, x, y);
    }

    // Clear shadow for next layers
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // 3. Render ultra-thick outline for maximum chunkiness
    ctx.globalAlpha = 1;
    ctx.strokeStyle = style.OUTLINE_COLOR;
    ctx.lineWidth = style.OUTLINE_WIDTH * 1.8; // Much thicker base
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Multiple aggressive outline passes for chunky dimensional effect
    for (let i = 0; i < 6; i++) {
      ctx.lineWidth = style.OUTLINE_WIDTH * (1.8 - i * 0.2);
      ctx.strokeText(text, x, y);
    }

    // 4. Render vibrant main text fill
    ctx.globalAlpha = 1;
    ctx.fillStyle = style.PRIMARY_COLOR;
    ctx.fillText(text, x, y);

    // 5. Add bright inner highlight for strong 3D bubble effect
    ctx.fillStyle = this.lightenColor(style.PRIMARY_COLOR, 0.4);
    ctx.globalAlpha = 0.8;
    ctx.fillText(text, x - 1, y - 3); // More pronounced highlight

    // 6. Add inner core glow for extra vibrancy
    ctx.fillStyle = this.lightenColor(style.PRIMARY_COLOR, 0.6);
    ctx.globalAlpha = 0.4;
    ctx.fillText(text, x, y - 1);

    // Restore context
    ctx.restore();
  }

  /**
   * Render multi-line cosmic text with proper spacing
   */
  public renderMultiLineCosmicText(
    lines: string[],
    x: number,
    startY: number,
    styleType: keyof typeof GAME_CONFIG.TEXT_STYLES,
    lineSpacing: number = 1.5,
    pulsePhase: number = 0
  ): void {
    const style = GAME_CONFIG.TEXT_STYLES[styleType];
    const lineHeight = style.FONT_SIZE * lineSpacing;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      // Stagger pulse for dynamic effect
      const staggeredPhase = pulsePhase + (index * 0.2);
      this.renderCosmicText(line, x, y, styleType, staggeredPhase);
    });
  }

  /**
   * Render title with special cosmic effects
   */
  public renderCosmicTitle(
    text: string,
    x: number,
    y: number,
    pulsePhase: number = 0
  ): void {
    const ctx = this.ctx;
    
    // Extra cosmic effects for titles
    ctx.save();

    // Render rainbow gradient background
    const gradient = ctx.createLinearGradient(x - 200, y, x + 200, y);
    gradient.addColorStop(0, '#FF0080');
    gradient.addColorStop(0.2, '#FF8000');
    gradient.addColorStop(0.4, '#FFFF00');
    gradient.addColorStop(0.6, '#80FF00');
    gradient.addColorStop(0.8, '#0080FF');
    gradient.addColorStop(1, '#8000FF');

    // Modify title style for gradient
    const originalColor = GAME_CONFIG.TEXT_STYLES.TITLE.PRIMARY_COLOR;
    (GAME_CONFIG.TEXT_STYLES.TITLE as any).PRIMARY_COLOR = gradient;

    this.renderCosmicText(text, x, y, 'TITLE', pulsePhase);

    // Restore original color
    (GAME_CONFIG.TEXT_STYLES.TITLE as any).PRIMARY_COLOR = originalColor;

    ctx.restore();
  }

  /**
   * Create animated star field effect around text
   */
  public renderStarField(
    centerX: number,
    centerY: number,
    radius: number,
    starCount: number,
    animationPhase: number
  ): void {
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2 + animationPhase;
      const distance = radius + Math.sin(animationPhase + i) * 20;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Render twinkling star
      ctx.fillStyle = `hsl(${(animationPhase * 50 + i * 30) % 360}, 100%, 70%)`;
      ctx.globalAlpha = 0.5 + Math.sin(animationPhase * 3 + i) * 0.5;
      
      const starSize = 2 + Math.sin(animationPhase * 2 + i) * 1;
      ctx.fillRect(x - starSize/2, y - starSize/2, starSize, starSize);
    }

    ctx.restore();
  }

  /**
   * Lighten a hex color by a percentage
   */
  private lightenColor(color: string, percent: number): string {
    // Simple color lightening for highlight effect
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  /**
   * Darken a hex color by a percentage for dimensional shadows
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B)
      .toString(16).slice(1);
  }
}
