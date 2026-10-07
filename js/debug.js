// ═══ Deckstorm — Debug / Cheat mode ═══
// Loaded BEFORE cards/jokers/consumables/game so those can read DEBUG at runtime.
// The panel itself is built lazily by buildDebugPanel(), called from game.js once
// every other script (and the DOM) is available.

const DEBUG = {
  on: false,
  // shop
  shopJokers: null,   // base number of joker offers (null = normal rule)
  shopPacks: null,    // number of booster packs
  freeReroll: false,
  // rates
  editionForce: "",   // "", "foil", "holo", "poly" — forces every rolled edition
  editionBoost: null, // multiplies the edition chance (e.g. 100 => always editions)
  rarityForce: "",    // "", "common", "uncommon", "rare"
  // gameplay
  noBossEffect: false,
  handSize: null,
  hands: null,
  discards: null,
  jokers: null,
  cons: null,
  ante: null,
};

// read a debug override, falling back to the normal value
function dbgVal(key, dflt) {
  const v = DEBUG[key];
  return (DEBUG.on && v != null && v !== "") ? v : dflt;
}
const dbgOn = () => !!DEBUG.on;
// handy from devtools too (and for tests): window.DEBUG.shopJokers = 6, etc.
if (typeof window !== "undefined") window.DEBUG = DEBUG;

// ── the actions the panel can run ──
const DBG_ACT = {
  money(v) {
    if (!S) return;
    S.money = Math.max(0, S.money + Number(v));
    renderAll();
    showToast(`Money: $${S.money}`);
  },
  winblind() {
    if (!S || S.phase !== "play") return;
    S.roundScore = blindTarget();
    renderHud();
    endRoundWin();
  },
  nextblind() {
    if (!S) return;
    advanceBlindIndex();
    if (S.gameWon) return;
    renderAll();
    showBlindSelect();
  },
  skipboss() {
    if (!S) return;
    S.blindIndex = 2;
    S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
    advanceBlindIndex();
    if (S.gameWon) return;
    renderAll();
    showBlindSelect();
    showToast("Boss skipped");
  },
  rerollboss() {
    if (!S || !S.boss) { showToast("No boss blind right now"); return; }
    S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
    renderBossBanner();
    renderHud();
    showToast("Boss: " + S.boss.name);
  },
  reroll() {
    if (!S || S.phase !== "shop") { showToast("Only in the shop"); return; }
    S.offers = rollShopJokers(shopJokerCount(), new Set(S.jokers.map(j => j.id)), S.vouchers.has("hone"));
    renderShop();
  },
  rerollcost() {
    if (!S) return;
    S.rerollCost = 5;
    if (S.phase === "shop") renderShop();
    showToast("Re-roll cost reset to $5");
  },
  givejoker() {
    const id = $("#dbg-joker") && $("#dbg-joker").value;
    const def = JOKERS.find(j => j.id === id);
    if (!def) return;
    if (S.jokers.length >= maxJokers()) { showToast(`Joker slots full (${maxJokers()})`); return; }
    S.jokers.push(makeJoker(def));
    renderAll(); renderJokers();
    showToast("Gave " + def.name);
  },
  givetarot() {
    const id = $("#dbg-tarot") && $("#dbg-tarot").value;
    const def = TAROTS.find(t => t.id === id);
    if (!def) return;
    if (S.consumables.length >= maxCons()) { showToast(`Consumable slots full (${maxCons()})`); return; }
    S.consumables.push({ ...def });
    renderAll(); renderConsumables();
    showToast("Gave " + def.name);
  },
  giveplanet() {
    const id = $("#dbg-planet") && $("#dbg-planet").value;
    const def = PLANETS.find(p => p.id === id);
    if (!def) return;
    if (S.consumables.length >= maxCons()) { showToast(`Consumable slots full (${maxCons()})`); return; }
    S.consumables.push({ ...def });
    renderAll(); renderConsumables();
    showToast("Gave " + def.name);
  },
  allvouchers() {
    if (!S) return;
    VOUCHERS.forEach(v => S.vouchers.add(v.id));
    renderAll();
    showToast("All vouchers active");
  },
  levelall() {
    if (!S) return;
    Object.keys(HAND_BASE).forEach(h => {
      const k = h === "Royal Flush" ? "Straight Flush" : h;
      S.handLevels[k] = (S.handLevels[k] || 1) + 1;
    });
    renderAll();
    showToast("Every hand +1 level");
  },
  setante() {
    if (!S) return;
    const n = Number($("#dbg-ante") && $("#dbg-ante").value);
    if (!(n >= 1 && n <= 8)) { showToast("Ante must be 1-8"); return; }
    S.ante = n; S.blindIndex = 0; S.boss = null;
    renderAll();
    showBlindSelect();
    showToast("Ante " + n);
  },
  winrun() { if (S) winRun(); },
  lose() { if (S) gameOver(); },
  clearsave() { clearSave(); showToast("Save cleared"); },
};

