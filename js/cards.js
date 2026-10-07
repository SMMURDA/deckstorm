// Deck & poker hand evaluation
const SUITS = ["♠", "♥", "♦", "♣"]; // spades, hearts, diamonds, clubs
const SUIT_KEYS = ["spades", "hearts", "diamonds", "clubs"];
const RANK_LABELS = { 11: "J", 12: "Q", 13: "K", 14: "A" };

function buildDeck() {
  const deck = [];
  for (let s = 0; s < 4; s++) {
    for (let r = 2; r <= 14; r++) {
      deck.push({ rank: r, suit: SUIT_KEYS[s], symbol: SUITS[s], id: `${SUIT_KEYS[s]}-${r}` });
    }
  }
  return deck;
}

function shuffle(deck) {
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankLabel(r) { return RANK_LABELS[r] || String(r); }

// Chips a card contributes when scoring (Balatro rules: 2-10 face, J/Q/K 10, A 11)
function cardChips(card) {
  if (card.rank === 14) return 11;
  if (card.rank >= 11) return 10;
  return card.rank;
}

// Hand base values: [chips, mult]
const HANDS = {
  "Royal Flush":     [100, 8],
  "Straight Flush":  [100, 8],
  "Four of a Kind":  [60, 7],
  "Full House":      [40, 4],
  "Flush":           [35, 4],
  "Straight":        [30, 4],
  "Three of a Kind": [30, 3],
  "Two Pair":        [20, 2],
  "Pair":            [10, 2],
  "High Card":       [5, 1],
};

// Evaluate up to 5 selected cards -> { name, chips, mult, scoringIds:Set }
function evaluateHand(cards) {
  const n = cards.length;
  const byRank = new Map();
  for (const c of cards) {
    if (!byRank.has(c.rank)) byRank.set(c.rank, []);
    byRank.get(c.rank).push(c);
  }
  const groups = [...byRank.values()].sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
  const sizes = groups.map(g => g.length).sort((a, b) => b - a);

  const isFlush = n === 5 && cards.every(c => c.suit === cards[0].suit);
  let isStraight = false, straightHigh = 0;
  if (n === 5 && byRank.size === 5) {
    const ranks = cards.map(c => c.rank).sort((a, b) => a - b);
    if (ranks[4] - ranks[0] === 4) { isStraight = true; straightHigh = ranks[4]; }
    else if (ranks.join() === "2,3,4,5,14") { isStraight = true; straightHigh = 5; } // wheel
  }

  const ids = arr => new Set(arr.flat().map(c => c.id));
  const allIds = new Set(cards.map(c => c.id));

  let name;
  if (isStraight && isFlush) name = straightHigh === 14 ? "Royal Flush" : "Straight Flush";
  else if (sizes[0] === 4) name = "Four of a Kind";
  else if (sizes[0] === 3 && sizes[1] === 2) name = "Full House";
  else if (isFlush) name = "Flush";
  else if (isStraight) name = "Straight";
  else if (sizes[0] === 3) name = "Three of a Kind";
  else if (sizes[0] === 2 && sizes[1] === 2) name = "Two Pair";
  else if (sizes[0] === 2) name = "Pair";
  else name = "High Card";

  let scoring;
  if (["Royal Flush", "Straight Flush", "Flush", "Straight", "Full House"].includes(name)) scoring = allIds;
  else if (name === "Four of a Kind") scoring = ids([groups[0]]);
  else if (name === "Three of a Kind") scoring = ids([groups[0]]);
  else if (name === "Two Pair") scoring = ids(groups.filter(g => g.length === 2));
  else if (name === "Pair") scoring = ids([groups[0]]);
  else scoring = new Set([cards.reduce((m, c) => (c.rank > m.rank ? c : m)).id]); // High Card: only highest

  const [chips, mult] = HANDS[name];
  return { name, chips, mult, scoringIds: scoring };
}
