// Web Audio API Cricket Sound Effects Synthesizer
// Generates sounds dynamically in the browser - no external audio file dependencies!

class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(state) {
    this.enabled = state;
    if (state) {
      this.init();
    }
  }

  // Brief clean metallic click
  playDot() {
    if (!this.enabled) return;
    this.init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Clear pleasant bell chime (C5 chord element)
  playRun() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5 note
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    osc.start();
    osc.stop(now + 0.3);
  }

  // Dual tone laser ding + crowd roar swell
  playBoundary() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    
    // 1. Play Laser Ding
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now); // A4
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // sweep up
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(554.37, now); // C#5
    osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.15); // sweep up
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);

    // 2. Play Crowd Roar (Synthesized using White Noise and bandpass filter)
    this.synthesizeCrowdRoar(now + 0.1, 1.5);
  }

  // Descending whistle + deep bass drop
  playWicket() {
    if (!this.enabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    
    // 1. Whistle Sweep Down
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.linearRampToValueAtTime(250, now + 0.4);
    
    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.start();
    osc.stop(now + 0.42);

    // 2. Bass Drop
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    
    bassOsc.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(90, now + 0.1);
    bassOsc.frequency.exponentialRampToValueAtTime(45, now + 0.6);
    
    bassGain.gain.setValueAtTime(0.3, now + 0.1);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    bassOsc.start(now + 0.1);
    bassOsc.stop(now + 0.62);
  }

  // Synthesizes crowd noise using white noise buffers
  synthesizeCrowdRoar(startTime, duration) {
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Fill random white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      // Bandpass filter to shape the noise into a "crowd cheer" frequencies
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, startTime);
      // Sweeping frequency slightly to simulate cheering dynamics
      filter.frequency.exponentialRampToValueAtTime(550, startTime + 0.4);
      filter.frequency.linearRampToValueAtTime(300, startTime + duration);
      filter.Q.value = 1.0;
      
      const gain = this.ctx.createGain();
      
      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      // Fade in and fade out
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.3); // swell up
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // fade out
      
      noiseNode.start(startTime);
      noiseNode.stop(startTime + duration + 0.1);
    } catch (e) {
      console.warn("Could not synthesize crowd audio", e);
    }
  }
}

export const soundSynth = new SoundSynth();
