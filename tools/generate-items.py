#!/usr/bin/env python3
"""
Generator kartu item Deckstorm: Planet, Tarot, Spectral, Joker, Voucher, Pack, Boss.

Kerangkanya memakai ulang generator kartu remi (tools/generate-cards.py) supaya
seluruh aset punya bahasa visual yang sama. Semua lambang digambar parametrik dari
kode di berkas ini - tidak ada gambar, font, atau ikon dari luar.

Pakai:
    /tmp/artvenv/bin/python tools/generate-items.py planet
    /tmp/artvenv/bin/python tools/generate-items.py planet --sheet
"""

import importlib.util
import os
import pathlib
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import emblems as E
import wajah as WAJAH
from PIL import Image

# ── memuat kerangka kartu ─────────────────────────────────────────────────────
_spec = importlib.util.spec_from_file_location(
    "kartu", os.path.join(os.path.dirname(os.path.abspath(__file__)), "generate-cards.py"))
kartu = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(kartu)

W, H = kartu.BASE_W, kartu.BASE_H
OUT_DIR = "assets/img/items"

# ── font A-Z 3x5 untuk label kartu ────────────────────────────────────────────
FONT_ABC = {
    "A": [".#.", "#.#", "###", "#.#", "#.#"],
    "B": ["##.", "#.#", "##.", "#.#", "##."],
    "C": [".##", "#..", "#..", "#..", ".##"],
    "D": ["##.", "#.#", "#.#", "#.#", "##."],
    "E": ["###", "#..", "##.", "#..", "###"],
    "F": ["###", "#..", "##.", "#..", "#.."],
    "G": [".##", "#..", "#.#", "#.#", ".##"],
    "H": ["#.#", "#.#", "###", "#.#", "#.#"],
    "I": ["###", ".#.", ".#.", ".#.", "###"],
    "J": ["###", "..#", "..#", "#.#", ".#."],
    "K": ["#.#", "#.#", "##.", "#.#", "#.#"],
    "L": ["#..", "#..", "#..", "#..", "###"],
    "M": ["#.#", "###", "###", "#.#", "#.#"],
    "N": ["#.#", "###", "###", "###", "#.#"],
    "O": [".#.", "#.#", "#.#", "#.#", ".#."],
    "P": ["##.", "#.#", "##.", "#..", "#.."],
    "Q": [".#.", "#.#", "#.#", "###", "..#"],
    "R": ["##.", "#.#", "##.", "#.#", "#.#"],
    "S": [".##", "#..", ".#.", "..#", "##."],
    "T": ["###", ".#.", ".#.", ".#.", ".#."],
    "U": ["#.#", "#.#", "#.#", "#.#", "###"],
    "V": ["#.#", "#.#", "#.#", "#.#", ".#."],
    "W": ["#.#", "#.#", "###", "###", "#.#"],
    "X": ["#.#", "#.#", ".#.", "#.#", "#.#"],
    "Y": ["#.#", "#.#", ".#.", ".#.", ".#."],
    "Z": ["###", "..#", ".#.", "#..", "###"],
    " ": ["...", "...", "...", "...", "..."],
    "-": ["...", "...", "###", "...", "..."],
    ".": ["...", "...", "...", "...", ".#."],
    "'": [".#.", ".#.", "...", "...", "..."],
}
FONT_ABC.update({k: v for k, v in kartu.FONT.items()})


def lebar_teks(teks):
    return sum(len(FONT_ABC.get(c, FONT_ABC[" "])[0]) + 1 for c in teks) - 1


def tulis(img, teks, x, y, warna, pusat_pada=None):
    """Tulis teks dengan font 3x5. pusat_pada = koordinat x tengah kartu."""
    if pusat_pada is not None:
        x = pusat_pada - lebar_teks(teks) // 2
    for ch in teks:
        pola = FONT_ABC.get(ch, FONT_ABC[" "])
        kartu.tempel(img, pola, x, y, warna)
        x += len(pola[0]) + 1


