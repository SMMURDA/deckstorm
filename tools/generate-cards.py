#!/usr/bin/env python3
"""
Generator kartu remi pixel-art Deckstorm.

Seluruh bentuk digambar dari matriks piksel yang ditulis di berkas ini: tidak ada
font, ikon, atau gambar yang diambil dari mana pun. Semua kartu dihasilkan
prosedural, jadi hasilnya bisa diulang dan disesuaikan kapan saja.

Pakai:
    /tmp/artvenv/bin/python tools/generate-cards.py             # seluruh 52 kartu + punggung
    /tmp/artvenv/bin/python tools/generate-cards.py --sheet     # plus lembar pratinjau
"""

import os
import sys
from PIL import Image

# ── dasar ─────────────────────────────────────────────────────────────────────
BASE_W, BASE_H = 48, 68          # kanvas kartu dalam "piksel" logis (nisbah 5:7, lebih rinci)
SCALE = 4                        # 48x68 -> 192x272 piksel PNG
OUT_DIR = "assets/img/cards"

WARNA = {
    # tema gelap: muka gelap, tinta gading, garis bingkai ungu muda
    "tepi":    "#0D0A15",        # garis luar kartu
    "tepi2":   "#7A63A8",        # garis dalam (memberi kesan berbingkai)
    "muka":    "#221C2E",        # permukaan kartu
    "muka2":   "#2E2740",        # bayangan halus di tepi dalam
    "hitam":   "#EFE9F7",        # sekop & keriting kini gading
    "merah":   "#F2545B",        # hati & wajik merah terang
    "punggung": "#1A1526",
    "punggung2": "#2B2140",
    "aksen":   "#E9A13B",
    "figur":   "#B79BE0",
    "figur2":  "#6E5A96",
}

# ── font 3x5: hanya yang dibutuhkan kartu ────────────────────────────────────
FONT = {
    "0": [".##", "#.#", "#.#", "#.#", "##."],
    "1": [".#.", "##.", ".#.", ".#.", "###"],
    "2": ["##.", "..#", ".#.", "#..", "###"],
    "3": ["##.", "..#", ".#.", "..#", "##."],
    "4": ["#.#", "#.#", "###", "..#", "..#"],
    "5": ["###", "#..", "##.", "..#", "##."],
    "6": [".##", "#..", "###", "#.#", "###"],
    "7": ["###", "..#", ".#.", ".#.", ".#."],
    "8": ["###", "#.#", "###", "#.#", "###"],
    "9": ["###", "#.#", "###", "..#", "##."],
    "A": [".#.", "#.#", "###", "#.#", "#.#"],
    "J": ["###", "..#", "..#", "#.#", ".#."],
    "Q": ["###", "#.#", "#.#", "###", "..#"],
    "K": ["#.#", "#.#", "##.", "#.#", "#.#"],
}

# ── bentuk suit: kecil 5x5 untuk sudut, besar 9x9 untuk tengah ───────────────
SUIT_KECIL = {
    "spades": [".#.#.", "#####", ".###.", "..#..", "..#.."],
    "hearts": [".#.#.", "#####", "#####", ".###.", "..#.."],
    "diamonds": ["..#..", ".###.", "#####", ".###.", "..#.."],
    "clubs": ["..#..", "#####", "..#..", ".###.", "..#.."],
}

SUIT_SEDANG = {
    "spades": ["...#...", "..###..", ".#####.", "#######", "...#...", "..###..", "...#..."],
    "hearts": [".##.##.", "#######", "#######", ".#####.", "..###..", "...#...", "......."],
    "diamonds": ["...#...", "..###..", ".#####.", "#######", ".#####.", "..###..", "...#..."],
    "clubs": ["..###..", ".#####.", "..###..", "...#...", ".#####.", "#######", "...#..."],
}

