// ═══════════════ DECKSTORM v2 — full Balatro-faithful core ═══════════════
"use strict";
const HAND_SIZE = 8, MAX_SELECT = 5, MAX_JOKERS = 5, MAX_CONS = 2;
const ANTE_TARGETS = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
const SUIT_CLASS = { hearts: "red", diamonds: "red", spades: "black", clubs: "black" };
const $ = s => document.querySelector(s);

// ── pixel-art suits (fine-grained 11-13px grids → smooth look) ──
const SUIT_PIXELS = {
  hearts: [
    "..###...###..",
    ".#####.#####.",
    "#############",
    "#############",
    "#############",
    ".###########.",
    "..#########..",
    "...#######...",
    "....#####....",
    ".....###.....",
    "......#......",
  ],
  diamonds: [
    ".....#.....",
    "....###....",
    "...#####...",
    "..#######..",
    ".#########.",
    "###########",
    ".#########.",
    "..#######..",
    "...#####...",
    "....###....",
    ".....#.....",
  ],
  spades: [
    "......#......",
    ".....###.....",
    "....#####....",
    "...#######...",
    "..#########..",
    ".###########.",
    "#############",
    "#############",
    ".##.#####.##.",
    "......#......",
    ".....###.....",
    "....#####....",
  ],
  clubs: [
    ".....###.....",
    "....#####....",
    "....#####....",
    ".####.#.####.",
    ".###########.",
    ".###########.",
    "..##.###.##..",
    "......#......",
    ".....###.....",
    "....#####....",
  ],
};
const SUIT_COLOR = { hearts: "#E23C50", diamonds: "#E23C50", spades: "#2B2B3A", clubs: "#2B2B3A" };

function pixelSVG(grid, fill) {
  const h = grid.length, w = grid[0].length;
  let rects = "";
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++)
      if (row[x] === "#") rects += `<rect x='${x}' y='${y}' width='1' height='1'/>`;
  });
  return `<svg viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges' fill='${fill}' aria-hidden='true'>${rects}</svg>`;
}
function suitSVG(suit) { return pixelSVG(SUIT_PIXELS[suit], SUIT_COLOR[suit]); }

// ── settings (persisted; storage-safe) ──
const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
const settings = Object.assign({ sound: true, anim: true },
  store ? JSON.parse(store.getItem("deckstorm.settings") || "{}") : {});
function saveSettings() { if (store) store.setItem("deckstorm.settings", JSON.stringify(settings)); }
function applySettings() {
  AudioFX.enabled = settings.sound;
  document.body.classList.toggle("reduced", !settings.anim);
  $("#set-sound").textContent = settings.sound ? "ON" : "OFF";
  $("#set-sound").classList.toggle("off", !settings.sound);
  $("#set-anim").textContent = settings.anim ? "ON" : "OFF";
  $("#set-anim").classList.toggle("off", !settings.anim);
}

// ── state ──
let S = null;
let sortMode = "rank";
let currentScreen = "menu";

function freshState() {
  return {
    ante: 1, blindIndex: 0, money: 4,
    jokers: [], consumables: [], vouchers: new Set(),
    deck: [], deckTotal: 52, hand: [], selected: new Set(), freshIds: new Set(),
    handsLeft: 0, discardsLeft: 0, roundScore: 0,
    handLevels: {}, // handName -> level
    stats: { planetsUsed: 0, tarotsUsed: 0, planetCounts: {} },
    lastConsumable: null,
    boss: null,
    phase: "play", animating: false,
    offers: [], packs: [], voucherOffer: null,
    rerollCost: 5,
    targetMode: null, // { cons } while selecting cards for a tarot
    packOpen: null,   // { pack, choices }
  };
}
function handLevel(name) {
  return S.handLevels[name === "Royal Flush" ? "Straight Flush" : name] || 1;
}
function handValue(name) {
  const key = name === "Royal Flush" ? "Straight Flush" : name;
  const base = HAND_BASE[name];
  const lvl = handLevel(name);
  if (lvl === 1) return { chips: base.chips, mult: base.mult };
  const planet = PLANETS.find(p => p.hand === key);
  return {
    chips: base.chips + planet.chips * (lvl - 1),
    mult: base.mult + planet.mult * (lvl - 1),
  };
}
const handSize = () => HAND_SIZE + (S.vouchers.has("paintbrush") ? 1 : 0) + (S.boss && S.boss.id === "manacle" ? -1 : 0);
const maxHands = () => 4 + (S.vouchers.has("grabber") ? 1 : 0);
const maxDiscards = () => 3 + (S.vouchers.has("wasteful") ? 1 : 0);
const interestCap = () => S.vouchers.has("seedmoney") ? 10 : 5;
const priceOf = item => {
  let p = item.cost + (item.edition ? EDITIONS[item.edition].priceAdd : 0);
  if (S.vouchers.has("clearance")) p = Math.ceil(p * 0.75);
  return p;
};
const isBossDebuffed = c => S.boss && S.boss.debuffSuit && c.suit === S.boss.debuffSuit && c.enhancement !== "wild" && c.enhancement !== "stone";

// ── save / continue (localStorage, autosave on every state change) ──
const SAVE_KEY = "deckstorm.save";
function serializeRun() {
  return {
    v: 3, sortMode,
    ante: S.ante, blindIndex: S.blindIndex, money: S.money,
    roundScore: S.roundScore, handsLeft: S.handsLeft, discardsLeft: S.discardsLeft,
    phase: S.phase === "shop" ? "shop" : "play",
    rerollCost: S.rerollCost, deckTotal: S.deckTotal,
    deck: S.deck, hand: S.hand,
    handLevels: S.handLevels, stats: S.stats,
    bossId: S.boss ? S.boss.id : null,
    vouchers: [...S.vouchers],
    jokers: S.jokers.map(j => ({ id: j.id, edition: j.edition, data: j.data || null, sellBonus: j.sellBonus || 0 })),
    consumables: S.consumables.map(c => ({ id: c.id, kind: c.kind })),
    offers: S.offers.map(j => ({ id: j.id, edition: j.edition, data: j.data || null, sellBonus: j.sellBonus || 0 })),
    packs: S.packs.map(p => p.id),
    voucherOfferId: S.voucherOffer ? S.voucherOffer.id : null,
    lastConsumable: S.lastConsumable ? { id: S.lastConsumable.id, kind: S.lastConsumable.kind } : null,
  };
}
function saveGame() {
  if (!store || !S || S.phase === "over" || S.phase === "win" || S.targetMode) return;
  try { store.setItem(SAVE_KEY, JSON.stringify(serializeRun())); } catch (e) {}
}
function hasSave() {
  if (!store) return false;
  try { return !!store.getItem(SAVE_KEY); } catch (e) { return false; }
}
function clearSave() { if (store) try { store.removeItem(SAVE_KEY); } catch (e) {} }

