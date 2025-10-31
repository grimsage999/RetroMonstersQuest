import { logger } from './Logger';
export class SoundGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      logger.debug('Web Audio API not supported');
    }
  }

  public generateCrunchSound(): Promise<AudioBuffer | null> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve(null);
        return;
      }

      const sampleRate = this.audioContext.sampleRate;
      const duration = 0.2; // 200ms
      const length = sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate crunch sound using noise with envelope
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 8); // Exponential decay
        const noise = (Math.random() * 2 - 1) * envelope;
        
        // Add some frequency content for crunch
        const crunch = Math.sin(t * 2000 * Math.PI) * envelope * 0.3;
        
        data[i] = (noise * 0.7 + crunch) * 0.5;
      }

      resolve(buffer);
    });
  }

  public playBuffer(buffer: AudioBuffer) {
    if (!this.audioContext || !buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = 0.3;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
  }
}