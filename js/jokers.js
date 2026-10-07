// ═══ Deckstorm — 43 Jokers (Balatro-faithful effects) ═══
// effect(ctx) -> { chips, mult, xmult, money, label } (all optional)
// ctx: { handName, scoringCards, playedCards, heldCards, discardsLeft, handsLeft,
//        deckCount, stats, money, emptySlots }
// Optional hooks: onBlindStart(j, S), onRoundEnd(j, S), onHandPlayed(j, ev), onDiscard(j)
const JOKERS = [
  // ── common ──
  { id: "joker", name: "Joker", cost: 2, rarity: "common",
    desc: "+4 Mult",
    effect: () => ({ mult: 4, label: "+4 mult" }) },

  { id: "greedy", name: "Greedy Joker", cost: 5, rarity: "common",
    desc: "Scoring Diamonds +3 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => x.suit === "diamonds").length; return n ? { mult: 3 * n, label: `+${3 * n} mult` } : null; } },
  { id: "lusty", name: "Lusty Joker", cost: 5, rarity: "common",
    desc: "Scoring Hearts +3 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => x.suit === "hearts").length; return n ? { mult: 3 * n, label: `+${3 * n} mult` } : null; } },
  { id: "wrathful", name: "Wrathful Joker", cost: 5, rarity: "common",
    desc: "Scoring Spades +3 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => x.suit === "spades").length; return n ? { mult: 3 * n, label: `+${3 * n} mult` } : null; } },
  { id: "gluttonous", name: "Gluttonous Joker", cost: 5, rarity: "common",
    desc: "Scoring Clubs +3 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => x.suit === "clubs").length; return n ? { mult: 3 * n, label: `+${3 * n} mult` } : null; } },

  { id: "jolly", name: "Jolly Joker", cost: 3, rarity: "common",
    desc: "+8 Mult if hand contains a Pair",
    effect: c => c.handName === "Pair" || c.handName === "Two Pair" || c.handName === "Full House" || c.handName === "Three of a Kind" || c.handName === "Four of a Kind" ? { mult: 8, label: "+8 mult" } : null },
  { id: "zany", name: "Zany Joker", cost: 4, rarity: "common",
    desc: "+12 Mult if hand contains Three of a Kind",
    effect: c => ["Three of a Kind", "Full House", "Four of a Kind", "Five of a Kind"].includes(c.handName) ? { mult: 12, label: "+12 mult" } : null },
  { id: "mad", name: "Mad Joker", cost: 4, rarity: "common",
    desc: "+10 Mult if hand contains Two Pair",
    effect: c => ["Two Pair", "Full House"].includes(c.handName) ? { mult: 10, label: "+10 mult" } : null },
  { id: "crazy", name: "Crazy Joker", cost: 4, rarity: "common",
    desc: "+12 Mult if hand contains a Straight",
    effect: c => ["Straight", "Straight Flush", "Royal Flush"].includes(c.handName) ? { mult: 12, label: "+12 mult" } : null },
  { id: "droll", name: "Droll Joker", cost: 4, rarity: "common",
    desc: "+10 Mult if hand contains a Flush",
    effect: c => ["Flush", "Straight Flush", "Royal Flush", "Flush House", "Flush Five"].includes(c.handName) ? { mult: 10, label: "+10 mult" } : null },

  { id: "sly", name: "Sly Joker", cost: 3, rarity: "common",
    desc: "+50 Chips if hand contains a Pair",
    effect: c => ["Pair", "Two Pair", "Full House", "Three of a Kind", "Four of a Kind"].includes(c.handName) ? { chips: 50, label: "+50 chips" } : null },
  { id: "wily", name: "Wily Joker", cost: 4, rarity: "common",
    desc: "+100 Chips if hand contains Three of a Kind",
    effect: c => ["Three of a Kind", "Full House", "Four of a Kind", "Five of a Kind"].includes(c.handName) ? { chips: 100, label: "+100 chips" } : null },
  { id: "clever", name: "Clever Joker", cost: 4, rarity: "common",
    desc: "+80 Chips if hand contains Two Pair",
    effect: c => ["Two Pair", "Full House"].includes(c.handName) ? { chips: 80, label: "+80 chips" } : null },
  { id: "devious", name: "Devious Joker", cost: 4, rarity: "common",
    desc: "+100 Chips if hand contains a Straight",
    effect: c => ["Straight", "Straight Flush", "Royal Flush"].includes(c.handName) ? { chips: 100, label: "+100 chips" } : null },
  { id: "crafty", name: "Crafty Joker", cost: 4, rarity: "common",
    desc: "+80 Chips if hand contains a Flush",
    effect: c => ["Flush", "Straight Flush", "Royal Flush", "Flush House", "Flush Five"].includes(c.handName) ? { chips: 80, label: "+80 chips" } : null },

  { id: "half", name: "Half Joker", cost: 5, rarity: "common",
    desc: "+20 Mult if hand has 3 or fewer cards",
    effect: c => c.playedCards.length <= 3 ? { mult: 20, label: "+20 mult" } : null },

  { id: "banner", name: "Banner", cost: 5, rarity: "common",
    desc: "+30 Chips per remaining discard",
    effect: c => c.discardsLeft > 0 ? { chips: 30 * c.discardsLeft, label: `+${30 * c.discardsLeft} chips` } : null },

  { id: "misprint", name: "Misprint", cost: 4, rarity: "common",
    desc: "+0 to +23 Mult (random)",
    effect: () => { const m = Math.floor(Math.random() * 24); return { mult: m, label: `+${m} mult` }; } },

  { id: "scholar", name: "Scholar", cost: 4, rarity: "common",
    desc: "Scoring Aces: +4 Mult, +20 Chips each",
    effect: c => { const n = c.scoringCards.filter(x => x.rank === 14).length; return n ? { chips: 20 * n, mult: 4 * n, label: `+${20 * n}c +${4 * n}m` } : null; } },

  { id: "business", name: "Business Card", cost: 4, rarity: "common",
    desc: "Scoring face cards: 1 in 2 chance for $2",
    effect: c => { let m = 0; c.scoringCards.forEach(x => { if (x.rank >= 11 && x.rank <= 13 && Math.random() < 0.5) m += 2; }); return m ? { money: m, label: `+$${m}` } : null; } },

  { id: "smiley", name: "Smiley Face", cost: 4, rarity: "common",
    desc: "Scoring face cards +5 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => x.rank >= 11 && x.rank <= 13).length; return n ? { mult: 5 * n, label: `+${5 * n} mult` } : null; } },

  { id: "green", name: "Green Joker", cost: 4, rarity: "common",
    desc: "+1 Mult per hand played, -1 per discard",
    init: () => ({ mult: 0 }),
    effect: function() { return this.data.mult > 0 ? { mult: this.data.mult, label: `+${this.data.mult} mult` } : null; },
    onHandPlayed(j) { j.data.mult++; },
    onDiscard(j) { j.data.mult = Math.max(0, j.data.mult - 1); } },

  { id: "fortune", name: "Fortune Teller", cost: 6, rarity: "common",
    desc: "+1 Mult per Tarot card used this run",
    effect: c => c.stats.tarotsUsed > 0 ? { mult: c.stats.tarotsUsed, label: `+${c.stats.tarotsUsed} mult` } : null },

  { id: "gros", name: "Gros Michel", cost: 5, rarity: "common",
    desc: "+15 Mult · 1 in 6 chance destroyed each hand",
    effect: () => ({ mult: 15, label: "+15 mult" }) },

  { id: "icecream", name: "Ice Cream", cost: 5, rarity: "common",
    desc: "+100 Chips · loses 5 per hand played",
    init: () => ({ chips: 100 }),
    effect: function() { return this.data.chips > 0 ? { chips: this.data.chips, label: `+${this.data.chips} chips` } : null; },
    onHandPlayed(j, ev, S) {
      j.data.chips -= 5;
      if (j.data.chips <= 0) S.jokers = S.jokers.filter(x => x !== j); // melts!
    } },

  { id: "egg", name: "Egg", cost: 4, rarity: "common",
    desc: "Gains $3 sell value each round",
    onRoundEnd(j) { j.sellBonus = (j.sellBonus || 0) + 3; } },

  { id: "blue", name: "Blue Joker", cost: 5, rarity: "common",
    desc: "+2 Chips per card left in deck",
    effect: c => ({ chips: 2 * c.deckCount, label: `+${2 * c.deckCount} chips` }) },

  { id: "bus", name: "Ride the Bus", cost: 5, rarity: "common",
    desc: "+1 Mult per consecutive hand without a scoring face card",
    init: () => ({ mult: 0 }),
    effect: function() { return this.data.mult > 0 ? { mult: this.data.mult, label: `+${this.data.mult} mult` } : null; },
    onHandPlayed(j, ev) {
      if (ev.scoringFacePlayed) j.data.mult = 0; else j.data.mult++;
    } },

  // ── uncommon ──
  { id: "fibonacci", name: "Fibonacci", cost: 8, rarity: "uncommon",
    desc: "Scoring A,2,3,5,8: +8 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => [14, 2, 3, 5, 8].includes(x.rank)).length; return n ? { mult: 8 * n, label: `+${8 * n} mult` } : null; } },

  { id: "even", name: "Even Steven", cost: 4, rarity: "uncommon",
    desc: "Scoring 10,8,6,4,2: +4 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => x.rank <= 10 && x.rank % 2 === 0).length; return n ? { mult: 4 * n, label: `+${4 * n} mult` } : null; } },
  { id: "odd", name: "Odd Todd", cost: 4, rarity: "uncommon",
    desc: "Scoring A,9,7,5,3: +4 Mult each",
    effect: c => { const n = c.scoringCards.filter(x => (x.rank === 14 || x.rank % 2 === 1) && x.rank < 11).length; return n ? { mult: 4 * n, label: `+${4 * n} mult` } : null; } },

  { id: "stencil", name: "Joker Stencil", cost: 8, rarity: "uncommon",
    desc: "×1 Mult per empty Joker slot",
    effect: c => ({ xmult: c.emptySlots, label: `×${c.emptySlots} mult` }) },

  { id: "constellation", name: "Constellation", cost: 6, rarity: "uncommon",
    desc: "×0.1 Mult per Planet card used this run",
    effect: c => c.stats.planetsUsed > 0 ? { xmult: 1 + 0.1 * c.stats.planetsUsed, label: `×${(1 + 0.1 * c.stats.planetsUsed).toFixed(1)} mult` } : null },

  { id: "satellite", name: "Satellite", cost: 6, rarity: "uncommon",
    desc: "$1 per Planet card used, at end of round",
    onRoundEnd(j, S) { return S.stats.planetsUsed; } },

  { id: "cartomancer", name: "Cartomancer", cost: 6, rarity: "uncommon",
    desc: "Create a Tarot card when blind begins",
    onBlindStart(j, S) {
      if (S.consumables.length < 2) {
        const t = TAROTS[Math.floor(Math.random() * TAROTS.length)];
        S.consumables.push({ ...t });
        return "Cartomancer created " + t.name;
      }
    } },

  { id: "burglar", name: "Burglar", cost: 6, rarity: "uncommon",
    desc: "+3 Hands, but no discards",
    onBlindStart(j, S) { S.handsLeft += 3; S.discardsLeft = 0; } },

  { id: "flowerpot", name: "Flower Pot", cost: 6, rarity: "uncommon",
    desc: "×3 Mult if scoring cards include all 4 suits",
    effect: c => {
      const suits = new Set(c.scoringCards.map(x => x.suit));
      return suits.size >= 4 ? { xmult: 3, label: "×3 mult" } : null;
    } },

  { id: "photograph", name: "Photograph", cost: 5, rarity: "uncommon",
    desc: "First scoring face card: ×2 Mult",
    effect: c => c.firstScoringFace ? { xmult: 2, label: "×2 mult" } : null },

  // ── rare ──
  { id: "duo", name: "The Duo", cost: 8, rarity: "rare",
    desc: "×2 Mult if hand contains a Pair",
    effect: c => ["Pair", "Two Pair", "Full House", "Three of a Kind", "Four of a Kind"].includes(c.handName) ? { xmult: 2, label: "×2 mult" } : null },
  { id: "trio", name: "The Trio", cost: 8, rarity: "rare",
    desc: "×3 Mult if hand contains Three of a Kind",
    effect: c => ["Three of a Kind", "Full House", "Four of a Kind", "Five of a Kind"].includes(c.handName) ? { xmult: 3, label: "×3 mult" } : null },
  { id: "family", name: "The Family", cost: 8, rarity: "rare",
    desc: "×4 Mult if hand contains Four of a Kind",
    effect: c => ["Four of a Kind", "Five of a Kind"].includes(c.handName) ? { xmult: 4, label: "×4 mult" } : null },
  { id: "order", name: "The Order", cost: 8, rarity: "rare",
    desc: "×3 Mult if hand contains a Straight",
    effect: c => ["Straight", "Straight Flush", "Royal Flush"].includes(c.handName) ? { xmult: 3, label: "×3 mult" } : null },
  { id: "tribe", name: "The Tribe", cost: 8, rarity: "rare",
    desc: "×2 Mult if hand contains a Flush",
    effect: c => ["Flush", "Straight Flush", "Royal Flush", "Flush House", "Flush Five"].includes(c.handName) ? { xmult: 2, label: "×2 mult" } : null },
];

// ── joker editions (Balatro: Foil/Holographic/Polychrome) ──
const EDITIONS = {
  foil:  { name: "Foil",         desc: "+50 Chips",    priceAdd: 2 },
  holo:  { name: "Holographic",  desc: "+10 Mult",     priceAdd: 3 },
  poly:  { name: "Polychrome",   desc: "×1.5 Mult",    priceAdd: 5 },
};

// Roll a random edition for a shop joker (Hone voucher doubles odds).
// Base odds: foil 4% / holo 3% / poly 2%, so 9% overall.
// Debug mode can force one edition outright, or scale the overall chance while
// keeping the 4:3:2 ratio between them.
const EDITION_TOTAL = 0.09;
function rollEdition(hone) {
  const forced = DEBUG.on && DEBUG.editionForce;
  if (forced) return forced;
  const boost = (DEBUG.on && DEBUG.editionBoost > 0) ? DEBUG.editionBoost : 1;
  const chance = Math.min(1, EDITION_TOTAL * (hone ? 2 : 1) * boost);
  if (Math.random() >= chance) return null;
  const r = Math.random() * EDITION_TOTAL;
  if (r < 0.04) return "foil";
  if (r < 0.07) return "holo";
  return "poly";
}

function makeJoker(def, edition) {
  const j = { ...def, edition: edition || null };
  if (def.init) j.data = def.init();
  return j;
}

function rollShopJokers(count, ownedIds, hone) {
  const weights = { common: 70, uncommon: 25, rare: 5 };
  let pool = JOKERS.filter(j => !ownedIds.has(j.id));
  // debug: pin the rarity of everything the shop rolls
  if (DEBUG.on && DEBUG.rarityForce) {
    const forced = pool.filter(j => j.rarity === DEBUG.rarityForce);
    if (forced.length) pool = forced;
  }
  const picks = [];
  while (picks.length < count && pool.length > 0) {
    const total = pool.reduce((s, j) => s + weights[j.rarity], 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[pool[i].rarity];
      if (r <= 0) { idx = i; break; }
    }
    picks.push(makeJoker(pool.splice(idx, 1)[0], rollEdition(hone)));
  }
  return picks;
}

// Balatro: sell = floor(cost/2), min $1 (+ edition price, + sellBonus e.g. Egg)
function sellValue(item) {
  let v = Math.max(1, Math.floor(item.cost / 2));
  if (item.edition) v += EDITIONS[item.edition].priceAdd;
  if (item.sellBonus) v += item.sellBonus;
  return v;
}
