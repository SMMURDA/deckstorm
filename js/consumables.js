// ═══ Deckstorm — Planets, Tarots, Vouchers, Booster Packs (Balatro-faithful) ═══

// ── PLANETS: level up a poker hand (+chips / +mult per level) ──
const PLANETS = [
  { id: "pluto",    name: "Pluto",    hand: "High Card",       chips: 10, mult: 1 },
  { id: "mercury",  name: "Mercury",  hand: "Pair",            chips: 15, mult: 1 },
  { id: "uranus",   name: "Uranus",   hand: "Two Pair",        chips: 20, mult: 1 },
  { id: "venus",    name: "Venus",    hand: "Three of a Kind", chips: 20, mult: 2 },
  { id: "saturn",   name: "Saturn",   hand: "Straight",        chips: 30, mult: 3 },
  { id: "jupiter",  name: "Jupiter",  hand: "Flush",           chips: 15, mult: 2 },
  { id: "earth",    name: "Earth",    hand: "Full House",      chips: 25, mult: 2 },
  { id: "mars",     name: "Mars",     hand: "Four of a Kind",  chips: 30, mult: 3 },
  { id: "neptune",  name: "Neptune",  hand: "Straight Flush",  chips: 40, mult: 4 },
  { id: "planetx",  name: "Planet X", hand: "Five of a Kind",  chips: 35, mult: 3 },
  { id: "ceres",    name: "Ceres",    hand: "Flush House",     chips: 40, mult: 4 },
  { id: "eris",     name: "Eris",     hand: "Flush Five",      chips: 50, mult: 3 },
].map(p => ({ ...p, kind: "planet", cost: 3 }));

