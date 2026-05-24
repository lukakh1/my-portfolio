export interface Ambient {
  start(): void;
  stop(): void;
}

/**
 * A soft, generative ambient pad built with the Web Audio API (no audio files):
 * a low A-major chord through a slow-sweeping lowpass filter. Kept very quiet and
 * faded in/out. Created lazily and only ever started after a user gesture.
 */
export function createAmbient(): Ambient {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;

  const build = () => {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    filter.Q.value = 0.7;
    filter.connect(master);

    const freqs = [110, 164.81, 220, 277.18]; // A2 · E3 · A3 · C#4
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 8;
      const g = ctx!.createGain();
      g.gain.value = 0.25 / freqs.length;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 240;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  };

  return {
    start() {
      if (!ctx) build();
      if (ctx!.state === "suspended") void ctx!.resume();
      const t = ctx!.currentTime;
      master!.gain.cancelScheduledValues(t);
      master!.gain.linearRampToValueAtTime(0.05, t + 2.5);
    },
    stop() {
      if (!ctx || !master) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.linearRampToValueAtTime(0, t + 0.6);
    },
  };
}