SUIT_BESAR = {
    "spades": [
        "....#....",
        "...###...",
        "..#####..",
        ".#######.",
        "#########",
        "....#....",
        "...###...",
        "..#####..",
        "....#....",
    ],
    "hearts": [
        ".##...##.",
        "#########",
        "#########",
        "#########",
        ".#######.",
        "..#####..",
        "...###...",
        "....#....",
        ".........",
    ],
    "diamonds": [
        "....#....",
        "...###...",
        "..#####..",
        ".#######.",
        "#########",
        ".#######.",
        "..#####..",
        "...###...",
        "....#....",
    ],
    "clubs": [
        "...###...",
        "..#####..",
        "...###...",
        "....#....",
        ".#######.",
        "#########",
        ".#######.",
        "....#....",
        "...###...",
    ],
}

# ── figur kartu wajah: digambar parametrik 22x22, lalu dicerminkan 180° ────
WARNA_KULIT = "#F2E4D4"
UKURAN_FIGUR = 22


def gambar_figur(img, pangkat, x0, y0, warna_badan, warna_aksen):
    """Gambar satu figur istana di (x0,y0) berukuran 22x22, khas J/Q/K."""
    px = img.load()

    def P(x, y, c):
        X, Y = x0 + x, y0 + y
        if 0 <= X < BASE_W and 0 <= Y < BASE_H:
            px[X, Y] = _w(c)

    def kotak(x1, y1, x2, y2, c):
        for y in range(y1, y2 + 1):
            for x in range(x1, x2 + 1):
                P(x, y, c)

    def garis(langkah, c):
        for x, y in langkah:
            P(x, y, c)

    # bahu dan pakaian
    kotak(3, 16, 18, 18, warna_badan)
    for i in range(4):
        kotak(3 + i, 19 + i, 6 + i, 19 + i, warna_badan)
        kotak(15 - i, 19 + i, 18 - i, 19 + i, warna_badan)
    # kerah dengan aksen
    garis([(8, 17), (9, 17), (10, 17), (11, 17), (12, 17), (13, 17)], warna_aksen)

    # kepala dan wajah
    kotak(6, 6, 15, 15, warna_badan)
    kotak(8, 8, 13, 14, WARNA_KULIT)
    P(9, 10, warna_badan)
    P(12, 10, warna_badan)

    if pangkat == "K":
        # mahkota tiga titik dengan permata, dan janggut
        kotak(5, 2, 16, 5, warna_aksen)
        for x in (5, 9, 12, 16):
            P(x, 1, warna_aksen)
            P(x, 0, warna_aksen)
        P(9, 4, "#C2304A")
        P(12, 4, "#2E6BC4")
        kotak(9, 15, 12, 15, warna_badan)
    elif pangkat == "Q":
        # mahkota berhias dan rambut panjang
        kotak(6, 3, 15, 5, warna_aksen)
        P(7, 2, warna_aksen)
        P(10, 1, warna_aksen)
        P(14, 2, warna_aksen)
        kotak(4, 7, 5, 16, warna_badan)
        kotak(16, 7, 17, 16, warna_badan)
        P(10, 15, "#C2304A")
    else:
        # topi dengan bulu
        kotak(5, 3, 16, 4, warna_badan)
        kotak(6, 1, 15, 2, warna_badan)
        garis([(16, 0), (17, 0), (17, 1)], warna_aksen)
        kotak(9, 15, 12, 15, warna_badan)


# ── tata letak pip kartu angka: baris & kolom dalam bidang tengah ────────────
# kolom: 0 = kiri, 1 = tengah, 2 = kanan. Baris: 0..4 dari atas.
PIP_LAYOUT = {
    "2":  [(1, 0), (1, 4)],
    "3":  [(1, 0), (1, 2), (1, 4)],
    "4":  [(0, 0), (2, 0), (0, 4), (2, 4)],
    "5":  [(0, 0), (2, 0), (1, 2), (0, 4), (2, 4)],
    "6":  [(0, 0), (2, 0), (0, 2), (2, 2), (0, 4), (2, 4)],
    "7":  [(0, 0), (2, 0), (1, 1), (0, 2), (2, 2), (0, 4), (2, 4)],
    "8":  [(0, 0), (2, 0), (1, 1), (0, 2), (2, 2), (1, 3), (0, 4), (2, 4)],
    "9":  [(0, 0), (2, 0), (0, 1), (2, 1), (1, 2), (0, 3), (2, 3), (0, 4), (2, 4)],
    "10": [(0, 0), (2, 0), (1, 1), (0, 2), (2, 2), (0, 3), (2, 3), (1, 4), (0, 5), (2, 5)],
}

