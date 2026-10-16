# Catatan Teknis

> **Pemeriksaan ulang 2026-10-16.** Empat klaim di dokumen ini diperiksa ulang
> terhadap isi repo apa adanya. Hasilnya: **tiga klaim sudah usang** (keadaan
> yang dikeluhkan sudah dibereskan) dan **satu klaim sebagian masih berlaku**
> (sebab utamanya hilang, tetapi ada sisa kerapuhan). Teks lama TIDAK dihapus:
> riwayat tetap utuh di bawah, koreksinya ada di bagian ini.

## Koreksi pemeriksaan (2026-10-16)

Nomor baris diukur pada berkas dengan sidik jari (md5) berikut. Ini penting
karena `js/game.js` sedang disunting pihak lain secara bersamaan, sehingga
nomor barisnya bisa bergeser:

| Berkas | md5 saat diperiksa |
|---|---|
| `js/game.js` | `55cd99dca3ab6fff7fa91a62b2f8c471` |
| `js/consumables.js` | `d8f4d67bb264dc92209bb917a4cb2dd3` |
| `js/data/jokers-pool.js` | `c049af90bc02479b298068f84d1d9f12` |
| `docs/catatan-teknis.md` | `8151eea7d308304615cd42b7edeaad85` |

### Koreksi 1 — "23 berkas PNG belum pernah dibuat"

**Klaim lama** (baris 8–14 dan 21–22): 18 voucher dan 5 boss PNG belum pernah
dibuat, sehingga tiap perujukan mencatat `net::ERR_FILE_NOT_FOUND`.

**Hasil pemeriksaan: USANG.** Seluruh 23 berkas sudah ada semua.

**Bukti.** Perintah [P2] memeriksa satu per satu 18 id voucher dan 5 id boss yang
disebut klaim itu; keluarannya `total diperiksa: 23` dan `HILANG: tidak ada`.
Folder `assets/img/items/voucher/` kini berisi **50 PNG** dan
`assets/img/items/boss/` berisi **56 PNG** — jauh lebih banyak daripada 23 yang
dulu hilang.

**Teks pengganti:**

> **Sebab (riwayat, sudah dibereskan):** dulu ada 23 berkas PNG yang dirujuk UI
> tetapi belum pernah dibuat — 18 voucher dan 5 boss. Berkas-berkas itu
> **sekarang sudah ada semua**, jadi sebab galat ini sudah tidak berlaku lagi.
> Pembuatnya ada di `tools/generate-hilang.py` (glyph-nya sengaja sama dengan
> ikon SVG di `js/pixelart.js`, supaya tampilan tidak berubah saat berkasnya
> muncul).

### Koreksi 2 — "Tujuh voucher masih belum berfungsi"

**Klaim lama** (baris 63–64): omenglobe, telescope, observatory, magictrick,
illusion, directorscut, dan retcon belum berfungsi.

**Hasil pemeriksaan: USANG.** Ketujuh id itu punya **definisi sekaligus
pemakaian nyata**, jadi kode yang dulu dikatakan belum ada sekarang ada.

**Bukti.** Ketujuhnya terdaftar di `js/consumables.js` baris 311–313
(`omenglobe`, `telescope`, `observatory`), 326–327 (`magictrick`, `illusion`),
dan 330–331 (`directorscut`, `retcon`). Pemakaiannya:

- `observatory` → `js/game.js:968`
- `magictrick` → `js/game.js:366`
- `illusion` → `js/game.js:376`
- `directorscut` → `js/game.js:692`
- `retcon` → `js/game.js:691`
- `omenglobe` → `js/consumables.js:345`
- `telescope` → `js/consumables.js:356` dan `js/data/decks.js:31`

**Teks pengganti:**

> Ketujuh voucher itu (omenglobe, telescope, observatory, magictrick, illusion,
> directorscut, retcon) **sudah berfungsi**: masing-masing punya definisi di
> `js/consumables.js` dan titik pakai yang nyata di `js/game.js`,
> `js/consumables.js`, serta `js/data/decks.js`. Daftar "belum berfungsi" yang
> dulu ditulis sudah tidak berlaku.

