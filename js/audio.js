// Deckstorm — tiny WebAudio retro sound engine (no assets, all synthesized)
const AudioFX = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur = 0.08, type = "square", vol = 0.12, delay = 0, slideTo = 0) {
    const c = ac();
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const sfx = {
    click()    { tone(660, .05, "square", .08); },
    select()   { tone(880, .06, "square", .09); },
    deselect() { tone(520, .06, "square", .08); },
    deal()     { tone(380 + Math.random() * 120, .05, "triangle", .07); },
    play()     { tone(330, .09, "square", .1); tone(495, .09, "square", .1, .07); tone(660, .14, "square", .11, .14); },
    discard()  { tone(300, .08, "sawtooth", .07, 0, 180); },
    coin()     { tone(988, .06, "square", .1); tone(1319, .14, "square", .1, .07); },
    score()    { tone(740, .05, "triangle", .1); },
    joker()    { tone(1047, .06, "square", .09); tone(1568, .08, "square", .07, .05); },
    error()    { tone(150, .14, "sawtooth", .12, 0, 110); },
    win()      { [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, "square", .12, i * .11)); },
    lose()     { [392, 330, 262, 196].forEach((f, i) => tone(f, .16, "sawtooth", .1, i * .13)); },
    levelup()  { [440, 554, 659].forEach((f, i) => tone(f, .09, "triangle", .11, i * .06)); },
    tarot()    { tone(523, .1, "triangle", .1); tone(392, .12, "triangle", .09, .08); tone(659, .14, "triangle", .09, .16); },
    pack()     { tone(220, .06, "sawtooth", .09); tone(440, .07, "square", .1, .06); tone(880, .1, "square", .1, .12); },
  };

  return {
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    play(name) { if (enabled && sfx[name]) { try { sfx[name](); } catch (e) { /* audio unavailable */ } } },
  };
})();