// ── TAROTS ──
// needs: how many hand cards must be selected (0 = instant, "death" = exactly 2)
// apply(S, sel) -> { ok, msg } ; sel = selected card objects
const TAROTS = [
  { id: "fool", name: "The Fool", needs: 0,
    desc: "Copy the last consumable used",
    apply: (S) => {
      if (!S.lastConsumable) return { ok: false, msg: "Nothing to copy" };
      if (S.consumables.length >= 2) return { ok: false, msg: "No room" };
      S.consumables.push({ ...S.lastConsumable });
      return { ok: true, msg: "Copied " + S.lastConsumable.name };
    } },
  { id: "magician", name: "The Magician", needs: 2, max: true,
    desc: "Up to 2 cards become Lucky (1/5: +20 Mult, 1/15: $20)",
    apply: (S, sel) => enhance(sel, "lucky") },
  { id: "priestess", name: "The High Priestess", needs: 0,
    desc: "Create up to 2 random Planet cards",
    apply: (S) => {
      let n = 0;
      while (S.consumables.length < 2 && n < 2) { S.consumables.push({ ...PLANETS[Math.floor(Math.random() * PLANETS.length)] }); n++; }
      return n ? { ok: true, msg: `+${n} Planet card${n > 1 ? "s" : ""}` } : { ok: false, msg: "No room" };
    } },
  { id: "empress", name: "The Empress", needs: 2, max: true,
    desc: "Up to 2 cards become Mult (+4 Mult when scored)",
    apply: (S, sel) => enhance(sel, "mult") },
  { id: "emperor", name: "The Emperor", needs: 0,
    desc: "Create up to 2 random Tarot cards",
    apply: (S) => {
      let n = 0;
      while (S.consumables.length < 2 && n < 2) {
        const t = TAROTS[Math.floor(Math.random() * TAROTS.length)];
        if (t.id !== "emperor") { S.consumables.push({ ...t }); n++; } // no infinite emperors
      }
      return n ? { ok: true, msg: `+${n} Tarot card${n > 1 ? "s" : ""}` } : { ok: false, msg: "No room" };
    } },
  { id: "hierophant", name: "The Hierophant", needs: 2, max: true,
    desc: "Up to 2 cards become Bonus (+30 Chips when scored)",
    apply: (S, sel) => enhance(sel, "bonus") },
  { id: "lovers", name: "The Lovers", needs: 1,
    desc: "1 card becomes Wild (counts as any suit)",
    apply: (S, sel) => enhance(sel, "wild") },
  { id: "chariot", name: "The Chariot", needs: 1,
    desc: "1 card becomes Steel (×1.5 Mult while held in hand)",
    apply: (S, sel) => enhance(sel, "steel") },
  { id: "justice", name: "Justice", needs: 1,
    desc: "1 card becomes Glass (×2 Mult, 1/4 breaks)",
    apply: (S, sel) => enhance(sel, "glass") },
  { id: "hermit", name: "The Hermit", needs: 0,
    desc: "Double your money (max +$20)",
    apply: (S) => {
      const gain = Math.min(S.money, 20);
      S.money += gain;
      return { ok: true, msg: `+$${gain}` };
    } },
  { id: "wheel", name: "Wheel of Fortune", needs: 0,
    desc: "1 in 4: a random Joker gains Foil, Holo or Polychrome",
    apply: (S) => {
      if (Math.random() < 0.25) {
        const pool = S.jokers.filter(j => !j.edition);
        if (!pool.length) return { ok: true, msg: "No eligible Joker…" };
        const j = pool[Math.floor(Math.random() * pool.length)];
        j.edition = ["foil", "holo", "poly"][Math.floor(Math.random() * 3)];
        return { ok: true, msg: j.name + " became " + EDITIONS[j.edition].name + "!" };
      }
      return { ok: true, msg: "Nope!" };
    } },
  { id: "strength", name: "Strength", needs: 2, max: true,
    desc: "Up to 2 cards gain +1 rank (Aces unaffected)",
    apply: (S, sel) => {
      sel.forEach(c => { if (c.enhancement !== "stone" && c.rank < 14) { c.rank++; c.id = c.suit + "-" + c.rank + "-u" + Math.random().toString(36).slice(2, 6); } });
      return { ok: true, msg: "Ranks increased" };
    } },
  { id: "hanged", name: "The Hanged Man", needs: 2, max: true,
    desc: "Destroy up to 2 selected cards",
    apply: (S, sel) => {
      const ids = new Set(sel.map(c => c.id));
      S.hand = S.hand.filter(c => !ids.has(c.id));
      S.deck = S.deck.filter(c => !ids.has(c.id));
      return { ok: true, msg: `${sel.length} card${sel.length > 1 ? "s" : ""} destroyed` };
    } },
  { id: "death", name: "Death", needs: 2, exact: true,
    desc: "Select 2 cards: the LEFT card becomes a copy of the RIGHT",
    apply: (S, sel) => {
      const [a, b] = sel;
      a.rank = b.rank; a.suit = b.suit; a.enhancement = b.enhancement;
      a.id = a.suit + "-" + a.rank + "-d" + Math.random().toString(36).slice(2, 6);
      return { ok: true, msg: "Converted!" };
    } },
  { id: "temperance", name: "Temperance", needs: 0,
    desc: "Gain the total sell value of your Jokers (max $50)",
    apply: (S) => {
      const gain = Math.min(50, S.jokers.reduce((s, j) => s + sellValue(j), 0));
      S.money += gain;
      return { ok: true, msg: `+$${gain}` };
    } },
  { id: "devil", name: "The Devil", needs: 1,
    desc: "1 card becomes Gold ($3 if held at end of round)",
    apply: (S, sel) => enhance(sel, "gold") },
  { id: "tower", name: "The Tower", needs: 1,
    desc: "1 card becomes Stone (+50 Chips, no rank/suit, always scores)",
    apply: (S, sel) => enhance(sel, "stone") },
  { id: "star", name: "The Star", needs: 3, max: true,
    desc: "Up to 3 cards become Diamonds",
    apply: (S, sel) => convertSuit(sel, "diamonds") },
  { id: "moon", name: "The Moon", needs: 3, max: true,
    desc: "Up to 3 cards become Clubs",
    apply: (S, sel) => convertSuit(sel, "clubs") },
  { id: "sun", name: "The Sun", needs: 3, max: true,
    desc: "Up to 3 cards become Hearts",
    apply: (S, sel) => convertSuit(sel, "hearts") },
  { id: "world", name: "The World", needs: 3, max: true,
    desc: "Up to 3 cards become Spades",
    apply: (S, sel) => convertSuit(sel, "spades") },
  { id: "judgement", name: "Judgement", needs: 0,
    desc: "Create a random Joker (needs a free slot)",
    apply: (S) => {
      if (S.jokers.length >= 5) return { ok: false, msg: "Joker slots full" };
      const pool = JOKERS.filter(j => !S.jokers.some(o => o.id === j.id));
      if (!pool.length) return { ok: false, msg: "No Jokers left" };
      const j = makeJoker(pool[Math.floor(Math.random() * pool.length)]);
      S.jokers.push(j);
      return { ok: true, msg: "Got " + j.name + "!" };
    } },
].map(t => ({ ...t, kind: "tarot", cost: 3 }));

