// Joker definitions. effect(ctx) -> { chips, mult, multTimes } deltas.
// ctx: { handName, scoringCards, playedCards, discardsLeft, handsLeft, rng }
const JOKERS = [
  {
    id: "joker", name: "Joker", cost: 2, rarity: "common",
    desc: "+4 Mult",
    effect: () => ({ mult: 4 }),
  },
  {
    id: "sly", name: "Sly Joker", cost: 3, rarity: "common",
    desc: "+50 Chips if played hand contains a Pair",
    effect: ({ handName }) => ["Pair", "Two Pair", "Full House"].includes(handName) ? { chips: 50 } : {},
  },
  {
    id: "wily", name: "Wily Joker", cost: 4, rarity: "common",
    desc: "+100 Chips if played hand contains Three of a Kind",
    effect: ({ handName }) => ["Three of a Kind", "Full House", "Four of a Kind"].includes(handName) ? { chips: 100 } : {},
  },
  {
    id: "jolly", name: "Jolly Joker", cost: 3, rarity: "common",
    desc: "+8 Mult if played hand contains a Pair",
    effect: ({ handName }) => ["Pair", "Two Pair", "Full House"].includes(handName) ? { mult: 8 } : {},
  },
  {
    id: "zany", name: "Zany Joker", cost: 4, rarity: "common",
    desc: "+12 Mult if played hand contains Three of a Kind",
    effect: ({ handName }) => ["Three of a Kind", "Full House", "Four of a Kind"].includes(handName) ? { mult: 12 } : {},
  },
  {
    id: "mad", name: "Mad Joker", cost: 6, rarity: "uncommon",
    desc: "+20 Mult if played hand contains Four of a Kind",
    effect: ({ handName }) => handName === "Four of a Kind" ? { mult: 20 } : {},
  },
  {
    id: "crazy", name: "Crazy Joker", cost: 4, rarity: "common",
    desc: "+12 Mult if played hand contains a Straight",
    effect: ({ handName }) => ["Straight", "Straight Flush", "Royal Flush"].includes(handName) ? { mult: 12 } : {},
  },
  {
    id: "droll", name: "Droll Joker", cost: 4, rarity: "common",
    desc: "+10 Mult if played hand contains a Flush",
    effect: ({ handName }) => ["Flush", "Straight Flush", "Royal Flush"].includes(handName) ? { mult: 10 } : {},
  },
  {
    id: "half", name: "Half Joker", cost: 5, rarity: "uncommon",
    desc: "+20 Mult if played hand has 3 or fewer cards",
    effect: ({ playedCards }) => playedCards.length <= 3 ? { mult: 20 } : {},
  },
  {
    id: "banner", name: "Banner", cost: 4, rarity: "common",
    desc: "+30 Chips for each remaining discard",
    effect: ({ discardsLeft }) => ({ chips: 30 * discardsLeft }),
  },
  {
    id: "summit", name: "Mystic Summit", cost: 5, rarity: "uncommon",
    desc: "+15 Mult when 0 discards remaining",
    effect: ({ discardsLeft }) => discardsLeft === 0 ? { mult: 15 } : {},
  },
  {
    id: "misprint", name: "Misprint", cost: 4, rarity: "uncommon",
    desc: "+0 to +23 Mult, random each hand",
    effect: () => ({ mult: Math.floor(Math.random() * 24) }),
  },
  {
    id: "fibonacci", name: "Fibonacci", cost: 6, rarity: "uncommon",
    desc: "+8 Mult per scoring Ace, 2, 3, 5, or 8",
    effect: ({ scoringCards }) => ({ mult: 8 * scoringCards.filter(c => [2, 3, 5, 8, 14].includes(c.rank)).length }),
  },
  {
    id: "gros", name: "Gros Michel", cost: 5, rarity: "uncommon",
    desc: "+15 Mult. 1 in 6 chance to be destroyed each round",
    effect: () => ({ mult: 15 }),
    endOfRoundDestroy: () => Math.random() < 1 / 6,
  },
  {
    id: "steven", name: "Even Steven", cost: 4, rarity: "common",
    desc: "+4 Mult per scoring even card",
    effect: ({ scoringCards }) => ({ mult: 4 * scoringCards.filter(c => c.rank % 2 === 0 && c.rank !== 14).length }),
  },
  {
    id: "todd", name: "Odd Todd", cost: 4, rarity: "common",
    desc: "+30 Chips per scoring odd card",
    effect: ({ scoringCards }) => ({ chips: 30 * scoringCards.filter(c => c.rank % 2 === 1).length }),
  },
];

const RARITY_WEIGHT = { common: 70, uncommon: 30 };

function rollShopJokers(count, ownedIds) {
  const pool = JOKERS.filter(j => !ownedIds.has(j.id));
  const offers = [];
  for (let i = 0; i < count && pool.length; i++) {
    const total = pool.reduce((s, j) => s + RARITY_WEIGHT[j.rarity], 0);
    let roll = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      roll -= RARITY_WEIGHT[pool[idx].rarity];
      if (roll <= 0) break;
    }
    idx = Math.min(idx, pool.length - 1);
    offers.push(pool.splice(idx, 1)[0]);
  }
  return offers;
}
