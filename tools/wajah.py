#!/usr/bin/env python3
"""
Wajah Joker Deckstorm.

Tiap Joker digambar sebagai wajah badut, bukan lambang. Ciri-cirinya dipilih dari
hash nama kartu, jadi setiap Joker selalu mendapat wajah yang sama (dapat diulang)
sekaligus berbeda dari 149 Joker lainnya.

Bentuk kepala, warna kulit, mata, mulut, hidung, topi, dan aksesori semuanya
digambar dari kode di berkas ini. Tidak ada gambar dari luar.
"""

import zlib

import emblems as E
from tools_bridge import kartu, W, H

# ── bahan pilihan fitur ──────────────────────────────────────────────────────
KULIT = ["#F2D5B8", "#E8B48C", "#C98A5E", "#8D5A3B", "#A8C0A0", "#C0A8E0"]
KOSTUM = ["#3E7BC4", "#3E9A5C", "#C43A48", "#8A5AC8", "#C4703E", "#2FA8A0", "#D9A431"]


def _pilih(h, geser, jumlah):
    return (h >> geser) % jumlah


def _kepala(img, bentuk, cx, cy, kulit, tinta):
    """Empat bentuk kepala: bulat, lonjong, kotak, dan lonjong ke bawah."""
    if bentuk == 0:
        E.lingkaran(img, cx, cy, 13, kulit)
    elif bentuk == 1:
        E.lingkaran(img, cx, cy - 3, 11, kulit)
        E.kotak(img, cx - 9, cy - 3, cx + 9, cy + 13, kulit)
        E.poligon(img, [(cx - 9, cy + 13), (cx + 9, cy + 13), (cx, cy + 18)], kulit)
    elif bentuk == 2:
        E.kotak(img, cx - 12, cy - 12, cx + 12, cy + 14, kulit)
        for x in (cx - 12, cx + 12):
            E.kotak(img, x, cy - 12, x, cy - 12, tinta)
    else:
        E.lingkaran(img, cx, cy - 6, 9, kulit)
        E.lingkaran(img, cx, cy + 7, 13, kulit)
    # telinga
    E.lingkaran(img, cx - 13, cy + 2, 3, kulit)
    E.lingkaran(img, cx + 13, cy + 2, 3, kulit)
    # garis rahang supaya bentuknya tegas
    E.cincin(img, cx, cy, 13, tinta, 1) if bentuk == 0 else None


def _mata(img, ragam, cx, cy, tinta, aksen):
    for arah in (-1, 1):
        ex = cx + arah * 6
        if ragam == 0:                       # bulat dengan pupil
            E.lingkaran(img, ex, cy, 4, "#FFFFFF")
            E.lingkaran(img, ex + arah, cy, 2, tinta)
        elif ragam == 1:                     # menyipit tajam
            E.poligon(img, [(ex - 4, cy + 1), (ex + 4, cy - 2), (ex + 4, cy + 2)], "#FFFFFF")
            E.lingkaran(img, ex, cy + 1, 1, tinta)
            E.garis(img, ex - 5, cy - 4, ex + 4, cy - 5, tinta, 2)
        elif ragam == 2:                     # melotot
            E.lingkaran(img, ex, cy, 5, "#FFFFFF")
            E.lingkaran(img, ex, cy, 2, tinta)
            E.lingkaran(img, ex, cy, 5, tinta, isi=False, tebal=1)
        elif ragam == 3:                     # tanda silang
            E.garis(img, ex - 3, cy - 3, ex + 3, cy + 3, tinta, 2)
            E.garis(img, ex + 3, cy - 3, ex - 3, cy + 3, tinta, 2)
        elif ragam == 4:                     # rongga kosong
            E.lingkaran(img, ex, cy, 4, "#0D0A15")
        else:                                # monokel di satu mata
            E.lingkaran(img, ex, cy, 4, "#FFFFFF")
            E.lingkaran(img, ex, cy, 2, tinta)
            if arah == 1:
                E.cincin(img, ex, cy, 6, aksen, 2)


def _hidung(img, ragam, cx, cy, kulit, tinta, aksen):
    if ragam == 0:
        E.lingkaran(img, cx, cy, 3, kartu.WARNA["muka2"])
    elif ragam == 1:
        E.poligon(img, [(cx, cy - 3), (cx + 3, cy + 2), (cx - 3, cy + 2)], kartu.WARNA["muka2"])
    elif ragam == 2:
        E.lingkaran(img, cx, cy, 5, "#E04A4A")   # hidung badut
    elif ragam == 3:
        E.garis(img, cx - 1, cy - 2, cx - 1, cy + 3, tinta, 2)
        E.lingkaran(img, cx - 3, cy + 3, 2, kartu.WARNA["muka2"])


