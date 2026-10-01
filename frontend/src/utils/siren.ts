// Tactical Defense Siren Synthesizer using Web Audio API

class TacticalSiren {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
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
   */
  public startSiren() {
    if (this.isPlaying || this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      this.isPlaying = true;
      const now = this.audioCtx.currentTime;

      // Primary siren sound oscillator (sawtooth/sine mix)
      this.oscNode = this.audioCtx.createOscillator();
      this.oscNode.type = 'sawtooth';
      this.oscNode.frequency.setValueAtTime(800, now);

      // Low Frequency Oscillator (LFO) to modulate pitch for emergency wailing effect (600Hz to 1200Hz)
      this.lfoNode = this.audioCtx.createOscillator();
      this.lfoNode.type = 'sine';
      this.lfoNode.frequency.setValueAtTime(1.8, now); // 1.8 Hz sweep rate

      this.lfoGain = this.audioCtx.createGain();
      this.lfoGain.gain.setValueAtTime(350, now); // Modulation depth: +/- 350Hz

      this.lfoNode.connect(this.lfoGain);
      this.lfoGain.connect(this.oscNode.frequency);

      // Volume gain node
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.1);

      this.oscNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.lfoNode.start(now);
      this.oscNode.start(now);
    } catch (e) {
      console.warn("Audio siren playback error:", e);
    }
  }

  /**
   * Plays a brief test siren pulse (1.2 seconds)
   */
  public playTestSiren(durationMs: number = 1400) {
    this.startSiren();
    setTimeout(() => {
      this.stop();
    }, durationMs);
  }

  /**
   * Stops the active siren sound smoothly
   */
  public stop() {
    this.isPlaying = false;
    if (this.gainNode && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
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
    }, 90);
  }
}

export const tacticalSiren = new TacticalSiren();
