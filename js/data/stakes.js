// ── 8 Stake ──────────────────────────────────────────────────────────────────
// Tingkat kesulitan yang menumpuk. Setiap Stake memuat pengubah dirinya dan
// seluruh pengubah Stake di bawahnya, karena di Balatro memilih Stake yang
// lebih tinggi berarti memainkan semua kesulitan sebelumnya sekaligus.
//
// ubah = {
//   kecilTanpaHadiah : Small Blind tidak memberi hadiah uang
//   buang            : tambahan (biasanya negatif) jumlah buang
//   lajuTarget       : pengali tambahan laju kenaikan target antar Ante
//   sewa             : uang yang dibayar tiap Joker tiap akhir babak
//   abadi            : Joker tidak dapat dijual atau dihancurkan
//   mudahRusak       : Joker menjadi lemah setelah 5 babak
// }
const STAKES = [
  { id: "white", name: "White Stake", desc: "Kesulitan dasar", ubah: {} },
  { id: "red", name: "Red Stake", desc: "Small Blind tidak memberi hadiah uang",
    ubah: { kecilTanpaHadiah: true } },
  { id: "green", name: "Green Stake", desc: "Target skor naik lebih cepat tiap Ante",
    ubah: { lajuTarget: 1 } },
  { id: "black", name: "Black Stake", desc: "Joker menjadi Abadi, tidak dapat dijual",
    ubah: { abadi: true } },
  { id: "blue", name: "Blue Stake", desc: "-1 buang tiap babak",
    ubah: { buang: -1 } },
  { id: "purple", name: "Purple Stake", desc: "Target skor naik lebih cepat lagi",
    ubah: { lajuTarget: 2 } },
  { id: "orange", name: "Orange Stake", desc: "Joker menjadi mudah rusak setelah 5 babak",
    ubah: { mudahRusak: true } },
  { id: "gold", name: "Gold Stake", desc: "Tiap Joker menyewa $3 tiap akhir babak",
    ubah: { sewa: 3 } },
];

// Stake yang dipilih berlaku menumpuk: seluruh Stake di bawahnya ikut aktif.
function stakeUbah(S) {
  const idx = STAKES.findIndex(s => s.id === (S && S.stakeId));
  if (idx < 0) return {};
  const gabung = {};
  for (let i = 0; i <= idx; i++) {
    const u = STAKES[i].ubah || {};
    Object.keys(u).forEach(k => {
      if (k === "lajuTarget") gabung[k] = Math.max(gabung[k] || 0, u[k]);
      else if (k === "buang") gabung[k] = (gabung[k] || 0) + u[k];
      else gabung[k] = u[k];
    });
  }
  return gabung;
}