function enhance(sel, kind) {
  sel.forEach(c => c.enhancement = kind);
  return { ok: true, msg: "Enhanced " + sel.length + " card" + (sel.length > 1 ? "s" : "") };
}
function convertSuit(sel, suit) {
  sel.forEach(c => { if (c.enhancement !== "stone") { c.suit = suit; c.id = suit + "-" + c.rank + "-c" + Math.random().toString(36).slice(2, 6); } });
  return { ok: true, msg: "Converted to " + suit };
}

// ── VOUCHERS ($10, one per shop, permanent, once per run) ──
// ── Kartu Spectral (18) ──────────────────────────────────────────────────────
// Repo sebelumnya hanya punya gambar kartu Spectral tanpa datanya, sehingga
// tidak satu pun dapat diperoleh dalam permainan. Daftar ini melengkapinya.
//
// needs = jumlah kartu yang harus dipilih sebelum kartu dapat dipakai.
// apply = efeknya; null berarti efeknya BELUM dibuat, dan kartu itu belum
// boleh muncul di permainan supaya tidak ada yang tampak bekerja padahal tidak.
const SPECTRALS = [
  { id: "familiar", name: "Familiar", needs: 0,
    desc: "Hancurkan 1 kartu acak, tambah 3 kartu wajah ber-enhancement",
    apply: (S) => {
      if (!S.deck.length) return { ok: false, msg: "Deck kosong" };
      S.deck.splice(Math.floor(Math.random() * S.deck.length), 1);
      const wajah = [11, 12, 13], jenis = ["bonus", "mult", "wild", "glass", "steel", "gold"];
      for (let i = 0; i < 3; i++) tambahKartuKeDeck(wajah[i % 3], ["spades", "hearts", "clubs", "diamonds"][i % 4], jenis[Math.floor(Math.random() * jenis.length)]);
      return { ok: true, msg: "Familiar: 3 kartu wajah ditambahkan" };
    } },
  { id: "grim", name: "Grim", needs: 0,
    desc: "Hancurkan 1 kartu acak, tambah 2 As ber-enhancement",
    apply: (S) => {
      if (!S.deck.length) return { ok: false, msg: "Deck kosong" };
      S.deck.splice(Math.floor(Math.random() * S.deck.length), 1);
      const jenis = ["bonus", "mult", "wild", "glass", "steel", "gold"];
      for (let i = 0; i < 2; i++) tambahKartuKeDeck(14, ["spades", "hearts"][i], jenis[Math.floor(Math.random() * jenis.length)]);
      return { ok: true, msg: "Grim: 2 As ditambahkan" };
    } },
  { id: "incantation", name: "Incantation", needs: 0,
    desc: "Hancurkan 1 kartu acak, tambah 4 kartu angka ber-enhancement",
    apply: (S) => {
      if (!S.deck.length) return { ok: false, msg: "Deck kosong" };
      S.deck.splice(Math.floor(Math.random() * S.deck.length), 1);
      const jenis = ["bonus", "mult", "wild", "glass", "steel", "gold"];
      for (let i = 0; i < 4; i++) tambahKartuKeDeck(2 + i, ["spades", "hearts", "clubs", "diamonds"][i], jenis[Math.floor(Math.random() * jenis.length)]);
      return { ok: true, msg: "Incantation: 4 kartu angka ditambahkan" };
    } },
  { id: "talisman", name: "Talisman", needs: 1,
    desc: "Beri Seal Emas pada 1 kartu terpilih",
    apply: (S, sel) => { const c = (sel || [])[0]; if (!c) return { ok: false, msg: "Pilih 1 kartu" };
      c.seal = "gold"; return { ok: true, msg: "Talisman: Seal Emas diberikan" }; } },
  { id: "deja-vu", name: "Deja Vu", needs: 1,
    desc: "Beri Seal Merah pada 1 kartu terpilih",
    apply: (S, sel) => { const c = (sel || [])[0]; if (!c) return { ok: false, msg: "Pilih 1 kartu" };
      c.seal = "red"; return { ok: true, msg: "Deja Vu: Seal Merah diberikan" }; } },
  { id: "trance", name: "Trance", needs: 1,
    desc: "Beri Seal Biru pada 1 kartu terpilih",
    apply: (S, sel) => { const c = (sel || [])[0]; if (!c) return { ok: false, msg: "Pilih 1 kartu" };
      c.seal = "blue"; return { ok: true, msg: "Trance: Seal Biru diberikan" }; } },
  { id: "medium", name: "Medium", needs: 1,
    desc: "Beri Seal Ungu pada 1 kartu terpilih",
    apply: (S, sel) => { const c = (sel || [])[0]; if (!c) return { ok: false, msg: "Pilih 1 kartu" };
      c.seal = "purple"; return { ok: true, msg: "Medium: Seal Ungu diberikan" }; } },
  { id: "aura", name: "Aura", needs: 1,
    desc: "Beri edisi Foil, Holographic, atau Polychrome pada 1 kartu terpilih",
    apply: (S, sel) => { const c = (sel || [])[0]; if (!c) return { ok: false, msg: "Pilih 1 kartu" };
      const r = Math.random(); c.edition = r < 0.6 ? "foil" : r < 0.9 ? "holo" : "poly";
      return { ok: true, msg: "Aura: edisi " + c.edition + " diberikan" }; } },
  { id: "black-hole", name: "Black Hole", needs: 0,
    desc: "Naikkan level semua bentuk tangan sebanyak 1",
    apply: (S) => {
      const kunci = ["High Card", "Pair", "Two Pair", "Three of a Kind", "Straight", "Flush",
        "Full House", "Four of a Kind", "Straight Flush"];
      kunci.forEach(k => { S.handLevels[k] = (S.handLevels[k] || 1) + 1; });
      return { ok: true, msg: "Black Hole: semua bentuk tangan naik 1 level" };
    } },
  { id: "immolate", name: "Immolate", needs: 0,
    desc: "Hancurkan 5 kartu acak, dapat $20",
    apply: (S) => {
      if (S.deck.length < 5) return { ok: false, msg: "Deck kurang dari 5 kartu" };
      for (let i = 0; i < 5; i++) S.deck.splice(Math.floor(Math.random() * S.deck.length), 1);
      S.money += 20;
      return { ok: true, msg: "Immolate: 5 kartu dihancurkan, +$20" };
    } },
  { id: "sigil", name: "Sigil", needs: 0,
    desc: "Ubah semua kartu di tangan menjadi satu suit acak",
    apply: (S) => {
      const suit = ["spades", "hearts", "clubs", "diamonds"][Math.floor(Math.random() * 4)];
      S.hand.forEach(c => { c.suit = suit; });
      return { ok: true, msg: "Sigil: semua kartu menjadi " + suit };
    } },
  { id: "ouija", name: "Ouija", needs: 0,
    desc: "Ubah semua kartu di tangan menjadi satu rank acak",
    apply: (S) => {
      const rank = 2 + Math.floor(Math.random() * 13);
      S.hand.forEach(c => { c.rank = rank; });
      return { ok: true, msg: "Ouija: semua kartu menjadi rank " + rank };
    } },
  { id: "wraith", name: "Wraith", needs: 0,
    desc: "Buat 1 Joker Rare acak, uang menjadi $0",
    apply: (S) => {
      const j = tambahJokerAcak("rare");
      if (!j) return { ok: false, msg: "Slot Joker penuh atau tidak ada Joker Rare" };
      S.money = 0;
      return { ok: true, msg: "Wraith: " + j.name + " didapat, uang menjadi $0" };
    } },
  { id: "ectoplasm", name: "Ectoplasm", needs: 0,
    desc: "Beri edisi Negative pada 1 Joker acak",
    apply: (S) => {
      if (!S.jokers.length) return { ok: false, msg: "Belum ada Joker" };
      const j = S.jokers[Math.floor(Math.random() * S.jokers.length)];
      j.edition = "negative";
      return { ok: true, msg: "Ectoplasm: " + j.name + " menjadi Negative" };
    } },
  // Belum dibuat: efeknya butuh kemampuan yang belum ada di repo, jadi kartu
  // ini sengaja tidak punya apply dan tidak akan muncul di permainan.
  { id: "seance", name: "Séance", needs: 1, desc: "Ubah 1 kartu terpilih menjadi kartu Spectral", apply: null },
  { id: "hex", name: "Hex", needs: 0, desc: "Beri Polychrome pada 1 Joker acak, hancurkan Joker lain", apply: null },
  { id: "ankh", name: "Ankh", needs: 0, desc: "Salin 1 Joker acak, hancurkan Joker lain", apply: null },
  { id: "cryptid", name: "Cryptid", needs: 1, desc: "Buat 2 salinan kartu terpilih", apply: null },
];

