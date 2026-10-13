// ═══ Deckstorm — deck, enhancements & poker hand evaluation (Balatro rules) ═══
const SUIT_KEYS = ["spades", "hearts", "diamonds", "clubs"];
const RANK_LABELS = { 11: "J", 12: "Q", 13: "K", 14: "A" };

// Base hand values (Balatro wiki, level 1). Chips/mult grow via Planet cards.
const HAND_BASE = {
  "High Card":       { chips: 5,   mult: 1  },
  "Pair":            { chips: 10,  mult: 2  },
  "Two Pair":        { chips: 20,  mult: 2  },
  "Three of a Kind": { chips: 30,  mult: 3  },
  "Straight":        { chips: 30,  mult: 4  },
  "Flush":           { chips: 35,  mult: 4  },
  "Full House":      { chips: 40,  mult: 4  },
  "Four of a Kind":  { chips: 60,  mult: 7  },
  "Straight Flush":  { chips: 100, mult: 8  },
  "Royal Flush":     { chips: 100, mult: 8  },
  "Five of a Kind":  { chips: 120, mult: 12 },
  "Flush House":     { chips: 140, mult: 14 },
  "Flush Five":      { chips: 160, mult: 14 },
};

function buildDeck() {
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (let r = 2; r <= 14; r++) {
      deck.push({ rank: r, suit, id: `${suit}-${r}`, enhancement: null });
    }
  }
  return deck;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// rankLabel takes a RANK NUMBER (2-14)
function rankLabel(r) { return RANK_LABELS[r] || String(r); }

// Chips a card contributes when scoring
function cardChips(card) {
  if (card.enhancement === "stone") return 50;
  if (card.rank === 14) return 11;
  if (card.rank >= 11) return 10;
  return card.rank;
}

function isFace(c) { return c.rank >= 11 && c.rank <= 13; }

// ── hand evaluation ──
// Stone cards are excluded from detection but ALWAYS score (+50 chips each).
// Wild cards count as any suit for flush checks.
// Aturan penilaian tangan yang bisa diubah Joker. js/game.js mengisinya dari
// DSEfek.aturanTangan() sebelum memanggil evaluateHand:
//   empatJari  (Four Fingers)  - Flush dan Straight cukup 4 kartu
//   jalanPintas (Shortcut)     - Straight boleh melompati satu rank
//   suitKabur  (Smeared Joker) - hati=wajik, sekop=keriting
//   semuaNilai (Splash)        - semua kartu yang dimainkan ikut dinilai
let ATURAN_TANGAN = { empatJari: false, jalanPintas: false, suitKabur: false, semuaNilai: false };

function evaluateHand(cards) {
  const stones = cards.filter(c => c.enhancement === "stone");
  const rest = cards.filter(c => c.enhancement !== "stone");
  const scoreAll = new Set(cards.map(c => c.id));
  const stoneIds = new Set(stones.map(c => c.id));

  if (rest.length === 0) {
    return { name: "High Card", scoringIds: scoreAll }; // semua batu: dinilai semua
  }

  const ranks = rest.map(c => c.rank).sort((a, b) => a - b);
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const groups = Object.entries(counts)
    .map(([r, n]) => ({ rank: +r, n }))
    .sort((a, b) => b.n - a.n || b.rank - a.rank);

  const wilds = rest.filter(c => c.enhancement === "wild");
  const nonWild = rest.filter(c => c.enhancement !== "wild");
  // Smeared Joker: hati dihitung wajik, sekop dihitung keriting
  const SUIT_KABUR = { hearts: "diamonds", diamonds: "diamonds", spades: "clubs", clubs: "clubs" };
  const suitOf = c => ATURAN_TANGAN.suitKabur ? (SUIT_KABUR[c.suit] || c.suit) : c.suit;
  const suitCounts = {};
  nonWild.forEach(c => { const k = suitOf(c); suitCounts[k] = (suitCounts[k] || 0) + 1; });
  const maxSuit = Math.max(0, ...Object.values(suitCounts));
  const perlu = ATURAN_TANGAN.empatJari ? 4 : 5;
  const isFlush = rest.length >= perlu && (maxSuit + wilds.length === rest.length);

  const uniq = [...new Set(ranks)];
  const berurutan = (mulai, lompat) => {
    for (let i = 1; i < mulai.length; i++) {
      const beda = mulai[i] - mulai[i - 1];
      if (beda !== 1 && !(lompat && beda === 2)) return false;
    }
    return true;
  };
  const isStraight = rest.length >= perlu && (
    (uniq.length === rest.length && berurutan(uniq, ATURAN_TANGAN.jalanPintas)) ||
    uniq.join() === "2,3,4,5,14" // roda
  );
  const straightHigh = uniq.join() === "2,3,4,5,14" ? 5 : uniq[4];

  const ids = pred => new Set(rest.filter(pred).map(c => c.id));
  const byRank = r => ids(c => c.rank === r);

  let name, scoring;
  const n = rest.length;
  const five = groups[0].n === 5;
  const fullHouse = groups[0].n === 3 && groups[1] && groups[1].n === 2;

  if (isFlush && five)            { name = "Flush Five";      scoring = scoreAll; }
  else if (isFlush && fullHouse)  { name = "Flush House";     scoring = scoreAll; }
  else if (five)                  { name = "Five of a Kind";  scoring = scoreAll; }
  else if (isFlush && isStraight) {
    name = straightHigh === 14 ? "Royal Flush" : "Straight Flush";
    scoring = scoreAll;
  }
  else if (groups[0].n === 4)     { name = "Four of a Kind";  scoring = byRank(groups[0].rank); }
  else if (fullHouse)             { name = "Full House";      scoring = scoreAll; }
  else if (isFlush)               { name = "Flush";           scoring = scoreAll; }
  else if (isStraight)            { name = "Straight";        scoring = scoreAll; }
  else if (groups[0].n === 3)     { name = "Three of a Kind"; scoring = byRank(groups[0].rank); }
  else if (groups[0].n === 2 && groups[1] && groups[1].n === 2) {
    name = "Two Pair";
    scoring = new Set([...byRank(groups[0].rank), ...byRank(groups[1].rank)]);
  }
  else if (groups[0].n === 2)     { name = "Pair";            scoring = byRank(groups[0].rank); }
  else {
    name = "High Card";
    const top = Math.max(...ranks);
    scoring = ids(c => c.rank === top);
  }

  stoneIds.forEach(id => scoring.add(id)); // stones always score
  const base = HAND_BASE[name];
  return { name, chips: base.chips, mult: base.mult, scoringIds: scoring };
}

// Splash: semua kartu yang dimainkan ikut dinilai, apa pun bentuk tangannya.
// Dipanggil js/game.js sesudah evaluateHand.
function terapkanSplash(hasil, cards) {
  if (ATURAN_TANGAN && ATURAN_TANGAN.semuaNilai) {
    return { name: hasil.name, scoringIds: new Set(cards.map(c => c.id)) };
  }
  return hasil;
}
