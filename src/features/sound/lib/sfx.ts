export type SfxName = "pop" | "tick" | "whoosh";

export interface Sfx {
  play(name: SfxName): void;
  setEnabled(on: boolean): void;
}

/**
 * Tiny synthesized UI sounds (no audio files): a soft pop for clicks, a dry
 * tick for small interactions, a filtered-noise whoosh for throws. Context is
 * created lazily on the first enabled play (post-gesture, so autoplay policy
 * is never violated) and everything routes through one master gain.
 */
export function createSfx(): Sfx {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;
  let enabled = false;
  let lastPlay = 0;

  const build = () => {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  };

  const pop = () => {
    const t = ctx!.currentTime;
    const osc = ctx!.createOscillator();
    const g = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(170, t + 0.07);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(g);
    g.connect(master!);
    osc.start(t);
    osc.stop(t + 0.1);
  };

  const tick = () => {
    const t = ctx!.currentTime;
    const src = ctx!.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx!.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 2600;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(f);
    f.connect(g);
    g.connect(master!);
    src.start(t);
    src.stop(t + 0.04);
  };

  const whoosh = () => {
    const t = ctx!.currentTime;
    const src = ctx!.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx!.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.1;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(1400, t + 0.16);
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    src.connect(f);
    f.connect(g);
    g.connect(master!);
    src.start(t);
    src.stop(t + 0.25);
  };

  return {
    play(name) {
      if (!enabled) return;
      const now = performance.now();
      if (now - lastPlay < 45) return; // rate-limit rapid-fire events
      lastPlay = now;
      if (!ctx) build();
      if (ctx!.state === "suspended") void ctx!.resume();
      if (name === "pop") pop();
      else if (name === "tick") tick();
      else whoosh();
    },
    setEnabled(on) {
      enabled = on;
    },
  };
}
