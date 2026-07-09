// Web Audio API sound effects — no audio files needed

function getCtx() {
  if (!window._apAudioCtx) {
    window._apAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._apAudioCtx;
}

// Electric spark / zap — plays when a Spark is sent or received
export function playSparkSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.18, now);
    master.connect(ctx.destination);

    // Layer 1: white noise burst (the "crackle")
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.5);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2400, now);
    noiseFilter.frequency.linearRampToValueAtTime(800, now + 0.12);
    noiseFilter.Q.value = 1.2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);

    // Layer 2: sharp pitch sweep (the "zap" tone)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(now);
    osc.stop(now + 0.15);

    // Layer 3: high "snap" transient at the very start
    const snap = ctx.createOscillator();
    snap.type = 'square';
    snap.frequency.setValueAtTime(3200, now);
    snap.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.4, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    snap.connect(snapGain);
    snapGain.connect(master);
    snap.start(now);
    snap.stop(now + 0.05);
  } catch (_) {
    // AudioContext blocked or unavailable — silently skip
  }
}

// Lightning strike + triumphant chord — plays when a connection match celebration opens
export function playConnectedSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Thunder crack: low rumble + bright crackle, bigger than the spark zap
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.22, now);
    master.connect(ctx.destination);

    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    noiseFilter.Q.value = 0.9;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);

    const rumble = ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(70, now);
    rumble.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.6, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    rumble.connect(rumbleGain);
    rumbleGain.connect(master);
    rumble.start(now);
    rumble.stop(now + 0.4);

    // Triumphant ascending major chord, arriving as the reveal happens
    const chordStart = now + 0.55;
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.16, chordStart);
    chordGain.connect(ctx.destination);
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => { // C5 E5 G5 C6
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const t = chordStart + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.7, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(gain);
      gain.connect(chordGain);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  } catch (_) {
    // AudioContext blocked or unavailable — silently skip
  }
}

// Soft two-tone ding — plays for messages, likes, milestones
export function playDingSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.14, now);
    master.connect(ctx.destination);

    const notes = [880, 1108]; // A5 → C#6 — pleasant minor third
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.8, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.56);
    });
  } catch (_) {
    // silently skip
  }
}
