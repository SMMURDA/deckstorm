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
  { id: "seance", name: "Séance", needs: 0, desc: "Kartu Spectral acak (bukan Séance)",
    apply: (S) => {
      // Séance tidak boleh memberi Séance lagi, jadi ia dikeluarkan dari kolam.
      const kolam = SPECTRALS.filter(x => typeof x.apply === "function" && x.id !== "seance");
      if (!kolam.length) return { ok: false, msg: "Tidak ada kartu Spectral lain" };
      const k = kolam[Math.floor(Math.random() * kolam.length)];
      S.consumables.push(Object.assign({}, k));
      return { ok: true, msg: "Séance: " + k.name + " didapat" };
    } },
  { id: "hex", name: "Hex", needs: 0, desc: "Beri Polychrome pada 1 Joker acak, hancurkan Joker lain",
    apply: (S) => {
      if (!S.jokers.length) return { ok: false, msg: "Belum ada Joker" };
      const j = S.jokers[Math.floor(Math.random() * S.jokers.length)];
      j.edition = "poly";
      S.jokers = [j];
      return { ok: true, msg: "Hex: " + j.name + " menjadi Polychrome, Joker lain hancur" };
    } },
  { id: "ankh", name: "Ankh", needs: 0, desc: "Salin 1 Joker acak, hancurkan Joker lain",
    apply: (S) => {
      if (!S.jokers.length) return { ok: false, msg: "Belum ada Joker" };
      const j = S.jokers[Math.floor(Math.random() * S.jokers.length)];
      const salinan = Object.assign({}, j);
      salinan.salinan = true;
      S.jokers = [j, salinan];
      return { ok: true, msg: "Ankh: " + j.name + " disalin, Joker lain hancur" };
    } },
  { id: "cryptid", name: "Cryptid", needs: 0, desc: "Buat 2 salinan kartu acak dari deck",
    apply: (S) => {
      if (!S.deck.length) return { ok: false, msg: "Deck kosong" };
      const asal = S.deck[Math.floor(Math.random() * S.deck.length)];
      for (let i = 0; i < 2; i++) {
        S.deck.push(Object.assign({}, asal, {
          id: asal.id + "-salin" + i + "-" + Math.floor(Math.random() * 1e6) }));
      }
      return { ok: true, msg: "Cryptid: 2 salinan " + asal.rank + " dibuat" };
    } },
];

