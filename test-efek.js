// Tes mesin penilaian Deckstorm (js/efek.js).
// Setiap nilai harapan diambil dari aturan Balatro yang terverifikasi wiki,
// bukan dari keluaran mesinnya sendiri — supaya tes ini benar-benar menguji.
//
// Jalankan: node test-efek.js

const E = require("./js/efek.js");

let lulus = 0;
let gagal = 0;
const pesan = [];

function uji(nama, dapat, harus) {
  const ok = Math.abs(dapat - harus) < 0.001;
  if (ok) lulus++;
  else {
    gagal++;
    pesan.push(`  GAGAL  ${nama}: dapat ${dapat}, harus ${harus}`);
  }
}

// ── nilai dasar tangan ───────────────────────────────────────────────────────
uji("Pair level 1 tanpa kartu dinilai", E.hitungSkor([], { dasar: { chips: 10, mult: 2 } }).skor, 20);
uji("Pair dengan dua kartu 10", E.hitungSkor([{ rank: 10 }, { rank: 10 }], { dasar: { chips: 10, mult: 2 } }).skor, 60);

// ── nilai kartu ──────────────────────────────────────────────────────────────
uji("As bernilai 11 chips", E.chipsKartu({ rank: "A" }), 11);
uji("Kartu wajah bernilai 10 chips", E.chipsKartu({ rank: "K" }), 10);
uji("Stone bernilai 50 chips tanpa nilai rank", E.chipsKartu({ rank: "K", enhancement: "stone" }), 50);
uji("Bonus menambah 30 chips", E.chipsKartu({ rank: 7, enhancement: "bonus" }), 37);

// ── Joker ────────────────────────────────────────────────────────────────────
uji("Joker (+4 Mult)", E.hitungSkor([{ rank: 10 }, { rank: 10 }],
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "joker" }] }).skor, 180);
uji("Baron x1.5 untuk 2 King di tangan", E.hitungSkor([{ rank: 10 }, { rank: 10 }],
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "baron" }], diTangan: [{ rank: "K" }, { rank: "K" }] }).skor, 135);
uji("Joker Stencil sendirian di 5 slot = x5", E.hitungSkor([{ rank: "A" }, { rank: "A" }],
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "joker-stencil" }], slotJoker: 5 }).skor, 320);
uji("Joker Stencil dengan 1 Joker lain di 5 slot = x4", E.hitungSkor([{ rank: "A" }, { rank: "A" }],
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "joker" }, { id: "joker-stencil" }], slotJoker: 5 }).skor, 768);

// ── enhancement dan seal pada kartu ──────────────────────────────────────────
uji("Kartu Mult menambah 4 Mult", E.hitungSkor([{ rank: 10 }, { rank: 10, enhancement: "mult" }],
  { dasar: { chips: 10, mult: 2 } }).skor, 180);
uji("Red Seal menggandakan kartu yang dinilai", E.hitungSkor([{ rank: 10, seal: "red" }, { rank: 10 }],
  { dasar: { chips: 10, mult: 2 } }).skor, 80);
uji("Steel di tangan mengalikan 1.5", E.hitungSkor([{ rank: 10 }, { rank: 10 }],
  { dasar: { chips: 10, mult: 2 }, diTangan: [{ rank: "A", enhancement: "steel" }] }).skor, 90);

// ── urutan aktivasi ──────────────────────────────────────────────────────────
uji("Polychrome dihitung paling akhir", E.hitungSkor([{ rank: 10 }, { rank: 10 }],
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "joker", edition: "poly" }] }).skor, 270);

// ── Joker yang bergantung isi tangan ─────────────────────────────────────────
// Angka harapan dihitung tangan: pair dua kartu 10 = 10 (dasar level 1) + 10 + 10
// = 30 chips, dikali mult dasar 2.
const PAIR10 = [{ rank: 10, suit: "spades" }, { rank: 10, suit: "hearts" }];
const TIGA10 = [{ rank: 10, suit: "spades" }, { rank: 10, suit: "hearts" }, { rank: 10, suit: "clubs" }];

uji("The Duo x2 saat ada pair", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "the-duo" }] }).skor, 120);
uji("The Trio x3 saat ada three of a kind", E.hitungSkor(TIGA10,
  { dasar: { chips: 30, mult: 3 }, joker: [{ id: "the-trio" }] }).skor, 540);
uji("Jolly +8 Mult saat ada pair", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "jolly" }] }).skor, 300);
uji("Jolly tidak berefek tanpa pair", E.hitungSkor([{ rank: 2, suit: "spades" }, { rank: 5, suit: "hearts" }],
  { dasar: { chips: 5, mult: 1 }, joker: [{ id: "jolly" }] }).skor, 12);
uji("Abstract Joker +3 Mult per Joker dimiliki", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "abstract-joker" }, { id: "joker" }] }).skor, 30 * (2 + 6 + 4));
uji("Blackboard x3 saat semua kartu di tangan sekop", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "blackboard" }], diTangan: [{ rank: 3, suit: "spades" }] }).skor, 180);
uji("Blackboard diam saat suit bercampur", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "blackboard" }],
    diTangan: [{ rank: 3, suit: "spades" }, { rank: 4, suit: "hearts" }] }).skor, 60);
uji("Brainstorm menyalin Joker paling kiri", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "joker" }, { id: "brainstorm" }] }).skor, 300);

// ── pengganda datar dan kelangkaan ───────────────────────────────────────────
uji("Cavendish x3", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "cavendish" }] }).skor, 180);
uji("Gros Michel +15 Mult", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "gros-michel" }] }).skor, 30 * 17);
// Urutan Joker berpengaruh, persis seperti Balatro: yang di kiri dihitung lebih dulu.
// Baseball Card di kiri: (2 x 1.5) + 8 = 11 -> 30 x 11 = 330
uji("Baseball Card di kiri Jolly", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 },
    joker: [{ id: "baseball-card" }, { id: "jolly", rarity: "uncommon" }] }).skor, 330);
// Jolly di kiri: (2 + 8) x 1.5 = 15 -> 30 x 15 = 450
uji("Jolly di kiri Baseball Card", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 },
    joker: [{ id: "jolly", rarity: "uncommon" }, { id: "baseball-card" }] }).skor, 450);
uji("Baseball Card diam tanpa Uncommon lain", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "baseball-card" }] }).skor, 60);

console.log(`  tes mesin penilaian: ${lulus} lulus, ${gagal} gagal`);
pesan.forEach((p) => console.log(p));
process.exit(gagal ? 1 : 0);
