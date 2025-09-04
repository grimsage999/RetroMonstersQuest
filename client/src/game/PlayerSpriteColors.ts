
export class PlayerSpriteColors {
  public static readonly SPRITE_SCALE = 3;
  
  // Enhanced cosmic kawaii palette inspired by moodboard
  public static readonly COSMO_PALETTE = {
    0: 'transparent',
    1: '#FFFFFF', // Pure white (eye shine)
    2: '#7FFF00', // Bright lime green (main body) - more vibrant
    3: '#228B22', // Forest green (shading)
    4: '#000080', // Navy blue (large kawaii eyes)
    5: '#FF69B4', // Hot pink (cosmic suit) - matches moodboard
    6: '#FFB6C1', // Light pink (blush/nose) - kawaii detail
    7: '#FFD700', // Gold (cosmic star details)
    8: '#00CED1', // Dark turquoise (accent)
    9: '#9370DB', // Medium purple (cosmic glow)
  };
  
  // Cosmic particle effects colors
  public static readonly COSMIC_EFFECTS = {
    STAR_COLORS: ['#FFD700', '#FF69B4', '#00CED1', '#9370DB'],
    TRAIL_COLORS: ['#7FFF00', '#FF69B4', '#FFD700'],
    GLOW_COLOR: '#7FFF00'
  };
}
