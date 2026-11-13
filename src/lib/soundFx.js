// Web Audio API ambient sounds and sound effects (no external mp3 dependencies)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.currentAmbient = null;
  }

  getAudioContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play pleasant notification bell chime
  playBell() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  }

  // Play gentle alert ping
  playDing() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  // Play wave/highfive interaction chime
  playWave() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Ambient sound generator (Rain, Coffee Shop, White Noise)
  startAmbient(type = "rain", volume = 0.25) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stopAmbient();
    this.currentAmbient = type;

    // Buffer length: 2 seconds loop
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "rain") {
        // Pink-like brownian noise for rainfall
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      } else if (type === "cafe") {
        // Filtered rumble for cafe atmosphere
        lastOut = (lastOut + 0.05 * white) / 1.05;
        data[i] = lastOut * 2.0;
      } else {
        // White noise for pure focus
        data[i] = white * 0.3;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter to make sound soft & cozy
    const filter = ctx.createBiquadFilter();
    if (type === "rain") {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
    } else if (type === "cafe") {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);
    } else {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2500, ctx.currentTime);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start();
    this.ambientSource = noiseSource;
    this.ambientGain = gain;
  }

  setAmbientVolume(vol) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch (e) {}
      this.ambientSource = null;
      this.ambientGain = null;
    }
    this.currentAmbient = null;
  }
}

export const soundManager = new SoundManager();
