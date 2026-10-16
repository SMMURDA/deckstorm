// ═══════════════ DECKSTORM v2 — full Balatro-faithful core ═══════════════
"use strict";
const HAND_SIZE = 8, MAX_SELECT = 5, MAX_JOKERS = 5, MAX_CONS = 2;
const ANTE_TARGETS = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
// Endless Mode: Ante 9 ke atas. Angka pengali 1,6 per Ante adalah PENDEKATAN
// Deckstorm, bukan angka Balatro yang sudah diverifikasi - dicatat supaya jujur.
function dasarTarget(ante) {
  if (ante <= 8) return ANTE_TARGETS[ante - 1];
  let t = ANTE_TARGETS[7];
  for (let a = 9; a <= ante; a++) t = Math.round(t * 1.6);
  return t;
}
// Setiap Ante kelipatan 8 blind terakhirnya adalah Showdown.
function showdown() { return S.ante % 8 === 0; }
const SUIT_CLASS = { hearts: "red", diamonds: "red", spades: "black", clubs: "black" };
const $ = s => document.querySelector(s);

// ── clean vector suits ──
const SUIT_COLOR = { hearts: "#E23C50", diamonds: "#E23C50", spades: "#2B2B3A", clubs: "#2B2B3A" };
const SUIT_SHAPE = {
  hearts: "<path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/>",
  diamonds: "<path d='M12 1.6 22.4 12 12 22.4 1.6 12z'/>",
  spades: "<path d='M12 2C12 2 4.6 7.6 4.6 13.1c0 2.33 1.62 3.74 3.55 3.74 1.14 0 2.17-.55 2.87-1.5-.35 1.9-1.3 3.36-2.72 4.5h7.4c-1.42-1.14-2.37-2.6-2.72-4.5.7.95 1.73 1.5 2.87 1.5 1.93 0 3.55-1.41 3.55-3.74C19.4 7.6 12 2 12 2z'/>",
  clubs: "<circle cx='12' cy='7.4' r='4'/><circle cx='6.9' cy='14.7' r='4'/><circle cx='17.1' cy='14.7' r='4'/><path d='M10.4 14h3.2l1.3 8h-5.8z'/>",
};
function suitSVG(suit) {
  return `<svg viewBox='0 0 24 24' fill='${SUIT_COLOR[suit]}' aria-hidden='true'>${SUIT_SHAPE[suit]}</svg>`;
}

// ── settings (persisted; storage-safe) ──
const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
const settings = Object.assign({ sound: true, anim: true, debug: false,
  temaKartu: "piksel-asli" },
  store ? JSON.parse(store.getItem("deckstorm.settings") || "{}") : {});
// ── tema kartu ──
// Empat tema piksel dan empat tema halus. Tema halus digambar pada kanvas 4x
// lalu diperkecil, jadi tepinya tidak bergerigi. Berkas tiap tema lengkap:
// 52 kartu + punggung, seluruhnya hasil generator sendiri di tools/.
const TEMA_KARTU = [
  { id: "piksel-asli",  nama: "Piksel Klasik", jenis: "piksel" },
  { id: "piksel-neon",  nama: "Piksel Neon",   jenis: "piksel" },
  { id: "piksel-retro", nama: "Piksel Retro",  jenis: "piksel" },
  { id: "piksel-mono",  nama: "Piksel Mono",   jenis: "piksel" },
  { id: "klasik",       nama: "Klasik",        jenis: "halus" },
  { id: "royal",        nama: "Royal",         jenis: "halus" },
  { id: "neon",         nama: "Neon",          jenis: "halus" },
  { id: "kaca",         nama: "Kaca",          jenis: "halus" },
];
function temaKartu() {
  const t = settings.temaKartu;
  return TEMA_KARTU.some(x => x.id === t) ? t : "piksel-asli";
}
function jalurKartu(suit, berkas) {
  return `assets/img/cards/${temaKartu()}/${suit}/${berkas}.png`;
}
function jalurPunggung() { return `assets/img/cards/${temaKartu()}/back.png`; }