function rehydrateJoker(s) {
  const def = JOKERS.find(j => j.id === s.id);
  if (!def) return null;
  const j = makeJoker(def, s.edition);
  if (s.data) j.data = s.data;
  if (s.sellBonus) j.sellBonus = s.sellBonus;
  return j;
}
function rehydrateCons(s) {
  const def = (s.kind === "planet" ? PLANETS : TAROTS).find(x => x.id === s.id);
  return def ? { ...def } : null;
}

function loadGame() {
  let d;
  try { d = JSON.parse(store.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!d || d.v !== 3) return false;
  S = freshState();
  sortMode = d.sortMode || "rank";
  Object.assign(S, {
    ante: d.ante, blindIndex: d.blindIndex, money: d.money,
    roundScore: d.roundScore, handsLeft: d.handsLeft, discardsLeft: d.discardsLeft,
    phase: d.phase, rerollCost: d.rerollCost, deckTotal: d.deckTotal,
    deck: d.deck, hand: d.hand, handLevels: d.handLevels, stats: d.stats,
  });
  S.vouchers = new Set(d.vouchers || []);
  S.jokers = (d.jokers || []).map(rehydrateJoker).filter(Boolean);
  S.consumables = (d.consumables || []).map(rehydrateCons).filter(Boolean);
  S.offers = (d.offers || []).map(rehydrateJoker).filter(Boolean);
  S.packs = (d.packs || []).map(id => ({ ...PACKS.find(p => p.id === id) })).filter(p => p.id);
  S.voucherOffer = d.voucherOfferId ? VOUCHERS.find(v => v.id === d.voucherOfferId) : null;
  S.lastConsumable = d.lastConsumable ? rehydrateCons(d.lastConsumable) : null;
  S.boss = d.bossId ? BOSSES.find(b => b.id === d.bossId) : null;

  if (S.phase === "shop") {
    showScreen("shop");
    renderShop();
    renderHud();
    renderJokers();
  } else {
    renderBossBanner();
    showScreen("game");
    renderAll();
  }
  return true;
}

// ── screens ──
function showScreen(name) {
  currentScreen = name;
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  $("#screen-" + name).classList.add("active");
  if (name === "menu") {
    const btn = $("#btn-continue");
    let label = null;
    if (hasSave()) {
      try {
        const d = JSON.parse(store.getItem(SAVE_KEY));
        if (d && d.v === 3) label = `↻ Continue — Ante ${d.ante}`;
      } catch (e) {}
    }
    btn.hidden = !label;
    if (label) btn.textContent = label;
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ── run / blind flow ──
function newRun() {
  S = freshState();
  sortMode = "rank";
  startBlind();
}

function blindTarget() {
  const base = ANTE_TARGETS[S.ante - 1];
  const mult = S.blindIndex === 0 ? 1 : S.blindIndex === 1 ? 1.5 : S.boss.targetMult;
  return Math.round(base * mult);
}
function blindName() {
  return S.blindIndex === 2 ? S.boss.name : (S.blindIndex === 0 ? "Small Blind" : "Big Blind");
}
function blindReward() { return S.blindIndex === 2 ? 5 : S.blindIndex === 1 ? 4 : 3; }

function startBlind() {
  S.phase = "play";
  S.animating = false;
  S.deck = shuffle(buildDeck());
  S.deckTotal = S.deck.length;
  S.hand = [];
  S.selected.clear();
  S.freshIds.clear();
  S.targetMode = null;
  S.roundScore = 0;
  S.boss = null;
  if (S.blindIndex === 2) S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];

  S.handsLeft = S.boss && S.boss.id === "needle" ? 1 : maxHands();
  S.discardsLeft = S.boss && S.boss.id === "water" ? 0 : maxDiscards();

  drawUp();

  // joker blind-start hooks
  S.jokers.forEach(j => {
    if (j.onBlindStart) {
      const msg = j.onBlindStart(j, S);
      if (msg) showToast(msg);
    }
  });

  $("#played-zone").innerHTML = "";
  setPlayedInfo("");
  renderBossBanner();
  showScreen("game");
  renderAll();
}

function nextBlind() {
  AudioFX.play("click");
  if (S.blindIndex === 2) {
    S.ante++;
    S.blindIndex = 0;
    if (S.ante > 8) return winRun();
  } else {
    S.blindIndex++;
  }
  startBlind();
}

// ── drawing / sorting ──
function drawUp() {
  const need = handSize() - S.hand.length;
  if (need <= 0) return;
  const drawn = S.deck.splice(0, need);
  drawn.forEach(c => S.freshIds.add(c.id));
  S.hand.push(...drawn);
  sortHand();
}
function sortHand() {
  const suitOrder = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
  S.hand.sort((a, b) => sortMode === "rank"
    ? b.rank - a.rank || suitOrder[a.suit] - suitOrder[b.suit]
    : suitOrder[a.suit] - suitOrder[b.suit] || b.rank - a.rank);
}

// ── scoring pipeline ──
function liveEval() {
  if (!S || S.selected.size === 0) return null;
  return evaluateHand(S.hand.filter(c => S.selected.has(c.id)));
}

function scorePlayed() {
  const played = S.hand.filter(c => S.selected.has(c.id));
  const ev = evaluateHand(played);
  const hv = handValue(ev.name);
  let chips = hv.chips, mult = hv.mult;
  const scoringCards = played.filter(c => ev.scoringIds.has(c.id));
  const heldCards = S.hand.filter(c => !S.selected.has(c.id));
  const destroyed = [];
  const flashes = [];
  let firstScoringFace = false, sawFace = false, debuffedCount = 0;

  // 1. per-card triggers (Balatro order: each scoring card, left to right)
  scoringCards.forEach(c => {
    if (isBossDebuffed(c)) { debuffedCount++; return; } // debuffed: no chips, no effects
    chips += cardChips(c);
    if (isFace(c)) { if (!sawFace) firstScoringFace = true; sawFace = true; }
    switch (c.enhancement) {
      case "bonus": chips += 30; break;
      case "mult": mult += 4; break;
      case "glass":
        mult *= 2;
        if (Math.random() < 0.25) destroyed.push(c);
        break;
      case "lucky":
        if (Math.random() < 1 / 5) mult += 20;
        if (Math.random() < 1 / 15) S.money += 20;
        break;
    }
  });
  ev.scoringFacePlayed = sawFace;
  if (sawFace) ev.firstFaceUsed = firstScoringFace;

  // 2. steel cards held in hand: ×1.5 each
  heldCards.forEach(c => { if (c.enhancement === "steel") mult *= 1.5; });

  // 3. jokers, left to right (editions included)
  const ctx = () => ({
    handName: ev.name,
    scoringCards: scoringCards.filter(c => !isBossDebuffed(c)),
    playedCards: played, heldCards,
    discardsLeft: S.discardsLeft, handsLeft: S.handsLeft,
    deckCount: S.deck.length, stats: S.stats, money: S.money,
    emptySlots: MAX_JOKERS - S.jokers.length,
    firstScoringFace,
  });
  S.jokers.forEach((j, idx) => {
    let label = null;
    const r = j.effect ? j.effect(ctx()) : { mult: 4 };
    if (r) {
      if (r.chips) chips += r.chips;
      if (r.mult) mult += r.mult;
      if (r.xmult) mult *= r.xmult;
      if (r.money) S.money += r.money;
      label = r.label;
    }
    if (j.edition === "foil") chips += 50;
    if (j.edition === "holo") mult += 10;
    if (j.edition === "poly") mult *= 1.5;
    if (label || j.edition) flashes.push({ idx, label: label || EDITIONS[j.edition].desc });
  });

  return { ev, chips, mult, total: Math.max(1, Math.round(chips * mult)), flashes, destroyed, debuffedCount, scoringCards };
}

// ── animation helpers ──
function flipMove(el, parent) {
  if (!settings.anim) { parent.appendChild(el); return; }
  const first = el.getBoundingClientRect();
  parent.appendChild(el);
  const last = el.getBoundingClientRect();
  el.style.transition = "none";
  el.style.transform = `translate(${first.left - last.left}px, ${first.top - last.top}px)`;
  requestAnimationFrame(() => {
    el.style.transition = "transform .38s cubic-bezier(.22,1,.36,1)";
    el.style.transform = "";
  });
}
function wait(ms) { return new Promise(r => setTimeout(r, settings.anim ? ms : Math.min(ms, 30))); }
function fmtMult(m) { return m % 1 === 0 ? String(m) : m.toFixed(1); }

// ── play hand ──
async function playHand() {
  if (!S || S.phase !== "play" || S.animating || S.targetMode) return;
  if (S.selected.size === 0 || S.handsLeft <= 0) { AudioFX.play("error"); shakeEl($("#btn-play")); return; }
  if (S.boss && S.boss.id === "psychic" && S.selected.size !== 5) {
    showToast("The Psychic: must play exactly 5 cards");
    AudioFX.play("error");
    shakeEl($("#btn-play"));
    return;
  }
  S.animating = true;
  refreshControls();
  AudioFX.play("play");

  const result = scorePlayed();
  S.handsLeft--;
  S.stats.handsPlayed = S.stats.handsPlayed || {};

  // move cards to staging
  const zone = $("#played-zone");
  zone.innerHTML = "";
  const els = [...document.querySelectorAll("#hand .card")].filter(el => S.selected.has(el.dataset.id));
  els.forEach(el => { el.classList.remove("selected"); el.disabled = true; flipMove(el, zone); });

  const t = settings.anim;
  await wait(t ? 400 : 30);

  // breakdown
  setPlayedInfo(`<span class="pi-name">${result.ev.name} · Lv.${handLevel(result.ev.name)}</span><span class="pi-chips">${result.chips}</span> × <span class="pi-mult">${fmtMult(result.mult)}</span>`);
  AudioFX.play("score");
  if (result.debuffedCount) showToast(`${result.debuffedCount} card(s) debuffed by ${S.boss.name}`);
  await wait(t ? 350 : 30);

  // joker flashes
  for (const f of result.flashes) {
    const tile = document.querySelectorAll("#jokers .joker")[f.idx];
    if (tile) {
      tile.classList.remove("flash");
      void tile.offsetWidth;
      tile.classList.add("flash");
      const pop = document.createElement("span");
      pop.className = "jpop";
      pop.textContent = f.label;
      tile.appendChild(pop);
      setTimeout(() => pop.remove(), 950);
      AudioFX.play("joker");
    }
    await wait(t ? 160 : 0);
  }

  // score
  const prevScore = S.roundScore;
  S.roundScore += result.total;
  spawnScorePop(`+${result.total.toLocaleString()}`);
  renderHud(true);
  countUp($("#hud-score"), prevScore, S.roundScore, t ? 550 : 30);
  await wait(t ? 600 : 30);

  // cleanup
  els.forEach(el => el.classList.add("played-out"));
  await wait(t ? 260 : 30);
  zone.innerHTML = "";
  setPlayedInfo("");

  // glass destruction
  if (result.destroyed.length) {
    const ids = new Set(result.destroyed.map(c => c.id));
    S.deck = S.deck.filter(c => !ids.has(c.id));
    S.deckTotal -= result.destroyed.length;
    showToast(`${result.destroyed.length} Glass card(s) shattered!`);
  }

  S.hand = S.hand.filter(c => !S.selected.has(c.id));
  S.selected.clear();
  drawUp();

  // joker per-hand hooks (green, bus, ice cream, gros michel)
  S.jokers.slice().forEach(j => {
    if (j.onHandPlayed) j.onHandPlayed(j, result.ev, S);
    if (j.id === "gros" && Math.random() < 1 / 6) {
      S.jokers = S.jokers.filter(x => x !== j);
      showToast("Gros Michel went extinct!");
    }
  });

  // The Hook: discard 2 random held cards
  if (S.boss && S.boss.id === "hook" && S.hand.length > 0) {
    const pool = [...S.hand];
    shuffle(pool).slice(0, 2).forEach(c => { S.hand = S.hand.filter(x => x !== c); });
    drawUp();
    showToast("The Hook discarded 2 cards");
  }

  renderAll();
  S.animating = false;
  refreshControls();

  if (S.roundScore >= blindTarget()) return setTimeout(endRoundWin, settings.anim ? 500 : 30);
  if (S.handsLeft <= 0) return setTimeout(gameOver, settings.anim ? 500 : 30);
}

// ── discard ──
async function discardHand() {
  if (!S || S.phase !== "play" || S.animating || S.targetMode) return;
  if (S.selected.size === 0 || S.discardsLeft <= 0) { AudioFX.play("error"); shakeEl($("#btn-discard")); return; }
  S.animating = true;
  refreshControls();
  AudioFX.play("discard");
  S.discardsLeft--;

  const els = [...document.querySelectorAll("#hand .card")].filter(el => S.selected.has(el.dataset.id));
  els.forEach((el, i) => {
    el.disabled = true;
    el.style.animationDelay = (settings.anim ? i * 45 : 0) + "ms";
    el.classList.add("discard-out");
  });
  await wait(settings.anim ? 300 + els.length * 45 : 30);

  S.hand = S.hand.filter(c => !S.selected.has(c.id));
  S.selected.clear();
  drawUp();
  S.jokers.forEach(j => { if (j.onDiscard) j.onDiscard(j, S); });
  renderAll();
  S.animating = false;
  refreshControls();
  AudioFX.play("deal");
}

// ── consumables (planets & tarots) ──
function useConsumable(cons, sel) {
  if (cons.kind === "planet") {
    const key = cons.hand === "Royal Flush" ? "Straight Flush" : cons.hand;
    S.handLevels[key] = (S.handLevels[key] || 1) + 1;
    S.stats.planetsUsed++;
    S.stats.planetCounts[cons.hand] = (S.stats.planetCounts[cons.hand] || 0) + 1;
    showToast(`${cons.hand} → Lv.${S.handLevels[key]} (+${cons.chips} chips, +${cons.mult} mult)`);
    AudioFX.play("levelup");
    S.lastConsumable = cons;
    return true;
  }
  // tarot
  const r = cons.apply(S, sel || []);
  if (!r.ok) { showToast(r.msg); AudioFX.play("error"); return false; }
  showToast(r.msg);
  S.stats.tarotsUsed++;
  if (cons.id !== "fool") S.lastConsumable = cons;
  AudioFX.play("tarot");
  return true;
}

function clickConsumable(idx) { openConsModal(idx); }

function cancelTarget() {
  S.targetMode = null;
  S.selected.clear();
  document.body.classList.remove("targeting");
  $("#target-fab").hidden = true;
  $("#actions").hidden = false;
  renderHand();
  refreshControls();
}

function confirmTarget() {
  const tm = S.targetMode;
  if (!tm) return;
  const sel = S.hand.filter(c => S.selected.has(c.id));
  const okCount = tm.cons.exact ? sel.length === tm.cons.needs : sel.length >= 1 && sel.length <= tm.cons.needs;
  if (!okCount) { AudioFX.play("error"); return; }
  if (useConsumable(tm.cons, sel)) {
    S.consumables.splice(tm.idx, 1);
    S.targetMode = null;
    S.selected.clear();
    document.body.classList.remove("targeting");
    $("#target-fab").hidden = true;
    $("#actions").hidden = false;
    renderAll();
  }
}

function sellConsumable(idx) {
  const cons = S.consumables[idx];
  if (!cons) return;
  S.money += sellValue(cons);
  S.consumables.splice(idx, 1);
  AudioFX.play("coin");
  showToast(`Sold ${cons.name} for $${sellValue(cons)}`);
  renderAll();
}

function sellJoker(idx) {
  const j = S.jokers[idx];
  if (!j) return;
  const v = sellValue(j);
  S.money += v;
  S.jokers.splice(idx, 1);
  AudioFX.play("coin");
  showToast(`Sold ${j.name} for $${v}`);
  renderAll();
  if (currentScreen === "shop") renderShop();
}

// ── round end / shop ──
function endRoundWin() {
  const interest = Math.min(Math.floor(S.money / 5), interestCap());
  const goldHeld = S.hand.filter(c => c.enhancement === "gold").length * 3;
  let jokerMoney = 0;
  S.jokers.forEach(j => { if (j.onRoundEnd) { const m = j.onRoundEnd(j, S); if (m) jokerMoney += m; } });
  const reward = blindReward() + S.handsLeft + interest + goldHeld + jokerMoney;
  S.money += reward;
  S.phase = "shop";
  S.rerollCost = 5;

  S.offers = rollShopJokers(2 + (S.vouchers.has("overstock") ? 1 : 0), new Set(S.jokers.map(j => j.id)), S.vouchers.has("hone"));
  S.packs = shuffle([...PACKS]).slice(0, 2).map(p => ({ ...p }));
  const availVouchers = VOUCHERS.filter(v => !S.vouchers.has(v.id));
  S.voucherOffer = availVouchers.length ? availVouchers[Math.floor(Math.random() * availVouchers.length)] : null;

  const parts = [`$${blindReward()} blind`];
  if (S.handsLeft) parts.push(`$${S.handsLeft} hands left`);
  if (interest) parts.push(`$${interest} interest`);
  if (goldHeld) parts.push(`$${goldHeld} gold cards`);
  if (jokerMoney) parts.push(`$${jokerMoney} jokers`);
  $("#shop-reward").textContent = parts.join("  +  ") + `  =  $${reward}`;

  AudioFX.play("coin");
  showScreen("shop");
  renderShop();
  renderHud();
  renderJokers();
}

function renderShop() {
  $("#shop-money").textContent = "$" + S.money;
  $("#btn-reroll").textContent = "Reroll $" + S.rerollCost;
  $("#btn-reroll").disabled = S.money < S.rerollCost;
  $("#shop-joker-count").textContent = `${S.jokers.length}/${MAX_JOKERS}`;

  // owned jokers (click for details / sell)
  const owned = $("#shop-owned");
  owned.innerHTML = "";
  if (S.jokers.length === 0) owned.innerHTML = `<p class="shop-empty">No jokers yet</p>`;
  S.jokers.forEach((j, i) => owned.appendChild(jokerTile(j, { onClick: () => openJokerModal(j, i) })));

  // joker offers
  const wrap = $("#shop-offers");
  wrap.innerHTML = "";
  if (S.jokers.length >= MAX_JOKERS) {
    wrap.innerHTML = `<p class="shop-empty">Joker slots full (${MAX_JOKERS}/${MAX_JOKERS})</p>`;
  } else if (S.offers.length === 0) {
    wrap.innerHTML = `<p class="shop-empty">Sold out — reroll!</p>`;
  } else {
    S.offers.forEach(j => {
      const tile = jokerTile(j, { showDesc: true });
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Buy $" + priceOf(j);
      btn.disabled = S.money < priceOf(j);
      btn.onclick = () => {
        if (S.money < priceOf(j)) { AudioFX.play("error"); return; }
        S.money -= priceOf(j);
        S.jokers.push(j);
        S.offers = S.offers.filter(o => o !== j);
        tile.classList.add("sold");
        flyTo(tile, "#jokers");
        AudioFX.play("coin");
        renderShop(); renderHud(); renderJokers();
      };
      tile.appendChild(btn);
      wrap.appendChild(tile);
    });
  }

  // booster packs
  const pw = $("#shop-packs");
  pw.innerHTML = "";
  S.packs.forEach(p => {
    const tile = consTile(p, { showDesc: true });
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Open $" + priceOf(p);
    btn.disabled = S.money < priceOf(p);
    btn.onclick = () => {
      if (S.money < priceOf(p)) { AudioFX.play("error"); return; }
      S.money -= priceOf(p);
      S.packs = S.packs.filter(o => o !== p);
      flyTo(tile, "#consumables");
      AudioFX.play("pack");
      openPack(p);
      renderShop(); renderHud();
    };
    tile.appendChild(btn);
    pw.appendChild(tile);
  });

  // voucher
  const vw = $("#shop-voucher");
  vw.innerHTML = "";
  if (S.voucherOffer) {
    const v = S.voucherOffer;
    const tile = consTile(v, { showDesc: true });
    tile.classList.add("j-voucher");
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Buy $" + priceOf(v);
    btn.disabled = S.money < priceOf(v);
    btn.onclick = () => {
      if (S.money < priceOf(v)) { AudioFX.play("error"); return; }
      S.money -= priceOf(v);
      S.vouchers.add(v.id);
      S.voucherOffer = null;
      flyTo(tile, ".sidebar");
      AudioFX.play("win");
      showToast(v.name + " active!");
      renderShop(); renderHud();
    };
    tile.appendChild(btn);
    vw.appendChild(tile);
  } else {
    vw.innerHTML = `<p class="shop-empty">No voucher available</p>`;
  }
  saveGame();
}

// ── booster pack opening ──
function openPack(pack) {
  S.packOpen = { pack, choices: pack.open(S) };
  $("#pack-title").textContent = pack.name;
  const wrap = $("#pack-choices");
  wrap.innerHTML = "";
  S.packOpen.choices.forEach(choice => {
    const tile = choice.rarity
      ? jokerTile(choice, { showDesc: true })
      : consTile(choice, { showDesc: true });
    const btn = document.createElement("button");
    btn.className = "btn";
    const noRoom = choice.rarity ? S.jokers.length >= MAX_JOKERS : S.consumables.length >= MAX_CONS;
    btn.textContent = noRoom ? "No room" : "Take";
    btn.disabled = noRoom;
    btn.onclick = () => {
      if (choice.rarity) { S.jokers.push(choice); flyTo(tile, "#jokers"); }
      else { S.consumables.push(choice); flyTo(tile, "#consumables"); }
      AudioFX.play("coin");
      showToast("Got " + choice.name + "!");
      S.packOpen = null;
      showScreen("shop");
      renderShop(); renderJokers(); renderConsumables(); renderHud();
    };
    tile.appendChild(btn);
    wrap.appendChild(tile);
  });
  showScreen("pack");
}
function consDesc(c) {
  if (c.kind === "planet") return `${c.hand}: +${c.chips} chips, +${c.mult} mult per level`;
  return c.desc;
}

// ── end screens ──
function gameOver() {
  S.phase = "over";
  $("#final-ante").textContent = S.ante;
  $("#final-blind").textContent = blindName();
  $("#final-score").textContent = S.roundScore.toLocaleString();
  $("#final-target").textContent = blindTarget().toLocaleString();
  clearSave();
  AudioFX.play("lose");
  showScreen("over");
}
function winRun() {
  S.phase = "win";
  clearSave();
  AudioFX.play("win");
  showScreen("win");
}

// ── rendering ──
function cardEl(c) {
  const el = document.createElement("button");
  const enh = c.enhancement ? ` enh-${c.enhancement}` : "";
  el.className = "card " + (SUIT_CLASS[c.suit] || "black") + enh;
  el.dataset.id = c.id;
  if (isBossDebuffed(c)) el.classList.add("debuffed");
  if (c.enhancement === "stone") {
    el.innerHTML = `<span class="c-stone">+50</span>`;
  } else {
    const svg = suitSVG(c.suit);
    el.innerHTML =
      `<span class="c-rank">${rankLabel(c.rank)}</span>` +
      `<span class="c-suit">${svg}</span>` +
      `<span class="c-big">${svg}</span>` +
      `<span class="c-rank c-rank-b">${rankLabel(c.rank)}</span>`;
  }
  el.onclick = () => toggleCard(c.id, el);
  return el;
}

function toggleCard(id, el) {
  if (!S || S.animating || S.phase !== "play") return;
  const maxSel = S.targetMode ? S.targetMode.cons.needs : MAX_SELECT;
  if (S.selected.has(id)) {
    S.selected.delete(id);
    el.classList.remove("selected");
    AudioFX.play("deselect");
  } else if (S.selected.size < maxSel) {
    S.selected.add(id);
    el.classList.add("selected");
    AudioFX.play("select");
  } else {
    AudioFX.play("error");
  }
  renderPreview();
  refreshControls();
}

function renderHand() {
  const wrap = $("#hand");
  wrap.innerHTML = "";
  S.hand.forEach((c, i) => {
    const el = cardEl(c);
    if (S.selected.has(c.id)) el.classList.add("selected");
    if (S.freshIds.has(c.id)) {
      el.classList.add("deal-in");
      el.style.animationDelay = (settings.anim ? i * 55 : 0) + "ms";
    }
    wrap.appendChild(el);
  });
  S.freshIds.clear();
  $("#hand-count").textContent = `${S.hand.length}/${handSize()}`;
}

function jokerTile(j, opts = {}) {
  const tile = document.createElement("div");
  tile.className = `joker j-${j.rarity}` + (j.edition ? ` ed-${j.edition}` : "") + (opts.onClick ? " clickable" : "");
  tile.innerHTML =
    `<div class="tile-icon">${iconSVG(j.id)}</div>` +
    `<div class="tile-name">${j.name}${j.edition ? ` <span class="ed-tag ed-${j.edition}">${EDITIONS[j.edition].name}</span>` : ""}</div>` +
    (opts.showDesc ? `<span class="jdesc">${j.desc}</span>` : "");
  if (opts.onClick) tile.onclick = opts.onClick;
  return tile;
}

function renderJokers() {
  const wrap = $("#jokers");
  wrap.innerHTML = "";
  S.jokers.forEach((j, i) => wrap.appendChild(jokerTile(j, { onClick: () => openJokerModal(j, i) })));
  for (let i = S.jokers.length; i < MAX_JOKERS; i++) {
    const slot = document.createElement("div");
    slot.className = "joker slot-empty";
    wrap.appendChild(slot);
  }
  $("#joker-count").textContent = `${S.jokers.length}/${MAX_JOKERS}`;
}

function consTile(c, opts = {}) {
  const tile = document.createElement("div");
  tile.className = `joker j-${c.kind}` + (opts.onClick ? " clickable" : "");
  tile.innerHTML =
    `<div class="tile-icon">${iconSVG(c.id)}</div>` +
    `<div class="tile-name">${c.name}</div>` +
    (opts.showDesc ? `<span class="jdesc">${consDesc(c)}</span>` : "");
  if (opts.onClick) tile.onclick = opts.onClick;
  return tile;
}

function renderConsumables() {
  const wrap = $("#consumables");
  wrap.innerHTML = "";
  S.consumables.forEach((c, i) => wrap.appendChild(consTile(c, { onClick: () => openConsModal(i) })));
  for (let i = S.consumables.length; i < MAX_CONS; i++) {
    const slot = document.createElement("div");
    slot.className = "joker slot-empty";
    wrap.appendChild(slot);
  }
  $("#cons-count").textContent = `${S.consumables.length}/${MAX_CONS}`;
}

// ── card detail modal ──
function openModal({ icon, name, tags, desc, sellVal, onSell, onUse, useLabel }) {
  $("#mc-icon").innerHTML = icon;
  $("#mc-name").textContent = name;
  $("#mc-tags").textContent = (tags || []).filter(Boolean).join(" · ");
  $("#mc-desc").textContent = desc;
  const sb = $("#mc-sell");
  if (sellVal != null && onSell) {
    sb.hidden = false;
    sb.textContent = "Sell $" + sellVal;
    sb.onclick = () => { closeModal(); onSell(); };
  } else sb.hidden = true;
  const ub = $("#mc-use");
  if (onUse) {
    ub.hidden = false;
    ub.textContent = useLabel || "Use";
    ub.onclick = () => { closeModal(); onUse(); };
  } else ub.hidden = true;
  $("#modal-card").hidden = false;
  AudioFX.play("click");
}
function closeModal() { $("#modal-card").hidden = true; }

function openJokerModal(j, idx) {
  openModal({
    icon: iconSVG(j.id),
    name: j.name,
    tags: [j.rarity, j.edition ? EDITIONS[j.edition].name + " edition" : null],
    desc: j.desc + (j.edition ? ` · Edition: ${EDITIONS[j.edition].desc}` : ""),
    sellVal: sellValue(j),
    onSell: () => sellJoker(idx),
  });
}

function openConsModal(idx) {
  const c = S.consumables[idx];
  if (!c) return;
  const canUse = S.phase === "play" && !S.animating;
  const isTargetingThis = S.targetMode && S.targetMode.cons === c;
  openModal({
    icon: iconSVG(c.id),
    name: c.name,
    tags: [c.kind],
    desc: consDesc(c),
    sellVal: sellValue(c),
    onSell: () => sellConsumable(idx),
    onUse: (canUse || isTargetingThis) ? () => activateConsumable(idx) : null,
    useLabel: isTargetingThis ? "Cancel Targeting" : "Use",
  });
}

function activateConsumable(idx) {
  const cons = S.consumables[idx];
  if (!cons) return;
  // clicking the same consumable while targeting it cancels the aiming mode
  if (S.targetMode && S.targetMode.cons === cons) { cancelTarget(); showToast("Targeting cancelled"); return; }
  if (cons.kind === "planet" || cons.needs === 0) {
    if (useConsumable(cons)) {
      S.consumables.splice(idx, 1);
      renderAll();
    }
    return;
  }
  // targeted tarot: enter aiming mode — hand glows, confirm pill slides up
  S.targetMode = { cons, idx };
  S.selected.clear();
  document.body.classList.add("targeting");
  $("#target-fab-icon").innerHTML = iconSVG(cons.id);
  $("#target-fab-msg").textContent = `${cons.name}: pick ${cons.exact ? "exactly" : "up to"} ${cons.needs}`;
  $("#target-fab").hidden = false;
  $("#actions").hidden = true;
  renderHand();
  refreshControls();
}

function renderBossBanner() {
  const el = $("#boss-banner");
  if (S.boss) {
    el.hidden = false;
    $("#boss-name").textContent = S.boss.name;
    $("#boss-desc").textContent = S.boss.desc;
  } else {
    el.hidden = true;
  }
}

function renderHud(skipScore) {
  const bn = blindName();
  const blindEl = $("#hud-blind"); if (blindEl) blindEl.textContent = bn;
  const btEl = $("#blind-title");
  if (btEl) { btEl.textContent = bn; btEl.className = "blind-title blind-" + (S.blindIndex === 0 ? "small" : S.blindIndex === 1 ? "big" : "boss"); }
  $("#hud-ante").textContent = S.ante + "/8";
  const badge = $("#blind-badge");
  const kind = S.blindIndex === 0 ? "small" : S.blindIndex === 1 ? "big" : "boss";
  badge.className = "blind-badge blind-" + kind;
  badge.innerHTML = iconSVG(kind === "boss" ? "death" : kind === "big" ? "blind_big" : "blind_small");
  $("#hud-target").textContent = blindTarget().toLocaleString();
  const earnEl = $("#hud-earn"); if (earnEl) earnEl.textContent = "$".repeat(Math.min(4, 1 + S.ante));
  if (!skipScore) $("#hud-score").textContent = S.roundScore.toLocaleString();
  $("#score-bar-fill").style.width = Math.min(100, S.roundScore / blindTarget() * 100) + "%";
  $("#hud-hands").textContent = S.handsLeft;
  $("#hud-discards").textContent = S.discardsLeft;
  $("#hud-money").textContent = "$" + S.money;
  $("#hud-deck").textContent = S.deck.length;
  const roundEl = $("#hud-round"); if (roundEl) roundEl.textContent = S.blindIndex + 1;
  const pileEl = $("#deck-pile-count"); if (pileEl) pileEl.textContent = S.deck.length;
  flashMoneyIfChanged();
}

function renderPreview() {
  const ev = liveEval();
  if (ev) {
    const hv = handValue(ev.name);
    $("#preview-name").textContent = ev.name;
    $("#preview-chips").textContent = hv.chips;
    $("#preview-mult").textContent = hv.mult;
    $("#preview-level").textContent = "Lv." + handLevel(ev.name);
  } else {
    $("#preview-name").textContent = S.targetMode ? "Select target cards" : "Select cards";
    $("#preview-chips").textContent = 0;
    $("#preview-mult").textContent = 0;
    $("#preview-level").innerHTML = "&nbsp;";
  }
}

function refreshControls() {
  const canAct = S && S.phase === "play" && !S.animating && !S.targetMode;
  $("#btn-play").disabled = !canAct || S.selected.size === 0 || S.handsLeft <= 0;
  $("#btn-discard").disabled = !canAct || S.selected.size === 0 || S.discardsLeft <= 0;
  if (S && S.targetMode) {
    const tm = S.targetMode;
    $("#btn-target-use").disabled = tm.cons.exact ? S.selected.size !== tm.cons.needs : S.selected.size < 1;
  }
}

function renderAll() {
  renderHand();
  renderJokers();
  renderConsumables();
  renderHud();
  renderPreview();
  refreshControls();
  saveGame();
}

// ── hand levels screen ──
// ── collection (card encyclopedia) ──
let collTab = "jokers";
function renderCollection() {
  const tabs = {
    jokers:   { items: JOKERS,   cls: i => "j-" + i.rarity, meta: i => `${i.rarity} · $${i.cost}`, txt: i => i.desc },
    planets:  { items: PLANETS,  cls: () => "j-planet",     meta: () => "planet · $3",  txt: consDesc },
    tarots:   { items: TAROTS,   cls: () => "j-tarot",      meta: () => "tarot · $3",   txt: i => i.desc },
    vouchers: { items: VOUCHERS, cls: () => "j-voucher",    meta: () => "voucher · $10", txt: i => i.desc },
    bosses:   { items: BOSSES,   cls: () => "j-boss",       meta: () => "boss blind",   txt: i => i.desc },
  };
  const t = tabs[collTab];
  const grid = $("#collection-grid");
  grid.innerHTML = "";
  t.items.forEach(item => {
    const tile = document.createElement("div");
    tile.className = "joker coll-tile " + t.cls(item);
    tile.innerHTML =
      `<div class="tile-icon">${iconSVG(item.id)}</div>` +
      `<div class="tile-name">${item.name}</div>` +
      `<span class="jdesc">${t.txt(item)}</span>` +
      `<span class="coll-meta">${t.meta(item)}</span>`;
    grid.appendChild(tile);
  });
  $("#coll-count").textContent = `${t.items.length} cards`;
  document.querySelectorAll(".coll-tab").forEach(b =>
    b.classList.toggle("btn-primary", b.dataset.tab === collTab));
}

function renderHandsScreen() {  const tbl = $("#hands-levels");
  const planetOf = h => PLANETS.find(p => p.hand === h);
  let rows = `<tr><th>Hand</th><th>Lv</th><th>Chips</th><th>Mult</th><th>Planet</th></tr>`;
  ["High Card", "Pair", "Two Pair", "Three of a Kind", "Straight", "Flush", "Full House",
   "Four of a Kind", "Straight Flush", "Five of a Kind", "Flush House", "Flush Five"].forEach(h => {
    const base = { name: h };
    const hv = handValue(h);
    const p = planetOf(h);
    const used = S.stats.planetCounts[h] || 0;
    rows += `<tr><td>${h}</td><td>${handLevel(h)}</td><td>${hv.chips}</td><td>×${hv.mult}</td><td>${p ? p.name : "—"}${used ? ` (${used})` : ""}</td></tr>`;
  });
  tbl.innerHTML = rows;
}

// ── fx helpers ──
function flyTo(sourceEl, targetSel) {
  if (!settings.anim || !sourceEl) return;
  const t = document.querySelector(targetSel);
  if (!t) return;
  const a = sourceEl.getBoundingClientRect(), b = t.getBoundingClientRect();
  const ghost = sourceEl.cloneNode(true);
  ghost.classList.add("fly-ghost");
  Object.assign(ghost.style, {
    position: "fixed", left: a.left + "px", top: a.top + "px",
    width: a.width + "px", zIndex: 98, margin: 0, pointerEvents: "none",
  });
  document.body.appendChild(ghost);
  requestAnimationFrame(() => {
    ghost.style.transition = "transform .5s cubic-bezier(.22,1,.36,1), opacity .5s ease";
    ghost.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.25)`;
    ghost.style.opacity = "0.25";
  });
  setTimeout(() => ghost.remove(), 600);
}

function shakeEl(el) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 400);
}

let prevMoney = null;
function flashMoneyIfChanged() {
  if (prevMoney !== null && S.money !== prevMoney) {
    ["#hud-money", "#shop-money"].forEach(sel => {
      const el = $(sel);
      if (el) { el.classList.remove("flash-gold"); void el.offsetWidth; el.classList.add("flash-gold"); }
    });
  }
  prevMoney = S.money;
}

function setPlayedInfo(html) {
  const el = $("#played-info");
  el.innerHTML = html;
  el.classList.toggle("show", !!html);
}
function spawnScorePop(text) {
  const zone = $("#played-zone").getBoundingClientRect();
  const pop = document.createElement("div");
  pop.className = "score-pop";
  pop.textContent = text;
  pop.style.left = (zone.left + zone.width / 2 - 40) + "px";
  pop.style.top = (zone.top + 10) + "px";
  $("#fx-layer").appendChild(pop);
  setTimeout(() => pop.remove(), 1050);
}
function countUp(el, from, to, dur) {
  const t0 = performance.now();
  (function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(from + (to - from) * p).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
let toastTimer = null;
function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

// ── bindings ──
$("#btn-start").onclick = () => { AudioFX.play("click"); newRun(); };
$("#btn-continue").onclick = () => {
  if (loadGame()) { AudioFX.play("click"); showToast("Run restored!"); }
  else { AudioFX.play("error"); showToast("Save corrupted — start a new run"); }
};
$("#btn-collection").onclick = () => { AudioFX.play("click"); renderCollection(); showScreen("collection"); };
window.addEventListener("beforeunload", saveGame);
$("#btn-howto").onclick = () => { AudioFX.play("click"); showScreen("howto"); };
$("#btn-settings").onclick = () => { AudioFX.play("click"); showScreen("settings"); };
$("#btn-play").onclick = playHand;
$("#btn-discard").onclick = discardHand;
$("#btn-sort-rank").onclick = () => { sortMode = "rank"; sortHand(); renderHand(); AudioFX.play("click"); };
$("#btn-sort-suit").onclick = () => { sortMode = "suit"; sortHand(); renderHand(); AudioFX.play("click"); };
$("#btn-next").onclick = nextBlind;
$("#btn-menu").onclick = () => { AudioFX.play("click"); $("#modal-nav").hidden = false; };
$("#nav-resume").onclick = () => { AudioFX.play("click"); $("#modal-nav").hidden = true; };
$("#nav-backdrop").onclick = () => { $("#modal-nav").hidden = true; };
$("#nav-fullscreen").onclick = () => {
  $("#modal-nav").hidden = true;
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      document.body.classList.add("fullscreen");
      showToast("Fullscreen ON — press Esc to exit");
    }).catch(() => showToast("Fullscreen not supported on this browser"));
  } else {
    document.exitFullscreen().then(() => {
      document.body.classList.remove("fullscreen");
    });
  }
  AudioFX.play("click");
};
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) document.body.classList.remove("fullscreen");
});
$("#btn-run-info").onclick = () => { AudioFX.play("click"); renderHandsScreen(); showScreen("hands"); };
$("#nav-abandon").onclick = () => { $("#modal-nav").hidden = true; AudioFX.play("click"); showScreen("menu"); };
$("#btn-hands-back").onclick = () => { AudioFX.play("click"); showScreen("game"); };
document.addEventListener("keydown", e => { if (e.key === "Escape" && S && S.targetMode) cancelTarget(); });
$("#btn-target-use").onclick = confirmTarget;
$("#btn-target-x").onclick = () => { AudioFX.play("deselect"); cancelTarget(); };
$("#btn-pack-skip").onclick = () => { S.packOpen = null; AudioFX.play("click"); showScreen("shop"); renderShop(); };
$("#btn-reroll").onclick = () => {
  if (!S || S.money < S.rerollCost) { AudioFX.play("error"); return; }
  S.money -= S.rerollCost;
  S.rerollCost++;
  S.offers = rollShopJokers(2 + (S.vouchers.has("overstock") ? 1 : 0), new Set(S.jokers.map(j => j.id)), S.vouchers.has("hone"));
  AudioFX.play("click");
  renderShop();
  renderHud();
};
$("#btn-retry").onclick = () => { AudioFX.play("click"); newRun(); };
$("#btn-again").onclick = () => { AudioFX.play("click"); newRun(); };
document.querySelectorAll("[data-back]").forEach(b =>
  b.onclick = () => { AudioFX.play("click"); showScreen("menu"); });
document.querySelectorAll(".coll-tab").forEach(b =>
  b.onclick = () => { collTab = b.dataset.tab; AudioFX.play("click"); renderCollection(); });
document.querySelectorAll("[data-menu]").forEach(b =>
  b.onclick = () => { AudioFX.play("click"); showScreen("menu"); });
$("#set-sound").onclick = () => { settings.sound = !settings.sound; saveSettings(); applySettings(); AudioFX.play("click"); };
$("#set-anim").onclick = () => { settings.anim = !settings.anim; saveSettings(); applySettings(); AudioFX.play("click"); };
$("#mc-close").onclick = () => { AudioFX.play("deselect"); closeModal(); };
$("#mc-backdrop").onclick = closeModal;

document.querySelectorAll(".float-card").forEach(el => {
  el.innerHTML = suitSVG(el.dataset.suit);
});

applySettings();
showScreen("menu"); // init: refresh Continue button visibility

// debug/testing hooks
window.DS = { get S() { return S; }, newRun, startBlind, endRoundWin, renderAll, renderShop, showScreen, openPack, settings,
  api: { PLANETS, TAROTS, VOUCHERS, PACKS, BOSSES, JOKERS } };
