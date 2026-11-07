/**
 * Ultra-Premium DJ Audio Engine
 * Powered by HTML5 Audio API & Web Audio API (AnalyserNode, 3-Band EQ, Resonant DJ Filter)
 * Plays ONLY real uploaded audio files (WAV, MP3, FLAC, M4A, OGG) with pristine quality preservation.
 */

export interface AudioMetrics {
  bass: number;       // 0.0 - 1.0 (sub + bass range 20Hz - 250Hz)
  mid: number;        // 0.0 - 1.0 (vocal & synth range 250Hz - 4kHz)
  treble: number;     // 0.0 - 1.0 (highs & cymbals 4kHz - 16kHz)
  energy: number;     // 0.0 - 1.0 (overall weighted RMS energy)
  beatDetected: boolean;
  peakValue: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  
  // 3-Band DJ Equalizer Nodes
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private djFilter: BiquadFilterNode | null = null; // Master resonant DJ filter knob

  // Analyser buffers
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;
  private lastBassValue = 0;
  private beatThreshold = 0.65;
  private lastBeatTime = 0;

  // Listeners
  private onTimeUpdateCallbacks: Set<(currentTime: number) => void> = new Set();
  private onEndedCallbacks: Set<() => void> = new Set();
  private onErrorCallbacks: Set<(err: any) => void> = new Set();
  private onStateChangeCallbacks: Set<(isPlaying: boolean) => void> = new Set();

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.audioElement = new Audio();
    // Do not force crossOrigin on local / same-origin audio; set dynamically per URL
    this.audioElement.preload = 'auto';
    this.audioElement.setAttribute('playsinline', 'true');
    this.audioElement.setAttribute('webkit-playsinline', 'true');

