#!/usr/bin/env python3
"""Pembuat tujuh tema kartu bermain untuk Deckstorm.

Tema piksel digambar tanpa penghalusan (tepi tegas, satu piksel satu warna),
tema halus digambar pada kanvas 4x lebih besar lalu diperkecil sehingga tepinya
halus tanpa gerigi.

Seluruh kartu dibuat dari kode di berkas ini - tidak ada gambar yang diambil
dari sumber mana pun.

Ukuran berkas: 192x272 piksel (nisbah 0,706, mendekati 2:3 kartu remi).
"""

from PIL import Image, ImageDraw
import os

W, H = 192, 272

# ── bentuk pip ──────────────────────────────────────────────────────────────
# Setiap bentuk digambar di dalam kotak (x, y, w, h) supaya dapat dipakai
# pada tema apa pun tanpa penyesuaian.


def pip_hati(d, x, y, w, h, c):
    """Hati: dua bulatan di atas dan segitiga di bawah."""
    r = w / 2
    d.ellipse([x, y, x + r, y + r], fill=c)
    d.ellipse([x + r, y, x + w, y + r], fill=c)
    d.polygon([(x, y + r * 0.85), (x + w, y + r * 0.85), (x + w / 2, y + h)], fill=c)


def pip_wajik(d, x, y, w, h, c):
    """Wajik: belah ketupat."""
    d.polygon([(x + w / 2, y), (x + w, y + h / 2), (x + w / 2, y + h), (x, y + h / 2)], fill=c)


def pip_sekop(d, x, y, w, h, c):
    """Sekop: hati terbalik dengan tangkai."""
    r = w / 2
    d.polygon([(x, y + h * 0.42), (x + w, y + h * 0.42), (x + w / 2, y)], fill=c)
    d.ellipse([x, y + h * 0.18, x + r, y + h * 0.18 + r], fill=c)
    d.ellipse([x + r, y + h * 0.18, x + w, y + h * 0.18 + r], fill=c)
    tw = w * 0.16
    d.polygon([(x + w / 2 - tw, y + h * 0.55), (x + w / 2 + tw, y + h * 0.55),
               (x + w / 2 + tw * 2.2, y + h), (x + w / 2 - tw * 2.2, y + h)], fill=c)


def pip_keriting(d, x, y, w, h, c):
    """Keriting: tiga bulatan dan tangkai."""
    r = w * 0.34
    d.ellipse([x + w / 2 - r, y, x + w / 2 + r, y + r * 2], fill=c)
    d.ellipse([x, y + h * 0.34, x + r * 2, y + h * 0.34 + r * 2], fill=c)
    d.ellipse([x + w - r * 2, y + h * 0.34, x + w, y + h * 0.34 + r * 2], fill=c)
    tw = w * 0.13
    d.polygon([(x + w / 2 - tw, y + h * 0.62), (x + w / 2 + tw, y + h * 0.62),
               (x + w / 2 + tw * 2.4, y + h), (x + w / 2 - tw * 2.4, y + h)], fill=c)


PIP = {"hearts": pip_hati, "diamonds": pip_wajik, "spades": pip_sekop, "clubs": pip_keriting}

# ── susunan pip untuk tiap angka ──
# Koordinat dalam satuan 0..1 pada area tengah kartu.

