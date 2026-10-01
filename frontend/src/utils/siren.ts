// Tactical Defense Siren Synthesizer using Web Audio API

class TacticalSiren {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  constructor() {
    // Auto-unlock audio context on first user interaction anywhere in the window
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
    }
  }

  public initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Starts a continuous, pitch-sweeping tactical defense siren (wail / yelp alarm)
   * Triggered immediately when non-human objects (chargers, spoons, tools, devices, etc.) enter the screen.
   */
  public startSiren() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    // If already actively playing, ensure audio context is running and return
    if (this.isPlaying && this.oscNode) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return;
    }

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.isPlaying = true;
      const now = this.audioCtx.currentTime;

      // Primary siren sound oscillator (sharp sawtooth alarm waveform)
      this.oscNode = this.audioCtx.createOscillator();
      this.oscNode.type = 'sawtooth';
      this.oscNode.frequency.setValueAtTime(850, now);

      // Low Frequency Oscillator (LFO) to modulate pitch continuously (550Hz to 1350Hz sweep)
      this.lfoNode = this.audioCtx.createOscillator();
      this.lfoNode.type = 'sine';
      this.lfoNode.frequency.setValueAtTime(2.2, now); // 2.2 Hz continuous tactical sweep rate

      this.lfoGain = this.audioCtx.createGain();
      this.lfoGain.gain.setValueAtTime(420, now); // Modulation depth: +/- 420Hz

      this.lfoNode.connect(this.lfoGain);
      this.lfoGain.connect(this.oscNode.frequency);

      // Volume gain node (continuous tactical alarm level)
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.45, now + 0.05);

      this.oscNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.lfoNode.start(now);
      this.oscNode.start(now);
    } catch (e) {
      console.warn("Tactical Audio Siren playback error:", e);
    }
  }

  /**
   * Plays a brief test siren pulse (1.4 seconds)
   */
  public playTestSiren(durationMs: number = 1400) {
    this.stop();
    setTimeout(() => {
      this.startSiren();
      setTimeout(() => {
        this.stop();
      }, durationMs);
    }, 50);
  }

  /**
   * Stops the active siren sound smoothly
   */
  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    
    if (this.gainNode && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      } catch {
        // Ignore ramp error on quick teardown
      }
    }

    setTimeout(() => {
      if (this.oscNode) {
        try {
          this.oscNode.stop();
          this.oscNode.disconnect();
        } catch {}
        this.oscNode = null;
      }
      if (this.lfoNode) {
        try {
          this.lfoNode.stop();
          this.lfoNode.disconnect();
        } catch {}
        this.lfoNode = null;
      }
      if (this.gainNode) {
        try {
          this.gainNode.disconnect();
        } catch {}
        this.gainNode = null;
      }
    }, 70);
  }
}

export const tacticalSiren = new TacticalSiren();