    // Unlock Web Audio context on first touch for iOS Safari & mobile Chrome
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('pointerdown', unlockAudio);
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
      window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
    }

    // Hook audio events
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.onTimeUpdateCallbacks.forEach(cb => cb(this.audioElement!.currentTime));
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.onEndedCallbacks.forEach(cb => cb());
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error on track source:', e);
      if (this.audioElement && this.audioElement.crossOrigin) {
        console.info('Attempting fallback audio playback without crossOrigin...');
        this.audioElement.removeAttribute('crossOrigin');
        const currentSrc = this.audioElement.src;
        if (currentSrc) {
          this.audioElement.src = currentSrc;
          this.audioElement.load();
          this.audioElement.play().then(() => {
            this.notifyStateChange(true);
          }).catch(err => {
            console.warn('Fallback playback failed:', err);
            this.onErrorCallbacks.forEach(cb => cb(e));
            this.notifyStateChange(false);
          });
          return;
        }
      }
      this.onErrorCallbacks.forEach(cb => cb(e));
      this.notifyStateChange(false);
    });

    // Create Audio Nodes
    try {
      this.sourceNode = this.ctx.createMediaElementSource(this.audioElement);
    } catch (e) {
      console.warn('MediaElementSource already created or CORS limitation:', e);
    }

    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 512;
    this.analyserNode.smoothingTimeConstant = 0.82;

    this.freqData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.gainNode = this.ctx.createGain();

    // 3-Band DJ EQ
    this.lowFilter = this.ctx.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 250;

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1200;
    this.midFilter.Q.value = 1.0;

    this.highFilter = this.ctx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 5000;

    // Resonant Filter Knob (DJ Filter)
    this.djFilter = this.ctx.createBiquadFilter();
    this.djFilter.type = 'allpass';

    // Connect node graph: Source -> LowEQ -> MidEQ -> HighEQ -> DJFilter -> Analyser -> Gain -> Destination
    if (this.sourceNode) {
      this.sourceNode
        .connect(this.lowFilter)
        .connect(this.midFilter)
        .connect(this.highFilter)
        .connect(this.djFilter)
        .connect(this.analyserNode)
        .connect(this.gainNode)
        .connect(this.ctx.destination);
    }
  }

  public async resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public async loadAndPlay(url: string, bpm: number = 128) {
    if (!url) return;
    await this.resume();

    if (!this.audioElement) return;

    // Apply CORS dynamically: only external cross-origin URLs need anonymous CORS
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    const isDifferentOrigin = isExternal && typeof window !== 'undefined' && !url.startsWith(window.location.origin);

    if (isDifferentOrigin) {
      this.audioElement.crossOrigin = 'anonymous';
    } else {
      this.audioElement.removeAttribute('crossOrigin');
    }

    const currentSrc = this.audioElement.src || '';
    const isSame = currentSrc === url || (url.startsWith('/') && currentSrc.endsWith(url));

    if (!isSame) {
      this.audioElement.src = url;
      this.audioElement.load();
    }

    try {
      await this.audioElement.play();
      this.notifyStateChange(true);
    } catch (err) {
      console.warn('Playback gesture required or blocked:', err);
      this.notifyStateChange(false);
    }
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.notifyStateChange(false);
  }

  public async play(fallbackUrl?: string) {
    await this.resume();
    if (!this.audioElement) return;

    if (fallbackUrl && (!this.audioElement.src || this.audioElement.src === '')) {
      await this.loadAndPlay(fallbackUrl);
      return;
    }

    if (!this.audioElement.src || this.audioElement.src === '') {
      console.warn('AudioEngine: No audio source loaded to play.');
      this.notifyStateChange(false);
      return;
    }

    try {
      await this.audioElement.play();
      this.notifyStateChange(true);
    } catch (e) {
      console.warn('Cannot resume playback:', e);
      this.notifyStateChange(false);
    }
  }

  public getCurrentSrc(): string {
    return this.audioElement?.src || '';
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public seek(seconds: number) {
    if (this.audioElement && isFinite(seconds)) {
      this.audioElement.currentTime = Math.max(0, seconds);
    }
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  // 3-Band Equalizer Controls (-12dB to +12dB)
  public setEQ(low: number, mid: number, high: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.lowFilter) this.lowFilter.gain.setTargetAtTime(low, now, 0.05);
    if (this.midFilter) this.midFilter.gain.setTargetAtTime(mid, now, 0.05);
    if (this.highFilter) this.highFilter.gain.setTargetAtTime(high, now, 0.05);
  }

  // DJ Filter Knob (-100 = full lowpass sweep, 0 = neutral, +100 = full highpass sweep)
  public setDJFilter(value: number) {
    if (!this.ctx || !this.djFilter) return;
    const now = this.ctx.currentTime;
    if (Math.abs(value) < 5) {
      this.djFilter.type = 'allpass';
      return;
    }
    if (value < 0) {
      this.djFilter.type = 'lowpass';
      const freq = 300 + ((value + 100) / 95) * 17700;
      this.djFilter.frequency.setTargetAtTime(freq, now, 0.05);
      this.djFilter.Q.setTargetAtTime(2.5, now, 0.05);
    } else {
      this.djFilter.type = 'highpass';
      const freq = 40 + ((value - 5) / 95) * 3960;
      this.djFilter.frequency.setTargetAtTime(freq, now, 0.05);
      this.djFilter.Q.setTargetAtTime(2.5, now, 0.05);
    }
  }

  // Performance Sound FX Triggers
  public triggerCueFX(type: 'sub-drop' | 'airhorn' | 'laser' | 'scratch') {
    this.resume();
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;

    if (type === 'sub-drop') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      osc.connect(gain);
      gain.connect(this.analyserNode || this.gainNode);
      osc.start(now);
      osc.stop(now + 1.3);
    } else if (type === 'laser') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.analyserNode || this.gainNode);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'scratch') {
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.25), this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(2400, now + 0.12);
      filter.frequency.linearRampToValueAtTime(600, now + 0.25);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.analyserNode || this.gainNode);
      whiteNoise.start(now);
      whiteNoise.stop(now + 0.25);
    }
  }

  // Real-time Visualizer Audio Analysis Data
  public getByteFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(256);
    }
    if (!this.freqData || this.freqData.length !== this.analyserNode.frequencyBinCount) {
      this.freqData = new Uint8Array(this.analyserNode.frequencyBinCount);
    }
    this.analyserNode.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  public getByteTimeDomainData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(256);
    }
    if (!this.timeData || this.timeData.length !== this.analyserNode.frequencyBinCount) {
      this.timeData = new Uint8Array(this.analyserNode.frequencyBinCount);
    }
    this.analyserNode.getByteTimeDomainData(this.timeData);
    return this.timeData;
  }

  public getAudioMetrics(): AudioMetrics {
    const data = this.getByteFrequencyData();
    const len = data.length;
    if (len === 0) {
      return { bass: 0, mid: 0, treble: 0, energy: 0, beatDetected: false, peakValue: 0 };
    }

    let bassSum = 0;
    const bassBins = Math.min(6, len);
    for (let i = 0; i < bassBins; i++) {
      bassSum += data[i];
    }
    const bass = bassSum / (bassBins * 255);

    let midSum = 0;
    const midBins = Math.min(36, len);
    for (let i = bassBins; i < midBins; i++) {
      midSum += data[i];
    }
    const mid = midSum / ((midBins - bassBins) * 255);

    let trebleSum = 0;
    const trebleBins = Math.min(128, len);
    for (let i = midBins; i < trebleBins; i++) {
      trebleSum += data[i];
    }
    const treble = trebleSum / ((trebleBins - midBins) * 255);

    const energy = bass * 0.5 + mid * 0.35 + treble * 0.15;

    // Beat Detection: Spike in bass with threshold & cooldown
    const now = performance.now();
    let beatDetected = false;
    if (bass > this.beatThreshold && (bass - this.lastBassValue) > 0.15 && (now - this.lastBeatTime) > 280) {
      beatDetected = true;
      this.lastBeatTime = now;
    }
    this.lastBassValue = bass;

    let peakValue = 0;
    for (let i = 0; i < len; i++) {
      if (data[i] > peakValue) peakValue = data[i];
    }

    return {
      bass,
      mid,
      treble,
      energy,
      beatDetected,
      peakValue: peakValue / 255
    };
  }

  public getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public getDuration(): number {
    return this.audioElement ? (this.audioElement.duration || 0) : 0;
  }

  public onTimeUpdate(callback: (t: number) => void) {
    this.onTimeUpdateCallbacks.add(callback);
    return () => this.onTimeUpdateCallbacks.delete(callback);
  }

  public onEnded(callback: () => void) {
    this.onEndedCallbacks.add(callback);
    return () => this.onEndedCallbacks.delete(callback);
  }

  public onStateChange(callback: (isPlaying: boolean) => void) {
    this.onStateChangeCallbacks.add(callback);
    return () => this.onStateChangeCallbacks.delete(callback);
  }

  public onError(callback: (err: any) => void) {
    this.onErrorCallbacks.add(callback);
    return () => this.onErrorCallbacks.delete(callback);
  }

  private notifyStateChange(isPlaying: boolean) {
    this.onStateChangeCallbacks.forEach(cb => cb(isPlaying));
  }
}

export const audioEngine = new AudioEngine();