SUSUNAN = {
    "A":  [(.5, .5, 2.2)],
    "2":  [(.5, .22, 1), (.5, .78, 1)],
    "3":  [(.5, .18, 1), (.5, .5, 1), (.5, .82, 1)],
    "4":  [(.3, .22, 1), (.7, .22, 1), (.3, .78, 1), (.7, .78, 1)],
    "5":  [(.3, .2, 1), (.7, .2, 1), (.5, .5, 1), (.3, .8, 1), (.7, .8, 1)],
    "6":  [(.3, .18, 1), (.7, .18, 1), (.3, .5, 1), (.7, .5, 1), (.3, .82, 1), (.7, .82, 1)],
    "7":  [(.3, .16, 1), (.7, .16, 1), (.5, .34, 1), (.3, .52, 1), (.7, .52, 1),
           (.3, .84, 1), (.7, .84, 1)],
    "8":  [(.3, .16, 1), (.7, .16, 1), (.5, .34, 1), (.3, .52, 1), (.7, .52, 1),
           (.5, .68, 1), (.3, .84, 1), (.7, .84, 1)],
    "9":  [(.3, .12, 1), (.7, .12, 1), (.3, .34, 1), (.7, .34, 1), (.5, .5, 1),
           (.3, .66, 1), (.7, .66, 1), (.3, .88, 1), (.7, .88, 1)],
    "10": [(.3, .12, 1), (.7, .12, 1), (.5, .27, 1), (.3, .4, 1), (.7, .4, 1),
           (.3, .6, 1), (.7, .6, 1), (.5, .73, 1), (.3, .88, 1), (.7, .88, 1)],
}

# ── tema ────────────────────────────────────────────────────────────────────
# bentuk : "piksel" (tepi tegas) atau "halus" (diperkecil dari 4x)
# motif  : "polos" | "royal" | "neon" | "kaca"

TEMA = {
    # ---- empat tema piksel ----
    "piksel": dict(
        bentuk="piksel", motif="polos",
        muka="#F6F1E4", muka2="#E7DFCC", tepi="#241B2E", garis="#8C7FA6",
        merah="#D9435C", hitam="#2B2438", teks="#241B2E", sudut=6,
    ),
    "piksel-neon": dict(
        bentuk="piksel", motif="neon",
        muka="#12102A", muka2="#1B1740", tepi="#00E5FF", garis="#5A4BFF",
        merah="#FF3D9A", hitam="#00E5FF", teks="#EAE6FF", sudut=4,
    ),
    "piksel-retro": dict(
        bentuk="piksel", motif="polos",
        muka="#2B1D12", muka2="#3A281A", tepi="#0F0A06", garis="#C9884A",
        merah="#FF9F45", hitam="#FFD9A0", teks="#FFD9A0", sudut=2,
    ),
    "piksel-mono": dict(
        bentuk="piksel", motif="polos",
        muka="#EDEDED", muka2="#D6D6D6", tepi="#111111", garis="#9A9A9A",
        merah="#111111", hitam="#111111", teks="#111111", sudut=1,
    ),
    # ---- empat tema halus, tanpa piksel ----
    "klasik": dict(
        bentuk="halus", motif="polos",
        muka="#FFFDF7", muka2="#F0E9DA", tepi="#B9A98C", garis="#D9CDB6",
        merah="#C0392B", hitam="#1F2933", teks="#1F2933", sudut=14,
    ),
    "royal": dict(
        bentuk="halus", motif="royal",
        muka="#2A1030", muka2="#1B0A20", tepi="#E8C46A", garis="#8A6B2A",
        merah="#FF7A9C", hitam="#F4E3B2", teks="#F4E3B2", sudut=16,
    ),
    "neon": dict(
        bentuk="halus", motif="neon",
        muka="#0B0A1F", muka2="#161434", tepi="#7A5CFF", garis="#3A2F80",
        merah="#FF4FD8", hitam="#4FE3FF", teks="#E8E6FF", sudut=18,
    ),
    "kaca": dict(
        bentuk="halus", motif="kaca",
        muka="#EAF6FF", muka2="#CFE7FA", tepi="#8FB9D9", garis="#BCDCEE",
        merah="#E8618C", hitam="#2F4A63", teks="#2F4A63", sudut=20,
    ),
}

URUTAN = ["piksel", "piksel-neon", "piksel-retro", "piksel-mono",
          "klasik", "royal", "neon", "kaca"]

RANK = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
SUIT = ["hearts", "diamonds", "spades", "clubs"]