def _mulut(img, ragam, cx, cy, tinta, aksen):
    if ragam == 0:                            # seringai bergigi
        E.poligon(img, [(cx - 9, cy - 2), (cx + 9, cy - 2), (cx + 7, cy + 4), (cx - 7, cy + 4)], "#0D0A15")
        for i in range(-6, 7, 3):
            E.kotak(img, cx + i, cy - 2, cx + i + 1, cy + 1, "#FFFFFF")
    elif ragam == 1:                          # gigi zigzag
        E.kotak(img, cx - 8, cy - 1, cx + 8, cy + 3, "#0D0A15")
        for i in range(-7, 8, 2):
            E.poligon(img, [(cx + i, cy - 1), (cx + i + 2, cy - 1), (cx + i + 1, cy + 2)], "#FFFFFF")
    elif ragam == 2:                          # cemberut
        E.garis(img, cx - 7, cy + 3, cx, cy - 1, tinta, 2)
        E.garis(img, cx, cy - 1, cx + 7, cy + 3, tinta, 2)
    elif ragam == 3:                          # mulut terbuka menjulurkan lidah
        E.lingkaran(img, cx, cy + 1, 5, "#0D0A15")
        E.poligon(img, [(cx - 3, cy + 4), (cx + 3, cy + 4), (cx, cy + 9)], "#E0607A")
    elif ragam == 4:                           # dijahit
        E.garis(img, cx - 8, cy + 1, cx + 8, cy + 1, tinta, 2)
        for i in range(-7, 8, 3):
            E.garis(img, cx + i, cy - 2, cx + i, cy + 4, tinta, 1)
    else:                                      # seringai tipis menyamping
        E.garis(img, cx - 6, cy, cx + 3, cy + 4, tinta, 2)
        E.garis(img, cx + 3, cy + 4, cx + 8, cy, tinta, 2)


def _topi(img, ragam, cx, cy, kostum, aksen, tinta):
    if ragam == 0:                            # topi jester tiga titik bergiring
        for arah, dx in ((-1, -11), (0, 0), (1, 11)):
            puncak_x = cx + dx
            puncak_y = cy - 22 + abs(dx) // 2
            E.poligon(img, [(cx + dx // 2 - 4, cy - 6), (cx + dx // 2 + 4, cy - 6),
                            (puncak_x + 1, puncak_y), (puncak_x - 1, puncak_y)], kostum)
            E.lingkaran(img, puncak_x, puncak_y - 2, 3, aksen)
        E.kotak(img, cx - 14, cy - 8, cx + 14, cy - 5, aksen)
    elif ragam == 1:                          # mahkota
        E.poligon(img, [(cx - 13, cy - 4), (cx - 13, cy - 16), (cx - 6, cy - 9),
                        (cx, cy - 19), (cx + 6, cy - 9), (cx + 13, cy - 16), (cx + 13, cy - 4)], aksen)
        E.kotak(img, cx - 13, cy - 4, cx + 13, cy - 1, aksen)
    elif ragam == 2:                          # mohawk
        for i in range(-4, 5, 2):
            E.poligon(img, [(cx + i - 2, cy - 8), (cx + i + 2, cy - 8), (cx + i, cy - 20)], kostum)
    elif ragam == 3:                          # botak dengan jambul samping
        E.lingkaran(img, cx - 12, cy - 3, 4, kostum)
        E.lingkaran(img, cx + 12, cy - 3, 4, kostum)
        E.garis(img, cx - 8, cy - 12, cx + 8, cy - 12, kostum, 2)
    elif ragam == 4:                          # topi tinggi
        E.kotak(img, cx - 9, cy - 24, cx + 9, cy - 8, kostum)
        E.kotak(img, cx - 14, cy - 8, cx + 14, cy - 4, tinta)
    else:                                     # tudung
        E.poligon(img, [(cx - 16, cy + 4), (cx - 12, cy - 14), (cx, cy - 20),
                        (cx + 12, cy - 14), (cx + 16, cy + 4), (cx + 12, cy + 4),
                        (cx + 12, cy - 10), (cx - 12, cy - 10), (cx - 12, cy + 4)], kostum)


def _aksesori(img, ragam, cx, cy, kostum, aksen, tinta):
    if ragam == 0:                            # kerah jester berujung
        E.poligon(img, [(cx - 16, cy + 30), (cx - 10, cy + 22), (cx - 4, cy + 30),
                        (cx + 2, cy + 22), (cx + 8, cy + 30), (cx + 14, cy + 22),
                        (cx + 16, cy + 30)], kostum)
    elif ragam == 1:                          # cerutu
        E.kotak(img, cx + 6, cy + 16, cx + 18, cy + 18, "#8A5A3A")
        E.lingkaran(img, cx + 19, cy + 17, 2, "#E0607A")
    elif ragam == 2:                          # kartu remi di samping
        E.kotak(img, cx + 14, cy + 10, cx + 22, cy + 20, "#EFE9F7")
        E.kotak(img, cx + 14, cy + 10, cx + 22, cy + 20, tinta, isi=False)
    elif ragam == 3:                          # kalung lonceng
        E.cincin(img, cx, cy + 26, 9, aksen, 2)
        E.lingkaran(img, cx, cy + 33, 3, aksen)


def wajah_joker(img, nama):
    """Gambar wajah Joker penuh pada kartu. Semua ciri ditentukan hash nama."""
    h = zlib.crc32(nama.encode("utf-8"))
    cx, cy = W // 2, 22
    kulit = KULIT[_pilih(h, 3, len(KULIT))]
    kostum = KOSTUM[_pilih(h, 6, len(KOSTUM))]
    tinta = "#0D0A15"
    aksen = kartu.WARNA["aksen"]

    _topi(img, _pilih(h, 12, 6), cx, cy, kostum, aksen, tinta)
    _kepala(img, _pilih(h, 15, 4), cx, cy, kulit, tinta)
    _mata(img, _pilih(h, 18, 6), cx, cy - 2, tinta, aksen)
    _hidung(img, _pilih(h, 21, 4), cx, cy + 5, kulit, tinta, aksen)
    _mulut(img, _pilih(h, 24, 6), cx, cy + 11, tinta, aksen)
    _aksesori(img, _pilih(h, 27, 4), cx, cy, kostum, aksen, tinta)
