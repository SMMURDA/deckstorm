// ═══ Deckstorm — DOM integration test (jsdom). Simulates real clicks. ═══
const fs = require("fs");
const { JSDOM } = require("jsdom");

// load all game scripts in ONE shared scope, injected as an inline <script>
const bundle = ["js/cards.js", "js/jokers.js", "js/consumables.js", "js/audio.js", "js/game.js"]
  .map(f => fs.readFileSync(f, "utf8")).join("\n;\n");
const html = fs.readFileSync("index.html", "utf8")
  .replace(/<script src="[^"]*"><\/script>/g, "")
  .replace("</body>", () => `<script>${bundle}</script></body>`); // fn: avoid $-pattern mangling
const dom = new JSDOM(html, {
  url: "https://deckstorm.local/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(window) {
    try { window.localStorage.setItem("deckstorm.settings", JSON.stringify({ sound: false, anim: false })); } catch (e) {}
  },
});
const { window } = dom;
const { document } = window;

let fails = 0, passes = 0;
function ok(name, cond) {
  if (cond) { passes++; console.log("ok   " + name); }
  else { fails++; console.log("FAIL " + name); }
}
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, timeout = 4000) {
  const t0 = Date.now();
  while (!fn()) { if (Date.now() - t0 > timeout) return false; await sleep(60); }
  return true;
}
const DS = window.DS;
DS.settings.anim = false;
DS.settings.sound = false;

