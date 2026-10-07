// ═══════════════ DECKSTORM — core game state & UI ═══════════════
"use strict";
const HAND_SIZE = 8, MAX_SELECT = 5, MAX_JOKERS = 5;
const BASE_HANDS = 4, BASE_DISCARDS = 3;
const ANTE_TARGETS = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
const BLINDS = [
  { name: "Small Blind", mult: 1,   reward: 3 },
  { name: "Big Blind",   mult: 1.5, reward: 4 },
  { name: "Boss Blind",  mult: 2,   reward: 5 },
];
const SUIT_CLASS = { hearts: "red", diamonds: "red", spades: "black", clubs: "black" };
const $ = s => document.querySelector(s);

// ── pixel-art suits (grid → inline SVG, crisp pixels) ──
const SUIT_PIXELS = {
  hearts:   [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."],
  diamonds: ["...#...", "..###..", ".#####.", "#######", ".#####.", "..###..", "...#..."],
  spades:   ["...#...", "..###..", ".#####.", "#######", "#######", "...#...", "..###.."],
  clubs:    ["..###..", "..###..", "##.#.##", "##.#.##", "..###..", "...#...", "..###.."],
};
const STAR_PIXELS = ["...#...", "..###..", "#######", ".#####.", "..###..", ".#...#."];
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
function starSVG(color) { return pixelSVG(STAR_PIXELS, color); }

// ── settings (persisted) ──
const settings = Object.assign({ sound: true, anim: true },
  JSON.parse(localStorage.getItem("deckstorm.settings") || "{}"));
function saveSettings() { localStorage.setItem("deckstorm.settings", JSON.stringify(settings)); }
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

// ── screen manager ──
let currentScreen = "menu";
function showScreen(name) {
  currentScreen = name;
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  $("#screen-" + name).classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ── run / round flow ──
function newRun() {
  S = {
    ante: 1, blindIndex: 0, money: 4, jokers: [], offers: [],
    deck: [], hand: [], selected: new Set(), freshIds: new Set(),
    handsLeft: 0, discardsLeft: 0, roundScore: 0,
    phase: "play", animating: false, grosMichelGone: false,
  };
  sortMode = "rank";
  startBlind();
}

function blindTarget() { return Math.round(ANTE_TARGETS[S.ante - 1] * BLINDS[S.blindIndex].mult); }

function startBlind() {
  S.phase = "play";
  S.animating = false;
  S.deck = shuffle(buildDeck());
  S.hand = [];
  S.selected.clear();
  S.freshIds.clear();
  S.handsLeft = BASE_HANDS;
  S.discardsLeft = BASE_DISCARDS;
  S.roundScore = 0;
  drawUp();
  $("#played-zone").innerHTML = "";
  setPlayedInfo("");
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
  const need = HAND_SIZE - S.hand.length;
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

// ── scoring ──
function liveEval() {
  if (!S || S.selected.size === 0) return null;
  return evaluateHand(S.hand.filter(c => S.selected.has(c.id)));
}

function scorePlayed() {
  const played = S.hand.filter(c => S.selected.has(c.id));
  const ev = evaluateHand(played);
  let chips = ev.chips, mult = ev.mult;
  played.forEach(c => { if (ev.scoringIds.has(c.id)) chips += cardChips(c); });

  const ctx = () => ({
    handName: ev.name, scoringCards: played.filter(c => ev.scoringIds.has(c.id)),
    playedCards: played, discardsLeft: S.discardsLeft, handsLeft: S.handsLeft,
  });

  const flashes = [];
  let removeGros = false;
  S.jokers.forEach((j, idx) => {
    let label = null;
    if (j.effect) {
      const r = j.effect(ctx());
      if (r && r.mult)  { mult += r.mult;   label = `+${r.mult} mult`; }
      if (r && r.chips) { chips += r.chips; label = `+${r.chips} chips`; }
    } else {
      mult += 4; label = "+4 mult"; // base Joker
    }
    if (label) flashes.push({ idx, label });
    if (j.id === "gros" && Math.random() < 1 / 6) removeGros = true;
  });
  if (removeGros) {
    S.jokers = S.jokers.filter(j => j.id !== "gros");
    S.grosMichelGone = true;
  }
  return { ev, chips, mult, total: chips * mult, flashes };
}

// ── play / discard with animation ──
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

async function playHand() {
  if (!S || S.phase !== "play" || S.animating) return;
  if (S.selected.size === 0 || S.handsLeft <= 0) { AudioFX.play("error"); return; }
  S.animating = true;
  refreshControls();
  AudioFX.play("play");

  const result = scorePlayed();
  S.handsLeft--;

  // 1. move selected cards into the staging zone (FLIP animation)
  const zone = $("#played-zone");
  zone.innerHTML = "";
  const els = [...document.querySelectorAll("#hand .card")].filter(el => S.selected.has(el.dataset.id));
  els.forEach(el => { el.classList.remove("selected"); el.disabled = true; flipMove(el, zone); });

  const t = settings.anim;
  await wait(t ? 400 : 30);

  // 2. show hand breakdown
  setPlayedInfo(`<span class="pi-name">${result.ev.name}</span><span class="pi-chips">${result.chips}</span> × <span class="pi-mult">${result.mult}</span>`);
  AudioFX.play("score");
  await wait(t ? 350 : 30);

  // 3. flash contributing jokers one by one
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
    await wait(t ? 180 : 0);
  }

  // 4. score popup + count-up + progress bar
  const prevScore = S.roundScore;
  S.roundScore += result.total;
  spawnScorePop(`+${result.total.toLocaleString()}`);
  renderHud(true);
  countUp($("#hud-score"), prevScore, S.roundScore, t ? 550 : 30);
  await wait(t ? 600 : 30);

  // 5. cleanup staging, redraw
  els.forEach(el => el.classList.add("played-out"));
  await wait(t ? 260 : 30);
  zone.innerHTML = "";
  setPlayedInfo("");
  S.hand = S.hand.filter(c => !S.selected.has(c.id));
  S.selected.clear();
  drawUp();
  renderAll();
  S.animating = false;
  refreshControls();

  if (S.roundScore >= blindTarget()) return setTimeout(endRoundWin, 500);
  if (S.handsLeft <= 0) return setTimeout(gameOver, 500);
}

async function discardHand() {
  if (!S || S.phase !== "play" || S.animating) return;
  if (S.selected.size === 0 || S.discardsLeft <= 0) { AudioFX.play("error"); return; }
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
  renderAll();
  S.animating = false;
  refreshControls();
  AudioFX.play("deal");
}

// ── shop ──
function endRoundWin() {
  const blind = BLINDS[S.blindIndex];
  const interest = Math.min(Math.floor(S.money / 5), 5);
  const reward = blind.reward + S.handsLeft + interest;
  S.money += reward;
  S.phase = "shop";
  S.offers = rollShopJokers(2, new Set(S.jokers.map(j => j.id)));
  $("#shop-reward").textContent =
    `+${blind.reward} blind  +${S.handsLeft} unused hands  +${interest} interest  =  $${reward}`;
  AudioFX.play("coin");
  showScreen("shop");
  renderShop();
  renderHud();
}

function renderShop() {
  $("#shop-money").textContent = "$" + S.money;
  $("#btn-reroll").disabled = S.money < 2;
  const wrap = $("#shop-offers");
  wrap.innerHTML = "";
  if (S.jokers.length >= MAX_JOKERS) {
    wrap.innerHTML = `<p class="shop-empty">Joker slots full (${MAX_JOKERS}/${MAX_JOKERS})</p>`;
  } else if (S.offers.length === 0) {
    wrap.innerHTML = `<p class="shop-empty">Sold out — reroll or move on!</p>`;
  } else {
    S.offers.forEach(j => wrap.appendChild(shopCard(j)));
  }
}

function shopCard(j) {
  const tile = jokerTile(j);
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.textContent = "Buy $" + j.cost;
  btn.disabled = S.money < j.cost;
  btn.onclick = () => {
    if (S.money < j.cost) { AudioFX.play("error"); return; }
    S.money -= j.cost;
    S.jokers.push(j);
    S.offers = S.offers.filter(o => o !== j);
    tile.classList.add("sold");
    AudioFX.play("coin");
    renderShop();
    renderHud();
    renderJokers();
  };
  tile.appendChild(btn);
  return tile;
}

// ── end screens ──
function gameOver() {
  S.phase = "over";
  $("#final-ante").textContent = S.ante;
  $("#final-blind").textContent = BLINDS[S.blindIndex].name;
  $("#final-score").textContent = S.roundScore.toLocaleString();
  $("#final-target").textContent = blindTarget().toLocaleString();
  AudioFX.play("lose");
  showScreen("over");
}

function winRun() {
  S.phase = "win";
  AudioFX.play("win");
  showScreen("win");
}

// ── rendering ──
function cardEl(c) {
  const el = document.createElement("button");
  el.className = "card " + SUIT_CLASS[c.suit];
  el.dataset.id = c.id;
  const svg = suitSVG(c.suit);
  el.innerHTML =
    `<span class="c-rank">${rankLabel(c)}</span>` +
    `<span class="c-suit">${svg}</span>` +
    `<span class="c-big">${svg}</span>` +
    `<span class="c-rank c-rank-b">${rankLabel(c)}</span>`;
  el.onclick = () => toggleCard(c.id, el);
  return el;
}

function toggleCard(id, el) {
  if (S.animating || S.phase !== "play") return;
  if (S.selected.has(id)) {
    S.selected.delete(id);
    el.classList.remove("selected");
    AudioFX.play("deselect");
  } else if (S.selected.size < MAX_SELECT) {
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
  $("#hand-count").textContent = `${S.hand.length}/${HAND_SIZE}`;
}

function jokerTile(j) {
  const tile = document.createElement("div");
  tile.className = `joker j-${j.rarity}`;
  const starColor = j.rarity === "uncommon" ? "#FC84FC" : "#C8C2DC";
  tile.innerHTML =
    `<div class="joker-head">${starSVG(starColor)}<b>${j.name}</b></div>` +
    `<span class="jdesc">${j.desc}</span>`;
  return tile;
}

function renderJokers() {
  const wrap = $("#jokers");
  wrap.innerHTML = "";
  S.jokers.forEach(j => wrap.appendChild(jokerTile(j)));
  $("#joker-count").textContent = `${S.jokers.length}/${MAX_JOKERS}`;
}

function renderHud(skipBar) {
  $("#hud-ante").textContent = S.ante + "/8";
  $("#hud-blind").textContent = BLINDS[S.blindIndex].name;
  $("#hud-target").textContent = blindTarget().toLocaleString();
  if (!skipBar) $("#hud-score").textContent = S.roundScore.toLocaleString();
  $("#score-bar-fill").style.width = Math.min(100, S.roundScore / blindTarget() * 100) + "%";
  $("#hud-hands").textContent = S.handsLeft;
  $("#hud-discards").textContent = S.discardsLeft;
  $("#hud-money").textContent = "$" + S.money;
}

function renderPreview() {
  const ev = liveEval();
  $("#preview-name").textContent = ev ? ev.name : "Select cards";
  $("#preview-chips").textContent = ev ? ev.chips : 0;
  $("#preview-mult").textContent = ev ? ev.mult : 0;
}

function refreshControls() {
  const canAct = S && S.phase === "play" && !S.animating;
  $("#btn-play").disabled = !canAct || S.selected.size === 0 || S.handsLeft <= 0;
  $("#btn-discard").disabled = !canAct || S.selected.size === 0 || S.discardsLeft <= 0;
  $("#btn-sort-rank").textContent = "Sort: Rank";
  $("#btn-sort-suit").textContent = "Sort: Suit";
}

function renderAll() {
  renderHand();
  renderJokers();
  renderHud();
  renderPreview();
  refreshControls();
}

// ── fx helpers ──
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

// ── bindings ──
$("#btn-start").onclick = () => { AudioFX.play("click"); newRun(); };
$("#btn-howto").onclick = () => { AudioFX.play("click"); showScreen("howto"); };
$("#btn-settings").onclick = () => { AudioFX.play("click"); showScreen("settings"); };
$("#btn-play").onclick = playHand;
$("#btn-discard").onclick = discardHand;
$("#btn-sort-rank").onclick = () => { sortMode = "rank"; sortHand(); renderHand(); AudioFX.play("click"); };
$("#btn-sort-suit").onclick = () => { sortMode = "suit"; sortHand(); renderHand(); AudioFX.play("click"); };
$("#btn-next").onclick = nextBlind;
$("#btn-reroll").onclick = () => {
  if (!S || S.money < 2) { AudioFX.play("error"); return; }
  S.money -= 2;
  S.offers = rollShopJokers(2, new Set(S.jokers.map(j => j.id)));
  AudioFX.play("click");
  renderShop();
  renderHud();
};
$("#btn-retry").onclick = () => { AudioFX.play("click"); newRun(); };
$("#btn-again").onclick = () => { AudioFX.play("click"); newRun(); };
$("#btn-abandon").onclick = () => { AudioFX.play("click"); showScreen("menu"); };
document.querySelectorAll("[data-back]").forEach(b =>
  b.onclick = () => { AudioFX.play("click"); showScreen("menu"); });
document.querySelectorAll("[data-menu]").forEach(b =>
  b.onclick = () => { AudioFX.play("click"); showScreen("menu"); });

$("#set-sound").onclick = () => { settings.sound = !settings.sound; saveSettings(); applySettings(); AudioFX.play("click"); };
$("#set-anim").onclick = () => { settings.anim = !settings.anim; saveSettings(); applySettings(); AudioFX.play("click"); };

// menu floating cards: fill with pixel suits
document.querySelectorAll(".float-card").forEach(el => {
  el.innerHTML = suitSVG(el.dataset.suit);
});

applySettings();
