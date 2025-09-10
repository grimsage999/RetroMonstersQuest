import { GAME_CONFIG } from './GameConfig';

export class AudioManager {
  private backgroundMusic: HTMLAudioElement | null = null;
  private hitSound: HTMLAudioElement | null = null;
  private successSound: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Don't load sounds until user interaction
  }

  public async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Create audio context on user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // CRITICAL: Resume AudioContext to unlock audio playback
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Load sounds in background (non-blocking)
      this.loadSounds(); // Don't await - let it load in background
      this.isInitialized = true;
    } catch (error) {
      // Audio initialization failed - set flag to prevent further operations
      this.isInitialized = false;
      throw error;
    }
  }

  private async loadSounds() {
    try {
      // Use existing sound files
      this.backgroundMusic = new Audio('/sounds/background.mp3');
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = GAME_CONFIG.AUDIO.BACKGROUND_MUSIC_VOLUME;
      
      // Load sound effects
      this.hitSound = new Audio('/sounds/hit.mp3');
      this.hitSound.volume = GAME_CONFIG.AUDIO.HIT_SOUND_VOLUME;
      
      this.successSound = new Audio('/sounds/success.mp3');
      this.successSound.volume = GAME_CONFIG.AUDIO.SUCCESS_SOUND_VOLUME;
      
      // Load sounds asynchronously without blocking
      const loadPromises = [
        new Promise<void>((resolve) => {
          this.backgroundMusic!.addEventListener('canplaythrough', () => resolve(), { once: true });
          this.backgroundMusic!.load();
        }),
        new Promise<void>((resolve) => {
          this.hitSound!.addEventListener('canplaythrough', () => resolve(), { once: true });
          this.hitSound!.load();
        }),
        new Promise<void>((resolve) => {
          this.successSound!.addEventListener('canplaythrough', () => resolve(), { once: true });
          this.successSound!.load();
        })
      ];
      
      // Don't await - let them load in background
      Promise.all(loadPromises).then(() => {
        // All sounds loaded successfully
      }).catch(error => {
        console.warn('AudioManager: Some sounds failed to load:', error);
      });
      
    } catch (error) {
      // Audio loading failed - continue without audio
    }
  }
  
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }



  public playBackgroundMusic() {
    if (this.backgroundMusic && !this.isMuted && this.isInitialized) {
      this.backgroundMusic.play().catch(error => {
        console.log('Background music play prevented:', error);
        // Disable background music to prevent repeated errors
        this.backgroundMusic = null;
      });
    }
  }

  public stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  public playHit() {
    if (this.hitSound && !this.isMuted && this.isInitialized) {
      // Clone the sound to allow overlapping playback
      try {
        const soundClone = this.hitSound.cloneNode(true);
        if (soundClone instanceof HTMLAudioElement) {
          soundClone.volume = 0.3;
          soundClone.play().catch(error => {
            console.log('Hit sound play prevented:', error);
            // Continue despite audio errors - don't break game flow
          });
        }
      } catch (error) {
        console.error('Audio clone failed:', error);
      }
    }
  }

  public playSuccess() {
    if (this.successSound && !this.isMuted && this.isInitialized) {
      this.successSound.currentTime = 0;
      this.successSound.play().catch(error => {
        console.log('Success sound play prevented:', error);
      });
    }
  }

  public playCrunch() {
    if (this.hitSound && !this.isMuted && this.isInitialized) {
      // Use hit sound with higher pitch for crunch effect
      try {
        const soundClone = this.hitSound.cloneNode(true);
        if (soundClone instanceof HTMLAudioElement) {
          soundClone.volume = 0.4;
          soundClone.playbackRate = 1.5; // Higher pitch for crunch
          soundClone.play().catch(error => {
            console.log('Crunch sound play prevented:', error);
          });
        }
      } catch (error) {
        console.error('Audio clone failed for crunch:', error);
      }
    }
  }

  public playRayGun() {
    if (this.hitSound && !this.isMuted && this.isInitialized) {
      // Use hit sound with lower pitch for ray gun
      try {
        const soundClone = this.hitSound.cloneNode(true);
        if (soundClone instanceof HTMLAudioElement) {
          soundClone.volume = 0.3;
          soundClone.playbackRate = 0.8; // Lower pitch for energy weapon
          soundClone.play().catch(error => {
            console.log('Ray gun sound play prevented:', error);
          });
        }
      } catch (error) {
        console.error('Audio clone failed for ray gun:', error);
      }
    }
  }

  public playAdjudicator() {
    if (this.successSound && !this.isMuted && this.isInitialized) {
      // Use success sound with dramatic effect for adjudicator
      try {
        const soundClone = this.successSound.cloneNode(true);
        if (soundClone instanceof HTMLAudioElement) {
          soundClone.volume = 0.6;
          soundClone.playbackRate = 0.7; // Deep, powerful sound
          soundClone.play().catch(error => {
            console.log('Adjudicator sound play prevented:', error);
          });
        }
      } catch (error) {
        console.error('Audio clone failed for adjudicator:', error);
      }
    }
  }

  public playVictoryFanfare() {
    if (this.successSound && !this.isMuted && this.isInitialized) {
      // Epic victory sequence
      try {
        const soundClone = this.successSound.cloneNode(true);
        if (soundClone instanceof HTMLAudioElement) {
          soundClone.volume = 0.8;
          soundClone.playbackRate = 1.2; // Triumphant tone
          soundClone.play().catch(error => {
            console.log('Victory fanfare play prevented:', error);
          });
        }
      } catch (error) {
        console.error('Audio clone failed for victory fanfare:', error);
      }
    }
  }

  public playGameStart() {
    if (this.successSound && !this.isMuted && this.isInitialized) {
      // Game start jingle
      try {
        const soundClone = this.successSound.cloneNode(true);
        if (soundClone instanceof HTMLAudioElement) {
          soundClone.volume = 0.5;
          soundClone.playbackRate = 1.5; // Cheerful startup
          soundClone.play().catch(error => {
            console.log('Game start sound play prevented:', error);
          });
        }
      } catch (error) {
        console.error('Audio clone failed for game start:', error);
      }
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
    
    console.log(`Sound ${this.isMuted ? 'muted' : 'unmuted'}`);
  }
}
