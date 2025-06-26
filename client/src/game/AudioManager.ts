export class AudioManager {
  private backgroundMusic: HTMLAudioElement | null = null;
  private hitSound: HTMLAudioElement | null = null;
  private successSound: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.loadSounds();
  }

  private async loadSounds() {
    try {
      // Load background music
      this.backgroundMusic = new Audio('/sounds/background.mp3');
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.3;
      
      // Load sound effects
      this.hitSound = new Audio('/sounds/hit.mp3');
      this.hitSound.volume = 0.5;
      
      this.successSound = new Audio('/sounds/success.mp3');
      this.successSound.volume = 0.7;
      
      // Start background music
      this.playBackgroundMusic();
    } catch (error) {
      console.log('Audio loading failed:', error);
    }
  }



  public playBackgroundMusic() {
    if (this.backgroundMusic && !this.isMuted) {
      this.backgroundMusic.play().catch(error => {
        console.log('Background music play prevented:', error);
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
    if (this.hitSound && !this.isMuted) {
      // Clone the sound to allow overlapping playback
      const soundClone = this.hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log('Hit sound play prevented:', error);
      });
    }
  }

  public playSuccess() {
    if (this.successSound && !this.isMuted) {
      this.successSound.currentTime = 0;
      this.successSound.play().catch(error => {
        console.log('Success sound play prevented:', error);
      });
    }
  }

  public playCrunch() {
    if (this.hitSound && !this.isMuted) {
      // Use hit sound with higher pitch for crunch effect
      const soundClone = this.hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.4;
      soundClone.playbackRate = 1.5; // Higher pitch for crunch
      soundClone.play().catch(error => {
        console.log('Crunch sound play prevented:', error);
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