const VOUCHERS = [
  { id: "overstock",  name: "Overstock",      desc: "+1 Joker slot in shop" },
  { id: "clearance",  name: "Clearance Sale", desc: "Everything 25% off" },
  { id: "grabber",    name: "Grabber",        desc: "+1 Hand every round" },
  { id: "wasteful",   name: "Wasteful",       desc: "+1 Discard every round" },
  { id: "seedmoney",  name: "Seed Money",     desc: "Interest cap raised to $10" },
  { id: "paintbrush", name: "Paint Brush",    desc: "+1 hand size" },
  { id: "hone",       name: "Hone",           desc: "Foil/Holo/Polychrome appear 2× more often" },
].map(v => ({ ...v, kind: "voucher", cost: 10 }));

// ── BOOSTER PACKS ──
const PACKS = [
  { id: "buffoon",   name: "Buffoon Pack",   kind: "pack", cost: 4, desc: "Choose 1 of 2 Jokers",
    open: (S) => rollShopJokers(2, new Set(S.jokers.map(j => j.id)), S.vouchers.has("hone")) },
  { id: "arcana",    name: "Arcana Pack",    kind: "pack", cost: 4, desc: "Choose 1 of 3 Tarots",
    open: () => shuffle([...TAROTS]).slice(0, 3).map(t => ({ ...t })) },
  { id: "celestial", name: "Celestial Pack", kind: "pack", cost: 4, desc: "Choose 1 of 3 Planets",
    open: () => shuffle([...PLANETS]).slice(0, 3).map(p => ({ ...p })) },
];