# ── lambang planet: bola parametrik dengan variasi khas tiap planet ──────────
PLANET = [
    # nama, warna bola, warna aksen, bentuk
    ("PLUTO",     "#9A8878", "#C9B7A4", "bopeng"),
    ("MERCURY",   "#9AA0A8", "#C6CBD1", "bopeng"),
    ("URANUS",    "#7FD8DE", "#B9F0F2", "cincin"),
    ("VENUS",     "#E8C05A", "#F6E29B", "awan"),
    ("SATURN",    "#E0B76A", "#F3DCA8", "cincin"),
    ("JUPITER",   "#D08A5A", "#F0BE95", "pita"),
    ("EARTH",     "#4E86C8", "#7FB2E8", "benua"),
    ("MARS",      "#C85540", "#E88C74", "bopeng"),
    ("NEPTUNE",   "#4A6BC8", "#88A6EC", "pita"),
    ("PLANET X",  "#8A5AC8", "#BFA0EC", "pita"),
    ("CERES",     "#A8A096", "#CFC8BE", "bopeng"),
    ("ERIS",      "#DCE4EC", "#FFFFFF", "bopeng"),
]


def bola(img, x0, y0, r, warna, aksen, bentuk):
    """Gambar bola planet radius r di tengah (x0+r, y0+r)."""
    px = img.load()
    cx, cy = x0 + r, y0 + r

    def P(x, y, c):
        if 0 <= x < W and 0 <= y < H:
            px[x, y] = kartu._w(c)

    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            d = (x * x + y * y) ** 0.5
            if d <= r:
                # bayangan di kanan bawah, sorotan di kiri atas
                if d > r - 1.4:
                    c = kartu.WARNA["tepi"]
                elif x - y > r * 0.45:
                    c = kartu.WARNA["tepi2"]
                elif x + y < -r * 0.5:
                    c = aksen
                else:
                    c = warna
                P(cx + x, cy + y, c)

    def titik(titik_list, c):
        for dx, dy in titik_list:
            P(cx + dx, cy + dy, c)

    # lubang kawah: beberapa lingkaran kecil
    kawah = [(-5, -2, 2), (3, 4, 3), (5, -4, 2), (-3, 5, 2), (0, 1, 2)]
    if bentuk == "bopeng":
        for dx, dy, rr in kawah:
            for y in range(-rr, rr + 1):
                for x in range(-rr, rr + 1):
                    if x * x + y * y <= rr * rr:
                        P(cx + dx + x, cy + dy + y, kartu.WARNA["tepi2"])
    elif bentuk == "pita":
        for dy in (-5, -1, 3, 6):
            for x in range(-r, r + 1):
                if (x * x + dy * dy) ** 0.5 <= r - 1:
                    P(cx + x, cy + dy, aksen)
    elif bentuk == "awan":
        for dx, dy, rr in [(-4, -4, 3), (3, -2, 4), (-2, 4, 4), (5, 3, 2)]:
            for y in range(-rr, rr + 1):
                for x in range(-rr, rr + 1):
                    if x * x + y * y <= rr * rr:
                        P(cx + dx + x, cy + dy + y, aksen)
    elif bentuk == "benua":
        for dx, dy, rr in [(-3, -3, 3), (4, 1, 3), (-2, 4, 2), (2, -5, 2)]:
            for y in range(-rr, rr + 1):
                for x in range(-rr, rr + 1):
                    if x * x + y * y <= rr * rr:
                        P(cx + dx + x, cy + dy + y, "#5FA85A")
    if bentuk == "cincin":
        for x in range(-r - 5, r + 6):
            for y in (-2, 2):
                d = (x * x + y * y) ** 0.5
                if r - 3 < d < r + 5 and abs(y) <= 2:
                    P(cx + x, cy + y * 2, aksen)
                    P(cx + x, cy + y * 2 + 1, kartu.WARNA["tepi2"])


