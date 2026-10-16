// 107 Joker tambahan untuk Deckstorm, dari data wiki yang sudah diverifikasi.
// Berkas ini dihasilkan oleh tools/import-jokers-pool.py - jangan disunting tangan.
//
// Dipisahkan dari js/jokers.js supaya 43 Joker lama yang efeknya ditulis tangan
// tidak tersentuh sama sekali. Berkas ini menyatukan dirinya ke kumpulan JOKERS
// saat dimuat, jadi urutan pemuatan di index.html harus sesudah js/jokers.js.
//
// Efek dialihkan ke mesin bersama js/efek.js. Joker berjenis khusus masuk kumpulan
// (bisa dibeli, tampil di koleksi) tetapi effect bernilai null sampai logikanya
// ditulis - jadi tidak ada efek yang diam-diam salah hitung.

const JOKER_TAMBAHAN = [
  { id: "8-ball", name: "8 Ball", cost: 5, rarity: "common",
    desc: "1 in 4 chance for each / played 8s to create a / when scored",
    gambar: "assets/img/items/joker/8-ball.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "abstract-joker", name: "Abstract Joker", cost: 4, rarity: "common",
    desc: "+3 Mult for / each Joker card",
    gambar: "assets/img/items/joker/abstract-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "abstract-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "+3 Mult for / each Joker car" };
    }
  },
  { id: "acrobat", name: "Acrobat", cost: 6, rarity: "uncommon",
    desc: "3 Mult on final / hand of round / (Currently ${jokerValue ? `active` : `inactive`})",
    gambar: "assets/img/items/joker/acrobat.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "ancient-joker", name: "Ancient Joker", cost: 8, rarity: "rare",
    desc: "Each played card with / ${[heartc, clubc, diamondc, spadec][Math.abs(jokerValue) % 4]} suit gives / 1.5 Mult when scored / suit changes at end of round",
    gambar: "assets/img/items/joker/ancient-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "ancient-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Each played card with / ${[h" };
    }
  },
  { id: "arrowhead", name: "Arrowhead", cost: 7, rarity: "uncommon",
    desc: "Played cards with / suit give / +50 Chips when scored",
    gambar: "assets/img/items/joker/arrowhead.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "arrowhead" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Played cards with / suit giv" };
    }
  },
  { id: "astronomer", name: "Astronomer", cost: 8, rarity: "uncommon",
    desc: "All cards and / in / the shop are free",
    gambar: "assets/img/items/joker/astronomer.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "baron", name: "Baron", cost: 8, rarity: "rare",
    desc: "Each King / held in hand / gives 1.5 Mult",
    gambar: "assets/img/items/joker/baron.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "baron" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Each King / held in hand / g" };
    }
  },
  { id: "baseball-card", name: "Baseball Card", cost: 8, rarity: "rare",
    desc: "Uncommon Jokers / each give 1.5 Mult",
    gambar: "assets/img/items/joker/baseball-card.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "baseball-card" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Uncommon Jokers / each give " };
    }
  },
  { id: "blackboard", name: "Blackboard", cost: 6, rarity: "uncommon",
    desc: "3 Mult if all / cards held in hand / are or",
    gambar: "assets/img/items/joker/blackboard.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "bloodstone", name: "Bloodstone", cost: 7, rarity: "uncommon",
    desc: "${!playfieldJokers?1:Object.keys(playfieldJokers).reduceRight((b,a)=>b||(playfieldJokers[a].modifiers.disabled?false:playfieldJokers[a].type+'' === '6,5'), false) ? 2 : 1} in 2 chance for / played cards with / suit to give / 1.5 Mult when scored",
    gambar: "assets/img/items/joker/bloodstone.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "bloodstone" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "${!playfieldJokers?1:Object." };
    }
  },
  { id: "blueprint", name: "Blueprint", cost: 10, rarity: "rare",
    desc: "Copies ability of / Joker to the right",
    gambar: "assets/img/items/joker/blueprint.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "bootstraps", name: "Bootstraps", cost: 7, rarity: "uncommon",
    desc: "+2 Mult for every / $5 you have / (Currently +${jokerValue * 2} Mult)",
    gambar: "assets/img/items/joker/bootstraps.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "bootstraps" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "+2 Mult for every / $5 you h" };
    }
  },
  { id: "brainstorm", name: "Brainstorm", cost: 10, rarity: "rare",
    desc: "Copies the ability / of the leftmost Joker",
    gambar: "assets/img/items/joker/brainstorm.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "bull", name: "Bull", cost: 6, rarity: "uncommon",
    desc: "+2 Chips for each / dollar you have / (Currently +${jokerValue * 2} Chips)",
    gambar: "assets/img/items/joker/bull.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "bull" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "+2 Chips for each / dollar y" };
    }
  },
  { id: "burnt-joker", name: "Burnt Joker", cost: 6, rarity: "rare",
    desc: "Upgrade the level of / the first discarded / poker hand each round",
    gambar: "assets/img/items/joker/burnt-joker.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "campfire", name: "Campfire", cost: 9, rarity: "rare",
    desc: "This Joker gains 0.25 Mult / for each card sold, resets / when Boss Blind is defeated / (Currently ${1 + jokerValue * 0.25} Mult)",
    gambar: "assets/img/items/joker/campfire.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "campfire" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.25 Mult /" };
    }
  },
  { id: "canio", name: "Canio", cost: 20, rarity: "legendary",
    desc: "This Joker gains 1 Mult / when a face card / is destroyed / (Currently ${1 + jokerValue} Mult)",
    gambar: "assets/img/items/joker/canio.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "canio" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 1 Mult / wh" };
    }
  },
  { id: "card-sharp", name: "Card Sharp", cost: 6, rarity: "uncommon",
    desc: "3 Mult if played / poker hand has already / been played this round",
    gambar: "assets/img/items/joker/card-sharp.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "castle", name: "Castle", cost: 6, rarity: "uncommon",
    desc: "This Joker gains +3 Chips / per discarded ${[heartc, clubc, diamondc, spadec][Math.abs(jokerValue) % 4]} card, / suit changes every round / (Currently +${jokerValue * 3} Chips)",
    gambar: "assets/img/items/joker/castle.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "castle" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains +3 Chips / " };
    }
  },
  { id: "cavendish", name: "Cavendish", cost: 4, rarity: "common",
    desc: "3 Mult / 1 in 1000 chance this / card is destroy / at end of round",
    gambar: "assets/img/items/joker/cavendish.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "ceremonial-dagger", name: "Ceremonial Dagger", cost: 6, rarity: "uncommon",
    desc: "When Blind is selected, / destroy Joker to the right / and permanently add double / its sell value to this Mult / (Currently +${jokerValue} Mult)",
    gambar: "assets/img/items/joker/ceremonial-dagger.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "certificate", name: "Certificate", cost: 6, rarity: "uncommon",
    desc: "When round begins, / add a random playing / card with a random / seal to your hand",
    gambar: "assets/img/items/joker/certificate.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "chaos-the-clown", name: "Chaos the Clown", cost: 4, rarity: "common",
    desc: "1 free Reroll / per shop",
    gambar: "assets/img/items/joker/chaos-the-clown.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "chicot", name: "Chicot", cost: 20, rarity: "legendary",
    desc: "Disables effect of / every Boss Blind",
    gambar: "assets/img/items/joker/chicot.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "cloud-9", name: "Cloud 9", cost: 7, rarity: "uncommon",
    desc: "Earn $1 for each / 9 in your full deck / at end of round / (Currently $${jokerValue})",
    gambar: "assets/img/items/joker/cloud-9.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "cloud-9" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $1 for each / 9 in your" };
    }
  },
  { id: "credit-card", name: "Credit Card", cost: 1, rarity: "common",
    desc: "Go up to / -$20 in debt",
    gambar: "assets/img/items/joker/credit-card.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "credit-card" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Go up to / -$20 in debt" };
    }
  },
  { id: "delayed-gratification", name: "Delayed Gratification", cost: 4, rarity: "common",
    desc: "Earn $2 per discard if / no discards are used / by end of the round",
    gambar: "assets/img/items/joker/delayed-gratification.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "delayed-gratification" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $2 per discard if / no " };
    }
  },
  { id: "diet-cola", name: "Diet Cola", cost: 6, rarity: "uncommon",
    desc: "Sell this card to / create a free / Double Tag",
    gambar: "assets/img/items/joker/diet-cola.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "dna", name: "DNA", cost: 8, rarity: "rare",
    desc: "If first hand of round / has only 1 card, add a / permanent copy to deck / and draw it to hand",
    gambar: "assets/img/items/joker/dna.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "driver-s-license", name: "Driver's License", cost: 7, rarity: "rare",
    desc: "3 Mult if you have / at least 16 Enhanced / cards in your full deck / (Currently ${jokerValue})",
    gambar: "assets/img/items/joker/driver-s-license.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "drunkard", name: "Drunkard", cost: 4, rarity: "common",
    desc: "+1 discard",
    gambar: "assets/img/items/joker/drunkard.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "dusk", name: "Dusk", cost: 5, rarity: "uncommon",
    desc: "Retrigger all played / cards in final / hand of round / (Currently ${jokerValue ? `active` : `inactive`})",
    gambar: "assets/img/items/joker/dusk.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "erosion", name: "Erosion", cost: 6, rarity: "uncommon",
    desc: "+4 Mult for each / card below 52 / in your full deck / (Currently ${jokerValue >= 0 ? '+' : ''}${jokerValue * 4})",
    gambar: "assets/img/items/joker/erosion.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "erosion" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "+4 Mult for each / card belo" };
    }
  },
  { id: "faceless-joker", name: "Faceless Joker", cost: 4, rarity: "common",
    desc: "Earn $5 if 3 or / more face cards / are discarded / at the same time",
    gambar: "assets/img/items/joker/faceless-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "faceless-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $5 if 3 or / more face " };
    }
  },
  { id: "flash-card", name: "Flash Card", cost: 5, rarity: "uncommon",
    desc: "This Joker gains +2 Mult / per reroll in the shop / (Currently +${jokerValue * 2} Mult)",
    gambar: "assets/img/items/joker/flash-card.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "flash-card" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains +2 Mult / p" };
    }
  },
  { id: "four-fingers", name: "Four Fingers", cost: 7, rarity: "uncommon",
    desc: "All Flushes and / Straights can be / made with 4 cards",
    gambar: "assets/img/items/joker/four-fingers.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "gift-card", name: "Gift Card", cost: 6, rarity: "uncommon",
    desc: "Add $1 of sell value / to every Joker and / Consumable card at / end of round",
    gambar: "assets/img/items/joker/gift-card.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "gift-card" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Add $1 of sell value / to ev" };
    }
  },
  { id: "glass-joker", name: "Glass Joker", cost: 6, rarity: "uncommon",
    desc: "This Joker gains 0.75 Mult / for every Glass Card / that is destroyed / (Currently ${1 + jokerValue * 0.75} Mult)",
    gambar: "assets/img/items/joker/glass-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "glass-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.75 Mult /" };
    }
  },
  { id: "golden-joker", name: "Golden Joker", cost: 6, rarity: "common",
    desc: "Earn $4 at / end of round",
    gambar: "assets/img/items/joker/golden-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "golden-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $4 at / end of round" };
    }
  },
  { id: "golden-ticket", name: "Golden Ticket", cost: 5, rarity: "common",
    desc: "Played Gold cards / earn $4 when scored",
    gambar: "assets/img/items/joker/golden-ticket.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "golden-ticket" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Played Gold cards / earn $4 " };
    }
  },
  { id: "hack", name: "Hack", cost: 6, rarity: "uncommon",
    desc: "Retrigger / each played / 2, 3, 4, or 5",
    gambar: "assets/img/items/joker/hack.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "hallucination", name: "Hallucination", cost: 4, rarity: "common",
    desc: "1 in 2 chance to create / a card when any / Booster Pack is opened",
    gambar: "assets/img/items/joker/hallucination.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "hanging-chad", name: "Hanging Chad", cost: 4, rarity: "common",
    desc: "Retrigger first played / card used in scoring / 2 additional times",
    gambar: "assets/img/items/joker/hanging-chad.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "hiker", name: "Hiker", cost: 5, rarity: "uncommon",
    desc: "Every played card / permanently gains / +5 Chips when scored",
    gambar: "assets/img/items/joker/hiker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "hiker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Every played card / permanen" };
    }
  },
  { id: "hit-the-road", name: "Hit the Road", cost: 8, rarity: "rare",
    desc: "This Joker gains 0.5 Mult / for every Jack / discarded this round / (Currently ${1 + jokerValue * 0.5})",
    gambar: "assets/img/items/joker/hit-the-road.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "hit-the-road" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.5 Mult / " };
    }
  },
  { id: "hologram", name: "Hologram", cost: 7, rarity: "uncommon",
    desc: "This Joker gains 0.25 Mult / every time a playing card / is added to your deck / (Currently ${1 + jokerValue * 0.25} Mult)",
    gambar: "assets/img/items/joker/hologram.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "hologram" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.25 Mult /" };
    }
  },
  { id: "invisible-joker", name: "Invisible Joker", cost: 8, rarity: "rare",
    desc: "After 2 rounds, / sell this card to / duplicate a random Joker / (Currently ${jokerValue}/2)",
    gambar: "assets/img/items/joker/invisible-joker.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "juggler", name: "Juggler", cost: 4, rarity: "common",
    desc: "+1 hand size",
    gambar: "assets/img/items/joker/juggler.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "loyalty-card", name: "Loyalty Card", cost: 5, rarity: "uncommon",
    desc: "4 Mult every / 6 hands played / (${jokerValue % 6} remaining)",
    gambar: "assets/img/items/joker/loyalty-card.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "luchador", name: "Luchador", cost: 5, rarity: "uncommon",
    desc: "Sell this card to / disable the current / Boss Blind",
    gambar: "assets/img/items/joker/luchador.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "lucky-cat", name: "Lucky Cat", cost: 6, rarity: "uncommon",
    desc: "This Joker gains 0.25 Mult every / time a Lucky card / successfully triggers / (Currently ${(10 + jokerValue * 2.5) / 10} Mult)",
    gambar: "assets/img/items/joker/lucky-cat.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "lucky-cat" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.25 Mult e" };
    }
  },
  { id: "madness", name: "Madness", cost: 7, rarity: "uncommon",
    desc: "When Small Blind or Big Blind / is selected, gain 0.5 Mult / and destroy a random Joker / (Currently ${1 + jokerValue * 0.5})",
    gambar: "assets/img/items/joker/madness.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "madness" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "When Small Blind or Big Blin" };
    }
  },
  { id: "mail-in-rebate", name: "Mail-In Rebate", cost: 4, rarity: "common",
    desc: "Earn $5 for each / discarded ${rankNames[Math.abs(jokerValue % 13)]}, rank / changes every round",
    gambar: "assets/img/items/joker/mail-in-rebate.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "mail-in-rebate" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $5 for each / discarded" };
    }
  },
  { id: "marble-joker", name: "Marble Joker", cost: 6, rarity: "uncommon",
    desc: "Adds one Stone card / to deck when / Blind is selected",
    gambar: "assets/img/items/joker/marble-joker.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "matador", name: "Matador", cost: 7, rarity: "uncommon",
    desc: "Earn $8 if played / hand triggers the / Boss Blind ability",
    gambar: "assets/img/items/joker/matador.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "matador" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $8 if played / hand tri" };
    }
  },
  { id: "merry-andy", name: "Merry Andy", cost: 7, rarity: "uncommon",
    desc: "+3 discards, / -1 hand size",
    gambar: "assets/img/items/joker/merry-andy.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "midas-mask", name: "Midas Mask", cost: 7, rarity: "uncommon",
    desc: "All played face cards / become Gold cards / when scored",
    gambar: "assets/img/items/joker/midas-mask.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "mime", name: "Mime", cost: 5, rarity: "uncommon",
    desc: "Retrigger all / card held in / hand abilities",
    gambar: "assets/img/items/joker/mime.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "mr-bones", name: "Mr. Bones", cost: 5, rarity: "uncommon",
    desc: "Prevents Death / if chips scored / are at least 25% / of required chips / self destructs",
    gambar: "assets/img/items/joker/mr-bones.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "mystic-summit", name: "Mystic Summit", cost: 5, rarity: "common",
    desc: "+15 Mult when / 0 discards / remaining / (Currently ${jokerValue ? `active` : `inactive`})",
    gambar: "assets/img/items/joker/mystic-summit.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "mystic-summit" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "+15 Mult when / 0 discards /" };
    }
  },
  { id: "obelisk", name: "Obelisk", cost: 8, rarity: "rare",
    desc: "This Joker gains 0.2 Mult / per consecutive hand played / without playing your / most played poker hand / (Currently ${(10 + jokerValue * 2) / 10} Mult)",
    gambar: "assets/img/items/joker/obelisk.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "obelisk" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.2 Mult / " };
    }
  },
  { id: "onyx-agate", name: "Onyx Agate", cost: 7, rarity: "uncommon",
    desc: "Played cards with / suit give / +7 Mult when scored",
    gambar: "assets/img/items/joker/onyx-agate.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "onyx-agate" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Played cards with / suit giv" };
    }
  },
  { id: "oops-all-6s", name: "Oops! All 6s", cost: 4, rarity: "uncommon",
    desc: "Double all listed / probabilities / (ex: 1 in 3 -> 2 in 3)",
    gambar: "assets/img/items/joker/oops-all-6s.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "pareidolia", name: "Pareidolia", cost: 5, rarity: "uncommon",
    desc: "All cards are / considered / Face cards",
    gambar: "assets/img/items/joker/pareidolia.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "perkeo", name: "Perkeo", cost: 20, rarity: "legendary",
    desc: "Creates a copy of / 1 random consumable / card in your possession / at the end of the shop",
    gambar: "assets/img/items/joker/perkeo.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "popcorn", name: "Popcorn", cost: 5, rarity: "common",
    desc: "${jokerValue <= 5 ? '+' : ''}${Math.max(0, 20 - jokerValue * 4)} Mult / -4 Mult per / round played",
    gambar: "assets/img/items/joker/popcorn.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "raised-fist", name: "Raised Fist", cost: 5, rarity: "common",
    desc: "Adds double the rank / of lowest card held in hand to Mult",
    gambar: "assets/img/items/joker/raised-fist.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "ramen", name: "Ramen", cost: 6, rarity: "uncommon",
    desc: "${(Math.max(0, 200 - jokerValue)) / 100} Mult, / loses 0.01 Mult / per card discarded",
    gambar: "assets/img/items/joker/ramen.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "red-card", name: "Red Card", cost: 5, rarity: "common",
    desc: "This Joker gains / +3 Mult when any / Booster Pack is skipped / (Currently +${jokerValue * 3} Mult)",
    gambar: "assets/img/items/joker/red-card.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "red-card" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains / +3 Mult w" };
    }
  },
  { id: "reserved-parking", name: "Reserved Parking", cost: 6, rarity: "common",
    desc: "Each face card / held in hand has / a 1 in 2 chance / to give $1",
    gambar: "assets/img/items/joker/reserved-parking.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "reserved-parking" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Each face card / held in han" };
    }
  },
  { id: "riff-raff", name: "Riff-raff", cost: 6, rarity: "common",
    desc: "When Blind is selected, / create 2 Jokers",
    gambar: "assets/img/items/joker/riff-raff.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "rocket", name: "Rocket", cost: 6, rarity: "uncommon",
    desc: "Earn $${1 + jokerValue * 2} at end of / round. Gains $2 when / Boss Blind is defeated",
    gambar: "assets/img/items/joker/rocket.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "rocket" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $${1 + jokerValue * 2} " };
    }
  },
  { id: "rough-gem", name: "Rough Gem", cost: 7, rarity: "uncommon",
    desc: "Played cards with / suit earn / $1 when scored",
    gambar: "assets/img/items/joker/rough-gem.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "rough-gem" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Played cards with / suit ear" };
    }
  },
  { id: "runner", name: "Runner", cost: 5, rarity: "common",
    desc: "Gains +15 Chips / if played hand / contains a Straight / (Currently +${jokerValue * 15} Chips)",
    gambar: "assets/img/items/joker/runner.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "runner" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Gains +15 Chips / if played " };
    }
  },
  { id: "s-ance", name: "S\\u00e9ance", cost: 6, rarity: "uncommon",
    desc: "If poker hand is a / Straight Flush, craeate a / random card",
    gambar: "assets/img/items/joker/s-ance.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "scary-face", name: "Scary Face", cost: 4, rarity: "common",
    desc: "Played face cards / give +30 Chips / when scored",
    gambar: "assets/img/items/joker/scary-face.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "scary-face" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Played face cards / give +30" };
    }
  },
  { id: "seeing-double", name: "Seeing Double", cost: 6, rarity: "uncommon",
    desc: "2 Mult if played / hand has a scoring / Club card and a scoring / card of any other suit",
    gambar: "assets/img/items/joker/seeing-double.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "seltzer", name: "Seltzer", cost: 6, rarity: "uncommon",
    desc: "Retrigger all / cards played for / the next ${Math.max(0, 10 - jokerValue)} hands",
    gambar: "assets/img/items/joker/seltzer.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "shoot-the-moon", name: "Shoot the Moon", cost: 5, rarity: "common",
    desc: "+13 Mult for / each Queen / held in hand",
    gambar: "assets/img/items/joker/shoot-the-moon.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "shoot-the-moon" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "+13 Mult for / each Queen / " };
    }
  },
  { id: "shortcut", name: "Shortcut", cost: 7, rarity: "uncommon",
    desc: "Allows Straights to be / made with gaps of 1 rank / (ex: 10 8 6 5 3)",
    gambar: "assets/img/items/joker/shortcut.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "showman", name: "Showman", cost: 5, rarity: "uncommon",
    desc: "Joker, , , / and cards may / appear multiple times",
    gambar: "assets/img/items/joker/showman.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "sixth-sense", name: "Sixth Sense", cost: 6, rarity: "uncommon",
    desc: "If first hand of round is / a single 6, destroy it and / create a card",
    gambar: "assets/img/items/joker/sixth-sense.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "smeared-joker", name: "Smeared Joker", cost: 7, rarity: "uncommon",
    desc: "and / count as the same suit, / and / count as the same suit",
    gambar: "assets/img/items/joker/smeared-joker.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "sock-and-buskin", name: "Sock and Buskin", cost: 6, rarity: "uncommon",
    desc: "Retrigger all / played face cards",
    gambar: "assets/img/items/joker/sock-and-buskin.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "space-joker", name: "Space Joker", cost: 5, rarity: "uncommon",
    desc: "1 in 4 chance to / upgrade level of / played poker hand",
    gambar: "assets/img/items/joker/space-joker.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "spare-trousers", name: "Spare Trousers", cost: 6, rarity: "uncommon",
    desc: "This Joker gains +2 Mult / if played hand contains / a Two Pair / (Currently +${jokerValue * 2} Mult)",
    gambar: "assets/img/items/joker/spare-trousers.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "spare-trousers" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains +2 Mult / i" };
    }
  },
  { id: "splash", name: "Splash", cost: 3, rarity: "common",
    desc: "Every played card / counts in scoring",
    gambar: "assets/img/items/joker/splash.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "square-joker", name: "Square Joker", cost: 4, rarity: "common",
    desc: "This Joker gains +4 Chips / if played hand has / exactly 4 cards / (Currently +${jokerValue * 4} Chips)",
    gambar: "assets/img/items/joker/square-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "square-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains +4 Chips / " };
    }
  },
  { id: "steel-joker", name: "Steel Joker", cost: 7, rarity: "uncommon",
    desc: "This Joker gains 0.2 Mult / for each Steel Card / in your full deck / (Currently ${Math.round((1 + jokerValue * 0.2) * 10) / 10} Mult)",
    gambar: "assets/img/items/joker/steel-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "steel-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.2 Mult / " };
    }
  },
  { id: "stone-joker", name: "Stone Joker", cost: 6, rarity: "uncommon",
    desc: "This Joker gains +25 Chips / for each Stone Card in your full deck / (Currently +${25*jokerValue} Chips)",
    gambar: "assets/img/items/joker/stone-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "stone-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains +25 Chips /" };
    }
  },
  { id: "stuntman", name: "Stuntman", cost: 7, rarity: "rare",
    desc: "+250 Chips, / -2 hand size",
    gambar: "assets/img/items/joker/stuntman.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "stuntman" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "+250 Chips, / -2 hand size" };
    }
  },
  { id: "supernova", name: "Supernova", cost: 5, rarity: "common",
    desc: "Adds the number of / times poker hand has / been played to Mult",
    gambar: "assets/img/items/joker/supernova.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "superposition", name: "Superposition", cost: 4, rarity: "common",
    desc: "Create a card if / poker hand contains an / Ace and a Straight",
    gambar: "assets/img/items/joker/superposition.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "swashbuckler", name: "Swashbuckler", cost: 4, rarity: "common",
    desc: "Adds the sell value / of all other owned / Jokers to Mult",
    gambar: "assets/img/items/joker/swashbuckler.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "the-idol", name: "The Idol", cost: 6, rarity: "uncommon",
    desc: "Each played ${rankNames[Math.floor(Math.abs(jokerValue)/4) % 13]} / of ${suitNames[Math.abs(jokerValue) % 4]} gives / 2 Mult when scored / Card changes every round",
    gambar: "assets/img/items/joker/the-idol.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "throwback", name: "Throwback", cost: 6, rarity: "uncommon",
    desc: "0.25 Mult for each / Blind skipped this run / (Currently ${1 + jokerValue * 0.25} Mult)",
    gambar: "assets/img/items/joker/throwback.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "to-do-list", name: "To Do List", cost: 4, rarity: "common",
    desc: "Earn $4 if poker hand / is a ${hands[11 - (Math.abs(jokerValue) % 12)].name}, / poker hand changes / at end of round",
    gambar: "assets/img/items/joker/to-do-list.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "to-do-list" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn $4 if poker hand / is a" };
    }
  },
  { id: "to-the-moon", name: "To the Moon", cost: 5, rarity: "uncommon",
    desc: "Earn an extra $1 of / interest for every $5 you / have at end of round",
    gambar: "assets/img/items/joker/to-the-moon.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "to-the-moon" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Earn an extra $1 of / intere" };
    }
  },
  { id: "trading-card", name: "Trading Card", cost: 6, rarity: "uncommon",
    desc: "If first discard of round / has only 1 card, destroy / it and earn $3",
    gambar: "assets/img/items/joker/trading-card.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "trading-card" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "If first discard of round / " };
    }
  },
  { id: "triboulet", name: "Triboulet", cost: 20, rarity: "legendary",
    desc: "Played Kings and / Queens each give / 2 Mult when scored",
    gambar: "assets/img/items/joker/triboulet.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "troubadour", name: "Troubadour", cost: 6, rarity: "uncommon",
    desc: "+2 hand size, / -1 hands per round",
    gambar: "assets/img/items/joker/troubadour.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "turtle-bean", name: "Turtle Bean", cost: 6, rarity: "uncommon",
    desc: "${5 - jokerValue >= 0 ? '+' : ''}${5 - jokerValue} hand size, / reduces by / 1 every round",
    gambar: "assets/img/items/joker/turtle-bean.png",
    effect: null,   // jenis khusus: belum berefek
  },
  { id: "vagabond", name: "Vagabond", cost: 8, rarity: "rare",
    desc: "Create a card / if hand is played / with $4 or less",
    gambar: "assets/img/items/joker/vagabond.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "vagabond" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Create a card / if hand is p" };
    }
  },
  { id: "vampire", name: "Vampire", cost: 7, rarity: "uncommon",
    desc: "This Joker gains 0.1 Mult / per scoring Enhanced card played, / removes card Enhancement / (Currently ${(10 + jokerValue) / 10} Mult)",
    gambar: "assets/img/items/joker/vampire.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "vampire" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains 0.1 Mult / " };
    }
  },
  { id: "walkie-talkie", name: "Walkie Talkie", cost: 4, rarity: "common",
    desc: "Each played 10 or 4 / gives +10 Chips and / +4 Mult when scored",
    gambar: "assets/img/items/joker/walkie-talkie.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "walkie-talkie" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "Each played 10 or 4 / gives " };
    }
  },
  { id: "wee-joker", name: "Wee Joker", cost: 8, rarity: "rare",
    desc: "This Joker gains / +8 Chips when each / played 2 is scored / (Currently +${jokerValue * 8} Chips)",
    gambar: "assets/img/items/joker/wee-joker.png",
    effect: c => {
      const w = typeof window !== "undefined" ? window : globalThis;
      if (!w.DSEfek) return null;
      const t = (c && (c.held || c.heldCards || c.hand)) || [];
      const e = w.DSEfek.efekJoker({ id: "wee-joker" }, { diTangan: t });
      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;
      return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "This Joker gains / +8 Chips " };
    }
  },
  { id: "yorick", name: "Yorick", cost: 20, rarity: "legendary",
    desc: "This Joker gains / 1 Mult every 23 [23] / cards discarded / (Currently ${jokerValue} Mult)",
    gambar: "assets/img/items/joker/yorick.png",
    effect: null,   // jenis khusus: belum berefek
  },
];

if (typeof JOKERS !== "undefined" && Array.isArray(JOKERS)) {
  JOKER_TAMBAHAN.forEach(j => { if (!JOKERS.some(x => x.id === j.id)) JOKERS.push(j); });
}

if (typeof module !== "undefined") module.exports = { JOKER_TAMBAHAN };