BIDANG = (7, 8, 41, 60)          # kiri, atas, kanan, bawah untuk bidang tengah
KOLOM_X = {0: 9, 1: 20, 2: 31}   # posisi kiri tiap kolom untuk pip 7x7


def kanvas():
    img = Image.new("RGBA", (BASE_W, BASE_H), (0, 0, 0, 0))
    px = img.load()
    for y in range(BASE_H):
        for x in range(BASE_W):
            tepi = x in (0, BASE_W - 1) or y in (0, BASE_H - 1)
            dalam = x in (1, BASE_W - 2) or y in (1, BASE_H - 2)
            if tepi:
                px[x, y] = _w(WARNA["tepi"])
            elif dalam:
                px[x, y] = _w(WARNA["tepi2"])
            elif x in (2, BASE_W - 3) or y in (2, BASE_H - 3):
                px[x, y] = _w(WARNA["muka2"])
            else:
                px[x, y] = _w(WARNA["muka"])
    return img


def _w(hexcolor):
    h = hexcolor.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def tempel(img, pola, x0, y0, warna, putar=False, peta=None):
    """Tempel matriks piksel. putar=True memutar 180 derajat di tempatnya.
    peta mengubah arti karakter: {"#": warna_utama, "o": warna_aksen}."""
    baris = pola[::-1] if putar else pola
    tinggi = len(pola)
    lebar = len(pola[0])
    px = img.load()
    arti = {"#": warna, "*": warna}
    if peta:
        arti.update(peta)
    for j, baris_pola in enumerate(baris):
        for i, ch in enumerate(baris_pola):
            if ch in arti:
                x = x0 + (lebar - 1 - i if putar else i)
                y = y0 + (tinggi - 1 - j if putar else j)
                if 0 <= x < BASE_W and 0 <= y < BASE_H:
                    px[x, y] = _w(arti[ch])


def glyph_rank(rank: str):
    """Matriks glyph untuk rank. '10' butuh dua glyph berdampingan (7 piksel)."""
    if rank == "10":
        a, b = FONT["1"], FONT["0"]
        return [x + "." + y for x, y in zip(a, b)]
    return FONT[rank]