def kartu_planet(nama, warna, aksen, bentuk):
    img = kartu.kanvas()
    tinta = kartu.WARNA["hitam"]
    # bingkai dalam
    px = img.load()
    for x in range(5, W - 5):
        for y in (5, H - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    for y in range(5, H - 5):
        for x in (5, W - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    bola(img, (W - 26) // 2, 11, 13, warna, aksen, bentuk)
    tulis(img, nama, 0, 45, tinta, pusat_pada=W // 2)
    tulis(img, "PLANET", 0, 53, kartu.WARNA["figur2"], pusat_pada=W // 2)
    return img


# ── Tarot: nama, warna lambang, warna aksen, fungsi lambang ──────────────────
EMAS = "#D9A431"
UNGU = "#8A5AC8"
MERAH = "#C2304A"
BIRU = "#3E6FBF"
HIJAU = "#4E9A5C"

def _sun(img, cx, cy, w, aksen):
    import math
    E.lingkaran(img, cx, cy, 7, aksen)
    E.cincin(img, cx, cy, 7, w, 2)
    for i in range(12):
        a = i * math.pi / 6
        E.garis(img, cx + int(10 * math.cos(a)), cy + int(10 * math.sin(a)),
                cx + int(14 * math.cos(a)), cy + int(14 * math.sin(a)), aksen, 2)

def _lovers(img, cx, cy, w, aksen):
    E.hati(img, cx - 4, cy - 2, aksen, s=6)
    E.hati(img, cx + 5, cy + 1, aksen, s=6)
    E.garis(img, cx - 10, cy + 9, cx + 10, cy - 10, w, 2)

TAROT = [
    ("THE FOOL",        E.buntelan,     UNGU),
    ("THE MAGICIAN",    E.tongkat_sihir, MERAH),
    ("HIGH PRIESTESS",  E.bulan,        BIRU),
    ("THE EMPRESS",     E.hati,         MERAH),
    ("THE EMPEROR",     E.mahkota,      EMAS),
    ("THE HIEROPHANT",  E.kunci,        EMAS),
    ("THE LOVERS",      _lovers,        MERAH),
    ("THE CHARIOT",     E.roda,         BIRU),
    ("STRENGTH",        E.tak_hingga,   EMAS),
    ("THE HERMIT",      E.lentera,      EMAS),
    ("WHEEL OF FORTUNE", E.roda_gigi,   UNGU),
    ("JUSTICE",         E.timbangan,    BIRU),
    ("THE HANGED MAN",  E.simpul,       UNGU),
    ("DEATH",           E.tengkorak,    HIJAU),
    ("TEMPERANCE",      E.ceret,        BIRU),
    ("THE DEVIL",       E.bintang,      MERAH),
    ("THE TOWER",       E.menara,       UNGU),
    ("THE STAR",        E.bintang,      EMAS),
    ("THE MOON",        E.bulan,        BIRU),
    ("THE SUN",         _sun,           EMAS),
    ("JUDGEMENT",       E.lonceng,      EMAS),
    ("THE WORLD",       E.bola_dunia,   HIJAU),
]


SPECTRAL = [
    ("FAMILIAR",     E.tengkorak,     "#5FB0C8"),
    ("GRIM",         E.sabit,         "#8FA8B8"),
    ("INCANTATION",  E.tongkat_sihir, "#C08A5A"),
    ("TALISMAN",     E.bintang,       "#D9A431"),
    ("AURA",         E.aura,          "#7FD8DE"),
    ("WRAITH",       E.hantu,         "#B8C4D8"),
    ("SIGIL",        E.rune,          "#C2304A"),
    ("OUIJA",        E.segitiga,      "#8A5AC8"),
    ("ECTOPLASM",    E.gumpalan,      "#7FE0B0"),
    ("IMMOLATE",     E.api,           "#E07A2A"),
    ("ANKH",         E.ankh,          "#D9A431"),
    ("DEJA VU",      E.tak_hingga,    "#5FB0C8"),
    ("HEX",          E.bintang,       "#8A5AC8"),
    ("TRANCE",       E.pusaran,       "#7FD8DE"),
    ("MEDIUM",       E.mata,          "#B8A0E0"),
    ("CRYPTID",      E.hantu,         "#4E9A5C"),
    ("THE SOUL",     E.bola_dunia,    "#7FD8DE"),
    ("BLACK HOLE",   E.lubang_hitam,  "#8A5AC8"),
]


# ── Joker: sigil prosedural dari hash nama, warna sesuai kelangkaan ──────────
WARNA_KELANGKAAN = {
    "common": "#3E7BC4",
    "uncommon": "#3E9A5C",
    "rare": "#C43A48",
    "legendary": "#D9A431",
}


def sigil_joker(img, nama, warna):
    """Lambang simetris yang diturunkan dari nama, jadi tiap Joker berbeda."""
    import zlib
    h = zlib.crc32(nama.encode("utf-8"))
    cx, cy = W // 2, 26
    tinta = kartu.WARNA["hitam"]

    # pelat bundar
    E.lingkaran(img, cx, cy, 16, kartu.WARNA["muka2"])
    E.cincin(img, cx, cy, 16, tinta, 2)
    E.cincin(img, cx, cy, 14, warna, 1)

    bentuk = (h >> 3) % 8
    if bentuk == 0:
        E.lingkaran(img, cx, cy, 8, warna)
        E.lingkaran(img, cx, cy, 4, kartu.WARNA["muka2"])
    elif bentuk == 1:
        E.poligon(img, [(cx, cy - 9), (cx + 9, cy + 7), (cx - 9, cy + 7)], warna, isi=False)
        E.poligon(img, [(cx, cy - 4), (cx + 4, cy + 4), (cx - 4, cy + 4)], tinta)
    elif bentuk == 2:
        E.bintang(img, cx, cy, warna, r=10, sudut=5)
    elif bentuk == 3:
        E.bintang(img, cx, cy, warna, r=10, sudut=6, dalam=0.55)
    elif bentuk == 4:
        E.poligon(img, [(cx - 8, cy - 8), (cx + 8, cy - 8), (cx - 8, cy + 8), (cx + 8, cy + 8)], warna)
        E.kotak(img, cx - 3, cy - 3, cx + 3, cy + 3, kartu.WARNA["muka2"])
    elif bentuk == 5:
        E.garis(img, cx - 9, cy - 9, cx + 9, cy + 9, warna, 3)
        E.garis(img, cx + 9, cy - 9, cx - 9, cy + 9, warna, 3)
        E.cincin(img, cx, cy, 6, tinta, 2)
    elif bentuk == 6:
        E.cincin(img, cx, cy, 9, warna, 3)
        E.garis(img, cx - 9, cy, cx + 9, cy, tinta, 2)
    else:
        E.poligon(img, [(cx, cy - 10), (cx + 10, cy), (cx, cy + 10), (cx - 10, cy)], warna, isi=False)
        E.lingkaran(img, cx, cy, 3, tinta)

    # ornamen simetris supaya terlihat sengaja digambar
    jumlah = 2 + (h >> 7) % 3
    for i in range(jumlah):
        a = (i + 1) * (6.283 / (jumlah + 1)) + (h % 7) * 0.1
        import math
        dx = int(12 * math.cos(a))
        dy = int(12 * math.sin(a))
        E.lingkaran(img, cx + dx, cy + dy, 2, tinta)
        E.lingkaran(img, cx - dx, cy - dy, 2, tinta)


GAYA_WARNA = {
    "voucher": "#3E9A5C", "pack": "#C4703E", "boss": "#8A2F3A",
    "seal": "#C43A48", "edition": "#8A5AC8", "enhance": "#3E7BC4",
    "deck": "#4E9A5C", "stake": "#D9A431", "tag": "#3E7BC4", "challenge": "#C2304A",
}


def lambang_gaya(img, nama, gaya, warna):
    """Lambang ringkas per kategori, tetap simetris dan khas."""
    import zlib
    h = zlib.crc32(nama.encode("utf-8"))
    cx, cy = W // 2, 26
    tinta = kartu.WARNA["hitam"]
    if gaya == "voucher":
        # kupon bergerigi
        E.kotak(img, cx - 15, cy - 11, cx + 15, cy + 11, warna, isi=False)
        for x in range(cx - 15, cx + 16, 4):
            E.kotak(img, x, cy - 11, x + 1, cy - 9, kartu.WARNA["muka"])
            E.kotak(img, x, cy + 9, x + 1, cy + 11, kartu.WARNA["muka"])
        E.bintang(img, cx, cy, warna, r=7)
    elif gaya == "pack":
        # bungkus kartu berpita
        E.kotak(img, cx - 12, cy - 13, cx + 12, cy + 13, warna, isi=False)
        E.kotak(img, cx - 3, cy - 13, cx + 3, cy + 13, kartu.WARNA["muka2"])
        E.kotak(img, cx - 12, cy - 3, cx + 12, cy + 3, kartu.WARNA["muka2"])
        E.cincin(img, cx, cy, 5, warna, 2)
    elif gaya == "boss":
        # topeng bertanduk
        E.lingkaran(img, cx, cy + 1, 12, warna)
        E.poligon(img, [(cx - 12, cy - 8), (cx - 16, cy - 16), (cx - 6, cy - 12)], tinta)
        E.poligon(img, [(cx + 12, cy - 8), (cx + 16, cy - 16), (cx + 6, cy - 12)], tinta)
        E.lingkaran(img, cx - 4, cy - 1, 2, kartu.WARNA["muka"])
        E.lingkaran(img, cx + 4, cy - 1, 2, kartu.WARNA["muka"])
        E.kotak(img, cx - 6, cy + 6, cx + 6, cy + 8, tinta)
    elif gaya == "seal":
        E.cincin(img, cx, cy, 11, warna, 3)
        E.lingkaran(img, cx, cy, 8, kartu.WARNA["muka2"])
        tulis(img, nama[:1].upper(), 0, cy - 3, warna, pusat_pada=cx)
    elif gaya == "edition":
        for i in range(9):
            E.garis(img, cx - 14, cy - 12 + i * 3, cx + 14, cy - 16 + i * 3, warna, 2)
    elif gaya == "enhance":
        E.poligon(img, [(cx, cy - 13), (cx + 12, cy), (cx, cy + 13), (cx - 12, cy)], warna, isi=False)
        E.lingkaran(img, cx, cy, 3 + (h % 3), kartu.WARNA["muka2"])
        E.cincin(img, cx, cy, 7, tinta, 1)
    else:
        E.bintang(img, cx, cy, warna, r=11, sudut=5 + (h % 2))
    return


def kartu_gaya(nama, gaya, subjudul=None):
    img = kartu.kanvas()
    tinta = kartu.WARNA["hitam"]
    warna = GAYA_WARNA.get(gaya, "#3E7BC4")
    px = img.load()
    for x in range(5, W - 5):
        for y in (5, H - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    for y in range(5, H - 5):
        for x in (5, W - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    E.kotak(img, 6, 43, W - 7, 46, warna)
    tulis(img, (subjudul or gaya).upper()[:12], 0, 44, kartu.WARNA["muka"], pusat_pada=W // 2)
    lambang_gaya(img, nama, gaya, warna)
    kata = nama.upper().split()
    baris, kini = [], ""
    for k in kata:
        if lebar_teks((kini + " " + k).strip()) <= W - 12:
            kini = (kini + " " + k).strip()
        else:
            if kini: baris.append(kini)
            kini = k
    if kini: baris.append(kini)
    y = 52 if len(baris[:2]) > 1 else 55
    for b in baris[:2]:
        tulis(img, b[:12], 0, y, tinta, pusat_pada=W // 2)
        y += 7
    return img


def kartu_joker(nama, kelangkaan):
    img = kartu.kanvas()
    tinta = kartu.WARNA["hitam"]
    warna = WARNA_KELANGKAAN.get(kelangkaan, "#3E7BC4")
    px = img.load()
    for x in range(5, W - 5):
        for y in (5, H - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    for y in range(5, H - 5):
        for x in (5, W - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    WAJAH.wajah_joker(img, nama)

    # pita kelangkaan
    E.kotak(img, 6, 45, W - 7, 48, warna)
    tulis(img, kelangkaan.upper()[:12], 0, 46, kartu.WARNA["muka"], pusat_pada=W // 2)

    # nama, dibungkus maksimal dua baris
    kata = nama.upper().split()
    baris, kini = [], ""
    for k in kata:
        if lebar_teks((kini + " " + k).strip()) <= W - 12:
            kini = (kini + " " + k).strip()
        else:
            if kini: baris.append(kini)
            kini = k
    if kini: baris.append(kini)
    baris = baris[:2]
    y = 54 if len(baris) > 1 else 57
    for b in baris:
        tulis(img, b[:12], 0, y, tinta, pusat_pada=W // 2)
        y += 7
    return img


def kartu_tarot(nama, fungsi, warna):
    img = kartu.kanvas()
    tinta = kartu.WARNA["hitam"]
    px = img.load()
    for x in range(5, W - 5):
        for y in (5, H - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    for y in range(5, H - 5):
        for x in (5, W - 6):
            px[x, y] = kartu._w(kartu.WARNA["tepi2"])
    fungsi(img, W // 2, 26, tinta, warna)
    kata = nama.split()
    if len(kata) > 2:
        tulis(img, kata[0], 0, 43, tinta, pusat_pada=W // 2)
        tulis(img, " ".join(kata[1:]), 0, 51, tinta, pusat_pada=W // 2)
    else:
        tulis(img, nama, 0, 47, tinta, pusat_pada=W // 2)
    return img


def sheet_kontak(dibuat, nama_berkas, kolom=6, skala=2):
    lebar, tinggi = W * skala, H * skala
    pad = 10
    baris = (len(dibuat) + kolom - 1) // kolom
    sheet = Image.new("RGBA", (kolom * (lebar + pad) + pad, baris * (tinggi + pad) + pad), (16, 12, 24, 255))
    for i, (_, img) in enumerate(dibuat):
        c, r = i % kolom, i // kolom
        kecil = img.resize((lebar, tinggi), Image.NEAREST)
        sheet.paste(kecil, (pad + c * (lebar + pad), pad + r * (tinggi + pad)), kecil)
    sheet.save(nama_berkas)
    print(f"   lembar pratinjau -> {nama_berkas} ({sheet.width}x{sheet.height})")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "planet"
    buat_sheet = "--sheet" in sys.argv
    if mode == "tarot":
        dibuat = []
        for nama, fungsi, warna in TAROT:
            berkas = nama.lower().replace(" ", "-")
            img = kartu_tarot(nama, fungsi, warna)
            kartu.simpan(img, f"{OUT_DIR}/tarot/{berkas}.png")
            dibuat.append((nama, img))
        print(f"   {len(dibuat)} kartu tarot -> {OUT_DIR}/tarot/")
        if buat_sheet:
            sheet_kontak(dibuat, "pratinjau-tarot.png", 5)
        return
    if mode == "spectral":
        dibuat = []
        for nama, fungsi, warna in SPECTRAL:
            berkas = nama.lower().replace(" ", "-")
            img = kartu_tarot(nama, fungsi, warna)
            kartu.simpan(img, f"{OUT_DIR}/spectral/{berkas}.png")
            dibuat.append((nama, img))
        print(f"   {len(dibuat)} kartu spectral -> {OUT_DIR}/spectral/")
        if buat_sheet:
            sheet_kontak(dibuat, "pratinjau-spectral.png", 6)
        return
    if mode == "joker":
        import json
        import zlib
        data = json.loads(pathlib.Path("/tmp/jokers150.json").read_text())
        if isinstance(data, dict): data = list(data.values())
        dibuat = []
        for item in data:
            nama = item.get("name") or item.get("nama")
            rar = (item.get("rarity") or item.get("kelangkaan") or "common").lower()
            if rar not in WARNA_KELANGKAAN:
                rar = {"1": "common", "2": "uncommon", "3": "rare", "4": "legendary"}.get(str(rar), "common")
            berkas = "".join(c if c.isalnum() else "-" for c in nama.lower()).strip("-")
            img = kartu_joker(nama, rar)
            kartu.simpan(img, f"{OUT_DIR}/joker/{berkas}.png")
            dibuat.append((nama, img))
        print(f"   {len(dibuat)} kartu joker -> {OUT_DIR}/joker/")
        if buat_sheet:
            sheet_kontak(dibuat[:30], "pratinjau-joker.png", 6)
        return
    if mode == "sisa":
        import json
        data = json.loads(pathlib.Path("/tmp/balatro-items.json").read_text())
        peta = [("voucher", "vouchers", "VOUCHER"), ("pack", "packs", "PACK"),
                ("boss", "bosses", "BOSS"), ("seal", "seals", "SEAL"),
                ("edition", "editions", "EDITION"), ("enhance", "enhancements", "ENHANCE"),
                ("tag", "tags", "TAG"), ("deck", "decks", "DECK"),
                ("stake", "stakes", "STAKE")]
        jumlah = 0
        for gaya, kunci, label in peta:
            daftar = data.get(kunci) or []
            if isinstance(daftar, dict): daftar = list(daftar.keys())
            for nama in daftar:
                berkas = "".join(c if c.isalnum() else "-" for c in str(nama).lower()).strip("-")
                img = kartu_gaya(str(nama), gaya, label)
                kartu.simpan(img, f"{OUT_DIR}/{gaya}/{berkas}.png")
                jumlah += 1
            print(f"   {len(daftar):3d} kartu {gaya:9s} -> {OUT_DIR}/{gaya}/")
        print(f"   total {jumlah} kartu")
        return
    if mode != "planet":
        print(f"   mode '{mode}' belum dibuat")
        return
    dibuat = []
    for nama, warna, aksen, bentuk in PLANET:
        berkas = nama.lower().replace(" ", "-")
        img = kartu_planet(nama, warna, aksen, bentuk)
        kartu.simpan(img, f"{OUT_DIR}/planet/{berkas}.png")
        dibuat.append((nama, img))
    print(f"   {len(dibuat)} kartu planet -> {OUT_DIR}/planet/ ({W * kartu.SCALE}x{H * kartu.SCALE} px)")

    if buat_sheet:
        skala = 2
        lebar, tinggi = W * skala, H * skala
        pad = 10
        kolom = 6
        baris = (len(dibuat) + kolom - 1) // kolom
        sheet = Image.new("RGBA", (kolom * (lebar + pad) + pad, baris * (tinggi + pad) + pad), (16, 12, 24, 255))
        for i, (_, img) in enumerate(dibuat):
            c, r = i % kolom, i // kolom
            kecil = img.resize((lebar, tinggi), Image.NEAREST)
            sheet.paste(kecil, (pad + c * (lebar + pad), pad + r * (tinggi + pad)), kecil)
        sheet.save("pratinjau-planet.png")
        print(f"   lembar pratinjau -> pratinjau-planet.png ({sheet.width}x{sheet.height})")


if __name__ == "__main__":
    main()