// ── BOSS BLINDS (Balatro-faithful subset) ──
const BOSSES = [
  { id: "hook",    name: "The Hook",    desc: "Discards 2 random held cards after each hand", targetMult: 2 },
  { id: "water",   name: "The Water",   desc: "Start with 0 discards",                        targetMult: 2 },
  { id: "needle",  name: "The Needle",  desc: "Play only 1 hand",                             targetMult: 1 },
  { id: "manacle", name: "The Manacle", desc: "-1 hand size",                                 targetMult: 2 },
  { id: "wall",    name: "The Wall",    desc: "Extra large blind (×4 target)",                targetMult: 4 },
  { id: "club",    name: "The Club",    desc: "All Clubs are debuffed",                       targetMult: 2, debuffSuit: "clubs" },
  { id: "goad",    name: "The Goad",    desc: "All Spades are debuffed",                      targetMult: 2, debuffSuit: "spades" },
  { id: "window",  name: "The Window",  desc: "All Diamonds are debuffed",                    targetMult: 2, debuffSuit: "diamonds" },
  { id: "heart",   name: "The Heart",   desc: "All Hearts are debuffed",                      targetMult: 2, debuffSuit: "hearts" },
  { id: "psychic", name: "The Psychic", desc: "Must play exactly 5 cards",                    targetMult: 2 },
];