### Koreksi 3 — "Dua Tag belum ada: Standard dan Charismatic"

**Klaim lama** (baris 65): Standard dan Charismatic belum ada.

**Hasil pemeriksaan: USANG.** Keduanya sudah ada, lengkap dengan `apply` yang
benar-benar mengubah keadaan permainan.

**Bukti.** `js/game.js:621` mendefinisikan `{ id: "standard", name: "Standard Tag" ... }`
dengan `apply` yang menambah kartu bermain acak ke `S.deckTambahan` dan menaikkan
`S.deckTotal`; `js/game.js:628` mendefinisikan `{ id: "charismatic", ... }` dengan
`apply` yang sama tetapi lebih dulu memasang `k.seal` acak dari
`["red","blue","gold","purple"]`. Keduanya berada di dalam `SKIP_TAGS`
(`js/game.js:607`), yang berisi **24 Tag unik**.

**Teks pengganti:**

> Kedua Tag itu sudah ada: `standard` (`js/game.js:621`) dan `charismatic`
> (`js/game.js:628`), keduanya di dalam `SKIP_TAGS` bersama 22 Tag lain
> (total 24). Isinya tetap **tafsiran Deckstorm**, bukan salinan aturan Balatro:
> Standard menambahkan kartu bermain acak ke deck, Charismatic menambahkan kartu
> bermain ber-seal acak — bukan membuka paket, karena Deckstorm tidak punya
> Standard Pack.

### Koreksi 4 — galat `ERR_FILE_NOT_FOUND`

**Klaim lama** (baris 3–32): galat berselang-seling karena 23 PNG yang belum
dibuat, dan galat hanya muncul saat boss/voucher itu sedang dirender.

**Hasil pemeriksaan: SEBAGIAN MASIH BERLAKU — sebabnya sudah hilang.** Perlu
dibedakan dua hal:

1. **Mekanismenya BENAR.** `itemArt()` (`js/game.js:1994`) memang menyetel
   `img.src = calon[0]` lalu hanya maju ke kandidat berikutnya di `onerror`, dan
   kalau semua kandidat habis ia jatuh ke ikon SVG. Jadi kegagalan muat tidak
   terlihat rusak, tetapi tercatat di konsol. Penjelasan "kenapa tidak terlihat
   rusak" masih akurat.
2. **Sebabnya sudah tidak ada.** Kandidat **pertama** pada seluruh item sudah
   ada di disk, sehingga tidak ada permintaan yang gagal.

**Bukti.** Uji [P5] menanyakan langsung ke halaman yang sedang berjalan, lewat
pintu masuk asli `artForCalon()`, untuk **115 item** (32 voucher, 28 boss,
3 pack, 12 planet, 22 tarot, 18 spectral): `kandidat[0] gagal = 0`,
`tanpa kandidat = 0`, `requestfailed tercatat = 0`. Uji [P6] menjalankan
permainan sungguhan (mulai run, 3 ronde hand, toko, reroll) dengan pencatat
`requestfailed` dan `pageerror`: **keduanya 0**.

**Sisa yang perlu dicatat (kerapuhan, bukan galat aktif).** Dari 340 jalur yang
bisa dihasilkan `artForCalon()`/`jokerArt()`, **38 jalur cadangan berbentuk
`the-*` memang tidak ada di disk**, misalnya
`assets/img/items/planet/the-pluto.png` dan
`assets/img/items/spectral/the-familiar.png` (daftar lengkap di [P4]). Jalur itu
**tidak pernah diminta** sekarang, karena kandidat pertamanya selalu ada. Tetapi
kalau suatu saat berkas kandidat pertama hilang atau berganti nama, jalur
cadangan itu akan gagal dan galatnya muncul kembali. Membersihkan daftar
cadangan `the-*` untuk jenis yang tidak pernah memakainya akan menutup celah ini.

**Teks pengganti:**

