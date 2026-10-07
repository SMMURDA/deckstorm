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
function evaluateHand(cards) {
  const stones = cards.filter(c => c.enhancement === "stone");
  const rest = cards.filter(c => c.enhancement !== "stone");
  const scoreAll = new Set(cards.map(c => c.id));
  const stoneIds = new Set(stones.map(c => c.id));

  if (rest.length === 0) {
    return { name: "High Card", scoringIds: scoreAll }; // all stone: just score them
  }

  const ranks = rest.map(c => c.rank).sort((a, b) => a - b);
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const groups = Object.entries(counts)
    .map(([r, n]) => ({ rank: +r, n }))
    .sort((a, b) => b.n - a.n || b.rank - a.rank);

  const wilds = rest.filter(c => c.enhancement === "wild");
  const nonWild = rest.filter(c => c.enhancement !== "wild");
  const suitCounts = {};
  nonWild.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
  const maxSuit = Math.max(0, ...Object.values(suitCounts));
  const isFlush = rest.length === 5 && (maxSuit + wilds.length === 5);

  const uniq = [...new Set(ranks)];
  const isStraight = rest.length === 5 && (
    (uniq.length === 5 && uniq[4] - uniq[0] === 4) ||
    uniq.join() === "2,3,4,5,14" // wheel
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
