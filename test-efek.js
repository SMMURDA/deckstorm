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

// ── Joker berbasis pencatat keadaan ──────────────────────────────────────────
// Ramen itu pengganda: mult dasar 2 menjadi 4, jadi 30 x 4 = 120.
uji("Ramen x2 utuh", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "ramen", tumpukan: 0 }] }).skor, 120);
uji("Ramen setelah 50 kartu dibuang", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "ramen", tumpukan: 50 }] }).skor, 90);
// Popcorn mulai +20 Mult dan turun 4 tiap ronde: ronde 0 -> mult 22
uji("Popcorn ronde 0", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "popcorn" }], ronde: 0 }).skor, 660);
uji("Popcorn ronde 3", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "popcorn" }], ronde: 3 }).skor, 300);
uji("Burnt Joker setelah 4 discard", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "burnt-joker", tumpukan: 4 }] }).skor, 120);
uji("Ceremonial Dagger menyerap 3 kali", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "ceremonial-dagger", tumpukan: 3 }] }).skor, 240);
uji("Loyalty Card hand ke-6", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "loyalty-card", tumpukan: 6 }] }).skor, 240);
uji("Loyalty Card hand ke-5 diam", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "loyalty-card", tumpukan: 5 }] }).skor, 60);
uji("Throwback 2 Blind dilewati", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "throwback", tumpukan: 2 }] }).skor, 93);
uji("Acrobat x3 pada hand terakhir", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "acrobat" }], sisaTangan: 1 }).skor, 180);
uji("Acrobat diam di hand lain", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "acrobat" }], sisaTangan: 3 }).skor, 60);

// Hit the Road: x1,5 Mult tiap Jack yang dibuang. Satu Jack -> mult 2 x 1,5 = 3
uji("Hit the Road setelah 1 Jack dibuang", E.hitungSkor(PAIR10,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "hit-the-road", tumpukan: 1 }] }).skor, 90);

// ── uang akhir babak ─────────────────────────────────────────────────────────
uji("Golden Joker memberi $4", E.uangAkhirRonde({ id: "golden-joker" }, {}), 4);
uji("Rocket memberi $2", E.uangAkhirRonde({ id: "rocket" }, {}), 2);
uji("Delayed Gratification $2 bila tanpa discard", E.uangAkhirRonde({ id: "delayed-gratification" }, { discardsLeft: 3 }), 2);
uji("Delayed Gratification $0 bila sudah discard", E.uangAkhirRonde({ id: "delayed-gratification" }, { discardsLeft: 1 }), 0);
uji("To the Moon +$1 tiap $5 (uang $23)", E.uangAkhirRonde({ id: "to-the-moon" }, { money: 23 }), 4);
uji("Joker biasa tidak memberi uang", E.uangAkhirRonde({ id: "joker" }, {}), 0);

// ── aturan penilaian tangan dari Joker ───────────────────────────────────────
const aturan = (ids) => E.aturanTangan(ids.map(id => ({ id })));
uji("tanpa Joker pengubah, semua aturan mati",
  Object.values(aturan([])).filter(Boolean).length, 0);
uji("Four Fingers menyalakan empatJari", aturan(["four-fingers"]).empatJari ? 1 : 0, 1);
uji("Shortcut menyalakan jalanPintas", aturan(["shortcut"]).jalanPintas ? 1 : 0, 1);
uji("Smeared Joker menyalakan suitKabur", aturan(["smeared-joker"]).suitKabur ? 1 : 0, 1);
uji("Splash menyalakan semuaNilai", aturan(["splash"]).semuaNilai ? 1 : 0, 1);
uji("Joker lain tidak menyalakan apa pun",
  Object.values(aturan(["joker", "baron", "popcorn"])).filter(Boolean).length, 0);

// ── Joker berbasis suit, nilai jual, dan catatan statistik ───────────────────
const KLUB = [{ rank: 10, suit: "clubs" }, { rank: 10, suit: "clubs" }, { rank: 5, suit: "hearts" }];
const SEKOP = [{ rank: 10, suit: "spades" }, { rank: 10, suit: "spades" }];
// (10 dasar + 10 + 10 + 5) = 35 chips x (2 x 2) = 140
uji("Seeing Double x2 saat ada keriting dan suit lain", E.hitungSkor(KLUB,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "seeing-double" }] }).skor, 140);
uji("Seeing Double diam saat hanya sekop", E.hitungSkor(SEKOP,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "seeing-double" }] }).skor, 60);
// nilai jual Joker lain: cost 8 -> 4, cost 5 -> 2, total +6 Mult
uji("Swashbuckler +6 Mult", E.hitungSkor(SEKOP,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "swashbuckler", cost: 0 }, { id: "a", cost: 8 }, { id: "b", cost: 5 }] }).skor, 240);
uji("Supernova +7 Mult bila Pair sudah 7 kali", E.hitungSkor(SEKOP,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "supernova" }], handName: "Pair", stats: { handsPlayed: { pair: 7 } } }).skor, 270);
uji("Supernova menghasilkan 0 tanpa catatan", E.hitungSkor(SEKOP,
  { dasar: { chips: 10, mult: 2 }, joker: [{ id: "supernova" }] }).skor, 60);

