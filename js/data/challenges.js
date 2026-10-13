// ── 20 Challenge ─────────────────────────────────────────────────────────────
// CATATAN KEJUJURAN PENTING
// Challenge di Balatro punya 20 aturan yang spesifik. Saya TIDAK berhasil
// memverifikasi daftar itu: pencarian web tidak tersedia (tanpa kunci API) dan
// kedua wiki Balatro menolak akses otomatis (HTTP 403). Karena itu isi di
// bawah adalah rancangan Deckstorm sendiri, BUKAN salinan aturan Balatro.
// Sengaja tidak saya beri nama Balatro supaya tidak ada yang menyangka ini
// aturan resmi. Sistemnya sudah siap ditukar isi begitu daftar yang sah ada.
//
// ubah = {
//   uang          : tambahan uang awal
//   tangan        : tambahan jumlah hand per babak
//   buang         : tambahan jumlah buang per babak
//   slotJoker     : tambahan slot Joker
//   ukuranTangan  : tambahan ukuran tangan
//   targetKali    : pengali target skor (lebih dari 1 berarti lebih sulit)
//   bungaNol      : bunga toko menjadi nol
//   tanpaJoker    : Joker tidak dapat dipakai sama sekali
//   kartuAwal     : "tanpaWajah" | "hanyaSekopHati" | "acak"
// }
const CHALLENGES = [
  { id: "polos",       name: "Tanpa Hiasan",     desc: "Aturan dasar, tanpa pengubah", ubah: {} },
  { id: "kantongTipis", name: "Kantong Tipis",   desc: "Mulai dengan $0", ubah: { uang: -4 } },
  { id: "berkantong",  name: "Berkantong Tebal", desc: "Mulai dengan $30, tanpa bunga", ubah: { uang: 26, bungaNol: true } },
  { id: "tanganKosong", name: "Tangan Kosong",   desc: "-1 hand tiap babak", ubah: { tangan: -1 } },
  { id: "tanganPenuh", name: "Tangan Penuh",     desc: "+2 hand, tapi target naik 25%", ubah: { tangan: 2, targetKali: 1.25 } },
  { id: "tanpaBuang",  name: "Tanpa Buang",      desc: "Tidak boleh membuang kartu", ubah: { buang: -3 } },
  { id: "pembuang",    name: "Pembuang Ulung",   desc: "+3 buang, tapi target naik 20%", ubah: { buang: 3, targetKali: 1.2 } },
  { id: "tanganMungil", name: "Tangan Mungil",   desc: "Ukuran tangan -3", ubah: { ukuranTangan: -3 } },
  { id: "tanganRaksasa", name: "Tangan Raksasa", desc: "Ukuran tangan +3, tapi -1 slot Joker", ubah: { ukuranTangan: 3, slotJoker: -1 } },
  { id: "satuSlot",    name: "Satu Slot",        desc: "Hanya boleh membawa 1 Joker", ubah: { slotJoker: -4 } },
  { id: "tanpaJoker",  name: "Tanpa Joker",      desc: "Joker tidak dapat dipakai sama sekali", ubah: { tanpaJoker: true } },
  { id: "tumpul",      name: "Tumpul",           desc: "Tanpa kartu wajah di deck", ubah: { kartuAwal: "tanpaWajah" } },
  { id: "papanCatur",  name: "Papan Catur",      desc: "Hanya sekop dan hati", ubah: { kartuAwal: "hanyaSekopHati" } },
  { id: "kacau",       name: "Kacau",            desc: "Semua rank dan suit diacak", ubah: { kartuAwal: "acak" } },
  { id: "tekanan",     name: "Tekanan",          desc: "Target skor naik 30%", ubah: { targetKali: 1.3 } },
  { id: "cengkeraman", name: "Cengkeraman",      desc: "Target naik 50%, tapi +1 slot Joker", ubah: { targetKali: 1.5, slotJoker: 1 } },
  { id: "hemat",       name: "Hemat",            desc: "Tanpa bunga toko, tapi +$10", ubah: { bungaNol: true, uang: 6 } },
  { id: "boros",       name: "Boros",            desc: "Bunga toko berlipat, mulai $20", ubah: { uang: 16 } },
  { id: "sempit",      name: "Sempit",           desc: "-2 ukuran tangan, +1 hand", ubah: { ukuranTangan: -2, tangan: 1 } },
  { id: "ujungTanduk", name: "Ujung Tanduk",     desc: "Target naik 75%, tanpa pengubah lain", ubah: { targetKali: 1.75 } },
];

// Challenge yang dipilih berlaku seperti Deck dan Stake: pengubahnya dibaca
// fungsi yang sama, bukan jalur baru.
function challengeUbah(S) {
  const c = CHALLENGES.find(x => x.id === (S && S.challengeId));
  return (c && c.ubah) || {};
}
