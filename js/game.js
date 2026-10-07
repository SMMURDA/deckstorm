// Core game state & UI
const HAND_SIZE = 8, MAX_SELECT = 5, MAX_JOKERS = 5;
const BASE_HANDS = 4, BASE_DISCARDS = 3;
const ANTE_TARGETS = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
const BLINDS = [
  { key: "small", name: "Small Blind", mult: 1, reward: 3 },
  { key: "big", name: "Big Blind", mult: 1.5, reward: 4 },
  { key: "boss", name: "Boss Blind", mult: 2, reward: 5 },
];
const REROLL_COST = 2;

const S = {}; // game state
const $ = sel => document.querySelector(sel);

function newRun() {
  S.ante = 1; S.blindIdx = 0;
  S.money = 4;
  S.jokers = [];
  S.sortMode = "rank";
  startBlind();
  $("#gameover").hidden = true;
  $("#win").hidden = true;
  $("#shop").hidden = true;
  $("#hud").hidden = false;
  $("#start-screen").hidden = true;
  renderAll();
}

function blindTarget() {
  return Math.round(ANTE_TARGETS[S.ante - 1] * BLINDS[S.blindIdx].mult);
}

function startBlind() {
  S.drawPile = shuffle(buildDeck());
  S.hand = [];
  S.selected = new Set();
  S.handsLeft = BASE_HANDS;
  S.discardsLeft = BASE_DISCARDS;
  S.roundScore = 0;
  S.phase = "play";
  drawUp();
}

function drawUp() {
  while (S.hand.length < HAND_SIZE && S.drawPile.length) S.hand.push(S.drawPile.pop());
  sortHand();
}

function sortHand() {
  const suitOrder = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  S.hand.sort((a, b) => S.sortMode === "rank"
    ? b.rank - a.rank || suitOrder[a.suit] - suitOrder[b.suit]
    : suitOrder[a.suit] - suitOrder[b.suit] || b.rank - a.rank);
}

function selectedCards() { return S.hand.filter(c => S.selected.has(c.id)); }

function liveEval() {
  const sel = selectedCards();
  return sel.length ? evaluateHand(sel) : null;
}

function toggleCard(id) {
  if (S.phase !== "play") return;
  if (S.selected.has(id)) S.selected.delete(id);
  else if (S.selected.size < MAX_SELECT) S.selected.add(id);
  renderHand(); renderPreview();
}

function playHand() {
  if (S.phase !== "play") return;
  const sel = selectedCards();
  if (!sel.length) return;
  const ev = evaluateHand(sel);
  const scoringCards = sel.filter(c => ev.scoringIds.has(c.id));

  let chips = ev.chips + scoringCards.reduce((s, c) => s + cardChips(c), 0);
  let mult = ev.mult;
  const ctx = () => ({ handName: ev.name, scoringCards, playedCards: sel, discardsLeft: S.discardsLeft, handsLeft: S.handsLeft });
  for (const j of S.jokers) {
    const d = j.effect(ctx()) || {};
    chips += d.chips || 0;
    mult += d.mult || 0;
    if (d.multTimes) mult *= d.multTimes;
  }
  const gained = chips * mult;
  S.roundScore += gained;
  S.handsLeft--;

  flashScore(ev, chips, mult, gained);

  // remove played cards, redraw
  S.hand = S.hand.filter(c => !S.selected.has(c.id));
  S.selected.clear();
  drawUp();
  renderAll();

  if (S.roundScore >= blindTarget()) return setTimeout(endRoundWin, 650);
  if (S.handsLeft <= 0) return setTimeout(gameOver, 650);
}

function discard() {
  if (S.phase !== "play" || S.discardsLeft <= 0 || !S.selected.size) return;
  S.hand = S.hand.filter(c => !S.selected.has(c.id));
  S.selected.clear();
  S.discardsLeft--;
  drawUp();
  renderAll();
}

function endRoundWin() {
  S.phase = "shop";
  const unused = S.handsLeft;
  const interest = Math.min(Math.floor(S.money / 5), 5);
  const reward = BLINDS[S.blindIdx].reward + unused + interest;
  S.lastReward = { base: BLINDS[S.blindIdx].reward, unused, interest };
  S.money += reward;

  // Gros Michel destruction check
  const destroyed = [];
  S.jokers = S.jokers.filter(j => {
    if (j.endOfRoundDestroy && j.endOfRoundDestroy()) { destroyed.push(j.name); return false; }
    return true;
  });
  S.lastDestroyed = destroyed;

  openShop();
}

function openShop() {
  S.shopOffers = rollShopJokers(2, new Set(S.jokers.map(j => j.id)));
  $("#shop").hidden = false;
  renderShop(); renderAll();
}

function rerollShop() {
  if (S.money < REROLL_COST) return;
  S.money -= REROLL_COST;
  S.shopOffers = rollShopJokers(2, new Set(S.jokers.map(j => j.id)));
  renderShop(); renderHud();
}

function buyJoker(offerIdx) {
  const j = S.shopOffers[offerIdx];
  if (!j || S.money < j.cost || S.jokers.length >= MAX_JOKERS) return;
  S.money -= j.cost;
  S.jokers.push(j);
  S.shopOffers.splice(offerIdx, 1);
  renderShop(); renderHud(); renderJokers();
}

