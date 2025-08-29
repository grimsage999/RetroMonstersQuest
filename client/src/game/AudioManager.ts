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
      
      // Load sounds after context is created
      await this.loadSounds();
      this.isInitialized = true;
    } catch (error) {
      console.log('Audio initialization failed:', error);
      // Set flag to prevent further audio operations that would fail
      this.isInitialized = false;
      throw error; // Re-throw to let caller handle
    }
  }

  private async loadSounds() {
    try {
      // Use existing sound files
      this.backgroundMusic = new Audio('/sounds/background.mp3');
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.3;
      
      // Load sound effects
      this.hitSound = new Audio('/sounds/hit.mp3');
      this.hitSound.volume = 0.5;
      
      this.successSound = new Audio('/sounds/success.mp3');
      this.successSound.volume = 0.7;
      
      // Preload all sounds
      await Promise.all([
        this.backgroundMusic.load(),
        this.hitSound.load(),
        this.successSound.load()
      ]);
      
      // Start background music after initialization
      this.playBackgroundMusic();
    } catch (error) {
      console.log('Audio loading failed:', error);
    }
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
      const soundClone = this.hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log('Hit sound play prevented:', error);
        // Continue despite audio errors - don't break game flow
      });
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
      const soundClone = this.hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.4;
      soundClone.playbackRate = 1.5; // Higher pitch for crunch
      soundClone.play().catch(error => {
        console.log('Crunch sound play prevented:', error);
      });
    }
  }

  public playRayGun() {
    if (this.hitSound && !this.isMuted && this.isInitialized) {
      // Use hit sound with lower pitch for ray gun
      const soundClone = this.hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.playbackRate = 0.8; // Lower pitch for energy weapon
      soundClone.play().catch(error => {
        console.log('Ray gun sound play prevented:', error);
      });
    }
  }

  public playAdjudicator() {
    if (this.successSound && !this.isMuted && this.isInitialized) {
      // Use success sound with dramatic effect for adjudicator
      const soundClone = this.successSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.6;
      soundClone.playbackRate = 0.7; // Deep, powerful sound
      soundClone.play().catch(error => {
        console.log('Adjudicator sound play prevented:', error);
      });
    }
  }

  public playVictoryFanfare() {
    if (this.successSound && !this.isMuted && this.isInitialized) {
      // Epic victory sequence
      const soundClone = this.successSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.8;
      soundClone.playbackRate = 1.2; // Triumphant tone
      soundClone.play().catch(error => {
        console.log('Victory fanfare play prevented:', error);
      });
    }
  }

  public playGameStart() {
    if (this.successSound && !this.isMuted && this.isInitialized) {
      // Game start jingle
      const soundClone = this.successSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.5;
      soundClone.playbackRate = 1.5; // Cheerful startup
      soundClone.play().catch(error => {
        console.log('Game start sound play prevented:', error);
      });
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