// ── Joker pengubah ukuran tangan dan jumlah buang ────────────────────────────
const uk = (ids, ronde) => E.ukuranTangan(ids.map(id => ({ id })), ronde || 0);
uji("tanpa Joker: ukuran tangan tetap", uk([]).tangan, 0);
uji("tanpa Joker: jumlah buang tetap", uk([]).buang, 0);
// Troubadour: +2 ukuran tangan, -1 buang
uji("Troubadour +2 ukuran tangan", uk(["troubadour"]).tangan, 2);
uji("Troubadour -1 buang", uk(["troubadour"]).buang, -1);
uji("Juggler +1 ukuran tangan", uk(["juggler"]).tangan, 1);
uji("Drunkard +1 buang", uk(["drunkard"]).buang, 1);
// Merry Andy: +3 buang, -1 ukuran tangan
uji("Merry Andy -1 ukuran tangan", uk(["merry-andy"]).tangan, -1);
uji("Merry Andy +3 buang", uk(["merry-andy"]).buang, 3);
// Turtle Bean menyusut satu tiap babak: +5, +2 di babak 3, 0 di babak 9
uji("Turtle Bean babak 0 memberi +5", uk(["turtle-bean"], 0).tangan, 5);
uji("Turtle Bean babak 3 memberi +2", uk(["turtle-bean"], 3).tangan, 2);
uji("Turtle Bean tidak pernah negatif", uk(["turtle-bean"], 9).tangan, 0);

// ── retrigger kartu yang dinilai ─────────────────────────────────────────────
// Satu kartu 10: chips 10 (kartu) + 10 (dasar) = 20, mult 2 -> 40
const SATU10 = [{ rank: 10, suit: "spades" }];
const DASAR10 = { chips: 10, mult: 2 };
uji("tanpa Joker pengulang", E.hitungSkor(SATU10, { dasar: DASAR10, joker: [] }).skor, 40);
// Seltzer: kartu dinilai 2 kali -> (10+10+10) x 2 = 60
uji("Seltzer mengulang kartu", E.hitungSkor(SATU10, { dasar: DASAR10, joker: [{ id: "seltzer" }] }).skor, 60);
// Hanging Chad: kartu pertama dinilai 3 kali -> (10+10+10+10) x 2 = 80
uji("Hanging Chad mengulang kartu pertama", E.hitungSkor(SATU10, { dasar: DASAR10, joker: [{ id: "hanging-chad" }] }).skor, 80);
// Dusk: hanya pada hand terakhir -> 60, di luar itu 40
uji("Dusk pada hand terakhir", E.hitungSkor(SATU10, { dasar: DASAR10, joker: [{ id: "dusk" }], sisaTangan: 1 }).skor, 60);
uji("Dusk diam bila bukan hand terakhir", E.hitungSkor(SATU10, { dasar: DASAR10, joker: [{ id: "dusk" }], sisaTangan: 2 }).skor, 40);
// Hack: kartu 3 dinilai 2 kali -> (3+3+10) x 2 = 32 ; kartu 10 tidak diulang -> 40
uji("Hack mengulang kartu 3", E.hitungSkor([{ rank: 3, suit: "spades" }], { dasar: DASAR10, joker: [{ id: "hack" }] }).skor, 32);
uji("Hack diam pada kartu 10", E.hitungSkor(SATU10, { dasar: DASAR10, joker: [{ id: "hack" }] }).skor, 40);

// ── chips tiap rank (cacat lama: kartu wajah dan As dihitung 0) ──────────────
// total chips = 10 (dasar) + chips kartu. J/Q/K = 10, As = 11.
[[2, 2], [5, 5], [10, 10], [11, 10], [12, 10], [13, 10], [14, 11]].forEach(([rank, harap]) => {
  uji(`rank ${rank} memberi ${harap} chips kartu`,
    E.hitungSkor([{ rank, suit: "spades" }], { dasar: { chips: 10, mult: 2 }, joker: [] }).chips - 10, harap);
});
uji("rank huruf K juga memberi 10 chips",
  E.hitungSkor([{ rank: "K", suit: "spades" }], { dasar: { chips: 10, mult: 2 }, joker: [] }).chips - 10, 10);

// ── Triboulet (Joker Legendary) ─────────────────────────────────────────────
// King: chips 10 (kartu) + 10 (dasar) = 20, mult 2 -> 40
uji("tanpa Triboulet, satu King", E.hitungSkor([{ rank: 13, suit: "spades" }], { dasar: { chips: 10, mult: 2 }, joker: [] }).skor, 40);
// Triboulet: mult 2 x2 = 4 -> 20 x 4 = 80
uji("Triboulet x2 untuk satu King", E.hitungSkor([{ rank: 13, suit: "spades" }], { dasar: { chips: 10, mult: 2 }, joker: [{ id: "triboulet" }] }).skor, 80);
uji("Triboulet x2 untuk satu Queen", E.hitungSkor([{ rank: 12, suit: "hearts" }], { dasar: { chips: 10, mult: 2 }, joker: [{ id: "triboulet" }] }).skor, 80);
// King + Queen: chips 30, mult 2 x4 = 8 -> 240
uji("Triboulet x4 untuk King dan Queen", E.hitungSkor([{ rank: 13, suit: "spades" }, { rank: 12, suit: "hearts" }], { dasar: { chips: 10, mult: 2 }, joker: [{ id: "triboulet" }] }).skor, 240);
uji("Triboulet diam pada kartu 10", E.hitungSkor([{ rank: 10, suit: "spades" }], { dasar: { chips: 10, mult: 2 }, joker: [{ id: "triboulet" }] }).skor, 40);

console.log(`  tes mesin penilaian: ${lulus} lulus, ${gagal} gagal`);
pesan.forEach((p) => console.log(p));
process.exit(gagal ? 1 : 0);