(async () => {
  // 1. menu loads
  ok("menu screen active", $("#screen-menu").classList.contains("active"));
  ok("start button exists", !!$("#btn-start"));

  // 2. start run
  $("#btn-start").click();
  await sleep(50);
  ok("game screen active after start", $("#screen-game").classList.contains("active"));
  ok("8 cards dealt", $$("#hand .card").length === 8);

  // 3. REGRESSION: rank labels must be A/K/Q/J/10-2, never "[object Object]"
  const ranks = $$("#hand .card .c-rank:not(.c-rank-b)").map(el => el.textContent);
  ok("no [object Object] on cards", !$$("#hand .card").some(el => el.textContent.includes("object Object")));
  ok("ranks are valid labels", ranks.every(r => /^(A|K|Q|J|10|[2-9])$/.test(r)));

  // 4. REGRESSION: must be able to select up to 5 cards
  const cards = $$("#hand .card");
  for (let i = 0; i < 6; i++) cards[i].click();
  ok("5 cards selectable (6th blocked)", $$("#hand .card.selected").length === 5);
  ok("preview shows a hand name", $("#preview-name").textContent.length > 0 && $("#preview-name").textContent !== "Select cards");

  // deselect 2, reselect
  cards[0].click(); cards[1].click();
  ok("deselect works", $$("#hand .card.selected").length === 3);

  // 5. play a hand
  const handsBefore = DS.S.handsLeft;
  $$("#hand .card").slice(0, 3).forEach(c => { if (!c.classList.contains("selected")) c.click(); });
  $("#btn-play").click();
  await waitFor(() => DS.S.animating === false);
  ok("hand consumed a hand", DS.S.handsLeft === handsBefore - 1);
  ok("score increased", DS.S.roundScore > 0);
  ok("hand refilled to 8", DS.S.hand.length === 8);

  // 6. discard flow
  const discBefore = DS.S.discardsLeft;
  $$("#hand .card")[0].click();
  $("#btn-discard").click();
  await waitFor(() => DS.S.animating === false);
  ok("discard consumed", DS.S.discardsLeft === discBefore - 1);
  ok("hand refilled after discard", DS.S.hand.length === 8);

  // 7. force round win -> shop
  DS.S.roundScore = 999999;
  $$("#hand .card")[0].click();
  $("#btn-play").click();
  await waitFor(() => $("#screen-shop").classList.contains("active"));
  ok("shop opens after beating blind", $("#screen-shop").classList.contains("active"));
  ok("shop shows reward text", $("#shop-reward").textContent.includes("$"));

  // 8. buy a joker -> appears in owned rows (game HUD + shop)
  DS.S.money = 99;
  DS.renderShop();
  const buyBtn = $$("#shop-offers .joker .btn").find(b => !b.disabled);
  ok("buyable joker offer exists", !!buyBtn);
  buyBtn.click();
  ok("joker added to state", DS.S.jokers.length === 1);
  ok("joker visible in shop owned row", $$("#shop-owned .joker").length === 1);
  ok("joker visible in game HUD", $$("#jokers .joker").length === 1);
  ok("joker count text", $("#joker-count").textContent === "1/5");

  // 9. sell joker
  const moneyBefore = DS.S.money;
  $("#jokers .joker .sell-btn").click();
  ok("joker sold", DS.S.jokers.length === 0);
  ok("sell paid money", DS.S.money > moneyBefore);

  // 12. booster pack flow
  DS.S.money = 99;
  DS.renderShop();
  const packBtn = $$("#shop-packs .joker .btn")[0];
  ok("pack for sale", !!packBtn);
  packBtn.click();
  await sleep(30);
  ok("pack screen opens", $("#screen-pack").classList.contains("active"));
  const takeBtn = $$("#pack-choices .joker .btn").find(b => !b.disabled);
  ok("pack has takeable choice", !!takeBtn);
  takeBtn.click();
  await sleep(30);
  ok("back to shop after pick", $("#screen-shop").classList.contains("active"));

  // 13. voucher purchase
  DS.S.money = 99;
  DS.renderShop();
  const vBtn = $$("#shop-voucher .joker .btn")[0];
  if (vBtn) {
    vBtn.click();
    ok("voucher applied", DS.S.vouchers.size === 1);
  } else { ok("voucher applied (none offered)", true); }

  // 14. boss blind flow
  DS.S.blindIndex = 2;
  DS.startBlind();
  await sleep(30);
  ok("boss assigned on boss blind", !!DS.S.boss);
  ok("boss banner visible", $("#boss-banner").hidden === false);
  ok("boss name shown", $("#boss-name").textContent.length > 3);

  // fresh small blind, no boss, for consumable tests (consumables need play phase)
  DS.S.blindIndex = 0;
  DS.startBlind();
  await sleep(30);
  ok("no boss on small blind", DS.S.boss === null);

  // 10. planet consumable levels up a hand
  DS.S.consumables.length = 0; // isolate from pack test
  DS.S.consumables.push({ ...DS.api.PLANETS.find(p => p.hand === "Pair") });
  DS.renderAll();
  ok("consumable tile shown", $$("#consumables .joker").length === 1);
  $$("#consumables .joker")[0].click();
  await sleep(30);
  ok("planet consumed", DS.S.consumables.length === 0);
  ok("pair leveled to 2", DS.S.handLevels["Pair"] === 2);
  ok("planetsUsed tracked", DS.S.stats.planetsUsed === 1);

  // 11. targeted tarot (Chariot -> steel)
  DS.S.consumables.length = 0;
  DS.S.consumables.push({ ...DS.api.TAROTS.find(t => t.id === "chariot") });
  DS.renderAll();
  $$("#consumables .joker")[0].click();
  await sleep(30);
  ok("target bar appears", $("#target-bar").hidden === false);
  $$("#hand .card")[2].click();
  $("#btn-target-use").click();
  await sleep(30);
  ok("tarot applied -> steel", DS.S.hand[2].enhancement === "steel");
  ok("target bar hidden after use", $("#target-bar").hidden === true);
  ok("tarotsUsed tracked", DS.S.stats.tarotsUsed === 1);

  // 15. hand levels screen
  $("#btn-hands").click();
  ok("hands screen opens", $("#screen-hands").classList.contains("active"));
  ok("hands table has 12 rows", $$("#hands-levels tr").length === 13); // header + 12
  $("#btn-hands-back").click();

  // 16. game over path (1 hand left, score stays 0 -> play fails to reach target)
  DS.S.handsLeft = 1;
  DS.S.roundScore = 0;
  $$("#hand .card")[0].click();
  $("#btn-play").click();
  await waitFor(() => $("#screen-over").classList.contains("active"));
  ok("game over screen", $("#screen-over").classList.contains("active"));

  // 17. retry returns to a fresh run
  $("#btn-retry").click();
  await sleep(50);
  ok("retry restarts run", DS.S.ante === 1 && DS.S.roundScore === 0 && $$("#hand .card").length === 8);

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log("FAIL harness:", e.message); process.exit(1); });
