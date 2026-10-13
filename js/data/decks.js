// ── 15 Deck ──────────────────────────────────────────────────────────────────
// Setiap Deck punya pengubah yang dibaca permainan. Sebagian bekerja saat run
// dimulai (apply), sebagian lagi lewat pengubah tetap (ubah) yang dibaca
// fungsi seperti handSize(), maxHands(), maxDiscards(), dan maxJokers().
//
// ubah = { tangan, buang, slotJoker, ukuranTangan, bungaNol, uangPerSisa }
//   tangan        : tambahan jumlah hand per babak
//   buang         : tambahan jumlah buang per babak
//   slotJoker     : tambahan slot Joker
//   ukuranTangan  : tambahan ukuran tangan
//   bungaNol      : bunga toko menjadi nol
//   uangPerSisa   : uang tambahan per sisa hand dan per sisa buang
const DECKS = [
  { id: "red", name: "Red Deck", desc: "+1 buang tiap babak",
    ubah: { buang: 1 } },
  { id: "blue", name: "Blue Deck", desc: "+1 hand tiap babak",
    ubah: { tangan: 1 } },
  { id: "yellow", name: "Yellow Deck", desc: "Mulai dengan $10",
    apply: (S) => { S.money += 10; } },
  { id: "green", name: "Green Deck", desc: "Tanpa bunga, +$2 per sisa hand dan +$1 per sisa buang",
    ubah: { bungaNol: true, uangPerSisa: true } },
  { id: "black", name: "Black Deck", desc: "+1 slot Joker, -1 hand tiap babak",
    ubah: { slotJoker: 1, tangan: -1 } },
  { id: "magic", name: "Magic Deck", desc: "Mulai dengan voucher Crystal Ball dan 2 kartu The Fool",
    apply: (S) => {
      S.vouchers.add("crystalball");
      for (let i = 0; i < 2; i++) S.consumables.push(Object.assign({}, TAROTS[0]));
    } },
  { id: "nebula", name: "Nebula Deck", desc: "Mulai dengan voucher Telescope, -1 slot konsumabel",
    ubah: { slotKonsumabel: -1 },
    apply: (S) => { S.vouchers.add("telescope"); } },
  { id: "ghost", name: "Ghost Deck", desc: "Mulai dengan kartu Hex, Spectral boleh muncul di toko",
    apply: (S) => {
      const hex = SPECTRALS.find(x => x.id === "hex");
      if (hex) S.consumables.push(Object.assign({}, hex));
    } },
  { id: "abandoned", name: "Abandoned Deck", desc: "Tanpa kartu wajah di deck",
    apply: (S) => { S.deck = S.deck.filter(c => c.rank < 11); } },
  { id: "checkered", name: "Checkered Deck", desc: "Hanya sekop dan hati",
    apply: (S) => {
      const kolam = S.deck.filter(c => c.suit === "spades" || c.suit === "hearts");
      while (S.deck.length > kolam.length) S.deck.pop();
      S.deck.forEach(c => { if (c.suit !== "spades" && c.suit !== "hearts") c.suit = "spades"; });
    } },
  { id: "zodiac", name: "Zodiac Deck", desc: "Mulai dengan voucher Tarot Merchant, Planet Merchant, dan Overstock",
    apply: (S) => {
      ["tarotmerchant", "planetmerchant", "overstock"].forEach(v => S.vouchers.add(v));
    } },
  { id: "painted", name: "Painted Deck", desc: "+2 ukuran tangan, -1 slot Joker",
    ubah: { ukuranTangan: 2, slotJoker: -1 } },
  { id: "anaglyph", name: "Anaglyph Deck", desc: "Tiap Boss Blind dikalahkan, dapat satu Double Tag",
    ubah: { tagGandaBos: true } },
  { id: "plasma", name: "Plasma Deck", desc: "Chips dan Mult diseimbangkan saat menghitung skor",
    ubah: { seimbang: true } },
  { id: "erratic", name: "Erratic Deck", desc: "Semua rank dan suit diacak",
    apply: (S) => {
      const suit = ["spades", "hearts", "clubs", "diamonds"];
      S.deck.forEach(c => {
        c.rank = 2 + Math.floor(Math.random() * 13);
        c.suit = suit[Math.floor(Math.random() * 4)];
      });
    } },
];
const deckUbah = (S) => (S && S.deckUbah) || {};