> **ERR_FILE_NOT_FOUND — sebabnya sudah dibereskan, mekanismenya masih berlaku.**
> Galat ini dulu dicatat karena 23 PNG (18 voucher + 5 boss) belum dibuat. Berkas
> itu **sudah ada semua**, dan pengukuran ulang pada 2026-10-16 menunjukkan
> **0 permintaan gagal**: kandidat pertama seluruh 115 item ada di disk, dan uji
> permainan nyata (3 ronde + toko) mencatat 0 `requestfailed` serta 0 `pageerror`.
>
> Mekanisme pelapisannya tetap seperti dulu dan tetap benar: `itemArt()`
> (`js/game.js:1994`) mencoba kandidat berurutan dan jatuh ke `iconSVG(id)` bila
> semuanya gagal — jadi tampilan tidak pernah terlihat rusak, hanya konsolnya
> yang kotor.
>
> **Kerapuhan yang belum ditutup:** 38 jalur cadangan berbentuk `the-*` (mis.
> `assets/img/items/planet/the-pluto.png`) tidak ada di disk. Jalur itu tidak
> pernah diminta selama kandidat pertama ada, tetapi bisa memunculkan galat lama
> kalau ada berkas kandidat pertama yang hilang. Sebaiknya daftar cadangan itu
> dirapikan untuk jenis yang memang tidak pernah memakai awalan `the-`.

### Catatan pemeriksaan

Perintah yang dipakai beserta hasilnya. Semua dijalankan dari akar repo
`deckstorm`; `[Pn]` adalah penanda yang dirujuk di atas.

| # | Perintah (ringkas) | Hasil |
|---|---|---|
| P1 | `node -e "... readFileSync('js/data/jokers-pool.js') ..."` — hitung `,,`, muat array, hitung lubang | Sebelum: `panjang=157`, `lubang=50`, `objekSah=107`. Sesudah: `panjang=107`, `lubang=0`, `objekSah=107` |
| P2 | `node -e` — cek `fs.existsSync` untuk 18 PNG voucher + 5 PNG boss | `total diperiksa: 23`, `HILANG: tidak ada` (exit 0) |
| P3 | `node -e` — muat `js/consumables.js`, jalankan `artForCalon`-setara untuk 6 jenis item | VOUCHER 32/32, BOSS 28/28, PACK 3/3, PLANET 12/12, TAROT 22/22, SPECTRAL 18/18 — `TANPA_GAMBAR=0` |
| P4 | Playwright: paksa muat 340 jalur dari `artForCalon()` + 424 jalur kartu tema | Kartu tema 424/424 ada. 340 jalur: 38 gagal, **semuanya** kandidat cadangan `the-*` |
| P5 | Playwright: untuk 115 item, muat `calon[0]` lalu cari cadangan bila gagal | `kandidat[0] gagal = 0`, `tanpa kandidat = 0`, `requestfailed = 0` |
| P6 | Playwright: mulai run, 3 ronde hand, toko + reroll, catat `requestfailed` + `pageerror` | `TOTAL requestfailed: 0`, `pageerror: 0`, layar aktif `screen-game` |
| P7 | `grep -n` untuk 7 id voucher di `js/game.js`/`js/consumables.js`/`js/data/decks.js` | Ketujuhnya ketemu: definisi + titik pakai (lihat Koreksi 2) |
| P8 | `grep -n 'id: "standard"\|id: "charismatic"' js/game.js` | `js/game.js:621` dan `js/game.js:628`, keduanya punya `apply` |
| P9 | Sapuan statis 158 jalur aset literal di 20 berkas `js/html/css` | `TIDAK ADA: 0` |
| P10 | Uji kering generator: `python3 /tmp/dryrun-gen.py` (tujuan dialihkan ke `/tmp`), lalu `diff` dengan `js/data/jokers-pool.js` | Keluaran: `107 Joker`, `50 di antaranya sudah berefek, 57 menunggu logika khusus`. `diff` → **IDENTIK** |
| P11 | Uji kering generator **versi lama** (cadangan) lalu `diff` dengan berkas data sebelum diperbaiki | **IDENTIK**, berisi 50 `},,`. Keluaran generator baru: 0 `},,` |
| P12 | `node -e` — periksa tanda tangan PNG, chunk `IEND`, dan ukuran 23 berkas itu | `PNG diperiksa: 23`, `rusak: 0`, semuanya `192x272` |
| P13 | Playwright — hitung `JOKERS` di halaman yang sudah dijalankan | `jokersTotal: 150`, `jokerUnik: 150`, `poolLubang: 0`, `requestfailed: 0`, `pageerror: 0` |