function nextBlind() {
  $("#shop").hidden = true;
  if (S.blindIdx === 2) {
    if (S.ante === 8) return winRun();
    S.ante++; S.blindIdx = 0;
  } else S.blindIdx++;
  startBlind();
  renderAll();
}

function gameOver() {
  S.phase = "over";
  $("#hud").hidden = true;
  $("#shop").hidden = true;
  $("#final-ante").textContent = S.ante;
  $("#final-blind").textContent = BLINDS[S.blindIdx].name;
  $("#final-score").textContent = S.roundScore.toLocaleString();
  $("#final-target").textContent = blindTarget().toLocaleString();
  $("#gameover").hidden = false;
}

function winRun() {
  S.phase = "win";
  $("#hud").hidden = true;
  $("#shop").hidden = true;
  $("#win").hidden = false;
}

// ---------- rendering ----------
function renderHud() {
  $("#hud-ante").textContent = S.ante;
  $("#hud-blind").textContent = BLINDS[S.blindIdx].name;
  $("#hud-target").textContent = blindTarget().toLocaleString();
  $("#hud-score").textContent = S.roundScore.toLocaleString();
  $("#hud-hands").textContent = S.handsLeft;
  $("#hud-discards").textContent = S.discardsLeft;
  $("#hud-money").textContent = "$" + S.money;
  const pct = Math.min(100, (S.roundScore / blindTarget()) * 100);
  $("#score-bar-fill").style.width = pct + "%";
  $("#btn-discard").disabled = S.discardsLeft <= 0 || !S.selected.size;
  $("#btn-play").disabled = !S.selected.size;
}

function renderPreview() {
  const ev = liveEval();
  $("#preview").textContent = ev ? `${ev.name} — ${ev.chips} chips × ${ev.mult} mult` : "Select up to 5 cards";
  renderHud();
}

function cardEl(c) {
  const el = document.createElement("button");
  el.className = "card" + (S.selected.has(c.id) ? " selected" : "") + ((c.suit === "hearts" || c.suit === "diamonds") ? " red" : "");
  el.innerHTML = `<span class="card-rank">${rankLabel(c.rank)}</span><span class="card-suit">${c.symbol}</span>`;
  el.onclick = () => toggleCard(c.id);
  return el;
}

function renderHand() {
  const wrap = $("#hand");
  wrap.innerHTML = "";
  for (const c of S.hand) wrap.appendChild(cardEl(c));
  $("#hand-count").textContent = `${S.hand.length}/${HAND_SIZE}`;
}

function renderJokers() {
  const wrap = $("#jokers");
  wrap.innerHTML = "";
  for (const j of S.jokers) {
    const el = document.createElement("div");
    el.className = "joker joker-" + j.rarity;
    el.innerHTML = `<b>${j.name}</b><span>${j.desc}</span>`;
    wrap.appendChild(el);
  }
  $("#joker-count").textContent = `${S.jokers.length}/${MAX_JOKERS}`;
}

function renderShop() {
  $("#shop-reward").textContent =
    `Reward: $${S.lastReward.base} blind + $${S.lastReward.unused} unused hands + $${S.lastReward.interest} interest` +
    (S.lastDestroyed.length ? ` — destroyed: ${S.lastDestroyed.join(", ")}` : "");
  const wrap = $("#shop-offers");
  wrap.innerHTML = "";
  if (!S.shopOffers.length) wrap.innerHTML = '<p class="shop-empty">Sold out.</p>';
  S.shopOffers.forEach((j, i) => {
    const el = document.createElement("div");
    el.className = "joker joker-" + j.rarity;
    el.innerHTML = `<b>${j.name}</b><span>${j.desc}</span>`;
    const btn = document.createElement("button");
    btn.className = "btn btn-buy";
    btn.textContent = `Buy $${j.cost}`;
    btn.disabled = S.money < j.cost || S.jokers.length >= MAX_JOKERS;
    btn.onclick = () => buyJoker(i);
    el.appendChild(btn);
    wrap.appendChild(el);
  });
  $("#btn-reroll").disabled = S.money < REROLL_COST;
  $("#btn-reroll").textContent = `Reroll $${REROLL_COST}`;
}

let flashTimer;
function flashScore(ev, chips, mult, gained) {
  const el = $("#score-flash");
  el.innerHTML = `<b>${ev.name}</b> · ${chips} × ${mult} = <b>${gained.toLocaleString()}</b>`;
  el.classList.add("show");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove("show"), 1200);
}

function renderAll() { renderHud(); renderHand(); renderJokers(); renderPreview(); }

$("#btn-play").onclick = playHand;
$("#btn-discard").onclick = discard;
$("#btn-sort-rank").onclick = () => { S.sortMode = "rank"; sortHand(); renderHand(); };
$("#btn-sort-suit").onclick = () => { S.sortMode = "suit"; sortHand(); renderHand(); };
$("#btn-reroll").onclick = rerollShop;
$("#btn-next").onclick = nextBlind;
$("#btn-start").onclick = newRun;
$("#btn-retry").onclick = newRun;
$("#btn-again").onclick = newRun;

$("#start-screen").hidden = false;
$("#hud").hidden = true;
$("#shop").hidden = true;
