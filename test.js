// Smoke test for cards.js + jokers.js (run with: node test.js)
const fs = require("fs");
eval(fs.readFileSync("js/cards.js", "utf8"));
eval(fs.readFileSync("js/jokers.js", "utf8") + ";globalThis.JOKERS=JOKERS;globalThis.rollShopJokers=rollShopJokers;");

const C = (rank, suit) => ({ rank, suit, symbol: "?", id: `${suit}-${rank}` });
let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${name}`);
}

// deck
eq("deck size", buildDeck().length, 52);
eq("deck unique", new Set(buildDeck().map(c => c.id)).size, 52);

// hand detection
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

// scoring cards: pair only scores the pair; kickers don't
const pairEv = evaluateHand([C(7,"spades"),C(7,"hearts"),C(3,"clubs"),C(9,"diamonds"),C(2,"spades")]);
eq("pair scores 2 cards", pairEv.scoringIds.size, 2);
const hcEv = evaluateHand([C(14,"spades"),C(7,"hearts"),C(3,"clubs"),C(9,"diamonds"),C(2,"spades")]);
eq("high card scores 1 card", hcEv.scoringIds.size, 1);
eq("full house scores all 5", evaluateHand([C(9,"spades"),C(9,"hearts"),C(9,"clubs"),C(2,"diamonds"),C(2,"spades")]).scoringIds.size, 5);

// card chips
eq("ace chips", cardChips(C(14,"hearts")), 11);
eq("king chips", cardChips(C(13,"hearts")), 10);
eq("nine chips", cardChips(C(9,"hearts")), 9);

// jokers: every effect runs without crashing on a sample ctx
const ctx = { handName: "Pair", scoringCards: [C(7,"spades"), C(7,"hearts")], playedCards: [C(7,"spades"), C(7,"hearts"), C(3,"clubs")], discardsLeft: 2, handsLeft: 3 };
for (const j of JOKERS) {
  try { j.effect(ctx); console.log(`ok   joker ${j.id}`); }
  catch (e) { fails++; console.log(`FAIL joker ${j.id}: ${e.message}`); }
}
eq("shop offers count", rollShopJokers(2, new Set()).length, 2);
eq("shop excludes owned", rollShopJokers(2, new Set(JOKERS.map(j => j.id))).length, 0);
eq("joker ids unique", new Set(JOKERS.map(j => j.id)).size, JOKERS.length);

console.log(fails ? `\n${fails} FAILURES` : "\nALL PASS");
process.exit(fails ? 1 : 0);