// 32 Voucher. Yang efeknya sudah tersambung ke mesin permainan tidak diberi
// penanda. Yang belum diberi "belumAktif: true" supaya TIDAK dijual di toko -
// lebih baik tidak dijual daripada dijual tetapi tidak bekerja.
const VOUCHERS = [
  { id: "overstock",      name: "Overstock",       desc: "+1 Joker in shop" },
  { id: "overstockplus",  name: "Overstock Plus",  desc: "+1 more Joker in shop" },
  { id: "clearance",      name: "Clearance Sale",  desc: "Everything 25% off" },
  { id: "liquidation",    name: "Liquidation",     desc: "Everything 50% off" },
  { id: "hone",           name: "Hone",            desc: "Foil/Holo/Poly appear 2x more often" },
  { id: "glowup",         name: "Glow Up",         desc: "Foil/Holo/Poly appear 4x more often" },
  { id: "rerollsurplus",  name: "Reroll Surplus",  desc: "Reroll costs $2 less" },
  { id: "rerollglut",     name: "Reroll Glut",     desc: "Reroll costs $2 less again" },
  { id: "crystalball",    name: "Crystal Ball",    desc: "+1 consumable slot" },
  { id: "omenglobe",      name: "Omen Globe",      desc: "Spectral cards may appear in packs", belumAktif: true },
  { id: "telescope",      name: "Telescope",       desc: "Celestial packs contain your most played hand", belumAktif: true },
  { id: "observatory",    name: "Observatory",     desc: "Planet cards give x1.5 Mult", belumAktif: true },
  { id: "grabber",        name: "Grabber",         desc: "+1 Hand every round" },
  { id: "nachotong",      name: "Nacho Tong",      desc: "+1 Discard every round" },
  { id: "wasteful",       name: "Wasteful",        desc: "+1 Discard every round" },
  { id: "recyclomancy",   name: "Recyclomancy",    desc: "Discards may be destroyed" },
  { id: "tarotmerchant",  name: "Tarot Merchant",  desc: "Tarot cards appear more often" },
  { id: "tarottycoon",    name: "Tarot Tycoon",    desc: "Tarot cards appear much more often" },
  { id: "planetmerchant", name: "Planet Merchant", desc: "Planet cards appear more often" },
  { id: "planettycoon",   name: "Planet Tycoon",   desc: "Planet cards appear much more often" },
  { id: "seedmoney",      name: "Seed Money",      desc: "Interest cap raised to $10" },
  { id: "moneytree",      name: "Money Tree",      desc: "Interest cap raised to $20" },
  { id: "blank",          name: "Blank",           desc: "Does nothing at all" },
  { id: "antimatter",     name: "Antimatter",      desc: "+1 Joker slot" },
  { id: "magictrick",     name: "Magic Trick",     desc: "Playing cards for sale in the shop", belumAktif: true },
  { id: "illusion",       name: "Illusion",        desc: "Shop playing cards may have enhancements", belumAktif: true },
  { id: "hieroglyph",     name: "Hieroglyph",      desc: "-1 Ante" },
  { id: "petroglyph",     name: "Petroglyph",      desc: "-1 Ante again" },
  { id: "directorscut",   name: "Director's Cut",  desc: "Reroll the Boss Blind once", belumAktif: true },
  { id: "retcon",         name: "Retcon",          desc: "Reroll the Boss Blind freely", belumAktif: true },
  { id: "paintbrush",     name: "Paint Brush",     desc: "+1 hand size" },
  { id: "palette",        name: "Palette",         desc: "+1 hand size again" },
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
  // targetMult: pengali target skor. debuff: kartu yang dilemahkan.
  // Efek yang belum bisa dibangun tetap ada di sini sebagai data supaya
  // daftarnya lengkap, tetapi tidak saya klaim sudah bekerja.
  { id: "hook",    name: "The Hook",    desc: "Membuang 2 kartu acak dari tangan setelah tiap hand" },
  { id: "ox",      name: "The Ox",      desc: "Memainkan bentuk tangan tersering membuat uang menjadi $0" },
  { id: "house",   name: "The House",   desc: "Hand pertama ditarik tertutup" },
  { id: "wall",    name: "The Wall",    desc: "Blind sangat besar", targetMult: 4 },
  { id: "wheel",   name: "The Wheel",   desc: "1 dari 7 kartu ditarik tertutup" },
  { id: "arm",     name: "The Arm",     desc: "Menurunkan level bentuk tangan yang dimainkan" },
  { id: "club",    name: "The Club",    desc: "Semua kartu Keriting dilemahkan", debuff: { suit: "clubs" } },
  { id: "fish",    name: "The Fish",    desc: "Kartu ditarik tertutup setelah tiap hand" },
  { id: "psychic", name: "The Psychic", desc: "Harus memainkan tepat 5 kartu" },
  { id: "goad",    name: "The Goad",    desc: "Semua kartu Sekop dilemahkan", debuff: { suit: "spades" } },
  { id: "head",    name: "The Head",    desc: "Semua kartu Hati dilemahkan", debuff: { suit: "hearts" } },
  { id: "window",  name: "The Window",  desc: "Semua kartu Wajik dilemahkan", debuff: { suit: "diamonds" } },
  { id: "manacle", name: "The Manacle", desc: "Ukuran tangan -1" },
  { id: "eye",     name: "The Eye",     desc: "Bentuk tangan tidak boleh diulang di babak ini" },
  { id: "mouth",   name: "The Mouth",   desc: "Hanya boleh memainkan satu bentuk tangan di babak ini" },
  { id: "plant",   name: "The Plant",   desc: "Semua kartu wajah dilemahkan", debuff: { face: true } },
  { id: "serpent", name: "The Serpent", desc: "Selalu menarik 3 kartu setelah main atau buang" },
  { id: "pillar",  name: "The Pillar",  desc: "Kartu yang sudah dimainkan di Ante ini dilemahkan" },
  { id: "needle",  name: "The Needle",  desc: "Hanya boleh memainkan 1 hand" },
  { id: "water",   name: "The Water",   desc: "Mulai dengan 0 buang" },
  { id: "tooth",   name: "The Tooth",   desc: "Kehilangan $1 tiap kartu yang dimainkan" },
  { id: "flint",   name: "The Flint",   desc: "Chips dan Mult dasar dibagi dua" },
  { id: "mark",    name: "The Mark",    desc: "Semua kartu wajah ditarik tertutup" },
  { id: "crimson", name: "Crimson Heart", desc: "Satu Joker acak dimatikan tiap hand" },
  { id: "cerulean", name: "Cerulean Bell", desc: "Satu kartu selalu terpilih" },
  { id: "verdant", name: "Verdant Leaf", desc: "Semua kartu dilemahkan sampai satu Joker dijual" },
  { id: "amber",   name: "Amber Acorn", desc: "Joker dibalik dan diacak" },
  { id: "violet",  name: "Violet Vessel", desc: "Blind Showdown sangat besar", targetMult: 6 },
];
