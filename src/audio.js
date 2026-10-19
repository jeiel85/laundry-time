// All sounds are synthesized locally; no audio file or network request is used.
export class LaundryAudio {
  constructor() { this.enabled = false; this.active = false; this.context = null; }

  async enable(value) {
    this.enabled = value;
    if (value) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('이 브라우저에서는 소리를 지원하지 않아요.');
      if (!this.context) this.createContext(AudioContext);
      await this.context.resume();
    }
    this.setRunning(this.active);
  }

  createContext(AudioContext) {
    const ctx = this.context = new AudioContext();
    this.volume = ctx.createGain();
    this.volume.gain.value = 0;
    this.volume.connect(ctx.destination);
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < samples.length; i++) {
      previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
      samples[i] = previous * 4;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    noise.connect(filter).connect(this.volume);
    noise.start();
    const motor = ctx.createOscillator();
    motor.type = 'sine';
    motor.frequency.value = 62;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    motor.connect(gain).connect(this.volume);
    motor.start();
    const wobble = ctx.createOscillator();
    const wobbleGain = ctx.createGain();
    wobble.frequency.value = 1.6;
    wobbleGain.gain.value = 0.04;
    wobble.connect(wobbleGain).connect(gain.gain);
    wobble.start();
  }

  setRunning(value) {
    this.active = value;
    if (this.context) this.volume.gain.setTargetAtTime(this.enabled && value ? 0.15 : 0, this.context.currentTime, 0.35);
  }

  chime() {
    if (!this.context || !this.enabled) return;
    [659.25, 783.99, 987.77].forEach((frequency, i) => {
      const ctx = this.context;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.18;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.85);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.9);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
}