### Perbaikan `js/data/jokers-pool.js` — lubang elemen kosong (2026-10-16)

Bukan bagian dari empat klaim di atas, tetapi ditemukan pada ronde pemeriksaan
yang sama dan dicatat di sini supaya tidak terulang.

**Gejala:** `JOKER_TAMBAHAN.length` bernilai **157**, padahal objek sahnya hanya
**107**. Selisih 50 itu adalah *elision* (lubang sparse) pada array, bukan
elemen `undefined` — jadi `JOKER_TAMBAHAN.filter(x => !x)` melaporkan `0` dan
kebocoran ini tidak terlihat dari `filter`.

**Akar masalah:** `tools/import-jokers-pool.py`. Cabang "SEDERHANA" sudah
mengakhiri `badan` dengan `},`, lalu baris perakitannya menambahkan koma lagi
(`...{badan},`), sehingga keluarannya `},,`. Cabang "khusus" tidak menambah koma
di `badan`, jadi hanya 50 objek bercabang SEDERHANA yang terkena — sama persis
dengan jumlah lubangnya.

**Perbaikan:** 50 pola `},,` pada `js/data/jokers-pool.js` dirapikan menjadi
`},`; **tidak ada satu objek sah pun yang dihapus** — daftar id sebelum dan
sesudah identik dan berurutan sama (107 id, semuanya unik). Koma ganda pada
perakit `tools/import-jokers-pool.py` juga dihapus agar berkasnya tidak rusak
lagi saat generator dijalankan ulang.

Catatan kejujuran: perintah persis yang disarankan di tugas,
`node -e "... eval(s); console.log(JOKER_TAMBAHAN.length)"`, **gagal dengan
exit 1** — `ReferenceError: JOKER_TAMBAHAN is not defined`, karena
`const` di dalam `eval()` ter-scope lokal dan tidak terlihat di luar `eval`.
Itu batas cara pemuatan, bukan tanda berkasnya rusak. Bentuk yang dipakai di
[P1] mengembalikan nilainya dari dalam `eval` (`eval(s + '; JOKER_TAMBAHAN')`)
dan berhasil dengan exit 0.

## ERR_FILE_NOT_FOUND — sebabnya sudah ditemukan (2026-10-23)

> **DIPERBARUI 2026-10-16.** Sebab yang ditulis di bagian ini (23 PNG belum
> dibuat) **sudah dibereskan** — semua berkasnya kini ada dan pengukuran ulang
> mencatat 0 permintaan gagal. Mekanisme pelapisannya masih berlaku dan masih
> benar. Rinciannya di **Koreksi 1** dan **Koreksi 4**. Teks asli di bawah
> dibiarkan apa adanya sebagai riwayat.

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
  *(DIPERBARUI 2026-10-16: klaim ini sudah tidak benar — ketujuhnya sudah punya
  definisi dan titik pakai. Lihat Koreksi 2.)*
- Dua Tag belum ada: Standard dan Charismatic.
  *(DIPERBARUI 2026-10-16: klaim ini sudah tidak benar — keduanya ada di
  `js/game.js:621` dan `:628`. Lihat Koreksi 3.)*

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
  *(DIPERBARUI 2026-10-16: kedua Tag itu kini benar-benar ada dan berjalan;
  yang tetap tafsiran hanyalah isi aturannya. Lihat Koreksi 3.)*
- Repo BELUM dipush. 75 commit masih lokal.
