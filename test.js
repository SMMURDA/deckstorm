// Smoke test for cards.js + jokers.js + consumables.js (run with: node test.js)
const fs = require("fs");
eval(fs.readFileSync("js/cards.js", "utf8"));
eval(fs.readFileSync("js/jokers.js", "utf8") + ";globalThis.JOKERS=JOKERS;globalThis.EDITIONS=EDITIONS;globalThis.rollShopJokers=rollShopJokers;globalThis.rollEdition=rollEdition;globalThis.makeJoker=makeJoker;globalThis.sellValue=sellValue;");
eval(fs.readFileSync("js/consumables.js", "utf8") + ";globalThis.PLANETS=PLANETS;globalThis.TAROTS=TAROTS;globalThis.VOUCHERS=VOUCHERS;globalThis.PACKS=PACKS;globalThis.BOSSES=BOSSES;");

const C = (rank, suit, enhancement = null) => ({ rank, suit, enhancement, id: `${suit}-${rank}-${Math.random().toString(36).slice(2, 7)}` });
let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${name}`);
}

// ── deck & labels ──
eq("deck size", buildDeck().length, 52);
eq("deck unique", new Set(buildDeck().map(c => c.id)).size, 52);
eq("rankLabel ace", rankLabel(14), "A");
eq("rankLabel king", rankLabel(13), "K");
eq("rankLabel queen", rankLabel(12), "Q");
eq("rankLabel jack", rankLabel(11), "J");
eq("rankLabel 9", rankLabel(9), "9");

// ── hand detection ──
eq("royal flush", evaluateHand([C(10,"hearts"),C(11,"hearts"),C(12,"hearts"),C(13,"hearts"),C(14,"hearts")]).name, "Royal Flush");
eq("straight flush", evaluateHand([C(5,"clubs"),C(6,"clubs"),C(7,"clubs"),C(8,"clubs"),C(9,"clubs")]).name, "Straight Flush");
eq("wheel straight", evaluateHand([C(14,"spades"),C(2,"hearts"),C(3,"clubs"),C(4,"diamonds"),C(5,"spades")]).name, "Straight");
eq("four of a kind", evaluateHand([C(9,"spades"),C(9,"hearts"),C(9,"clubs"),C(9,"diamonds"),C(2,"spades")]).name, "Four of a Kind");
eq("full house", evaluateHand([C(9,"spades"),C(9,"hearts"),C(9,"clubs"),C(2,"diamonds"),C(2,"spades")]).name, "Full House");
eq("flush", evaluateHand([C(2,"hearts"),C(5,"hearts"),C(9,"hearts"),C(11,"hearts"),C(13,"hearts")]).name, "Flush");
eq("straight", evaluateHand([C(5,"spades"),C(6,"hearts"),C(7,"clubs"),C(8,"diamonds"),C(9,"spades")]).name, "Straight");
eq("trips", evaluateHand([C(7,"spades"),C(7,"hearts"),C(7,"clubs"),C(2,"diamonds"),C(9,"spades")]).name, "Three of a Kind");
eq("two pair", evaluateHand([C(7,"spades"),C(7,"hearts"),C(9,"clubs"),C(9,"diamonds"),C(2,"spades")]).name, "Two Pair");
eq("pair", evaluateHand([C(7,"spades"),C(7,"hearts"),C(3,"clubs"),C(9,"diamonds"),C(2,"spades")]).name, "Pair");
eq("high card", evaluateHand([C(14,"spades"),C(7,"hearts"),C(3,"clubs"),C(9,"diamonds"),C(2,"spades")]).name, "High Card");
eq("4-card flush is NOT flush", evaluateHand([C(2,"hearts"),C(5,"hearts"),C(9,"hearts"),C(11,"hearts")]).name, "High Card");

// secret hands
eq("five of a kind", evaluateHand([C(9,"spades"),C(9,"hearts"),C(9,"clubs"),C(9,"diamonds"),C(9,"hearts")]).name, "Five of a Kind");
eq("flush five", evaluateHand([C(9,"hearts"),C(9,"hearts"),C(9,"hearts"),C(9,"hearts"),C(9,"hearts")]).name, "Flush Five");
eq("flush house", evaluateHand([C(9,"hearts"),C(9,"hearts"),C(9,"hearts"),C(2,"hearts"),C(2,"hearts")]).name, "Flush House");

// enhancements in evaluation
eq("wild completes flush", evaluateHand([C(2,"hearts"),C(5,"hearts"),C(9,"hearts"),C(11,"hearts"),C(13,"spades","wild")]).name, "Flush");
eq("stone always scores", evaluateHand([C(7,"spades"),C(7,"hearts"),C(3,"clubs"),C(9,"diamonds"),C(2,"spades","stone")]).scoringIds.size, 3);
eq("all stones = high card, all score", evaluateHand([C(7,"spades","stone"),C(7,"hearts","stone")]).scoringIds.size, 2);
eq("stone excluded from detection", evaluateHand([C(5,"spades"),C(6,"hearts"),C(7,"clubs"),C(8,"diamonds"),C(9,"spades","stone")]).name, "High Card");

// scoring-card subsets
eq("pair scores 2 cards", evaluateHand([C(7,"spades"),C(7,"hearts"),C(3,"clubs"),C(9,"diamonds"),C(2,"spades")]).scoringIds.size, 2);
eq("full house scores all 5", evaluateHand([C(9,"spades"),C(9,"hearts"),C(9,"clubs"),C(2,"diamonds"),C(2,"spades")]).scoringIds.size, 5);

// chips
eq("ace chips", cardChips(C(14,"hearts")), 11);
eq("king chips", cardChips(C(13,"hearts")), 10);
eq("stone chips", cardChips(C(9,"hearts","stone")), 50);

// ── jokers ──
const ctx = {
  handName: "Pair",
  scoringCards: [C(7,"spades"), C(7,"hearts")],
  playedCards: [C(7,"spades"), C(7,"hearts"), C(3,"clubs")],
  heldCards: [], discardsLeft: 2, handsLeft: 3,
  deckCount: 30, stats: { planetsUsed: 2, tarotsUsed: 1 },
  money: 10, emptySlots: 3, firstScoringFace: false,
};
for (const def of JOKERS) {
  const j = makeJoker(def);
  try {
    const r = j.effect ? j.effect(ctx) : null;
    if (j.onHandPlayed) j.onHandPlayed(j, { scoringFacePlayed: false }, { jokers: [j] });
    if (j.onDiscard) j.onDiscard(j, {});
    if (j.onRoundEnd) j.onRoundEnd(j, { stats: { planetsUsed: 2 } });
    console.log(`ok   joker ${j.id}`);
  } catch (e) { fails++; console.log(`FAIL joker ${j.id}: ${e.message}`); }
}
eq("joker ids unique", new Set(JOKERS.map(j => j.id)).size, JOKERS.length);
eq("joker count >= 40", JOKERS.length >= 40, true);
eq("shop offers count", rollShopJokers(3, new Set()).length, 3);
eq("shop excludes owned", rollShopJokers(2, new Set(JOKERS.map(j => j.id))).length, 0);
eq("sellValue joker $2 -> $1", sellValue({ cost: 2 }), 1);
eq("sellValue $5 -> $2", sellValue({ cost: 5 }), 2);
eq("sellValue poly adds 5", sellValue({ cost: 4, edition: "poly" }), 7);
eq("editions valid keys", Object.keys(EDITIONS).sort(), ["foil", "holo", "poly"]);
{ const j = makeJoker(JOKERS.find(x => x.id === "green")); eq("makeJoker init data", j.data.mult, 0); }

// ── consumables ──
eq("12 planets", PLANETS.length, 12);
eq("22 tarots", TAROTS.length, 22);
eq("7 vouchers", VOUCHERS.length, 7);
eq("3 packs", PACKS.length, 3);
eq("10 bosses", BOSSES.length, 10);
eq("planet ids unique", new Set(PLANETS.map(p => p.id)).size, 12);
eq("tarot ids unique", new Set(TAROTS.map(t => t.id)).size, 22);
eq("voucher ids unique", new Set(VOUCHERS.map(v => v.id)).size, 7);

// planet covers every levelable hand
["High Card","Pair","Two Pair","Three of a Kind","Straight","Flush","Full House","Four of a Kind","Straight Flush","Five of a Kind","Flush House","Flush Five"].forEach(h => {
  eq(`planet exists for ${h}`, PLANETS.some(p => p.hand === h), true);
});

// tarot applies (mock S)
function mockS() {
  return { money: 10, jokers: [], consumables: [], hand: [C(5,"hearts"), C(9,"clubs")], deck: buildDeck(), lastConsumable: null, vouchers: new Set(), stats: { planetsUsed: 0, tarotsUsed: 0, planetCounts: {} } };
}
{
  const s = mockS();
  TAROTS.find(t => t.id === "hermit").apply(s);
  eq("hermit doubles money", s.money, 20);
}
{
  const s = mockS(); s.money = 50;
  TAROTS.find(t => t.id === "hermit").apply(s);
  eq("hermit caps at +20", s.money, 70);
}
{
  const s = mockS();
  const card = s.hand[0];
  TAROTS.find(t => t.id === "chariot").apply(s, [card]);
  eq("chariot -> steel", card.enhancement, "steel");
}
{
  const s = mockS();
  TAROTS.find(t => t.id === "sun").apply(s, s.hand);
  eq("sun -> hearts", s.hand.every(c => c.suit === "hearts"), true);
}
{
  const s = mockS();
  const card = s.hand[0]; // 5 hearts
  TAROTS.find(t => t.id === "strength").apply(s, [card]);
  eq("strength +1 rank", card.rank, 6);
}
{
  const s = mockS();
  const before = s.hand.length + s.deck.length;
  TAROTS.find(t => t.id === "hanged").apply(s, [s.hand[0]]);
  eq("hanged destroys card", s.hand.length + s.deck.length, before - 1);
}
{
  const s = mockS();
  TAROTS.find(t => t.id === "death").apply(s, [s.hand[0], s.hand[1]]);
  eq("death copies card", s.hand[0].rank, 9);
  eq("death copies suit", s.hand[0].suit, "clubs");
}
{
  const s = mockS();
  s.jokers.push(makeJoker(JOKERS.find(j => j.id === "joker")));
  TAROTS.find(t => t.id === "judgement").apply(s);
  eq("judgement adds joker", s.jokers.length, 2);
}
{
  const s = mockS();
  const r = TAROTS.find(t => t.id === "priestess").apply(s);
  eq("priestess creates planets", r.ok && s.consumables.length, 2);
}
{
  const s = mockS();
  s.lastConsumable = { ...PLANETS[0] };
  TAROTS.find(t => t.id === "fool").apply(s);
  eq("fool copies last consumable", s.consumables[0].name, "Pluto");
}
{
  const s = mockS();
  s.jokers.push(makeJoker(JOKERS.find(j => j.id === "joker"))); // cost 2 -> sell 1
  TAROTS.find(t => t.id === "temperance").apply(s);
  eq("temperance pays sell value", s.money, 11);
}

// packs open
{
  const s = mockS();
  const b = PACKS.find(p => p.id === "buffoon").open(s);
  eq("buffoon opens 2 jokers", b.length, 2);
  const a = PACKS.find(p => p.id === "arcana").open(s);
  eq("arcana opens 3 tarots", a.length, 3);
  const ce = PACKS.find(p => p.id === "celestial").open(s);
  eq("celestial opens 3 planets", ce.length, 3);
}

console.log(fails ? `\n${fails} FAILURES` : "\nALL PASS");
process.exit(fails ? 1 : 0);