// ── panel ──
function dbgBtn(label, act, val, cls) {
  return `<button class="dbg-b${cls ? " " + cls : ""}" data-act="${act}"${val != null ? ` data-v="${val}"` : ""}>${label}</button>`;
}
function dbgNum(key, ph, min, max) {
  return `<label class="dbg-f">${key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}
    <input class="dbg-num" type="number" min="${min}" max="${max}" data-num="${key}" placeholder="${ph}"></label>`;
}
function dbgSeg(kind, value, label) {
  return `<button class="dbg-b dbg-seg" data-${kind}="${value}">${label}</button>`;
}

function buildDebugPanel() {
  if (document.getElementById("debug-panel")) return;
  const el = document.createElement("div");
  el.id = "debug-panel";
  el.hidden = true;
  el.innerHTML = `
    <div class="dbg-head" id="dbg-head">
      <span class="dbg-dot"></span><b>DEBUG</b>
      <span class="dbg-spacer"></span>
      <button class="dbg-ic" id="dbg-collapse" title="Collapse">▾</button>
      <button class="dbg-ic" id="dbg-hide" title="Close (turn off in Settings)">✕</button>
    </div>
    <div class="dbg-body" id="dbg-body">
      <section class="dbg-sec">
        <h4>Money</h4>
        <div class="dbg-row">
          ${dbgBtn("+$100", "money", 100)}${dbgBtn("+$1k", "money", 1000)}
          ${dbgBtn("+$10k", "money", 10000)}${dbgBtn("−$1k", "money", -1000)}
        </div>
      </section>

      <section class="dbg-sec">
        <h4>Blind &amp; Boss</h4>
        <div class="dbg-row">
          ${dbgBtn("Win blind", "winblind")}${dbgBtn("Next blind", "nextblind")}
          ${dbgBtn("Skip boss", "skipboss")}${dbgBtn("Re-roll boss", "rerollboss")}
        </div>
        <label class="dbg-chk"><input type="checkbox" data-flip="noBossEffect"> Boss effects disabled</label>
      </section>

      <section class="dbg-sec">
        <h4>Shop</h4>
        <div class="dbg-row">${dbgNum("shopJokers", 2, 1, 10)}${dbgNum("shopPacks", 2, 0, 3)}</div>
        <label class="dbg-chk"><input type="checkbox" data-flip="freeReroll"> Free re-rolls</label>
        <div class="dbg-row">${dbgBtn("Re-roll shop now", "reroll")}${dbgBtn("Reset re-roll cost", "rerollcost")}</div>
      </section>

      <section class="dbg-sec">
        <h4>Drop rates</h4>
        <div class="dbg-row dbg-wrap"><span class="dbg-lbl">Edition</span>
          ${dbgSeg("edition", "", "Off")}${dbgSeg("edition", "foil", "Foil")}
          ${dbgSeg("edition", "holo", "Holo")}${dbgSeg("edition", "poly", "Poly")}</div>
        <div class="dbg-row">${dbgNum("editionBoost", 1, 1, 100)}</div>
        <div class="dbg-row dbg-wrap"><span class="dbg-lbl">Rarity</span>
          ${dbgSeg("rarity", "", "Any")}${dbgSeg("rarity", "common", "Common")}
          ${dbgSeg("rarity", "uncommon", "Uncommon")}${dbgSeg("rarity", "rare", "Rare")}</div>
      </section>

      <section class="dbg-sec">
        <h4>Slots &amp; sizes</h4>
        <div class="dbg-row dbg-wrap">
          ${dbgNum("handSize", 8, 1, 20)}${dbgNum("hands", 4, 1, 20)}${dbgNum("discards", 3, 0, 20)}
          ${dbgNum("jokers", 5, 1, 12)}${dbgNum("cons", 2, 1, 8)}
        </div>
      </section>

      <section class="dbg-sec">
        <h4>Give items</h4>
        <div class="dbg-row"><select class="dbg-sel" id="dbg-joker"></select>${dbgBtn("+ Joker", "givejoker")}</div>
        <div class="dbg-row"><select class="dbg-sel" id="dbg-tarot"></select>${dbgBtn("+ Tarot", "givetarot")}</div>
        <div class="dbg-row"><select class="dbg-sel" id="dbg-planet"></select>${dbgBtn("+ Planet", "giveplanet")}</div>
        <div class="dbg-row">${dbgBtn("All vouchers", "allvouchers")}${dbgBtn("Every hand +1 lv", "levelall")}</div>
      </section>

      <section class="dbg-sec">
        <h4>Run</h4>
        <div class="dbg-row"><label class="dbg-f">Ante <input class="dbg-num" id="dbg-ante" type="number" min="1" max="8" placeholder="1"></label>${dbgBtn("Go", "setante")}</div>
        <div class="dbg-row">${dbgBtn("Win run", "winrun")}${dbgBtn("Game over", "lose")}${dbgBtn("Clear save", "clearsave", null, "dbg-danger")}</div>
      </section>
    </div>`;
  document.body.appendChild(el);

  // fill the item pickers (needs jokers.js / consumables.js loaded)
  const opt = list => list.map(x => `<option value="${x.id}">${x.name}</option>`).join("");
  const jk = el.querySelector("#dbg-joker"); if (jk) jk.innerHTML = opt(JOKERS);
  const tt = el.querySelector("#dbg-tarot"); if (tt) tt.innerHTML = opt(TAROTS);
  const pl = el.querySelector("#dbg-planet"); if (pl) pl.innerHTML = opt(PLANETS);

  // number inputs -> DEBUG
  el.querySelectorAll("[data-num]").forEach(inp => {
    inp.addEventListener("input", () => {
      const k = inp.dataset.num;
      const v = inp.value === "" ? null : Number(inp.value);
      DEBUG[k] = (v == null || Number.isNaN(v)) ? null : v;
      dbgApplyLive();
    });
  });
  // checkboxes -> DEBUG
  el.querySelectorAll("[data-flip]").forEach(chk => {
    chk.addEventListener("change", () => { DEBUG[chk.dataset.flip] = chk.checked; dbgApplyLive(); });
  });
  // segmented edition / rarity pickers
  el.querySelectorAll("[data-edition]").forEach(b => b.addEventListener("click", () => {
    DEBUG.editionForce = b.dataset.edition;
    el.querySelectorAll("[data-edition]").forEach(x => x.classList.toggle("on", x === b));
  }));
  el.querySelectorAll("[data-rarity]").forEach(b => b.addEventListener("click", () => {
    DEBUG.rarityForce = b.dataset.rarity;
    el.querySelectorAll("[data-rarity]").forEach(x => x.classList.toggle("on", x === b));
  }));
  el.querySelector('[data-edition=""]').classList.add("on");
  el.querySelector('[data-rarity=""]').classList.add("on");

  // action buttons
  el.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
    const fn = DBG_ACT[b.dataset.act];
    if (fn) fn(b.dataset.v);
  }));

  // collapse + close
  const body = el.querySelector("#dbg-body");
  el.querySelector("#dbg-collapse").addEventListener("click", () => {
    const col = el.classList.toggle("collapsed");
    el.querySelector("#dbg-collapse").textContent = col ? "▸" : "▾";
  });
  el.querySelector("#dbg-hide").addEventListener("click", () => {
    settings.debug = false; saveSettings(); applySettings();
  });

  // drag the panel around (it "floats")
  const head = el.querySelector("#dbg-head");
  let drag = null;
  head.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    const r = el.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  head.addEventListener("pointermove", e => {
    if (!drag) return;
    el.style.left = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - drag.dx)) + "px";
    el.style.top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - drag.dy)) + "px";
    el.style.right = "auto"; el.style.bottom = "auto";
  });
  head.addEventListener("pointerup", () => { drag = null; });
}

// re-render the game so live tweaks (sizes, slots) take effect immediately
function dbgApplyLive() {
  try { if (S) renderAll(); } catch (e) { /* not in a run yet */ }
}