def latar(d, tema, S, skala):
    """Muka kartu, tepi, dan hiasan motif. Digambar pada kanvas berskala."""
    w, h = W * S, H * S
    t = tema
    # latar dengan sedikit gradasi supaya tidak terlihat rata
    for i in range(h):
        f = i / h
        if t["motif"] == "neon":
            dasar = (8, 7, 24)
            c = tuple(int(dasar[j] + (18 if j == 2 else 6) * (1 - f)) for j in range(3))
        elif t["motif"] == "kaca":
            c = (int(234 - 12 * f), int(246 - 8 * f), int(255 - 2 * f))
        else:
            a = hexke(t["muka"]); b = hexke(t["muka2"])
            c = tuple(int(a[j] + (b[j] - a[j]) * f) for j in range(3))
        d.line([(0, i), (w, i)], fill=c + (255,))

    # bingkai dalam bergaris halus, tidak terlalu tebal
    tepi = hexke(t["tepi"]) + (255,)
    garis = hexke(t["garis"]) + (255,)
    r = t["sudut"] * skala
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, outline=tepi, width=max(1, int(1.6 * skala)))
    inset = int(6 * skala)
    d.rounded_rectangle([inset, inset, w - 1 - inset, h - 1 - inset],
                        radius=max(1, r - inset), outline=garis, width=max(1, int(1 * skala)))

    if t["motif"] == "royal":
        # sudut berhias dan garis emas tipis di tengah tepi
        for (cx, cy) in [(14, 14), (w - 14, 14), (14, h - 14), (w - 14, h - 14)]:
            d.ellipse([(cx - 5) * skala, (cy - 5) * skala, (cx + 5) * skala, (cy + 5) * skala],
                      outline=tepi, width=max(1, int(1.2 * skala)))
        d.line([(w / 2, inset + 4 * skala), (w / 2, h - inset - 4 * skala)],
               fill=garis, width=max(1, int(0.8 * skala)))
    elif t["motif"] == "neon":
        # pendar lembut di tengah
        d.rounded_rectangle([inset * 2, inset * 2, w - inset * 2, h - inset * 2],
                            radius=max(1, r - inset * 2), outline=garis, width=max(1, int(1 * skala)))
    elif t["motif"] == "kaca":
        # kilau diagonal
        d.polygon([(inset, h * 0.62), (w * 0.5, inset), (w * 0.66, inset), (inset, h * 0.78)],
                  fill=(255, 255, 255, 46))