def gambar_kartu(rank: str, suit: str) -> Image:
    img = kanvas()
    warna = WARNA["merah"] if suit in ("hearts", "diamonds") else WARNA["hitam"]
    glyph = glyph_rank(rank)
    lebar_glyph = len(glyph[0])

    # indeks sudut kiri atas
    x_glyph = 4
    tempel(img, glyph, x_glyph, 4, warna)
    tempel(img, SUIT_KECIL[suit], x_glyph, 11, warna)
    # indeks sudut kanan bawah (diputar 180 derajat)
    tempel(img, glyph, BASE_W - 4 - lebar_glyph, BASE_H - 9, warna, putar=True)
    tempel(img, SUIT_KECIL[suit], BASE_W - 8, BASE_H - 15, warna, putar=True)

    if rank == "A":
        tempel(img, SUIT_BESAR[suit], (BASE_W - 9) // 2, (BASE_H - 9) // 2, warna)
    elif rank in ("J", "Q", "K"):
        x_fig = (BASE_W - UKURAN_FIGUR) // 2
        atas = 5
        # panel berbingkai seperti kartu wajah sungguhan
        px = img.load()
        for x in range(12, BASE_W - 12):
            px[x, 3] = _w(warna)
            px[x, BASE_H - 4] = _w(warna)
        for y in range(3, BASE_H - 3):
            px[12, y] = _w(warna)
            px[BASE_W - 13, y] = _w(warna)
        # figur atas + bayangan, lalu cerminannya di bawah
        gambar_figur(img, rank, x_fig + 1, atas + 1, WARNA["figur2"], WARNA["figur2"])
        gambar_figur(img, rank, x_fig, atas, WARNA["figur"], WARNA["aksen"])
        gambar_figur(img, rank, x_fig, BASE_H - atas - UKURAN_FIGUR, WARNA["figur"], WARNA["aksen"])
        tempel(img, SUIT_SEDANG[suit], (BASE_W - 7) // 2, (BASE_H - 7) // 2, warna)
    else:
        for kolom, baris in PIP_LAYOUT[rank]:
            x = KOLOM_X[kolom]
            # baris 0..5 dipetakan merata di bidang tengah
            maks = max(b for _, b in PIP_LAYOUT[rank])
            langkah = (BIDANG[3] - BIDANG[1] - 7) / maks if maks else 0
            y = int(BIDANG[1] + baris * langkah)
            tempel(img, SUIT_SEDANG[suit], x, y, warna)
    return img


def gambar_punggung() -> Image:
    img = kanvas()
    px = img.load()
    for y in range(2, BASE_H - 2):
        for x in range(2, BASE_W - 2):
            pola = ((x + y) // 2) % 2 == 0
            px[x, y] = _w(WARNA["punggung"] if pola else WARNA["punggung2"])
    # bingkai aksen
    for i in range(3, BASE_W - 3):
        for y in (3, BASE_H - 4):
            px[i, y] = _w(WARNA["aksen"])
    for j in range(3, BASE_H - 3):
        for x in (3, BASE_W - 4):
            px[x, j] = _w(WARNA["aksen"])
    tempel(img, SUIT_BESAR["spades"], (BASE_W - 9) // 2, (BASE_H - 9) // 2, WARNA["aksen"])
    return img


def simpan(img: Image, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    besar = img.resize((BASE_W * SCALE, BASE_H * SCALE), Image.NEAREST)
    besar.save(path)
    return besar


RANKS = ["A"] + [str(n) for n in range(2, 11)] + ["J", "Q", "K"]
SUITS = ["spades", "hearts", "diamonds", "clubs"]


def main():
    buat_sheet = "--sheet" in sys.argv
    jumlah = 0
    for suit in SUITS:
        for rank in RANKS:
            simpan(gambar_kartu(rank, suit), f"{OUT_DIR}/{suit}/{rank}.png")
            jumlah += 1
    simpan(gambar_punggung(), f"{OUT_DIR}/back.png")
    print(f"   {jumlah} kartu + 1 punggung -> {OUT_DIR}/ ({BASE_W * SCALE}x{BASE_H * SCALE} px)")

    if buat_sheet:
        lebar, tinggi = BASE_W * SCALE, BASE_H * SCALE
        kolom, baris = 13, 5
        pad = 8
        sheet = Image.new("RGBA", (kolom * (lebar + pad) + pad, baris * (tinggi + pad) + pad), (24, 18, 34, 255))
        urut = []
        for rank in RANKS:
            for suit in SUITS:
                urut.append((rank, suit))
        for i, (rank, suit) in enumerate(urut):
            c, r = i % kolom, i // kolom
            img = gambar_kartu(rank, suit).resize((lebar, tinggi), Image.NEAREST)
            sheet.paste(img, (pad + c * (lebar + pad), pad + r * (tinggi + pad)), img)
        punggung = gambar_punggung().resize((lebar, tinggi), Image.NEAREST)
        sheet.paste(punggung, (pad, pad + 4 * (tinggi + pad)), punggung)
        sheet.save("pratinjau-kartu.png")
        print(f"   lembar pratinjau -> pratinjau-kartu.png ({sheet.width}x{sheet.height})")


if __name__ == "__main__":
    main()