function saveSettings() { if (store) store.setItem("deckstorm.settings", JSON.stringify(settings)); }
function applySettings() {
  AudioFX.enabled = settings.sound;
  const selTemaNow = $("#set-tema");
  if (selTemaNow) selTemaNow.value = temaKartu();
  document.body.classList.toggle("reduced", !settings.anim);
  $("#set-sound").textContent = settings.sound ? "ON" : "OFF";
  $("#set-sound").classList.toggle("off", !settings.sound);
  $("#set-anim").textContent = settings.anim ? "ON" : "OFF";
  $("#set-anim").classList.toggle("off", !settings.anim);
  // debug / cheat mode
  DEBUG.on = !!settings.debug;
  const dbgToggle = $("#set-debug");
  if (dbgToggle) {
    dbgToggle.textContent = settings.debug ? "ON" : "OFF";
    dbgToggle.classList.toggle("off", !settings.debug);
  }
  const dbgPanel = document.getElementById("debug-panel");
  if (dbgPanel) dbgPanel.hidden = !settings.debug;
  if (S) renderAll();
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
    bonusHands: 0,    // from Handy Tag
    skipsThisAnte: 0, // Balatro: at most 2 skips per ante (Small + Big)
    pendingTag: null, // tag offered on the blind-select screen
    gameWon: false,
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
// ── debug-overridable limits (see js/debug.js) ──
// Setiap Joker ber-edisi Negative menambah satu slot Joker.
const jumlahNegative = () => (S && S.jokers)
  ? S.jokers.filter(j => j && j.edition === "negative").length : 0;
const maxJokers = () => challengeUbah(S).tanpaJoker ? 0 : dbgVal("jokers", Math.max(1,
  MAX_JOKERS + (deckUbah(S).slotJoker || 0)
  + (S.vouchers.has("antimatter") ? 1 : 0)
  + (challengeUbah(S).slotJoker || 0)));
const maxCons   = () => dbgVal("cons", Math.max(1,
  MAX_CONS + (deckUbah(S).slotKonsumabel || 0)
  + (S.vouchers.has("crystalball") ? 1 : 0)));
// boss effects (debuffs + special rules) can be switched off from the debug panel
// Chicot mematikan efek Boss Blind selama ia terpasang.
const bossActive = () => !!(S && S.boss && !(DEBUG.on && DEBUG.noBossEffect)
    && !punyaJoker("chicot") && !S.bossDimatikan);

// Ukuran tangan dan jumlah buang juga dipengaruhi Joker (Troubadour, Juggler,
// Drunkard, Merry Andy, Turtle Bean) lewat mesin efek.
const ukuranJoker = () => (typeof DSEfek !== "undefined" && DSEfek.ukuranTangan)
  ? DSEfek.ukuranTangan(S.jokers, (S.ante - 1) * 3 + S.blindIndex) : { tangan: 0, buang: 0 };
const handSize = () => dbgVal("handSize", Math.max(1,
  HAND_SIZE + (S.vouchers.has("paintbrush") ? 1 : 0)
    + (S.vouchers.has("palette") ? 1 : 0)
    + (bossActive() && S.boss.id === "manacle" ? -1 : 0) + ukuranJoker().tangan
    + (deckUbah(S).ukuranTangan || 0) + (challengeUbah(S).ukuranTangan || 0)));
const maxHands = () => dbgVal("hands", Math.max(1,
  4 + (S.vouchers.has("grabber") ? 1 : 0) + (deckUbah(S).tangan || 0)
  + (challengeUbah(S).tangan || 0)));
const maxDiscards = () => dbgVal("discards", Math.max(0,
  3 + (S.vouchers.has("wasteful") ? 1 : 0)
  + (S.vouchers.has("nachotong") ? 1 : 0) + ukuranJoker().buang
    + (deckUbah(S).buang || 0) + (stakeUbah(S).buang || 0)
  + (challengeUbah(S).buang || 0)));
// Green Deck mematikan bunga toko sepenuhnya
const interestCap = () => (deckUbah(S).bungaNol || challengeUbah(S).bungaNol) ? 0
    : (S.vouchers.has("moneytree") ? 20
     : S.vouchers.has("seedmoney") ? 10 : 5);
// how many jokers / packs the shop rolls up
const shopJokerCount = () => dbgVal("shopJokers",
  2 + (S.vouchers.has("overstock") ? 1 : 0)
    + (S.vouchers.has("overstockplus") ? 1 : 0));
const shopPackCount = () => dbgVal("shopPacks", 2);
const priceOf = item => {
  let p = item.cost + (item.edition ? EDITIONS[item.edition].priceAdd : 0);
  // Clearance Sale 25%, Liquidation 50%; keduanya bisa menumpuk
  if (S.vouchers.has("clearance")) p = Math.ceil(p * 0.75);
  if (S.vouchers.has("liquidation")) p = Math.ceil(p * 0.75);
  // Astronomer: seluruh kartu Planet menjadi gratis
  if (punyaJoker("astronomer") && PLANETS.some(x => x.id === item.id)) p = 0;
  return p;
};
const isBossDebuffed = c => bossActive() && S.boss.debuffSuit && c.suit === S.boss.debuffSuit && c.enhancement !== "wild" && c.enhancement !== "stone";

// ── save / continue (localStorage, autosave on every state change) ──
const SAVE_KEY = "deckstorm.save";
function serializeRun() {
  return {
    v: 3, sortMode,
    ante: S.ante, blindIndex: S.blindIndex, money: S.money,
    roundScore: S.roundScore, handsLeft: S.handsLeft, discardsLeft: S.discardsLeft,
    phase: (S.phase === "shop" || S.phase === "blindselect") ? S.phase : "play",
    rerollCost: S.rerollCost, deckTotal: S.deckTotal,
    deck: S.deck, hand: S.hand,
    handLevels: S.handLevels, stats: S.stats,
    bossId: S.boss ? S.boss.id : null,
    skipsThisAnte: S.skipsThisAnte || 0,
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
  // Deck yang dipilih diterapkan: pengubah tetap disimpan, efek awal
  // dijalankan. Berlaku di kedua jalur yang memulai run.
  const dk = DECKS.find(d => d.id === deckTerpilih) || DECKS[0];
  S.deckId = dk.id;
  
S.stakeId = stakeTerpilih;
S.challengeId = challengeTerpilih;
  // Efek awal Deck TIDAK dijalankan di sini: deck baru disusun di
  // startBlind(), sesudah baris ini. Dijalankan di sana lewat penanda.
  S.deckBelumDiterapkan = true;
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
  S.skipsThisAnte = d.skipsThisAnte || 0;

  if (S.phase === "shop") {
    showScreen("shop");
    renderShop();
    renderHud();
    renderJokers();
  } else if (S.phase === "blindselect") {
    renderHud();
    showBlindSelect();
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
// Deck yang dipilih pemain. Bisa diganti lewat DS.setDeck(id).
let deckTerpilih = "red";
// Stake yang dipilih pemain. Bisa diganti lewat DS.setStake(id).
let stakeTerpilih = "white";
// Challenge yang dipilih. Bisa diganti lewat DS.setChallenge(id).
let challengeTerpilih = "polos";
function setChallenge(id) {
  if (typeof CHALLENGES !== "undefined" && CHALLENGES.some(c => c.id === id)) {
    challengeTerpilih = id; return true;
  }
  return false;
}
function setStake(id) {
  if (typeof STAKES !== "undefined" && STAKES.some(s => s.id === id)) {
    stakeTerpilih = id; return true;
  }
  return false;
}
function setDeck(id) {
  if (typeof DECKS !== "undefined" && DECKS.some(d => d.id === id)) {
    deckTerpilih = id; return true;
  }
  return false;
}

function newRun() {
  S = freshState();
  // Deck yang dipilih diterapkan: pengubah tetap disimpan, efek awal
  // dijalankan. Berlaku di kedua jalur yang memulai run.
  const dk = DECKS.find(d => d.id === deckTerpilih) || DECKS[0];
  S.deckId = dk.id;
  
S.stakeId = stakeTerpilih;
S.challengeId = challengeTerpilih;
  // Efek awal Deck TIDAK dijalankan di sini: deck baru disusun di
  // startBlind(), sesudah baris ini. Dijalankan di sana lewat penanda.
  S.deckBelumDiterapkan = true;
  sortMode = "rank";
  startBlind();
}

// Kartu yang dilemahkan Boss Blind. Boss dengan debuff.suit melemahkan
// seluruh kartu bergambar suit itu, debuff.face melemahkan kartu wajah.
function debuffAktif(kartu) {
  if (!kartu || !bossActive()) return false;
  if (bossActive() && S.boss && S.boss.id === "verdant" && !S.verdantLunas) return true;
  // The Pillar melemahkan kartu yang sudah dimainkan di Ante ini.
  if (bossActive() && S.boss && S.boss.id === "pillar"
      && (S.kartuTerpakaiAnte || []).indexOf(kartu.id) >= 0) return true;
  if (!S.boss || !S.boss.debuff) return false;
  const d = S.boss.debuff;
  if (d.suit && kartu.suit === d.suit) return true;
  if (d.face && kartu.rank >= 11) return true;
  return false;
}

// Pengali peluang munculnya edisi pada Joker di toko. Hone 2x, Glow Up 4x.
// Glow Up adalah tingkat di atas Hone, jadi tidak menumpuk.
// Voucher yang efeknya berlaku SEKETIKA saat dibeli. Voucher lain cukup
// dibaca dari S.vouchers lewat fungsi yang memakainya.
function terapkanVoucher(St, v) {
  if (!v) return;
  if (v.id === "hieroglyph" || v.id === "petroglyph") {
    // Turunkan Ante satu tingkat, tidak pernah di bawah 1.
    St.ante = Math.max(1, St.ante - 1);
    showToast(v.name + ": Ante turun ke " + St.ante);
  }
}

// Slot kartu di toko menjual CAMPURAN Joker, Tarot, dan Planet.
// Bobot 5 : 1 : 1 memberi Joker 71,4% dan Tarot serta Planet 14,3%
// masing-masing - angka Balatro yang sudah diverifikasi.
function bobotToko() {
  const b = { joker: 5, tarot: 1, planet: 1, kartu: 0 };
  if (S.vouchers.has("tarottycoon")) b.tarot *= 4;
  else if (S.vouchers.has("tarotmerchant")) b.tarot *= 2;
  if (S.vouchers.has("planettycoon")) b.planet *= 4;
  // Magic Trick: kartu bermain mulai dijual di toko. Bobot 1 adalah
  // pilihan Deckstorm (angka Balatro untuk ini tidak bisa saya verifikasi).
  if (S.vouchers.has("magictrick")) b.kartu = 1;
  else if (S.vouchers.has("planetmerchant")) b.planet *= 2;
  return b;
}
// Tawaran berupa satu kartu bermain. Dengan Illusion, kartunya bisa
// datang sudah ber-enhancement, ber-edisi, dan/atau ber-seal.
function buatTawaranKartu() {
  const dasar = buildDeck()[Math.floor(Math.random() * 52)];
  const k = Object.assign({}, dasar, { kind: "kartu", cost: 2,
    id: dasar.id + "-beli" + Math.floor(Math.random() * 1e9) });
  if (S.vouchers.has("illusion")) {
    const enh = ["bonus", "mult", "wild", "glass", "steel", "stone", "gold", "lucky"];
    const seal = ["red", "blue", "gold", "purple"];
    const edisi = ["foil", "holo", "poly", "negative"];
    const pilih = (arr) => arr[Math.floor(Math.random() * arr.length)];
    // Tidak semua bagian pasti muncul; kadang hanya salah satu.
    if (Math.random() < 0.5) k.enhancement = pilih(enh);
    if (Math.random() < 0.35) k.seal = pilih(seal);
    if (Math.random() < 0.2) k.edition = pilih(edisi);
  }
  return k;
}

function rollShopCards(n) {
  const b = bobotToko();
  const total = b.joker + b.tarot + b.planet + b.kartu;
  const jenis = [];
  for (let i = 0; i < n; i++) {
    const r = Math.random() * total;
    jenis.push(r < b.joker ? "joker" : r < b.joker + b.tarot ? "tarot"
      : r < b.joker + b.tarot + b.planet ? "planet" : "kartu");
  }
  const nJoker = jenis.filter(x => x === "joker").length;
  // Planet TIDAK memakai bidang apply (levelnya diurus jalur pemakaian
  // tersendiri), jadi penyaringan apply hanya berlaku untuk Tarot. Filter
  // yang sama untuk Planet membuat kolamnya kosong dan Planet tidak pernah
  // muncul sama sekali - itu yang terjadi sebelum baris ini diperbaiki.
  const ambil = (arr, k, perluApply) => arr
    .filter(x => !perluApply || typeof x.apply === "function")
    .sort(() => Math.random() - 0.5).slice(0, k).map(x => Object.assign({}, x));
  const hasil = nJoker
    ? rollShopJokers(nJoker, punyaJoker("showman") ? new Set() : new Set(S.jokers.map(j => j.id)), faktorEdisi(S))
    : [];
  ambil(TAROTS, jenis.filter(x => x === "tarot").length, true)
    .concat(ambil(PLANETS, jenis.filter(x => x === "planet").length, false))
    .forEach(x => hasil.push(x));
    const nKartu = jenis.filter(x => x === "kartu").length;
    for (let i = 0; i < nKartu; i++) hasil.push(buatTawaranKartu());
  return hasil;
}

function faktorEdisi(St) {
  if (St.vouchers.has("glowup")) return 4;
  if (St.vouchers.has("hone")) return 2;
  return 1;
}

function blindTarget() {
  const base = dasarTarget(S.ante);
  const mult = S.blindIndex === 0 ? 1 : S.blindIndex === 1 ? 1.5 : (S.boss ? (S.boss.targetMult || 2) : 2);
  // Green dan Purple Stake menaikkan laju kenaikan target antar Ante.
  // Angka 8% per Ante per tingkat adalah pendekatan Deckstorm, bukan
  // angka Balatro yang sudah diverifikasi - dicatat supaya jujur.
  const laju = (stakeUbah(S).lajuTarget || 0) * 0.08 * (S.ante - 1);
  return Math.round(base * mult * (1 + laju) * (challengeUbah(S).targetKali || 1));
}
function blindName() {
  return S.blindIndex === 2 ? (showdown() ? "Showdown" : S.boss.name)
    : (S.blindIndex === 0 ? "Small Blind" : "Big Blind");
}
// Red Stake: Small Blind tidak memberi hadiah uang
function blindReward() {
  if (S.blindIndex === 0 && stakeUbah(S).kecilTanpaHadiah) return 0;
  if (S.blindIndex === 2) return showdown() ? 8 : 5;
  return S.blindIndex === 1 ? 4 : 3;
}

// Menambah kartu baru ke deck. Dipakai Joker pembuat kartu (DNA, Marble Joker).
// Id diberi awalan "buat-" supaya tidak bertabrakan dengan kartu bawaan deck
// maupun kartu yang sedang di tangan.
function tambahKartuKeDeck(rank, suit, enhancement) {
  if (!S) return null;
  const kartu = {
    rank,
    suit,
    enhancement: enhancement || null,
    id: "buat-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
  };
  S.deck.push(kartu);
  if (typeof S.deckTotal === "number") S.deckTotal += 1;
  return kartu;
}

// Riff-Raff memakai ini untuk menambah Joker Common acak.
function tambahJokerAcak(kelangkaan) {
  if (!S || S.jokers.length >= maxJokers()) return null;
  const kolam = JOKERS.filter(j => j.rarity === (kelangkaan || "common") && !j.legendary);
  if (!kolam.length) return null;
  const pilih = kolam[Math.floor(Math.random() * kolam.length)];
  if (S.jokers.some(j => j.id === pilih.id)) return null;
  S.jokers.push(Object.assign({}, pilih));
  return pilih;
}

// 8 Ball dan Hallucination memakai ini untuk membuat Tarot.
function tambahKonsumabelAcak(jenis) {
  if (!S || S.consumables.length >= maxCons()) return null;
  // Kartu yang efeknya belum dibuat (apply null) tidak boleh muncul, supaya
  // tidak ada yang tampak bekerja padahal tidak.
  let kolam = jenis === "tarot" ? TAROTS : jenis === "spectral" ? SPECTRALS : PLANETS;
  if (jenis === "spectral") kolam = kolam.filter(x => typeof x.apply === "function");
  if (!kolam || !kolam.length) return null;
  const pilih = kolam[Math.floor(Math.random() * kolam.length)];
  S.consumables.push(Object.assign({}, pilih));
  return pilih;
}

function punyaJoker(id) {
  return !!(S && S.jokers && S.jokers.some(j => j.id === id));
}

function startBlind() {
// Card Sharp mencatat bentuk tangan yang sudah dimainkan babak ini.
S.jenisTanganBabak = [];
// Boss kartu tertutup direset tiap babak.
S.tertutup = new Set();
S.drawKe = 0;
// The Idol: kartu pilihannya berganti tiap babak, diambil dari deck
if (punyaJoker("the-idol") && S.deck && S.deck.length) {
  const dasar = S.deck[Math.floor(Math.random() * S.deck.length)];
  S.idolTarget = { rank: dasar.rank, suit: dasar.suit };
} else {
  S.idolTarget = null;
}
  S.phase = "play";
  S.animating = false;
  S.deck = shuffle(buildDeck());
  // Kartu yang sudah dihancurkan tidak ikut dibangun ulang. Sebelum ini,
  // kartu hancur (Sixth Sense) kembali muncul di babak berikutnya karena
  // deck disusun ulang dari nol tiap babak.
  if (S.deckHancur && S.deckHancur.size) {
    S.deck = S.deck.filter(c => !S.deckHancur.has(c.id));
    S.deckTotal = Math.max(0, 52 - S.deckHancur.size);
  }

  // Kartu bermain yang dibeli dari toko (Magic Trick) ikut disusun tiap
  // babak. Tanpa ini, kartu yang dibeli akan hilang di babak berikutnya.
  if (S.deckTambahan && S.deckTambahan.length) {
    S.deck.push(...S.deckTambahan.map(c => ({ ...c })));
  }
  S.deckTotal = S.deck.length;
  // Efek awal Deck dijalankan di sini karena deck baru saja disusun.
  // Penanda mencegahnya berjalan lagi di babak-babak berikutnya.
  if (S.deckBelumDiterapkan) {
    S.deckBelumDiterapkan = false;
    const dkAwal = DECKS.find(d => d.id === S.deckId);
    if (dkAwal && typeof dkAwal.apply === "function") dkAwal.apply(S);
    terapkanChallenge(S);
  }
  S.deckTotal = S.deck.length;
  S.hand = [];
  S.selected.clear();
  S.freshIds.clear();
  S.targetMode = null;
  S.roundScore = 0;
  S.boss = null;
  if (S.blindIndex === 2) S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];

  // Amber Acorn: Joker dibalik dan diacak. Ini berefek sungguhan karena
  // urutan Joker kiri ke kanan menentukan urutan aktivasi.
  if (bossActive() && S.boss && S.boss.id === "amber" && S.jokers.length > 1) {
    for (let i = S.jokers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [S.jokers[i], S.jokers[j]] = [S.jokers[j], S.jokers[i]];
    }
    showToast("Amber Acorn: urutan Joker diacak");
  }
  S.handsLeft = bossActive() && S.boss.id === "needle" ? 1 : maxHands();
  if (S.bonusHands) { S.handsLeft += S.bonusHands; S.bonusHands = 0; }
  S.discardsLeft = bossActive() && S.boss.id === "water" ? 0 : maxDiscards();

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
  // Perkeo: di akhir toko, satu konsumabel acak yang dimiliki disalin.
  // Salinan hanya dibuat bila masih ada slot kosong.
  if (punyaJoker("perkeo") && S.consumables.length
      && S.consumables.length < maxCons()) {
    const asal = S.consumables[Math.floor(Math.random() * S.consumables.length)];
    S.consumables.push(Object.assign({}, asal));
    showToast("Perkeo: " + asal.name + " disalin");
  }
  AudioFX.play("click");
  advanceBlindIndex();
  if (S.gameWon) return; // winRun already fired
  showBlindSelect();
}

function advanceBlindIndex() {
  if (S.blindIndex === 2) {
    S.ante++;
    S.blindIndex = 0;
    S.skipsThisAnte = 0; // fresh ante → skips available again
    S.bossReroll = 0; // Director's Cut tersedia lagi di Ante baru
    S.kartuTerpakaiAnte = []; // The Pillar hanya berlaku dalam satu Ante
    S.boss = null;
    // Ante 8 adalah Showdown terakhir pada run biasa. Bila pemain memilih
    // Endless, run berlanjut sampai batas praktis Ante 39.
    if (S.ante === 9 && !S.endless) { winRun(); return; }
    if (S.ante > 39) { winRun(); return; }
  } else {
    S.blindIndex++;
    // landing on the boss blind: roll it now so targets/renders are valid
    if (S.blindIndex === 2) S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
    else S.boss = null;
  }
}

// Balatro rule: only Small and Big Blinds are skippable (max 2 per ante).
// The Boss Blind must always be fought.
const MAX_SKIPS_PER_ANTE = 2;
function canSkipCurrentBlind() {
  return S.blindIndex !== 2 && (S.skipsThisAnte || 0) < MAX_SKIPS_PER_ANTE;
}

// ── blind select: play or skip for a tag ──
const SKIP_TAGS = [
  { id: "coin",    name: "Coin Tag",    desc: "+$5",                apply: () => { S.money += 5; return "+$5"; } },
  { id: "charm",   name: "Charm Tag",   desc: "Free Tarot card",    apply: () => { if (S.consumables.length >= maxCons()) return null; const t = TAROTS[Math.floor(Math.random() * TAROTS.length)]; S.consumables.push({ ...t }); return t.name; } },
  { id: "meteor",  name: "Meteor Tag",  desc: "Free Planet card",   apply: () => { if (S.consumables.length >= maxCons()) return null; const p = PLANETS[Math.floor(Math.random() * PLANETS.length)]; S.consumables.push({ ...p }); return p.name; } },
  { id: "buffoon", name: "Buffoon Tag", desc: "Free Joker",         apply: () => { if (S.jokers.length >= maxJokers()) return null; const pool = JOKERS.filter(j => !S.jokers.some(o => o.id === j.id)); if (!pool.length) return null; const j = makeJoker(pool[Math.floor(Math.random() * pool.length)]); S.jokers.push(j); return j.name; } },
  { id: "handy",   name: "Handy Tag",   desc: "+1 Hand next round", apply: () => { S.bonusHands = (S.bonusHands || 0) + 1; return "+1 hand"; } },
  { id: "ethereal", name: "Ethereal Tag", desc: "Kartu Spectral gratis",
    apply: () => { const k = tambahKonsumabelAcak("spectral"); return k ? "Kartu " + k.name + " didapat" : "Slot konsumabel penuh"; } },
  { id: "garbage",  name: "Garbage Tag",  desc: "+$1 tiap buang yang tidak terpakai",
    apply: () => { const u = S.discardsLeft; S.money += u; return "$" + u + " didapat"; } },
  // Dua Tag ini TAFSIRAN DECKSTORM, bukan salinan aturan Balatro: aturan
  // Tag Balatro tidak bisa saya verifikasi (situsnya menolak akses). Di
  // Balatro, Standard Tag membuka Standard Pack, sedangkan Deckstorm tidak
  // punya paket itu - jadi di sini isinya langsung berupa kartu bermain.
  { id: "standard", name: "Standard Tag", desc: "Kartu bermain acak masuk deck",
    apply: () => {
      const k = buatTawaranKartu();
      S.deckTambahan = S.deckTambahan || [];
      S.deckTambahan.push(Object.assign({}, k, { kind: undefined }));
      S.deckTotal = (S.deckTotal || 52) + 1;
      return "Kartu " + (k.name || (k.rank + " " + k.suit)) + " masuk deck"; } },
  { id: "charismatic", name: "Charismatic Tag", desc: "Kartu bermain ber-seal masuk deck",
    apply: () => {
      const k = buatTawaranKartu();
      k.seal = ["red", "blue", "gold", "purple"][Math.floor(Math.random() * 4)];
      S.deckTambahan = S.deckTambahan || [];
      S.deckTambahan.push(Object.assign({}, k, { kind: undefined }));
      S.deckTotal = (S.deckTotal || 52) + 1;
      return "Kartu bersegel " + k.seal + " masuk deck"; } },
  { id: "economy",  name: "Economy Tag",  desc: "Uang menjadi dua kali, maksimal $40",
    apply: () => { const d = Math.min(S.money, 40); S.money += d; return "$" + d + " didapat"; } },
  { id: "topup",    name: "Top-up Tag",   desc: "Dua Joker Common gratis",
    apply: () => { let n = 0; for (let i = 0; i < 2; i++) if (tambahJokerAcak("common")) n++; return n ? n + " Joker didapat" : "Slot Joker penuh"; } },
  { id: "rare",     name: "Rare Tag",     desc: "Joker Rare gratis",
    apply: () => { const j = tambahJokerAcak("rare"); return j ? j.name + " didapat" : "Slot penuh atau tidak ada Joker Rare"; } },
  { id: "orbital",  name: "Orbital Tag",  desc: "Bentuk tangan tersering naik 1 level",
    apply: () => { const k = "Flush"; S.handLevels[k] = (S.handLevels[k] || 1) + 1; return k + " naik ke Lv." + S.handLevels[k]; } },
  { id: "investment", name: "Investment Tag", desc: "+$25 setelah mengalahkan Boss Blind",
    apply: () => { S.investasi = true; return "Hadiah $25 disiapkan"; } },
  { id: "voucher",  name: "Voucher Tag",  desc: "Toko berikutnya menambah satu Voucher",
    apply: () => { S.voucherTambahan = (S.voucherTambahan || 0) + 1; return "Voucher tambahan disiapkan"; } },
  { id: "coupon",   name: "Coupon Tag",   desc: "Barang toko berikutnya gratis",
    apply: () => { S.kuponGratis = true; return "Satu barang gratis disiapkan"; } },
  { id: "d6",       name: "D6 Tag",       desc: "Guling ulang toko berikutnya gratis",
    apply: () => { S.chaosGratis = true; return "Satu guling ulang gratis disiapkan"; } },
  { id: "boss",     name: "Boss Tag",     desc: "Ganti Boss Blind yang sedang berlaku",
    apply: () => { if (typeof BOSSES !== "undefined") S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)]; return "Boss Blind diganti"; } },
  { id: "foil",     name: "Foil Tag",     desc: "Joker dasar berikutnya ber-edisi Foil",
    apply: () => { S.edisiBerikut = "foil"; return "Foil disiapkan"; } },
  { id: "holo",     name: "Holo Tag",     desc: "Joker dasar berikutnya ber-edisi Holographic",
    apply: () => { S.edisiBerikut = "holo"; return "Holographic disiapkan"; } },
  { id: "poly",     name: "Poly Tag",     desc: "Joker dasar berikutnya ber-edisi Polychrome",
    apply: () => { S.edisiBerikut = "poly"; return "Polychrome disiapkan"; } },
  { id: "negative", name: "Negative Tag", desc: "Joker dasar berikutnya ber-edisi Negative",
    apply: () => { S.edisiBerikut = "negative"; return "Negative disiapkan"; } },
  { id: "double",   name: "Double Tag",   desc: "Tag berikutnya menjadi ganda",
    apply: () => { S.tagGanda = true; return "Tag berikutnya menjadi ganda"; } },
  { id: "speed",    name: "Speed Tag",    desc: "+$5 tiap Blind yang dilewati",
    apply: () => { const n = S.skipsThisAnte || 0; S.money += 5 * n; return "$" + (5 * n) + " didapat"; } },
];

function showBlindSelect() {
  S.phase = "blindselect";
  const kind = S.blindIndex === 0 ? "small" : S.blindIndex === 1 ? "big" : "boss";
  if (kind === "boss") S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
  else S.boss = null;

  const badge = $("#bs-badge");
  badge.className = "blind-select-badge blind-" + kind;
  badge.innerHTML = iconSVG(kind === "boss" ? "death" : kind === "big" ? "blind_big" : "blind_small");
  $("#bs-name").textContent = kind === "boss" ? S.boss.name : (kind === "big" ? "Big Blind" : "Small Blind");
  $("#bs-target").textContent = blindTarget().toLocaleString();
  $("#bs-reward").textContent = "$" + blindReward();
  const bossEl = $("#bs-boss");
  if (kind === "boss") { bossEl.hidden = false; bossEl.textContent = S.boss.desc; }
  else bossEl.hidden = true;

  // Balatro rule: only Small and Big Blinds can be skipped (max 2 per ante)
  const canSkip = canSkipCurrentBlind();
  const skipBtn = $("#btn-skip-blind");
  skipBtn.hidden = !canSkip;
  // Director's Cut (sekali per Ante) dan Retcon (bebas) mengganti Boss Blind.
  const rerollBtn = $("#btn-reroll-boss");
  if (rerollBtn) {
    const punyaRetcon = S.vouchers.has("retcon");
    const punyaCut = S.vouchers.has("directorscut");
    const sisa = Math.max(0, 1 - (S.bossReroll || 0));
    const boleh = kind === "boss" && (punyaRetcon || (punyaCut && sisa > 0));
    rerollBtn.hidden = !boleh;
    if (boleh) {
      rerollBtn.textContent = punyaRetcon ? "Ganti Boss (bebas)"
        : "Ganti Boss (" + sisa + " tersisa)";
      rerollBtn.onclick = () => {
        if (kind !== "boss") return;
        if (!punyaRetcon && (S.bossReroll || 0) >= 1) { AudioFX.play("error"); return; }
        S.bossReroll = (S.bossReroll || 0) + 1;
        S.boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
        AudioFX.play("click");
        showBlindSelect();
      };
    }
  }
  const hint = $(".blind-select-hint");
  if (hint) {
    if (S.blindIndex === 2) hint.innerHTML = "<b>Boss Blinds cannot be skipped</b> — defeat it to clear the ante.";
    else if (!canSkip) hint.innerHTML = "No skips left this ante — play the blind.";
    else hint.innerHTML = "Skipping forfeits this blind's reward but grants a <b>Tag</b> bonus.";
  }

  if (canSkip) renderBlindTag();
  showScreen("blind");
}

function renderBlindTag() {
  const el = $("#btn-skip-blind");
  if (!el) return;
  const tag = SKIP_TAGS[Math.floor(Math.random() * SKIP_TAGS.length)];
  S.pendingTag = tag;
  const lbl = el.querySelector(".lbl");
  if (lbl) lbl.textContent = "Skip → " + tag.desc;
}

function skipBlind() {
  tambahPencatat("throwback", 1);
  // Marble Joker: menambah satu kartu Stone setiap Blind dimulai
  if (punyaJoker("marble-joker")) tambahKartuKeDeck(14, "spades", "stone");
  // Riff-Raff: menambah dua Joker Common saat Blind dimulai
  if (punyaJoker("riff-raff")) {
    const a = tambahJokerAcak("common");
    const b = tambahJokerAcak("common");
    if (a || b) showToast("Riff-Raff: Joker Common ditambahkan");
  }
  const tag = S.pendingTag || SKIP_TAGS[0];
  const res = tag.apply();
  if (res === null) {
    // no room for the tag reward — fall back to coins
    S.money += 5;
    showToast("No room for " + tag.name + " → +$5");
  } else {
    showToast(tag.name + ": " + tag.desc + " (" + res + ")");
  }
  S.skipsThisAnte = (S.skipsThisAnte || 0) + 1;
  AudioFX.play("coin");
  advanceBlindIndex();
  if (S.gameWon) return;
  renderAll();
  showBlindSelect();
}

function playSelectedBlind() {
  AudioFX.play("click");
  startBlind();
}

// ── drawing / sorting ──
// Pencatat keadaan Joker: angka yang naik sepanjang run (Burnt Joker, Ramen,
// Hit the Road, Throwback). Dibaca mesin efek dari joker.tumpukan.
function tambahPencatat(id, jumlah) {
  if (!S || !jumlah) return;
  S.jokers.forEach(j => { if (j.id === id) j.tumpukan = (j.tumpukan || 0) + jumlah; });
}

// Menandai kartu yang ditarik sebagai tertutup, sesuai boss yang berlaku.
// House: hanya hand pertama babak ini. Wheel: 1 dari 7 kartu.
// Fish: tiap penarikan sesudah hand pertama. Mark: hanya kartu wajah.
function tandaiTertutup(kartu) {
  if (!S.tertutup) S.tertutup = new Set();
  [...S.tertutup].forEach(id => {
    if (!S.hand.some(c => c.id === id)) S.tertutup.delete(id);
  });
  if (!bossActive() || !S.boss || !kartu || !kartu.length) return;
  const b = S.boss.id;
  const ke = S.drawKe || 0;
  if (b === "house" && ke === 0) kartu.forEach(c => S.tertutup.add(c.id));
  else if (b === "wheel") kartu.forEach(c => { if (Math.random() < 1 / 7) S.tertutup.add(c.id); });
  else if (b === "fish" && ke > 0) kartu.forEach(c => S.tertutup.add(c.id));
  else if (b === "mark") kartu.forEach(c => { if (c.rank >= 11) S.tertutup.add(c.id); });
}

function drawUp() {
  // Cerulean Bell: satu kartu selalu terpilih dan tidak dapat dilepas.
  // Diletakkan SEBELUM keluar-lebih-awal, karena saat tangan sudah penuh
  // fungsi ini tetap harus memastikan kartu wajibnya terpilih.
  if (bossActive() && S.boss && S.boss.id === "cerulean" && S.hand.length) {
    if (!S.kartuWajib || !S.hand.some(c => c.id === S.kartuWajib)) {
      S.kartuWajib = S.hand[Math.floor(Math.random() * S.hand.length)].id;
    }
    S.selected.add(S.kartuWajib);
  } else {
    S.kartuWajib = null;
  }
  // The Serpent: setelah main atau buang, selalu menarik TEPAT 3 kartu,
  // bukan mengisi tangan sampai penuh. Batas ukuran tangan tetap berlaku.
  const serpent = bossActive() && S.boss && S.boss.id === "serpent";
  const kurang = handSize() - S.hand.length;
  const need = serpent ? Math.min(3, kurang) : kurang;
  if (need <= 0) return;
  const drawn = S.deck.splice(0, need);
  drawn.forEach(c => S.freshIds.add(c.id));
  S.hand.push(...drawn);
  // Boss kartu tertutup menandai kartu yang baru ditarik.
  tandaiTertutup(drawn);
  S.drawKe = (S.drawKe || 0) + 1;
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
  ATURAN_TANGAN = typeof DSEfek !== "undefined" && DSEfek.aturanTangan
    ? DSEfek.aturanTangan(S.jokers) : ATURAN_TANGAN;
  return evaluateHand(S.hand.filter(c => S.selected.has(c.id)));
}

function scorePlayed() {
  // Crimson Heart: satu Joker acak dimatikan untuk hand ini. Dipilih di sini
  // supaya berganti tiap hand, bukan sekali per babak.
  if (bossActive() && S.boss && S.boss.id === "crimson" && S.jokers.length) {
    S.jokerMati = S.jokers[Math.floor(Math.random() * S.jokers.length)].id;
  } else {
    S.jokerMati = null;
  }
  const played = S.hand.filter(c => S.selected.has(c.id));
  ATURAN_TANGAN = typeof DSEfek !== "undefined" && DSEfek.aturanTangan
    ? DSEfek.aturanTangan(S.jokers) : ATURAN_TANGAN;
  // Splash membuat semua kartu yang dimainkan ikut dinilai
  const ev = typeof terapkanSplash === "function"
    ? terapkanSplash(evaluateHand(played), played)
    : evaluateHand(played);
  const hv = handValue(ev.name);
  let chips = hv.chips, mult = hv.mult;
  const scoringCards = played.filter(c => ev.scoringIds.has(c.id));
  const heldCards = S.hand.filter(c => !S.selected.has(c.id));
  const destroyed = [];
  const flashes = [];
  let firstScoringFace = false, sawFace = false, debuffedCount = 0;

  // 1. per-card triggers (Balatro order: each scoring card, left to right)
  // Seal pada kartu yang dinilai:
  //   Merah  - kartu dinilai dua kali (chips dan efeknya berlipat)
  //   Emas   - memberi $3 tiap kali kartu dinilai
  // Seal Biru (Planet tiap akhir babak) dan Ungu (Tarot saat dibuang)
  // ditangani di kejadian masing-masing.
  scoringCards.forEach(c => {
    const sealKali = c.seal === "red" ? 2 : 1;
    if (c.seal === "gold") S.money += 3;
    if (isBossDebuffed(c)) { debuffedCount++; return; } // debuffed: no chips, no effects
    chips += cardChips(c) * sealKali;
    if (isFace(c)) { if (!sawFace) firstScoringFace = true; sawFace = true; }
    switch (c.enhancement) {
      case "bonus": chips += 30 * sealKali; break;
      case "mult": mult += 4 * sealKali; break;
      case "glass":
        mult *= Math.pow(2, sealKali);
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
    deckCount: S.deck.length, deckCards: S.deck,
    jenisTanganBabak: S.jenisTanganBabak || [],
    idol: S.idolTarget || null,
    debuff: debuffAktif,
    flint: bossActive() && S.boss && S.boss.id === "flint",
      stats: S.stats, money: S.money,
    emptySlots: maxJokers() - S.jokers.length,
    firstScoringFace,
  });
  S.jokers.forEach((j, idx) => {
    // Joker yang dimatikan Crimson Heart tidak ikut dinilai sama sekali.
    if (S.jokerMati && j.id === S.jokerMati) return;
    let label = null;
    // Jembatan ke mesin efek: penangan khusus (Popcorn, Ramen, Baron, dan
    // sejenisnya) ikut terpakai, bukan hanya efek sederhana dari data.
    const konteks = Object.assign(ctx(), {
      jokerSelf: j, jokerCount: S.jokers.length, allJokers: S.jokers,
      ante: S.ante, blindIndex: S.blindIndex,
    });
    // Dua bug nyata di sini, keduanya terbukti dengan menyadap DSEfek.efekLengkap
    // pada jalur permainan sebenarnya:
    //
    // 1. Mesin efek mengembalikan NOL untuk Joker yang justru punya efek tertulis.
    //    Terukur: "Joker" (yang efeknya +4 Mult) -> { mult: 0 }, sehingga Joker
    //    polos itu tidak menambah apa pun. Karena itu, kalau mesin tidak
    //    menghasilkan apa-apa sementara j.effect ada, efek tertulisnya yang
    //    dipakai.
    // 2. Cadangan { mult: 4 } untuk Joker tanpa properti effect membuat Joker
    //    yang sebenarnya tidak menambah Mult ikut menambah +4 Mult. Terukur:
    //    "Juggler" (yang efeknya menambah satu slot kartu, bukan Mult) muncul di
    //    daftar perhitungan sebagai "+4 Mult". Cadangan itu dibuang.
    let r = j.effect
      ? (typeof DSEfek !== "undefined" && DSEfek.efekLengkap
          ? DSEfek.efekLengkap(j, konteks)
          : j.effect(konteks))
      : null;
    const tanpaEfek = (x) => !x || (!x.chips && !x.mult && (!x.xmult || x.xmult === 1) && !x.money);
    if (tanpaEfek(r) && typeof j.effect === "function") {
      let r2 = null;
      try { r2 = j.effect(konteks); } catch (e) { r2 = null; }
      if (!tanpaEfek(r2)) r = r2;
    }
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

    // Label disusun dari NILAI YANG BENAR-BENAR DIBERIKAN, bukan hanya dari
    // r.label. Mesin efek sering mengembalikan { mult: 4 } tanpa field label,
    // sehingga hampir semua Joker tidak pernah masuk daftar kilat dan pemain
    // melihat seolah tidak ada Joker yang bekerja - itu penyebab keluhan
    // "joker mana yang terpakai tidak kelihatan".
    if (!label) {
      const bagian = [];
      // Nilai netral (mult 0, xmult 1) tidak ditampilkan: mesin efek selalu
      // mengembalikan seluruh kunci, dan "x1 Mult" pada Joker yang tidak mengali
      // apa pun hanya menambah kebisingan.
      if (r && r.chips) bagian.push("+" + r.chips + " Chips");
      if (r && r.mult) bagian.push("+" + r.mult + " Mult");
      if (r && r.xmult && r.xmult !== 1) bagian.push("x" + r.xmult + " Mult");
      if (r && r.money) bagian.push("+$" + r.money);
      if (j.edition) bagian.push(EDITIONS[j.edition].desc);
      label = bagian.length ? bagian.join(" · ") : null;
    }
    if (label) flashes.push({ idx, nama: j.name || j.nama || "Joker", label });
  });

  // Observatory: setiap kartu Planet di area konsumabel memberi x1,5 Mult.
  // Diletakkan tepat sebelum Mult dikunci, karena setelah baris return di
  // bawah ini nilainya sudah menjadi skor dan tidak bisa diubah lagi.
  if (S.vouchers.has("observatory")) {
    const nPl = (S.consumables || []).filter(c => c.kind === "planet").length;
    if (nPl > 0) mult *= Math.pow(1.5, nPl);
  }
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
  // The Eye dan The Mouth membatasi bentuk tangan yang boleh dimainkan.
  if (bossActive() && (S.boss.id === "eye" || S.boss.id === "mouth") && S.selected.size > 0) {
    const ev0 = evaluateHand([...S.selected]);
    const nama0 = (ev0 && ev0.ev && ev0.ev.name) || (ev0 && ev0.name) || "";
    const sudah = S.jenisTanganBabak || [];
    const salah = S.boss.id === "eye"
      ? sudah.indexOf(nama0) >= 0
      : sudah.length > 0 && sudah.indexOf(nama0) < 0;
    if (salah) {
      showToast(S.boss.name + (S.boss.id === "eye"
        ? ": bentuk tangan ini sudah dimainkan di babak ini"
        : ": hanya boleh satu bentuk tangan di babak ini"));
      AudioFX.play("error");
      shakeEl($("#btn-play"));
      return;
    }
  }
  if (bossActive() && S.boss.id === "psychic" && S.selected.size !== 5) {
    showToast("The Psychic: must play exactly 5 cards");
    AudioFX.play("error");
    shakeEl($("#btn-play"));
    return;
  }
  S.animating = true;
  refreshControls();
  AudioFX.play("play");
// DNA: bila hanya satu kartu dimainkan, kartu itu disalin ke deck
if (S.selected.size === 1 && punyaJoker("dna")) {
  const asal = S.hand.find(c => S.selected.has(c.id));
  if (asal) {
    tambahKartuKeDeck(asal.rank, asal.suit, asal.enhancement);
    showToast("DNA: kartu disalin ke deck");
  }
}
// 8 Ball: tiap kartu 8 yang dimainkan berpeluang 1 banding 4 membuat Tarot
if (punyaJoker("8-ball")) {
  const delapan = S.hand.filter(c => S.selected.has(c.id) && c.rank === 8).length;
  let dapat = 0;
  for (let i = 0; i < delapan; i++) if (Math.random() < 0.25) dapat++;
  for (let i = 0; i < dapat; i++) tambahKonsumabelAcak("tarot");
  if (dapat) showToast("8 Ball: " + dapat + " Tarot dibuat");
}



  // Midas Mask: kartu wajah yang dimainkan menjadi ber-enhancement Emas
  if (punyaJoker("midas-mask")) {
    let jadi = 0;
    S.hand.forEach(c => {
      if (S.selected.has(c.id) && c.rank >= 11 && c.rank <= 13 && c.enhancement !== "gold") {
        c.enhancement = "gold"; jadi++;
      }
    });
    if (jadi) showToast("Midas Mask: " + jadi + " kartu wajah menjadi Emas");
  }

  const result = scorePlayed();
  // Séance: Straight Flush membuat satu kartu Spectral
  // Catat bentuk tangan babak ini untuk Card Sharp, SESUDAH penilaian
  // supaya hand pertama belum ikut terhitung.
  if (S.jenisTanganBabak) S.jenisTanganBabak.push(result.ev.name);
  
  // Bentuk tangan yang dimainkan dicatat sepanjang run. Sebelumnya larik ini
  // dibuat tetapi TIDAK PERNAH ditambah, sehingga The Ox tidak punya data
  // untuk dipakai. Dicatat SESUDAH penilaian, sama seperti jenisTanganBabak.
  S.stats.handsPlayed = S.stats.handsPlayed || {};
  const tersering = (() => {
    let nama = null, n = 0;
    Object.keys(S.stats.handsPlayed).forEach(k => {
      if (S.stats.handsPlayed[k] > n) { n = S.stats.handsPlayed[k]; nama = k; }
    });
    return nama;
  })();
  S.stats.handsPlayed[result.ev.name] = (S.stats.handsPlayed[result.ev.name] || 0) + 1;
  // The Pillar: kartu yang sudah dimainkan di Ante ini dicatat untuk dilemahkan.
  S.kartuTerpakaiAnte = S.kartuTerpakaiAnte || [];
  [...S.selected].forEach(id => {
    if (S.kartuTerpakaiAnte.indexOf(id) < 0) S.kartuTerpakaiAnte.push(id);
  });
  
  // The Ox: memainkan bentuk tangan tersering membuat uang menjadi $0.
  // Dibandingkan dengan catatan SEBELUM hand ini, karena sesudahnya hand ini
  // sudah ikut terhitung dan hampir selalu menjadi tersering.
  if (bossActive() && S.boss && S.boss.id === "ox" && tersering === result.ev.name && S.money > 0) {
    const hilang = S.money;
    S.money = 0;
    showToast("The Ox: bentuk tersering dimainkan, -$" + hilang);
  }
  
  // The Arm: menurunkan level bentuk tangan yang dimainkan, tidak di bawah 1.
  if (bossActive() && S.boss && S.boss.id === "arm") {
    const kunci = result.ev.name === "Royal Flush" ? "Straight Flush" : result.ev.name;
    const lv = S.handLevels[kunci] || 1;
    if (lv > 1) {
      S.handLevels[kunci] = lv - 1;
      showToast("The Arm: " + kunci + " turun ke Lv." + S.handLevels[kunci]);
    }
  }

  if (punyaJoker("s-ance") && /Straight Flush|Royal Flush/.test(result.ev.name)) {
    if (tambahKonsumabelAcak("spectral")) showToast("Séance: satu kartu Spectral dibuat");
  }

  // Sixth Sense: bila hand pertama babak ini hanya satu kartu 6, kartu itu
  // dihancurkan dan satu kartu Spectral dibuat
  // hand pertama = belum ada hand yang terpakai babak ini. Dipakai dua
  // kemungkinan urutan (sebelum atau sesudah pengurangan sisa tangan).
  if (punyaJoker("sixth-sense") && (S.handsLeft === maxHands() || S.handsLeft === maxHands() - 1)) {
    const dimainkan = S.hand.filter(c => S.selected.has(c.id));
    if (dimainkan.length === 1 && dimainkan[0].rank === 6) {
      const buang = dimainkan[0];
      S.deck = S.deck.filter(c => c.id !== buang.id);
      S.deckHancur = S.deckHancur || new Set();
      S.deckHancur.add(buang.id);
      if (tambahKonsumabelAcak("spectral")) showToast("Sixth Sense: kartu 6 dihancurkan, satu Spectral dibuat");
    }
  }

  // Space Joker: peluang 1 banding 4 menaikkan level bentuk tangan ini
  if (punyaJoker("space-joker") && Math.random() < 0.25) {
    const kunci = result.ev.name === "Royal Flush" ? "Straight Flush" : result.ev.name;
    S.handLevels[kunci] = (S.handLevels[kunci] || 1) + 1;
    showToast("Space Joker: " + kunci + " naik ke Lv." + S.handLevels[kunci]);
  }

  // Superposition: Tarot dibuat bila tangan berisi As dan berbentuk Straight
  if (punyaJoker("superposition")) {
    const adaAs = result.ev.scoringIds && [...result.ev.scoringIds].some(id => {
      const c = S.hand.find(x => x.id === id); return c && c.rank === 14;
    });
    const straight = /Straight/.test(result.ev.name);
    if (adaAs && straight) {
      tambahKonsumabelAcak("tarot");
      showToast("Superposition: satu Tarot dibuat");
    }
  }

  S.handsLeft--;
  S.stats.handsPlayed = S.stats.handsPlayed || {};

  // move cards to staging
  const zone = $("#played-zone");
  zone.innerHTML = "";
  const els = [...document.querySelectorAll("#hand .card")].filter(el => S.selected.has(el.dataset.id));
  els.forEach(el => { el.classList.remove("selected"); el.disabled = true; flipMove(el, zone); });

  const t = settings.anim;
  await wait(t ? 200 : 20);

  // breakdown
  setPlayedInfo(`<span class="pi-name">${result.ev.name} · Lv.${handLevel(result.ev.name)}</span><span class="pi-chips">${result.chips}</span> × <span class="pi-mult">${fmtMult(result.mult)}</span>`);
  AudioFX.play("score");
  if (result.debuffedCount) showToast(`${result.debuffedCount} card(s) debuffed by ${S.boss.name}`);
  await wait(t ? 170 : 20);

  // ── PERHITUNGAN SKOR DITAMPILKAN LANGKAH DEMI LANGKAH ──
  // Sebelumnya seluruh Joker berkedip bersama dengan jeda hanya 190ms, sehingga
  // pemain tidak bisa tahu Joker mana yang bekerja, berapa sumbangannya, dan
  // mana yang tidak terpakai sama sekali. Sekarang tiap Joker menyala SATU PER
  // SATU mengikuti urutan aktivasi, sumbangannya ditulis di daftar langkah, dan
  // Joker yang tidak ikut dihitung diredupkan supaya jelas bedanya.
  const jwrap = $("#jokers");
  const tiles = Array.prototype.slice.call(document.querySelectorAll("#jokers .joker"));
  const terpakai = new Set((result.flashes || []).map(f => f.idx));

  // Jeda santai supaya sempat dibaca. Tanpa animasi, jedanya nol.
  const JEDA_JOKER = t ? 520 : 0;
  const JEDA_AWAL = t ? 340 : 0;

  if (jwrap && t) {
    jwrap.classList.add("sedang-menghitung");
    tiles.forEach((el, i) => el.classList.toggle("redup", !terpakai.has(i)));
  }

  // Daftar langkah perhitungan, diisi satu baris setiap satu Joker selesai.
  const lama = $("#calc-log");
  if (lama) lama.remove();
  const log = document.createElement("div");
  log.className = "calc-log";
  log.id = "calc-log";
  const infoEl = $("#played-info");
  if (infoEl && infoEl.parentElement) infoEl.parentElement.insertBefore(log, infoEl.nextSibling);
  else document.querySelector(".felt-table").appendChild(log);

  const tulisLangkah = (nama, nilai, jenis) => {
    const baris = document.createElement("div");
    baris.className = "calc-baris " + (jenis || "");
    baris.innerHTML = '<span class="cb-nama">' + nama + '</span><span class="cb-nilai">' + nilai + "</span>";
    log.appendChild(baris);
    // Baris baru selalu ikut terlihat walau daftarnya sudah panjang
    if (log.scrollHeight > log.clientHeight) log.scrollTop = log.scrollHeight;
  };

  await wait(JEDA_AWAL);
  if ((result.flashes || []).length === 0) {
    tulisLangkah("Tidak ada Joker yang bekerja di tangan ini", "—", "kosong");
  }

  for (const f of result.flashes || []) {
    const tile = tiles[f.idx];
    // Sorot Joker ini dan biarkan menyala sampai langkah berikutnya, supaya
    // mata pemain sempat berpindah mengikuti urutan perhitungan.
    tiles.forEach(el => el.classList.remove("sedang"));
    if (tile) {
      tile.classList.remove("flash");
      void tile.offsetWidth;
      tile.classList.add("flash", "sedang");
      const pop = document.createElement("span");
      pop.className = "jpop";
      pop.textContent = f.label;
      tile.appendChild(pop);
      setTimeout(() => { pop.classList.add("pudar"); }, JEDA_JOKER - 180);
      setTimeout(() => pop.remove(), JEDA_JOKER + 200);
    }
    if (typeof tulisLangkah === "function") tulisLangkah(f.nama || (tile ? (tile.getAttribute("title") || "Joker") : "Joker"), f.label, "joker");
    AudioFX.play("joker");
    await wait(JEDA_JOKER);
  }

  tiles.forEach(el => el.classList.remove("sedang"));
  if (jwrap) jwrap.classList.remove("sedang-menghitung");
  tiles.forEach(el => el.classList.remove("redup"));
  await wait(t ? 200 : 0);

  // score
  const prevScore = S.roundScore;
  // The Tooth: kehilangan $1 tiap kartu yang dimainkan. Uang tidak boleh
  // menjadi negatif, jadi dipotong sampai nol saja.
  if (bossActive() && S.boss && S.boss.id === "tooth" && S.selected.size) {
    const hilang = Math.min(S.money, S.selected.size);
    if (hilang > 0) {
      S.money -= hilang;
      showToast("The Tooth: -$" + hilang);
    }
  }
  S.roundScore += result.total;
  spawnScorePop(`+${result.total.toLocaleString()}`);
  renderHud(true);
  countUp($("#hud-score"), prevScore, S.roundScore, t ? 550 : 30);
  await wait(t ? 280 : 20);

  // cleanup
  els.forEach(el => el.classList.add("played-out"));
  await wait(t ? 130 : 20);
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
  if (bossActive() && S.boss.id === "hook" && S.hand.length > 0) {
    const pool = [...S.hand];
    shuffle(pool).slice(0, 2).forEach(c => { S.hand = S.hand.filter(x => x !== c); });
    drawUp();
    showToast("The Hook discarded 2 cards");
  }

  renderAll();
  S.animating = false;
  refreshControls();

  if (S.roundScore >= blindTarget()) return setTimeout(endRoundWin, settings.anim ? 500 : 30);
  if (S.handsLeft <= 0) {
    // Mr. Bones: mencegah kalah bila skor sudah mencapai minimal 25%
    // dari target. Joker-nya hancur sendiri setelah menyelamatkan.
    const bones = S.jokers.findIndex(j => j.id === "mr-bones");
    if (bones >= 0 && S.roundScore >= blindTarget() * 0.25) {
      const nama = S.jokers[bones].name || "Mr. Bones";
      S.jokers.splice(bones, 1);
      showToast(nama + " menyelamatkanmu, lalu hancur");
      renderAll();
      return setTimeout(endRoundWin, settings.anim ? 500 : 30);
    }
    return setTimeout(gameOver, settings.anim ? 500 : 30);
  }
}

// ── discard ──
async function discardHand() {
  if (!S || S.phase !== "play" || S.animating || S.targetMode) return;
  if (S.selected.size === 0 || S.discardsLeft <= 0) { AudioFX.play("error"); shakeEl($("#btn-discard")); return; }
  S.animating = true;
  refreshControls();
  AudioFX.play("discard");
  S.discardsLeft--;
  const dibuang = S.selected.size;
  const jackDibuang = [...S.selected].filter(id => {
    const c = S.hand.find(x => x.id === id);
    return c && c.rank === 11;
  }).length;
  tambahPencatat("burnt-joker", 1);
  tambahPencatat("ramen", dibuang);
  tambahPencatat("yorick", dibuang);
  tambahPencatat("hit-the-road", jackDibuang);
  // Recyclomancy: tiap kartu yang dibuang berpeluang 1 banding 4 hancur,
  // yaitu hilang dari deck untuk seterusnya, bukan sekadar dibuang.
  if (S.vouchers.has("recyclomancy")) {
    S.deckHancur = S.deckHancur || new Set();
    const hancur = [...S.selected].filter(() => Math.random() < 0.25);
    hancur.forEach(id => S.deckHancur.add(id));
    if (hancur.length) showToast("Recyclomancy: " + hancur.length + " kartu hancur");
  }
  // Seal Ungu: tiap kartu ber-seal ungu yang dibuang membuat satu Tarot
  const unguDibuang = [...S.selected].filter(id => {
    const c = S.hand.find(x => x.id === id);
    return c && c.seal === "purple";
  }).length;
  for (let i = 0; i < unguDibuang; i++) tambahKonsumabelAcak("tarot");
  if (unguDibuang) showToast("Seal Ungu: " + unguDibuang + " Tarot dibuat");

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
  // Tarot dan Spectral sama-sama memakai apply; yang berbeda hanya
  // pencatatannya, karena sebelumnya Spectral terhitung sebagai Tarot.
  const r = cons.apply(S, sel || []);
  if (!r.ok) { showToast(r.msg); AudioFX.play("error"); return false; }
  showToast(r.msg);
  if (cons.kind === "spectral") S.stats.spectralsUsed = (S.stats.spectralsUsed || 0) + 1;
  else S.stats.tarotsUsed++;
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

// Efek khusus saat sebuah Joker dijual.
// Black Stake: Joker menjadi Abadi dan tidak dapat dijual.
function bolehDijual(j) {
  return !(stakeUbah(S).abadi && j && !j.sementara);
}

function jualEfek(j) {
  if (!j) return;
  // Diet Cola: membuat Tag gratis
  if (j.id === "diet-cola") {
    S.pendingTag = { id: "double", name: "Double Tag",
      desc: "Tag berikutnya menjadi ganda" };
    showToast("Diet Cola: Tag gratis didapat");
  }
  // Luchador: mematikan efek Boss Blind saat ini
  if (j.id === "luchador") {
    S.bossDimatikan = true;
    showToast("Luchador: efek Boss Blind dimatikan");
  }
  // Invisible Joker: setelah 2 babak, menyalin satu Joker acak
  if (j.id === "invisible-joker") {
    if ((j.tumpukan || 0) < 2) {
      showToast("Invisible Joker: belum 2 babak, tidak menyalin");
    } else if (S.jokers.length >= maxJokers() + 1) {
      showToast("Invisible Joker: slot tidak cukup");
    } else {
      const lain = S.jokers.filter(x => x !== j);
      if (lain.length) {
        const asal = lain[Math.floor(Math.random() * lain.length)];
        S.jokers.push(Object.assign({}, asal));
        showToast("Invisible Joker: " + asal.name + " disalin");
      }
    }
  }
}

function sellJoker(idx) {
  const j = S.jokers[idx];
    if (j && !bolehDijual(j)) {
      showToast("Joker Abadi tidak dapat dijual");
      return;
    }
  if (!j) return;
  // Efek saat dijual. Dijalankan SEBELUM Joker dibuang dari daftar,
  // karena sebagian efeknya membaca Joker yang dijual itu sendiri.
  jualEfek(j);
  // Verdant Leaf: menjual satu Joker melepaskan pelemahan seluruh kartu.
  if (bossActive() && S.boss && S.boss.id === "verdant") S.verdantLunas = true;
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
  // Seal Biru: tiap kartu ber-seal biru yang dipegang membuat satu Planet
  const biruDiTangan = S.hand.filter(c => c.seal === "blue").length;
  for (let i = 0; i < biruDiTangan; i++) tambahKonsumabelAcak("planet");S.hand.filter(c => c.enhancement === "gold").length * 3;
  let jokerMoney = 0;
  S.jokers.forEach(j => {
    if (j.onRoundEnd) { const m = j.onRoundEnd(j, S); if (m) jokerMoney += m; }
    // Joker pemberi uang dari data wiki (Golden Joker, Rocket, dan sejenisnya)
    if (typeof DSEfek !== "undefined" && DSEfek.uangAkhirRonde) {
      jokerMoney += DSEfek.uangAkhirRonde(j, { money: S.money, discardsLeft: S.discardsLeft, discardMaks: 3 });
    }
  })
  // Kartu ber-enhancement emas yang dipegang memberi $3 masing-masing.
  // Baris ini sempat terhapus tanpa sengaja saat menyisipkan blok Seal Biru.
  // Invisible Joker menghitung babaknya sendiri
  tambahPencatat("invisible-joker", 1);
  const goldHeld = S.hand.filter(c => c.enhancement === "gold").length * 3;
  // Green Deck: +$2 per sisa hand dan +$1 per sisa buang
  const sisaUang = deckUbah(S).uangPerSisa
    ? S.handsLeft * 2 + S.discardsLeft : 0;
  // Gold Stake: tiap Joker menyewa sejumlah uang tiap akhir babak
  const sewa = (stakeUbah(S).sewa || 0) * S.jokers.length;
  const reward = blindReward() + S.handsLeft + interest + goldHeld
    + jokerMoney + sisaUang - sewa;
  S.money += reward;
  S.phase = "shop";
  // Reroll Surplus dan Reroll Glut menurunkan harga awal reroll
  S.rerollCost = Math.max(0, 5
    - (S.vouchers.has("rerollsurplus") ? 2 : 0)
    - (S.vouchers.has("rerollglut") ? 2 : 0));
  // Chaos the Clown: satu reroll gratis di tiap toko
  S.chaosGratis = punyaJoker("chaos-the-clown");

  // Showman: bila terpasang, Joker yang sudah dimiliki boleh muncul lagi
    S.offers = rollShopCards(shopJokerCount());
  S.packs = shuffle([...PACKS]).slice(0, Math.max(0, Math.min(PACKS.length, shopPackCount()))).map(p => ({ ...p }));
  // Voucher yang efeknya belum terpasang tidak dijual sama sekali.
  const availVouchers = VOUCHERS.filter(v => !S.vouchers.has(v.id) && !v.belumAktif);
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

let shopSudahBerbunyi = false;

function renderShop() {
  // Tahan keadaan daftar tawaran kosong. Sebelumnya pemanggilan dengan
  // S.offers kosong langsung melempar TypeError (Cannot read properties of
  // null) karena kode di bawah membaca S.offers dengan asumsi selalu terisi.
  if (!S.offers) S.offers = [];
  // Suara barang muncul sekali per render toko, sebagai penanda pendengaran
  // bahwa tokonya sudah terisi. Dipasang di sini, bukan di dalam loop tawaran,
  // supaya tidak berbunyi berulang untuk setiap barang.
  if (settings.anim && S.offers && S.offers.length && !shopSudahBerbunyi) {
    shopSudahBerbunyi = true;
    AudioFX.play("deal");
  }
  $("#shop-money").textContent = "$" + S.money;
  const rerollLbl = $("#btn-reroll .lbl");
  if (rerollLbl) rerollLbl.textContent = "Reroll $" + S.rerollCost;
  else $("#btn-reroll").textContent = "Reroll $" + S.rerollCost;
  $("#btn-reroll").disabled = !(DEBUG.on && DEBUG.freeReroll) && S.money < S.rerollCost;
  const hint = $("#reroll-hint");
  if (hint) hint.textContent = "reroll $" + S.rerollCost;
  $("#shop-joker-count").textContent = `${S.jokers.length}/${maxJokers()}`;

  // owned jokers (click for details / sell)
  const owned = $("#shop-owned");
  owned.innerHTML = "";
  if (S.jokers.length === 0) owned.innerHTML = `<p class="shop-empty">No jokers yet</p>`;
  S.jokers.forEach((j, i) => owned.appendChild(jokerTile(j, { onClick: () => openJokerModal(j, i) })));

  // joker offers
  const wrap = $("#shop-offers");
  wrap.innerHTML = "";
  if (S.jokers.length >= maxJokers() && S.offers.every(o => !o.kind)) {
    wrap.innerHTML = `<p class="shop-empty">Joker slots full (${maxJokers()}/${maxJokers()})</p>`;
  } else if (S.offers.length === 0) {
    wrap.innerHTML = `<p class="shop-empty">Sold out — reroll!</p>`;
  } else {
    S.offers.forEach(j => {
      // Tawaran bisa berupa Joker atau kartu konsumabel (Tarot/Planet).
      const kartuMain = j.kind === "kartu";
        const barang = !!j.kind && j.kind !== "joker" && !kartuMain;const tile = kartuMain ? cardEl(j)
            : barang ? consTile(j, { showDesc: true }) : jokerTile(j, { showDesc: true });
          // Pemain harus bisa membaca keterangan barang SEBELUM membeli, bukan
          // menebak dari gambar dan harga saja. Mengetuk ubinnya membuka panel
          // keterangan yang sama dengan yang dipakai di tangan dan koleksi.
          tile.classList.add("bisa-diklik");
          tile.title = "Ketuk untuk keterangan";
          // Kotak harga diletakkan DI ATAS kartu, mengikuti aturan Balatro
          // (offset.y +0.38 di atas kartu, warna G.C.MONEY #f3b958). Sebelumnya
          // harga hanya menempel di tombol beli sehingga kurang terbaca.
          const hargaEl = document.createElement("span");
          hargaEl.className = "tile-harga";
          hargaEl.textContent = "$" + (kartuMain ? j.cost : priceOf(j));
          tile.insertBefore(hargaEl, tile.firstChild);
          tile.onclick = (ev) => {
            if (ev.target.closest("button")) return;   // tombol Buy ditangani sendiri
            AudioFX.play("select");
            const harga = kartuMain ? j.cost : priceOf(j);
            const jenis = kartuMain ? "Playing Card"
              : barang ? (j.kind === "planet" ? "Planet" : j.kind === "spectral" ? "Spectral" : "Tarot")
              : (j.rarity || "joker");
            openModal({
              icon: j.art || j.icon || (j.suit ? "suit" + j.suit : null),
              name: j.name || j.nama || "Barang",
              tags: [String(jenis).toUpperCase(), "Harga $" + harga],
              desc: j.desc || j.keterangan || "Tidak ada keterangan.",
              // onSell dan onUse sengaja TIDAK diberikan: barang ini belum
              // dibeli, jadi menawarkan Jual atau Pakai tidak masuk akal.
              onSell: null, onUse: null,
            });
          };
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Buy $" + (kartuMain ? j.cost : priceOf(j));
      btn.disabled = S.money < priceOf(j);
      btn.onclick = () => {
        if (S.money < priceOf(j)) { AudioFX.play("error"); return; }
          // Slot diperiksa SEBELUM uang dipotong. Sebelumnya uang dipotong dulu
          // lalu pembelian dibatalkan karena slot penuh, sehingga uang berkurang
          // tanpa barang: terukur 50 -> 45 dengan Joker tetap 5, dan 50 -> 47.
          if (!kartuMain && barang && S.consumables.length >= maxCons()) {
            showToast("Slot konsumabel penuh"); AudioFX.play("error"); return;
          }
          if (!kartuMain && !barang && S.jokers.length >= maxJokers()) {
            showToast("Slot Joker penuh"); AudioFX.play("error"); return;
          }
          S.money -= priceOf(j);
          if (kartuMain) {
            S.deckTambahan = S.deckTambahan || [];
            S.deckTambahan.push(Object.assign({}, j, { kind: undefined }));
            S.deckTotal = (S.deckTotal || 52) + 1;
          } else if (barang) {
          if (S.consumables.length >= maxCons()) { showToast("Slot konsumabel penuh"); return; }
          S.consumables.push(j);
        } else if (S.jokers.length >= maxJokers()) {
          showToast("Slot Joker penuh");
          return;
        } else {
          S.jokers.push(j);
        }
        // Tawaran dibuang dari daftar toko. Tanpa ini renderShop() membangun ulang
          // tombol untuk tawaran yang sama, sehingga satu tawaran bisa dibeli
          // berkali-kali: terukur tawaran $2 menghasilkan tiga Joker (30->24).
          if (S.offers) {
            const pos = S.offers.indexOf(j);
            if (pos >= 0) S.offers.splice(pos, 1);
          }
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
      terapkanVoucher(S, v);
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
  // Hallucination: peluang 1 banding 2 membuat satu kartu tiap kali
  // paket dibuka. Kartu Tarot, karena kartu Spectral tersendiri juga.
  if (punyaJoker("hallucination") && Math.random() < 0.5) {
    if (tambahKonsumabelAcak("tarot")) showToast("Hallucination: satu Tarot dibuat");
  }
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
    const noRoom = choice.rarity ? S.jokers.length >= maxJokers() : S.consumables.length >= maxCons();
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
// Melanjutkan run ke Endless Mode sesudah Ante 8 ditaklukkan.
function lanjutEndless() {
  if (!S || S.ante < 9) return false;
  S.endless = true;
  S.gameWon = false;
  showScreen("game");
  startBlind();
  renderAll();
  return true;
}

// Challenge diterapkan sesudah deck disusun, karena sebagiannya mengubah deck.
function terapkanChallenge(St) {
  const u = challengeUbah(St);
  if (!u) return;
  if (u.uang) St.money = Math.max(0, St.money + u.uang);
  if (u.kartuAwal === "tanpaWajah") {
    St.deck = St.deck.filter(c => c.rank < 11);
  } else if (u.kartuAwal === "hanyaSekopHati") {
    while (St.deck.length > 26) St.deck.pop();
    St.deck.forEach(c => { if (c.suit !== "spades" && c.suit !== "hearts") c.suit = "spades"; });
  } else if (u.kartuAwal === "acak") {
    const suit = ["spades", "hearts", "clubs", "diamonds"];
    St.deck.forEach(c => {
      c.rank = 2 + Math.floor(Math.random() * 13);
      c.suit = suit[Math.floor(Math.random() * 4)];
    });
  }
}

function winRun() {
  S.phase = "win";
  S.gameWon = true;
  clearSave();
  AudioFX.play("win");
  showScreen("win");
}

// ── rendering ──
// short badge + tooltip for each Tarot enhancement, so an altered card stands out
const ENH_BADGE = {
  bonus: ["+30",  "Bonus • +30 Chips when scored"],
  mult:  ["+4",   "Mult • +4 Mult when scored"],
  wild:  ["★",    "Wild • counts as every suit"],
  glass: ["×2",   "Glass • ×2 Mult, 1 in 4 shatters"],
  steel: ["×1.5", "Steel • ×1.5 Mult while held in hand"],
  gold:  ["$",    "Gold • $3 if held at end of round"],
  lucky: ["?",    "Lucky • 1/5 +20 Mult, 1/15 $20"],
  stone: ["◆",    "Stone • +50 Chips, always scores"],
};

function cardEl(c) {
  const el = document.createElement("button");
  const enh = c.enhancement ? ` enh-${c.enhancement}` : "";
  el.className = "card " + (SUIT_CLASS[c.suit] || "black") + enh;
  el.dataset.id = c.id;
  if (isBossDebuffed(c)) el.classList.add("debuffed");
  const badge = ENH_BADGE[c.enhancement];
  const badgeHTML = badge ? `<span class="c-enh-badge" title="${badge[1]}">${badge[0]}</span>` : "";
  // Segel sebelumnya hanya tersimpan di data dan tidak pernah digambar,
  // sehingga kartu bersegel tampak sama seperti kartu biasa.
  const sealHTML = c.seal
    ? `<span class="c-seal seal-${c.seal}" title="Seal ${c.seal}"></span>` : "";
  // Kartu tertutup (boss House, Wheel, Fish, Mark) digambar sebagai punggung
  // kartu. Kartunya tetap dapat dipilih dan dimainkan, hanya tidak diketahui.
  const tertutup = !!(S.tertutup && S.tertutup.has(c.id));
  if (tertutup) {
    el.innerHTML = '<img class="c-img" draggable="false" alt="tertutup" ' +
      'src="' + jalurPunggung() + '">';
    el.classList.add("c-tertutup");
  } else if (c.enhancement === "stone") {
    el.innerHTML = `<span class="c-stone">+50</span>` + badgeHTML + sealHTML;
  } else {
    // Kartu memakai PNG hasil generator sendiri (tools/generate-cards.py)
    const berkas = rankLabel(c.rank);
    el.innerHTML =
      `<img class="c-img" draggable="false" alt="${berkas} ${c.suit}" ` +
      `src="${jalurKartu(c.suit, berkas)}">` + badgeHTML + sealHTML;
  }
  el.onclick = () => toggleCard(c.id, el);
  return el;
}

function toggleCard(id, el) {
  if (!S || S.animating || S.phase !== "play") return;
  // Kartu yang dipaksa terpilih oleh Cerulean Bell tidak dapat dilepas.
  if (S.kartuWajib && id === S.kartuWajib && S.selected.has(id)) {
    AudioFX.play("error");
    return;
  }
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

// Gambar Joker: PNG hasil generator sendiri (assets/img/items/joker/).
// 107 Joker baru membawa jalur gambarnya langsung; 43 Joker lama dicocokkan
// lewat nama dengan data 150 Joker. Yang tidak ketemu tetap memakai ikon lama.
function jokerArt(j) {
  if (j.gambar) return j.gambar;
  if (typeof JOKER_DATA !== "undefined" && j.name) {
    const d = JOKER_DATA.find(x => x.nama.toLowerCase() === j.name.toLowerCase());
    if (d) return d.gambar;
  }
  return null;
}

// Penolong tunggal untuk semua jenis kartu di koleksi dan jendela rincian.
// Urutannya: jalur langsung -> cocok nama Joker -> jenis konsumabel -> bos.
function artForCalon(item) {
  if (!item) return [];
  if (item.gambar) return [item.gambar];
  const lewatNama = jokerArt(item);
  if (lewatNama) return [lewatNama];
  if (item.kind) return consArt(item);
  if (item.id) {
    // nama berkas bos memakai awalan "the-", sedangkan id di repo tidak
    const id = String(item.id).toLowerCase();
    // "heart" di repo adalah bos yang men-debuff kartu Hati; namanya yang benar
    // di Balatro adalah The Head, jadi berkasnya dipetakan ke sana.
    if (id === "heart") return ["assets/img/items/boss/the-head.png"];
    return [`assets/img/items/boss/${id}.png`, `assets/img/items/boss/the-${id}.png`];
  }
  return [];
}

function artFor(item) {
  return artForCalon(item)[0] || null;
}

function jokerTile(j, opts = {}) {
  const tile = document.createElement("div");
  tile.className = `joker j-${j.rarity}` + (j.edition ? ` ed-${j.edition}` : "") + (opts.onClick ? " clickable" : "");
  tile.innerHTML =
    (j.edition ? `<span class="ed-tag ed-${j.edition}">${EDITIONS[j.edition].name}</span>` : "") +
    `<div class="tile-icon">${jokerArt(j)
      ? `<img class="j-art" draggable="false" alt="" src="${jokerArt(j)}">`
      : iconSVG(j.id)}</div>` +
    `<div class="tile-name">${j.name}</div>` +
    `<div class="tile-rarity rar-${j.rarity}">${j.rarity}</div>` +
    (opts.showDesc ? `<span class="jdesc">${j.desc}</span>` : "");
  if (opts.onClick) tile.onclick = opts.onClick;
  return tile;
}

function renderJokers() {
  const wrap = $("#jokers");
  wrap.innerHTML = "";
  S.jokers.forEach((j, i) => wrap.appendChild(jokerTile(j, { onClick: () => openJokerModal(j, i) })));
  for (let i = S.jokers.length; i < maxJokers(); i++) {
    const slot = document.createElement("div");
    slot.className = "joker slot-empty";
    wrap.appendChild(slot);
  }
  $("#joker-count").textContent = `${S.jokers.length}/${maxJokers()}`;
}

// Gambar kartu item memakai PNG hasil generator sendiri. Sebagian id di repo
// lebih pendek daripada nama berkasnya ("fool" vs "the-fool.png"), jadi dipakai
// rantai jalur cadangan; kalau semuanya gagal, ikon lama tetap dipasang.
function itemArt(calon, nama, svgCadangan) {
  const img = document.createElement("img");
  img.className = "c-art";
  img.draggable = false;
  img.alt = nama || "";
  let i = 0;
  img.onerror = () => {
    i += 1;
    if (i < calon.length) { img.src = calon[i]; return; }
    if (svgCadangan) img.parentNode.innerHTML = svgCadangan;
  };
  img.src = calon[0];
  return img;
}

// Id di repo sering disingkat dan tidak bisa ditebak dari nama berkasnya,
// jadi yang tidak sama dipetakan langsung - bukan ditebak lewat jalur gagal,
// supaya konsol tetap bersih.
const ALIAS_BARANG = {
  planetx: "planet-x", priestess: "high-priestess", wheel: "wheel-of-fortune", hanged: "the-hanged-man",
  clearance: "clearance-sale", seedmoney: "seed-money", paintbrush: "paint-brush",
};

function consArt(c) {
  const id = String(c.id || "").toLowerCase();
  const kind = String(c.kind || "").toLowerCase();

  if (kind === "pack") {
    const tingkat = String(c.tier || c.size || "").toLowerCase();
    const dasar = `assets/img/items/pack/${id}-pack.png`;
    return (tingkat && tingkat !== "normal")
      ? [`assets/img/items/pack/${tingkat}-${id}-pack.png`, dasar]
      : [dasar];
  }
  if (kind === "voucher") {
    return [`assets/img/items/voucher/${ALIAS_BARANG[id] || id}.png`];
  }

  const dir = ["planet", "tarot", "spectral"].includes(kind) ? kind : "tarot";
  // Nama berkas memakai tanda hubung; sebagian id repo memakai garis bawah,
  // dan sebagian nama Tarot diawali "the-". Semua bentuk dicoba berurutan.
  // bentuk bertanda hubung dicoba lebih dulu: itu bentuk yang dipakai berkas,
  // sehingga jalur yang gagal jarang tersentuh dan konsol tetap bersih
  // Sebagian id repo disingkat dan tidak bisa ditebak dari namanya, jadi
  // dipetakan langsung. Sisanya dicoba dalam dua bentuk: bertanda hubung
  // (bentuk nama berkas) lalu apa adanya, dengan awalan "the-" sebagai cadangan.
  if (ALIAS_BARANG[id]) return [`assets/img/items/${dir}/${ALIAS_BARANG[id]}.png`];
  const bentuk = [...new Set([id.replace(/_/g, "-"), id])];
  const calon = [];
  bentuk.forEach(b => {
    calon.push(`assets/img/items/${dir}/${b}.png`);
    if (!b.startsWith("the-")) calon.push(`assets/img/items/${dir}/the-${b}.png`);
  });
  return calon;
}

function consTile(c, opts = {}) {
  const tile = document.createElement("div");
  tile.className = `joker j-${c.kind}` + (opts.onClick ? " clickable" : "");
  tile.innerHTML =
    `<div class="tile-icon"></div>` +
    `<div class="tile-name">${c.name}</div>` +
    `<div class="tile-rarity kind-${c.kind}">${c.kind}</div>` +
    (opts.showDesc ? `<span class="jdesc">${consDesc(c)}</span>` : "");
  tile.querySelector(".tile-icon").appendChild(itemArt(consArt(c), c.name, iconSVG(c.id)));
  if (opts.onClick) tile.onclick = opts.onClick;
  return tile;
}

function renderConsumables() {
  const wrap = $("#consumables");
  wrap.innerHTML = "";
  S.consumables.forEach((c, i) => wrap.appendChild(consTile(c, { onClick: () => openConsModal(i) })));
  for (let i = S.consumables.length; i < maxCons(); i++) {
    const slot = document.createElement("div");
    slot.className = "joker slot-empty";
    wrap.appendChild(slot);
  }
  $("#cons-count").textContent = `${S.consumables.length}/${maxCons()}`;
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
    icon: `<img class="c-art modal-art" draggable="false" alt="" src="${artFor(j) || ""}">`,
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
    icon: `<img class="c-art modal-art" draggable="false" alt="" src="${artFor(c) || ""}">`,
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
    // Hanya Boss Blind yang memunculkan pemberitahuan ini. Small Blind dan Big
    // Blind tidak punya aturan khusus, jadi keduanya tidak memicunya.
    // Kelas "tampil" diperlukan supaya animasi warna dan putar pada CSS berlaku,
    // dan suaranya mengikuti pola Balatro: satu whoosh lalu beberapa ketukan.
    const pertamaKali = el.hidden;
    el.hidden = false;
    el.classList.add("tampil");
    if (pertamaKali && settings.anim) {
      AudioFX.play("pack");
      [0, 100, 200, 300].forEach(t => setTimeout(() => AudioFX.play("click"), t));
    }
    // Lama pemberitahuan mengikuti aturan Balatro: jumlah karakter x 0,035 + 1,3
    // detik, jadi 45 karakter bertahan 2,88 detik, lalu memudar 330ms sebelum
    // disembunyikan supaya tidak menumpuk di layar.
    const teksBos = ((($("#boss-name") || {}).textContent || "") + (($("#boss-desc") || {}).textContent || "")).trim();
    const lamaTampil = teksBos.length * 0.035 + 1.3;
    clearTimeout(el._timerBos);
    clearTimeout(el._timerPudar);
    el._timerBos = setTimeout(() => {
      if (settings.anim) el.classList.add("pudar");
      el._timerPudar = setTimeout(() => {
        el.hidden = true;
        el.classList.remove("tampil", "pudar");
      }, settings.anim ? 330 : 0);
    }, lamaTampil * 1000);
    $("#boss-name").textContent = S.boss.name;
    $("#boss-desc").textContent = S.boss.desc;
    const art = $("#boss-art");
    if (art) {
      art.innerHTML = "";
      art.appendChild(itemArt([`assets/img/items/boss/${S.boss.id}.png`,
                               `assets/img/items/boss/the-${S.boss.id}.png`],
                              S.boss.name, iconSVG(S.boss.id)));
    }
  } else {
    el.hidden = true;
  }
}

// Skor terakhir yang sudah digambar, dipakai untuk tahu berapa yang bertambah.
let skorTerakhir = null;

// Angka bertambah terbang dari posisi elemen acuan lalu menghilang.
function terbangkanSkor(jumlah, acuan) {
  if (!jumlah || jumlah <= 0 || !settings.anim) return;
  const kotak = acuan && acuan.getBoundingClientRect ? acuan.getBoundingClientRect() : null;
  const el = document.createElement("div");
  el.className = "skor-terbang";
  el.textContent = "+" + jumlah.toLocaleString();
  if (kotak && kotak.width) {
    el.style.left = Math.round(kotak.left + kotak.width / 2) + "px";
    el.style.top = Math.round(kotak.top) + "px";
    el.style.transform = "translateX(-50%)";
  } else {
    el.style.left = "50%"; el.style.top = "30%";
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
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
  // Efek skor ala Balatro: angka berdenyut, angkanya terbang, dan bilah skor
  // menyala begitu target terlewati.
  const bilahSkor = document.querySelector(".score-bar");
  if (bilahSkor) bilahSkor.classList.toggle("penuh", S.roundScore >= blindTarget());
  if (skorTerakhir !== null && S.roundScore > skorTerakhir) {
    const elSkor = $("#hud-score");
    if (elSkor) {
      elSkor.classList.remove("pop");
      void elSkor.offsetWidth;      // paksa peramban memulai ulang animasinya
      elSkor.classList.add("pop");
    }
    terbangkanSkor(S.roundScore - skorTerakhir, elSkor || bilahSkor);
  }
  skorTerakhir = S.roundScore;
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
  const playBtn = $("#btn-play"), discBtn = $("#btn-discard");
  const sel = S ? S.selected.size : 0;
  const hands = S ? S.handsLeft : 0;
  const discards = S ? S.discardsLeft : 0;
  playBtn.disabled = !canAct || sel === 0 || hands <= 0;
  discBtn.disabled = !canAct || sel === 0 || discards <= 0;
  playBtn.title = hands <= 0 ? "No hands left"
    : sel === 0 ? "Select cards to play" : "Play the selected cards";
  discBtn.title = discards <= 0 ? "No discards left this blind"
    : sel === 0 ? "Select cards to discard" : "Discard the selected cards";
  if (S && S.targetMode) {
    const tm = S.targetMode;
    $("#btn-target-use").disabled = tm.cons.exact ? S.selected.size !== tm.cons.needs : S.selected.size < 1;
  }
}

// Menghitung tumpang tindih kartu di tangan supaya SELURUH kartu muat dalam
// lebar wadah tanpa gulir mendatar, berapa pun jumlah kartu dan ukuran layar.
// Sebelumnya tumpang tindih dipatok tetap (-20px), sehingga di ponsel tangan
// berisi 8 kartu meluap dan harus digulir.
// Menyamakan ukuran ubin di kedua baki (Joker dan Konsumabel).
// Sebelumnya tiap baki menghitung lebarnya sendiri, sehingga pada 390px ubin
// Joker 39px sedangkan ubin Konsumabel 48px - berbeda tinggi dan lebarnya, dan
// itulah yang membuat kedua baki terlihat tidak rapih meski tidak bertumpuk.
// Ukuran dipakai bersama: yang menentukan adalah baki yang lebih sempit.
function rapatkanBaki() {
  // Jangan menghitung ulang saat layar permainan tersembunyi: clientWidth
  // elemen tersembunyi adalah 0, sehingga lebar kartu dihitung dari lebar 0
  // dan hasilnya mengecil tiba-tiba saat layar dibuka lagi.
  if (!document.querySelector("#screen-game.active")) return;
  const baris = document.querySelector(".strips-row");
  const jok = document.querySelector("#jokers");
  const kon = document.querySelector("#consumables");
  if (!baris || !jok || !kon) return;
  const bersih = (el) => {
    const g = getComputedStyle(el);
    return Math.max(40, el.clientWidth - parseFloat(g.paddingLeft || 0) - parseFloat(g.paddingRight || 0));
  };
  const celah = 4;
  const nJ = jok.children.length, nK = kon.children.length;
  const kandidat = [];
  if (nJ) kandidat.push((bersih(jok) - (nJ - 1) * celah) / nJ);
  if (nK) kandidat.push((bersih(kon) - (nK - 1) * celah) / nK);
  if (!kandidat.length) {
    baris.style.removeProperty("--ubin-w");
    baris.style.removeProperty("--ubin-h");
    return;
  }
  // Batas atas 50px supaya baki berisi sedikit ubin tidak membesar berlebihan,
  // batas bawah 30px supaya gambarnya masih bisa dikenali.
  const w = Math.max(30, Math.min(50, Math.floor(Math.min.apply(null, kandidat))));
  baris.style.setProperty("--ubin-w", w + "px");
  baris.style.setProperty("--ubin-h", Math.round(w * 62 / 46) + "px");
}

// ── Sistem satuan Balatro ──
// Dari main.lua: TILESCALE = w / (TILE_W * 0.63 * TILESIZE) dengan TILE_W = 20 dan
// TILESIZE = 20, jadi 1 unit = lebar layar / 12,6. Lebar ruang selalu 12,6 unit di
// layar mana pun, sehingga satu tata letak berbasis unit berlaku untuk semua ukuran.
// Kartu: CARD_W = 2,0488 unit, CARD_H = 2,7512 unit.
function satuanBalatro() { return window.innerWidth / 12.6; }

function rapatkanTangan() {
  const zona = document.querySelector("#hand");
  if (!zona) return;
  // Jangan menghitung saat layar permainan tersembunyi: clientWidth elemen
  // tersembunyi adalah 0 dan kartu akan dihitung dari lebar nol.
  if (!document.querySelector("#screen-game.active")) return;
  const kartu = zona.querySelectorAll(".card");
  const n = kartu.length;
  if (!n) {
    ["--kartu-w", "--kartu-h", "--tumpuk", "--kartu-gap"].forEach(v => zona.style.removeProperty(v));
    return;
  }
  const gaya = getComputedStyle(zona);
  const lebar = Math.max(120, zona.clientWidth
    - parseFloat(gaya.paddingLeft || 0) - parseFloat(gaya.paddingRight || 0));
  const dasar = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue("--kartu-w")) || 96;
  const celah = 8;

  // KARTU TIDAK PERNAH BERTUMPUK.
  // Versi-versi sebelumnya menumpuk kartu, dan itu memang perilaku Balatro -
  // tetapi menumpuk berarti kartu yang diketuk menaungi tetangganya, dan itu
  // yang berulang kali jadi keluhan. Jadi di sini tumpang tindih dihapus sama
  // sekali: kartu selalu berdiri sendiri-sendiri, dan kalau tidak muat dalam
  // satu baris, tangan dibungkus ke baris berikutnya.
  //
  // Susunan dipilih dengan aturan: pakai baris SESEDIKIT mungkin selama kartunya
  // masih cukup besar untuk dibaca (NYAMAN). Kalau tidak ada yang mencapai itu,
  // pakai susunan dengan kartu terbesar.
  const NYAMAN = lebar >= 640 ? 72 : 56;
  let terpilih = null;
  // Maksimum DUA baris. Tiga baris membuat tangan terlalu tinggi sehingga
  // bagian atasnya bertabrakan dengan elemen di atasnya; dengan dua baris,
  // sepuluh kartu sekalipun masih muat dan tetap terbaca.
  for (let baris = 1; baris <= 2; baris++) {
    const perBaris = Math.ceil(n / baris);
    if (perBaris < 1) continue;
    const w = Math.min(dasar, Math.floor((lebar - (perBaris - 1) * celah) / perBaris));
    if (w < 30) continue;
    const calon = { w, perBaris, baris: Math.ceil(n / perBaris) };
    if (!terpilih) terpilih = calon;
    if (calon.w >= NYAMAN && calon.baris <= terpilih.baris) terpilih = calon;
    if (terpilih.w < NYAMAN && calon.w > terpilih.w) terpilih = calon;
  }
  if (!terpilih) terpilih = { w: 30, perBaris: n, baris: Math.ceil(n / Math.max(1, Math.floor(lebar / 36))) };

  zona.style.setProperty("--kartu-w", terpilih.w + "px");
  zona.style.setProperty("--kartu-h", Math.round(terpilih.w * 272 / 192) + "px");
  zona.style.setProperty("--kartu-gap", celah + "px");
  zona.style.setProperty("--tumpuk", "0px");
  zona.classList.toggle("dua-baris", terpilih.baris > 1);
  zona.style.setProperty("--per-baris", terpilih.perBaris);
}

// Kartu melayang di menu mengikuti tema yang dipilih, bukan berkas tetap.
function perbaruiKartuMelayang() {
  const contoh = [["hearts", "A"], ["spades", "K"], ["diamonds", "Q"], ["clubs", "J"], ["hearts", "10"]];
  document.querySelectorAll(".float-card").forEach((img, i) => {
    const [suit, rank] = contoh[i % contoh.length];
    img.src = jalurKartu(suit, rank);
  });
}

function renderAll() {
  // Pemberitahuan bos disegarkan di sini. Terukur dengan uji peramban:
  // renderAll() TIDAK memanggil renderBossBanner(), sehingga bannernya hanya
  // muncul kalau ada yang memanggilnya langsung - keterangan bos bisa hilang
  // begitu layar digambar ulang.
  renderBossBanner();
  renderHand();
  renderJokers();
  renderConsumables();
  renderHud();
  renderPreview();
  rapatkanTangan();
  rapatkanBaki();
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
      `<div class="tile-icon"></div>` +
      `<div class="tile-name">${item.name}</div>` +
      `<span class="jdesc">${t.txt(item)}</span>` +
      `<span class="coll-meta">${t.meta(item)}</span>`;
    tile.querySelector(".tile-icon").appendChild(itemArt(artForCalon(item), item.name, iconSVG(item.id)));
    grid.appendChild(tile);
  });
  $("#coll-count").textContent = `${t.items.length} cards`;
  document.querySelectorAll(".coll-tab").forEach(b =>
    b.classList.toggle("btn-primary", b.dataset.tab === collTab));
}

// ── poker-hand examples, shown as real (mini) cards in How to Play / Run Info ──
const HAND_ORDER = ["High Card", "Pair", "Two Pair", "Three of a Kind", "Straight", "Flush",
  "Full House", "Four of a Kind", "Straight Flush", "Royal Flush",
  "Five of a Kind", "Flush House", "Flush Five"];
const SUIT_GLYPH = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣", copy: "★" };
// "copy" = a duplicated/copied card (what you get from Tarot cards)
const HAND_DEMO = {
  "High Card":       [["A", "spades"], ["K", "hearts"], ["9", "diamonds"], ["6", "clubs"], ["3", "spades"]],
  "Pair":            [["8", "spades"], ["8", "hearts"], ["K", "diamonds"], ["5", "clubs"], ["2", "spades"]],
  "Two Pair":        [["J", "spades"], ["J", "hearts"], ["4", "diamonds"], ["4", "clubs"], ["9", "spades"]],
  "Three of a Kind": [["7", "spades"], ["7", "hearts"], ["7", "diamonds"], ["K", "clubs"], ["2", "spades"]],
  "Straight":        [["5", "spades"], ["6", "hearts"], ["7", "diamonds"], ["8", "clubs"], ["9", "spades"]],
  "Flush":           [["A", "hearts"], ["K", "hearts"], ["9", "hearts"], ["6", "hearts"], ["3", "hearts"]],
  "Full House":      [["Q", "spades"], ["Q", "hearts"], ["Q", "diamonds"], ["5", "clubs"], ["5", "spades"]],
  "Four of a Kind":  [["9", "spades"], ["9", "hearts"], ["9", "diamonds"], ["9", "clubs"], ["A", "spades"]],
  "Straight Flush":  [["6", "hearts"], ["7", "hearts"], ["8", "hearts"], ["9", "hearts"], ["10", "hearts"]],
  "Royal Flush":     [["10", "spades"], ["J", "spades"], ["Q", "spades"], ["K", "spades"], ["A", "spades"]],
  "Five of a Kind":  [["5", "spades"], ["5", "hearts"], ["5", "diamonds"], ["5", "clubs"], ["5", "copy"]],
  "Flush House":     [["Q", "hearts"], ["Q", "hearts"], ["Q", "copy"], ["5", "hearts"], ["5", "copy"]],
  "Flush Five":      [["A", "spades"], ["A", "spades"], ["A", "copy"], ["A", "copy"], ["A", "copy"]],
};
function miniCardHTML(rank, suit) {
  const kind = suit === "copy" ? " copy" : (suit === "hearts" || suit === "diamonds") ? " red" : "";
  const tip = suit === "copy" ? ' title="Copied card (made with a Tarot)"' : "";
  // deliberately <span>, not <b>/<i>: ancestor rules like `.howto-body b` would recolour them
  return `<span class="mini-card${kind}"${tip}><span class="mc-r">${rank}</span><span class="mc-s">${SUIT_GLYPH[suit] || "?"}</span></span>`;
}
function handDemoHTML(name) {
  const d = HAND_DEMO[name];
  if (!d) return "";
  return `<span class="hand-demo">${d.map(([r, s]) => miniCardHTML(r, s)).join("")}</span>`;
}

function renderHandsScreen() {
  const tbl = $("#hands-levels");
  const planetOf = h => PLANETS.find(p => p.hand === h);
  let rows = `<tr><th>Hand</th><th>Example</th><th>Lv</th><th>Chips</th><th>Mult</th><th>Planet</th></tr>`;
  HAND_ORDER.forEach(h => {
    const hv = handValue(h);
    const p = planetOf(h);
    const used = S.stats.planetCounts[h] || 0;
    rows += `<tr><td>${h}</td><td class="demo-cell">${handDemoHTML(h)}</td><td>${handLevel(h)}</td><td>${hv.chips}</td><td>×${hv.mult}</td><td>${p ? p.name : "—"}${used ? ` (${used})` : ""}</td></tr>`;
  });
  tbl.innerHTML = rows;
}

function renderHowtoHands() {
  const tbl = $("#howto-hands");
  if (!tbl) return;
  let rows = `<tr><th>Hand</th><th>Example</th><th>Chips</th><th>Mult</th></tr>`;
  HAND_ORDER.forEach(h => {
    const b = HAND_BASE[h] || { chips: 0, mult: 0 };
    rows += `<tr><td>${h}</td><td class="demo-cell">${handDemoHTML(h)}</td><td>${b.chips}</td><td>×${b.mult}</td></tr>`;
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
$("#btn-play-blind").onclick = playSelectedBlind;
$("#btn-skip-blind").onclick = () => { AudioFX.play("click"); skipBlind(); };
$("#btn-menu").onclick = () => { AudioFX.play("click"); $("#modal-nav").hidden = false; };
const menuCompact = $("#btn-menu-compact");
if (menuCompact) menuCompact.onclick = () => { AudioFX.play("click"); $("#modal-nav").hidden = false; };

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
// Abandon Run harus benar-benar membuang run. Sebelumnya hanya berpindah layar:
  // simpanan tetap ada, S masih hidup, dan tombol Continue tetap muncul dengan
  // "Ante 1". gameOver() dan winRun() sudah memanggil clearSave().
  $("#nav-abandon").onclick = () => {
    $("#modal-nav").hidden = true; AudioFX.play("click");
    clearSave();
    showScreen("menu");
  };
$("#btn-hands-back").onclick = () => { AudioFX.play("click"); showScreen("game"); };
document.addEventListener("keydown", e => { if (e.key === "Escape" && S && S.targetMode) cancelTarget(); });
$("#btn-target-use").onclick = confirmTarget;
$("#btn-target-x").onclick = () => { AudioFX.play("deselect"); cancelTarget(); };
$("#btn-pack-skip").onclick = () => { S.packOpen = null; AudioFX.play("click"); showScreen("shop"); renderShop(); };
$("#btn-reroll").onclick = () => {
  // Jatah gratis dari Chaos the Clown dipakai sebelum membayar
  const gratis = S && S.chaosGratis;
  if (gratis) { S.chaosGratis = false; }
  const free = (DEBUG.on && DEBUG.freeReroll) || gratis;
  if (!S || (!free && S.money < S.rerollCost)) { AudioFX.play("error"); return; }
  if (!free) { S.money -= S.rerollCost; S.rerollCost++; }
  // Showman: bila terpasang, Joker yang sudah dimiliki boleh muncul lagi
    S.offers = rollShopCards(shopJokerCount());
  AudioFX.play("click");
  renderShop();
  renderHud();
};
$("#btn-retry").onclick = () => { AudioFX.play("click"); newRun(); };
$("#btn-again").onclick = () => { AudioFX.play("click"); newRun(); };

// ── Pemilih Deck, Stake, dan Challenge di menu ──
// Sebelumnya ketiganya hanya bisa diubah lewat API. Pemain sekarang memilihnya
// langsung, dan pilihannya dipakai saat Start Run.
// Menampilkan isi permainan di layar pengaturan. Angka dibaca dari data yang
// benar-benar dimuat, bukan ditulis tangan, supaya tidak bisa basi.
function isiInfoPengaturan() {
  const el = $("#set-info");
  if (!el) return;
  const jml = (x) => (typeof x !== "undefined" && x.length) ? x.length : null;
  const baris = [
    ["Joker", jml(typeof JOKER_POOL !== "undefined" ? JOKER_POOL : (typeof JOKERS !== "undefined" ? JOKERS : undefined))],
    ["Voucher", jml(typeof VOUCHERS !== "undefined" ? VOUCHERS : undefined)],
    ["Tag", jml(typeof SKIP_TAGS !== "undefined" ? SKIP_TAGS : undefined)],
    ["Boss Blind", jml(typeof BOSSES !== "undefined" ? BOSSES : undefined)],
    ["Deck", jml(typeof DECKS !== "undefined" ? DECKS : undefined)],
    ["Stake", jml(typeof STAKES !== "undefined" ? STAKES : undefined)],
    ["Challenge", jml(typeof CHALLENGES !== "undefined" ? CHALLENGES : undefined)],
    ["Tarot", jml(typeof TAROTS !== "undefined" ? TAROTS : undefined)],
    ["Planet", jml(typeof PLANETS !== "undefined" ? PLANETS : undefined)],
    ["Spectral", jml(typeof SPECTRALS !== "undefined" ? SPECTRALS : undefined)],
  ].filter(x => x[1] !== null);
  el.innerHTML = baris.map(([nama, n]) =>
    `<div><b>${n}</b><span>${nama}</span></div>`).join("");
}

function isiPemilih() {
  const isi = (sel, daftar, terpilih, fn) => {
    const el = $(sel);
    if (!el) return;
    el.innerHTML = daftar.map(x =>
      `<option value="${x.id}"${x.id === terpilih ? " selected" : ""}>${x.name}</option>`).join("");
    el.onchange = () => { if (fn(el.value)) AudioFX.play("click"); };
  };
  if (typeof DECKS !== "undefined") isi("#pilih-deck", DECKS, deckTerpilih, setDeck);
  if (typeof STAKES !== "undefined") isi("#pilih-stake", STAKES, stakeTerpilih, setStake);
  if (typeof CHALLENGES !== "undefined") isi("#pilih-challenge", CHALLENGES, challengeTerpilih, setChallenge);
}
function siapkanMenu() { isiPemilih(); isiInfoPengaturan(); }
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", siapkanMenu);
} else {
  siapkanMenu();
}
if ($("#btn-endless")) $("#btn-endless").onclick = () => { AudioFX.play("click"); lanjutEndless(); };
document.querySelectorAll("[data-back]").forEach(b =>
  b.onclick = () => { AudioFX.play("click"); showScreen("menu"); });
document.querySelectorAll(".coll-tab").forEach(b =>
  b.onclick = () => { collTab = b.dataset.tab; AudioFX.play("click"); renderCollection(); });
document.querySelectorAll("[data-menu]").forEach(b =>
  b.onclick = () => { AudioFX.play("click"); showScreen("menu"); });
$("#set-sound").onclick = () => { settings.sound = !settings.sound; saveSettings(); applySettings(); AudioFX.play("click"); };
$("#set-anim").onclick = () => { settings.anim = !settings.anim; saveSettings(); applySettings(); AudioFX.play("click"); };
// Pemilih tema kartu. Perubahan langsung digambar ulang supaya pemain bisa
// menilai tanpa keluar dari layar Pengaturan.
const selTema = $("#set-tema");
if (selTema) {
  selTema.innerHTML = TEMA_KARTU
    .map(x => `<option value="${x.id}">${x.nama} — ${x.jenis}</option>`).join("");
  selTema.value = temaKartu();
  selTema.onchange = () => {
    settings.temaKartu = selTema.value;
    saveSettings();
    renderAll();
    if (typeof renderShop === "function" && currentScreen === "shop") renderShop();
    perbaruiKartuMelayang();
    showToast("Tema kartu: " + (TEMA_KARTU.find(x => x.id === selTema.value) || {}).nama);
  };
}

// Ukuran wadah berubah -> tumpang tindih kartu harus dihitung ulang.
window.addEventListener("resize", () => { if (S) rapatkanTangan(); });
perbaruiKartuMelayang();

const dbgSettingBtn = $("#set-debug");
if (dbgSettingBtn) dbgSettingBtn.onclick = () => { settings.debug = !settings.debug; saveSettings(); applySettings(); AudioFX.play("click"); };
$("#mc-close").onclick = () => { AudioFX.play("deselect"); closeModal(); };
$("#mc-backdrop").onclick = closeModal;

document.querySelectorAll(".float-card").forEach(el => {
  el.innerHTML = suitSVG(el.dataset.suit);
});

// inject pixel-art UI icons into buttons
document.querySelectorAll(".ico[data-icon]").forEach(el => {
  el.innerHTML = uiIcon(el.dataset.icon, "currentColor");
});

renderHowtoHands();  // How to Play table with card examples
buildDebugPanel();   // floating debug/cheat panel (hidden unless enabled in Settings)
applySettings();
showScreen("menu"); // init: refresh Continue button visibility

// debug/testing hooks
window.DS = { get S() { return S; }, newRun, setDeck, setStake, setChallenge, lanjutEndless, startBlind, endRoundWin, renderAll, renderShop, showScreen, openPack, settings, showBlindSelect, skipBlind,
  api: { PLANETS, TAROTS, VOUCHERS, PACKS, BOSSES, JOKERS } };