def hexke(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def indeks(d, tema, teks, warna, skala, atas=True):
    """Angka dan lambang kecil di sudut kiri atas (dan salinannya dibalik)."""
    t = tema
    x, y = 12 * skala, 12 * skala
    W_, H_ = W * skala, H * skala
    # angka: kotak tebal supaya terbaca pada tema piksel
    if t["bentuk"] == "piksel":
        d.rectangle([x, y, x + 9 * skala, y + 5 * skala], fill=warna)
        d.rectangle([x, y, x + 9 * skala, y + 5 * skala], outline=warna)
        for i, lekuk in enumerate(TEKS.get(teks, TEKS["A"])):
            for j, bit in enumerate(lekuk):
                if bit == "1":
                    d.rectangle([x + (j + 1) * skala, y + (i + 1) * skala,
                                 x + (j + 2) * skala - 1, y + (i + 2) * skala - 1],
                                fill=t["muka"] if t["motif"] == "piksel-mono" else (255, 255, 255))
    else:
        d.text((x - 2 * skala, y - 3 * skala), teks, fill=warna, font=FONT.get(skala))
    # pip kecil di bawah angka
    PIP[SUIT[0]]  # no-op, hanya memastikan bentuk tersedia


# ── angka 3x5 untuk tema piksel (tanpa font) ──
TEKS = {
    "A": ["010", "101", "111", "101", "101"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    "10": ["101", "101", "101", "101", "101"],
    "J": ["111", "010", "010", "010", "111"],
    "Q": ["111", "101", "101", "101", "111"],
    "K": ["101", "101", "110", "101", "101"],
}

FONT = {}


def muat_font(skala):
    if skala in FONT:
        return FONT[skala]
    from PIL import ImageFont
    jalur = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
    ]
    for j in jalur:
        if os.path.exists(j):
            FONT[skala] = ImageFont.truetype(j, int(20 * skala))
            return FONT[skala]
    FONT[skala] = None
    return None


def kartu(tema, rank, suit):
    S = 1 if tema["bentuk"] == "piksel" else 4
    img = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    latar(d, tema, S, 1)

    merah = rank in ("A", "J", "Q", "K") or True
    warna = hexke(tema["merah"] if suit in ("hearts", "diamonds") else tema["hitam"]) + (255,)
    tinta = hexke(tema["teks"]) + (255,)

    # angka sudut: kiri atas, dan salinannya di kanan bawah (diputar 180 derajat)
    if tema["bentuk"] == "piksel":
        for (ox, oy, balik) in [(12, 14, False), (W - 22, H - 24, True)]:
            pola = TEKS[rank]
            for i, lekuk in enumerate(pola):
                for j, bit in enumerate(lekuk):
                    if bit == "1":
                        x = ox + j * 3
                        y = oy + (4 - i if balik else i) * 3
                        d.rectangle([x, y, x + 2, y + 2], fill=tinta)
            px = ox + 3
            py = oy + 20 if not balik else oy - 22
            PIP[suit](d, px, py, 12, 12, warna)
    else:
        f = muat_font(S)
        d.text((13 * S, 10 * S), rank, fill=tinta, font=f)
        PIP[suit](d, 16 * S, 34 * S, 15 * S, 15 * S, warna)
        # salinan terbalik
        kecil = Image.new("RGBA", (int(44 * S), int(64 * S)), (0, 0, 0, 0))
        dk = ImageDraw.Draw(kecil)
        dk.text((6 * S, 4 * S), rank, fill=tinta, font=f)
        PIP[suit](dk, 9 * S, 30 * S, 15 * S, 15 * S, warna)
        kecil = kecil.rotate(180, expand=False)
        img.alpha_composite(kecil, (int((W - 34) * S), int((H - 60) * S)))

    # tengah
    if rank in ("J", "Q", "K"):
        figur(d, tema, rank, suit, S, warna, tinta)
    else:
        for (fx, fy, sk) in SUSUNAN[rank]:
            cx, cy = fx * W * S, fy * H * S
            uk = 26 * S * sk / 1.0
            PIP[suit](d, cx - uk / 2, cy - uk / 2, uk, uk, warna)

    if S > 1:
        img = img.resize((W, H), Image.LANCZOS)
    return img


def figur(d, tema, rank, suit, S, warna, tinta):
    """Figur istana: siluet dengan mahkota dan hiasan, berbeda tiap rank."""
    cx, cy = W * S / 2, H * S / 2
    t = tema
    dasar = hexke(t["edisi"] if "edisi" in t else t["garis"]) + (255,)
    if tema["bentuk"] == "piksel":
        d.rectangle([cx - 34 * S, cy - 44 * S, cx + 34 * S, cy + 44 * S], outline=warna, width=2 * S)
    else:
        d.rounded_rectangle([cx - 36 * S, cy - 46 * S, cx + 36 * S, cy + 46 * S],
                            radius=6 * S, outline=dasar, width=max(1, int(1.4 * S)))

    # bahu
    d.polygon([(cx - 26 * S, cy + 40 * S), (cx - 16 * S, cy + 6 * S),
               (cx + 16 * S, cy + 6 * S), (cx + 26 * S, cy + 40 * S)], fill=warna)
    # kepala
    d.ellipse([cx - 12 * S, cy - 26 * S, cx + 12 * S, cy - 2 * S], fill=warna)

    if rank == "K":      # mahkota bergerigi
        d.polygon([(cx - 16 * S, cy - 26 * S), (cx - 16 * S, cy - 40 * S), (cx - 8 * S, cy - 31 * S),
                   (cx, cy - 43 * S), (cx + 8 * S, cy - 31 * S), (cx + 16 * S, cy - 40 * S),
                   (cx + 16 * S, cy - 26 * S)], fill=warna)
        d.line([(cx - 24 * S, cy + 24 * S), (cx + 24 * S, cy + 24 * S)], fill=dasar, width=max(1, 2 * S))
    elif rank == "Q":    # mahkota bulat dengan titik
        d.ellipse([cx - 15 * S, cy - 36 * S, cx + 15 * S, cy - 24 * S], fill=warna)
        d.ellipse([cx - 3 * S, cy - 41 * S, cx + 3 * S, cy - 35 * S], fill=dasar)
    else:                # J: topi berujung
        d.polygon([(cx - 14 * S, cy - 25 * S), (cx + 14 * S, cy - 25 * S), (cx, cy - 44 * S)], fill=warna)
        d.line([(cx - 20 * S, cy + 30 * S), (cx + 20 * S, cy + 30 * S)], fill=dasar, width=max(1, 2 * S))

    # lambang jenis di bawah figur
    PIP[suit](d, cx - 8 * S, cy + 44 * S - 16 * S, 16 * S, 16 * S, warna)


def punggung(tema):
    S = 1 if tema["bentuk"] == "piksel" else 4
    img = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    t = tema
    w, h = W * S, H * S
    dasar = hexke(t["muka2"]) + (255,)
    d.rectangle([0, 0, w, h], fill=dasar)
    garis = hexke(t["garis"]) + (255,)
    tepi = hexke(t["tepi"]) + (255,)
    r = t["sudut"] * S
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, outline=tepi, width=max(1, int(1.8 * S)))
    inset = int(7 * S)
    d.rounded_rectangle([inset, inset, w - 1 - inset, h - 1 - inset],
                        radius=max(1, r - inset), outline=garis, width=max(1, int(1.2 * S)))
    # anyaman belah ketupat
    langkah = int(14 * S)
    for y in range(-langkah, h + langkah, langkah):
        for x in range(-langkah, w + langkah, langkah):
            if inset * 2 < x < w - inset * 2 and inset * 2 < y < h - inset * 2:
                d.polygon([(x, y + langkah / 2), (x + langkah / 2, y),
                           (x + langkah, y + langkah / 2), (x + langkah / 2, y + langkah)],
                          outline=garis, width=max(1, int(0.9 * S)))
    # lambang tengah
    mx, my = w / 2, h / 2
    d.ellipse([mx - 26 * S, my - 26 * S, mx + 26 * S, my + 26 * S], outline=tepi, width=max(1, int(2 * S)))
    pip_hati(d, mx - 12 * S, my - 12 * S, 24 * S, 24 * S, tepi)
    if S > 1:
        img = img.resize((W, H), Image.LANCZOS)
    return img


def utama():
    akar = "assets/img/cards"
    total = 0
    for nama in URUTAN:
        tema = TEMA[nama]
        for suit in SUIT:
            os.makedirs(f"{akar}/{nama}/{suit}", exist_ok=True)
            for rank in RANK:
                kartu(tema, rank, suit).save(f"{akar}/{nama}/{suit}/{rank}.png")
                total += 1
        punggung(tema).save(f"{akar}/{nama}/back.png")
        total += 1
        print(f"   {nama:14s} {'piksel' if tema['bentuk'] == 'piksel' else 'halus ':6s} "
              f"52 kartu + punggung")
    print(f"   total {total} berkas di {akar}/")


if __name__ == "__main__":
    utama()
