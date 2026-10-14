# Catatan Teknis

## ERR_FILE_NOT_FOUND — sebabnya sudah ditemukan (2026-10-23)

Galat ini muncul berselang-seling sejak jauh sebelum ronde ini dan tidak pernah
bisa direproduksi dengan pasti. Sebabnya sekarang diketahui.

**Sebab:** 23 berkas PNG yang dirujuk UI belum pernah dibuat:

- 18 voucher: overstockplus, clearance, glowup, rerollsurplus, rerollglut,
  crystalball, omenglobe, nachotong, tarotmerchant, tarottycoon,
  planetmerchant, planettycoon, seedmoney, moneytree, magictrick,
  directorscut, paintbrush, palette
- 5 boss: crimson, cerulean, verdant, amber, violet

**Kenapa tidak terlihat rusak:** UI memakai `itemArt([...jalur PNG...], nama, iconSVG(id))`.
Bila PNG gagal dimuat, ia jatuh ke ikon SVG yang digambar di dalam kode. Jadi
tampilannya benar, tetapi tiap percobaan memuat mencatat `net::ERR_FILE_NOT_FOUND`
di konsol peramban.

**Kenapa berselang-seling:** galat hanya muncul saat boss atau voucher tersebut
kebetulan sedang dirender — jadi bergantung layar dan undian boss.

**Cara menemukannya:** menjalankan satu Ante penuh dari awal sampai akhir
(Small, Big, Boss, toko, Ante berikutnya) sambil mencatat `requestfailed`.
Uji-uji sebelumnya hanya memeriksa bagian-bagian, sehingga jalur ini tidak
pernah dijalani utuh.

**Perbaikan yang benar:** membuat 23 PNG tersebut dengan generator di `tools/`.
Data yang dipakai generator (`tools/data/balatro-items.json`) memakai nama
Bergaris_Bawah, sedangkan `js/consumables.js` memakai id tanpa tanda hubung —
perbedaan penamaan inilah yang membuat berkasnya tidak pernah cocok.

## Audit menyeluruh (2026-10-23)

Dipicu oleh bug target NaN yang lolos 18 ronde: bug itu ditemukan karena uji
saya selalu menguji EFEK, bukan apakah fiturnya BEKERJA. Audit ini menutup
celah itu.

**Lapis 1 — sapuan keadaan (196 kombinasi):**
seluruh 15 Deck x 8 Stake, seluruh 20 Challenge, dan seluruh 28 Boss Blind pada
Ante 8 serta Ante 16. Tiap kombinasi diperiksa 11 nilai: target, skor, uang,
jumlah hand, jumlah buang, kartu di tangan, isi deck, slot Joker, ukuran tangan,
slot konsumabel, jumlah slot toko, dan batas bunga.

Hasil: **0 nilai tidak sah**, 0 galat halaman.

**Lapis 2 — sapuan penilaian (4 keadaan rumit x 3 hand):**
keadaan yang dipilih justru yang paling rawan: 5 Joker sekaligus, Joker
beredisi foil/holo/poly/negative, boss The Flint, dan Challenge Ujung Tanduk.
Bukan hanya nilai akhir yang diperiksa, tetapi SETIAP LANGKAH pada catatan
penilaian (chips, mult, multX) — catatan langkah itulah yang paling rinci dan
paling mungkin menampakkan nilai rusak lebih awal.

Hasil: **0 langkah tidak sah**, 0 keadaan tidak sah, 0 galat halaman.

**Yang belum dicakup audit ini** — dan sebaiknya jangan dianggap sudah:
- Penghancuran kartu yang menetap baru diperiksa pada satu keadaan, bukan
  seluruh kombinasi Challenge.
- Peluang (edisi, Wheel, Recyclomancy) diperiksa dengan ratusan percobaan,
  bukan puluhan ribu, sehingga hanya membuktikan mekanismenya bekerja, bukan
  presisi angkanya.
- Tujuh voucher masih belum berfungsi: omenglobe, telescope, observatory,
  magictrick, illusion, directorscut, retcon.
- Dua Tag belum ada: Standard dan Charismatic.

## Status verifikasi akhir (ronde terakhir)

**Yang SUDAH terbukti:**
- Kelengkapan data: Joker 150, Voucher 32 (semuanya dapat dibeli), Tag 24,
  Boss Blind 28, Deck 15, Stake 8, Spectral 18, Seal 4, Edisi 4, Challenge 20.
- Sapuan 196 kombinasi Deck x Stake x Challenge x Boss: 0 nilai tidak sah.
- Sapuan penilaian langkah demi langkah pada 4 keadaan rumit: 0 nilai tidak sah.
- Run 480 hand menembus ante 1 sampai 21 lewat jalur nextBlind() yang sebenarnya,
  tanpa satu pun berkas gagal dimuat dan tanpa galat konsol.
- Tombol Endless bekerja: keadaan endless berubah menjadi true sesudah diklik.
- Seluruh layar (menu, howto, settings, collection, shop, win) terbuka bersih.

**Yang BELUM terbukti - jangan dianggap sudah:**
- **Uji run saya memanggil endRoundWin() tanpa syarat**, jadi run itu TIDAK
  membuktikan syarat menang dan kalah. Run tersebut juga TIDAK membuktikan bahwa
  target benar-benar bisa dicapai dengan cara bermain yang sah.
- **gameWon tidak pernah menjadi true sampai ante 21.** Syarat menang di ante 9
  perlu diperiksa ulang: apakah benar dipicu, dan di titik mana. Saya TIDAK
  menyimpulkan ini bug, dan saya juga TIDAK menyimpulkan ini benar.
- Skor yang dihasilkan jauh di bawah target (misalnya 263 berbanding 5.153.964),
  dan kenaikan handLevels di uji saya tampaknya tidak benar-benar diterapkan.
  Artinya angka-angka pada uji itu tidak menggambarkan permainan yang wajar.
- Peluang (edisi, Wheel, Recyclomancy) hanya diuji dengan ratusan percobaan.
- Aturan 20 Challenge dan 2 Tag (Standard, Charismatic) adalah tafsiran
  Deckstorm; aturan Balatro-nya tidak bisa diverifikasi (situs menolak akses).
- Repo BELUM dipush. 75 commit masih lokal.
