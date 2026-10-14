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
