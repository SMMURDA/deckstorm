#!/usr/bin/env python3
"""
Lambang kartu item Deckstorm: primitif geometris + pemetaan per kartu.

Semua lambang digambar dari kode di berkas ini (garis, lingkaran, poligon),
tidak memakai font, SVG, atau ikon dari luar. Dipakai oleh tools/generate-items.py.
"""

# ── primitif dasar pada kanvas kartu (48x68) ─────────────────────────────────

def _p(img, x, y, w):
    from tools_bridge import kartu, W, H
    if 0 <= x < W and 0 <= y < H:
        img.load()[x, y] = kartu._w(w)


def garis(img, x1, y1, x2, y2, w, tebal=1):
    """Garis lurus dengan ketebalan piksel."""
    langkah = int(max(abs(x2 - x1), abs(y2 - y1))) + 1
    for i in range(langkah + 1):
        t = i / langkah if langkah else 0
        x = round(x1 + (x2 - x1) * t)
        y = round(y1 + (y2 - y1) * t)
        for dx in range(tebal):
            for dy in range(tebal):
                _p(img, x + dx, y + dy, w)


def lingkaran(img, cx, cy, r, w, isi=True, tebal=1):
    for y in range(-r - tebal, r + tebal + 1):
        for x in range(-r - tebal, r + tebal + 1):
            d = (x * x + y * y) ** 0.5
            if (d <= r) if isi else (r - tebal < d <= r):
                _p(img, cx + x, cy + y, w)


def cincin(img, cx, cy, r, w, tebal=2):
    lingkaran(img, cx, cy, r, w, isi=False, tebal=tebal)


def kotak(img, x1, y1, x2, y2, w, isi=True):
    for y in range(y1, y2 + 1):
        for x in range(x1, x2 + 1):
            if isi or x in (x1, x2) or y in (y1, y2):
                _p(img, x, y, w)


def poligon(img, titik, w, isi=True):
    titik = [(float(a), float(b)) for a, b in titik]
    ys = [b for _, b in titik]
    for y in range(int(min(ys)), int(max(ys)) + 1):
        potong = []
        for i in range(len(titik)):
            x1, y1 = titik[i]
            x2, y2 = titik[(i + 1) % len(titik)]
            if (y1 <= y < y2) or (y2 <= y < y1):
                potong.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
        potong.sort()
        for i in range(0, len(potong) - 1, 2):
            for x in range(int(potong[i]), int(potong[i + 1]) + 1):
                if isi or x in (int(potong[i]), int(potong[i + 1])):
                    _p(img, x, y, w)


# ── primitif lambang ─────────────────────────────────────────────────────────

def bintang(img, cx, cy, w, aksen=None, r=11, sudut=5, dalam=0.42):
    import math
    titik = []
    for i in range(sudut * 2):
        a = -math.pi / 2 + i * math.pi / sudut
        rr = r if i % 2 == 0 else r * dalam
        titik.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    poligon(img, titik, w)


def bulan(img, cx, cy, w, aksen=None, r=13, latar=None):
    """Bulan sabit: lingkaran penuh lalu digigit lingkaran bergeser."""
    from tools_bridge import kartu
    latar = latar or kartu.WARNA["muka"]
    lingkaran(img, cx, cy, r, w)
    lingkaran(img, cx + int(r * 0.75), cy - int(r * 0.15), int(r * 0.92), latar)


def mata(img, cx, cy, w, aksen=None, latar=None):
    import math
    from tools_bridge import kartu
    latar = latar or kartu.WARNA["muka"]
    for x in range(-11, 12):
        t = x / 11.0
        h = int(6 * math.sqrt(max(0.0, 1 - t * t)))
        for y in range(-h, h + 1):
            _p(img, cx + x, cy + y, w)
    lingkaran(img, cx, cy, 4, latar)
    lingkaran(img, cx + 1, cy - 1, 2, w)


def piala(img, cx, cy, w):
    poligon(img, [(cx - 7, cy - 8), (cx + 7, cy - 8), (cx + 3, cy + 4), (cx - 3, cy + 4)], w, isi=False)
    garis(img, cx, cy + 4, cx, cy + 9, w, 2)
    garis(img, cx - 6, cy + 10, cx + 6, cy + 10, w, 2)


def pedang(img, cx, cy, w, aksen):
    garis(img, cx, cy - 11, cx, cy + 8, w, 2)
    poligon(img, [(cx, cy - 12), (cx - 2, cy - 8), (cx + 2, cy - 8)], aksen)
    garis(img, cx - 5, cy + 2, cx + 5, cy + 2, w, 2)
    garis(img, cx, cy + 8, cx, cy + 11, w)


def menara(img, cx, cy, w, aksen):
    kotak(img, cx - 6, cy - 4, cx + 6, cy + 11, w, isi=False)
    for i in (-6, -2, 2):
        kotak(img, cx + i, cy - 8, cx + i + 2, cy - 5, w)
    kotak(img, cx - 2, cy + 1, cx + 2, cy + 5, aksen)
    # kilat
    garis(img, cx + 5, cy - 14, cx + 1, cy - 10, aksen, 2)
    garis(img, cx + 1, cy - 10, cx + 5, cy - 9, aksen, 2)
    garis(img, cx + 5, cy - 9, cx, cy - 4, aksen, 2)


def roda(img, cx, cy, w, aksen=None, r=11):
    aksen = aksen or w
    cincin(img, cx, cy, r, w, 2)
    import math
    for i in range(8):
        a = i * math.pi / 4
        garis(img, cx, cy, cx + int(r * math.cos(a)), cy + int(r * math.sin(a)), aksen)
    lingkaran(img, cx, cy, 2, w)


def timbangan(img, cx, cy, w, aksen):
    garis(img, cx, cy - 12, cx, cy + 8, w, 2)
    garis(img, cx - 10, cy - 8, cx + 10, cy - 8, w, 2)
    for dx in (-10, 10):
        garis(img, cx + dx, cy - 8, cx + dx, cy - 2, aksen)
        poligon(img, [(cx + dx - 5, cy - 2), (cx + dx + 5, cy - 2), (cx + dx, cy + 4)], w, isi=False)
    garis(img, cx - 7, cy + 9, cx + 7, cy + 9, w, 2)


def kunci(img, cx, cy, w, aksen):
    cincin(img, cx, cy - 6, 5, w, 3)
    garis(img, cx, cy - 1, cx, cy + 12, w, 3)
    garis(img, cx, cy + 6, cx + 4, cy + 6, aksen, 2)
    garis(img, cx, cy + 10, cx + 3, cy + 10, aksen, 2)


def tengkorak(img, cx, cy, w, aksen=None, latar=None):
    from tools_bridge import kartu
    latar = latar or kartu.WARNA["muka"]
    kotak(img, cx - 7, cy - 8, cx + 7, cy + 4, w)
    kotak(img, cx - 4, cy + 5, cx + 4, cy + 9, w)
    lingkaran(img, cx - 3, cy - 3, 2, latar)
    lingkaran(img, cx + 3, cy - 3, 2, latar)
    garis(img, cx, cy + 1, cx, cy + 3, latar)
    for x in (-4, -1, 2):
        garis(img, cx + x, cy + 5, cx + x, cy + 9, latar)


def lentera(img, cx, cy, w, aksen):
    garis(img, cx - 3, cy - 11, cx - 3, cy - 8, w)
    garis(img, cx + 3, cy - 11, cx + 3, cy - 8, w)
    garis(img, cx - 3, cy - 11, cx + 3, cy - 11, w)
    kotak(img, cx - 6, cy - 8, cx + 6, cy + 7, w, isi=False)
    kotak(img, cx - 3, cy - 5, cx + 3, cy + 4, aksen)
    kotak(img, cx - 8, cy + 8, cx + 8, cy + 11, w)


def tak_hingga(img, cx, cy, w, aksen=None):
    lingkaran(img, cx - 5, cy, 4, w, isi=False, tebal=2)
    lingkaran(img, cx + 5, cy, 4, w, isi=False, tebal=2)


def simpul(img, cx, cy, w, aksen):
    """Lingkar tali (The Hanged Man)."""
    cincin(img, cx, cy - 3, 6, w, 3)
    garis(img, cx, cy - 9, cx, cy - 14, w, 3)
    garis(img, cx - 5, cy + 3, cx - 8, cy + 9, aksen, 2)
    garis(img, cx + 5, cy + 3, cx + 8, cy + 9, aksen, 2)


def bola_dunia(img, cx, cy, w, aksen=None, r=13):
    aksen = aksen or w
    lingkaran(img, cx, cy, r, w)
    cincin(img, cx, cy, r, kartu_warna_tepi(), 1)
    import math
    for f in (0.45, -0.45):
        for x in range(-r, r + 1):
            y = int(f * x)
            if x * x + y * y <= r * r:
                _p(img, cx + x, cy + y, aksen)
    garis(img, cx, cy - r, cx, cy + r, aksen)


def kartu_warna_tepi():
    from tools_bridge import kartu
    return kartu.WARNA["tepi"]


def buntelan(img, cx, cy, w, aksen):
    """Tongkat dengan buntelan kain (The Fool)."""
    garis(img, cx - 8, cy + 11, cx + 8, cy - 11, w, 2)
    lingkaran(img, cx + 8, cy - 11, 6, aksen)
    cincin(img, cx + 8, cy - 11, 6, w, 1)


def tongkat_sihir(img, cx, cy, w, aksen):
    garis(img, cx - 7, cy + 11, cx + 6, cy - 6, w, 2)
    bintang(img, cx + 8, cy - 9, aksen, r=6)


def mahkota(img, cx, cy, w, aksen):
    poligon(img, [(cx - 9, cy + 5), (cx - 9, cy - 5), (cx - 4, cy), (cx, cy - 7), (cx + 4, cy), (cx + 9, cy - 5), (cx + 9, cy + 5)], w)
    kotak(img, cx - 9, cy + 6, cx + 9, cy + 8, aksen)


def hati(img, cx, cy, w, aksen=None, s=7):
    import math
    for x in range(-s, s + 1):
        for y in range(-s, s + 1):
            t = x / s
            u = y / s
            if (t * t + u * u - 1) ** 3 - t * t * u * u * u <= 0:
                _p(img, cx + x, cy + y, w)


def lonceng(img, cx, cy, w, aksen):
    poligon(img, [(cx - 8, cy + 7), (cx + 8, cy + 7), (cx + 5, cy - 6), (cx - 5, cy - 6)], w)
    kotak(img, cx - 9, cy + 8, cx + 9, cy + 10, aksen)
    lingkaran(img, cx, cy + 13, 2, w)
    garis(img, cx, cy - 6, cx, cy - 10, w, 2)


def ceret(img, cx, cy, w, aksen):
    """Cangkir (Temperance)."""
    poligon(img, [(cx - 7, cy - 6), (cx + 7, cy - 6), (cx + 5, cy + 6), (cx - 5, cy + 6)], w, isi=False)
    cincin(img, cx + 8, cy - 2, 4, w, 2)
    garis(img, cx - 5, cy + 8, cx + 5, cy + 8, aksen, 2)


def roda_gigi(img, cx, cy, w, aksen=None, r=10):
    import math
    aksen = aksen or w
    for i in range(12):
        a = i * math.pi / 6
        garis(img, cx + int((r - 2) * math.cos(a)), cy + int((r - 2) * math.sin(a)),
              cx + int((r + 3) * math.cos(a)), cy + int((r + 3) * math.sin(a)), aksen, 2)
    cincin(img, cx, cy, r, w, 2)
    lingkaran(img, cx, cy, 3, w)


# ── primitif tambahan untuk Spectral ─────────────────────────────────────────

def sabit(img, cx, cy, w, aksen=None):
    """Sabit grim: bilah melengkung di ujung tongkat."""
    for t in range(0, 26):
        a = -0.9 + t * 0.11
        import math
        x = cx + int(9 * math.cos(a))
        y = cy - int(9 * math.sin(a)) - 2
        garis(img, x, y, x + 1, y + 3, w, 2)
    garis(img, cx + 8, cy + 4, cx - 6, cy + 12, aksen or w, 2)


def hantu(img, cx, cy, w, aksen=None):
    """Wujud hantu: kepala bulat dengan ekor bergelombang."""
    lingkaran(img, cx, cy - 3, 7, w)
    kotak(img, cx - 7, cy - 3, cx + 7, cy + 7, w)
    for i, x in enumerate(range(-7, 8, 4)):
        kotak(img, cx + x, cy + 8, cx + x + 2, cy + 11 - (i % 2) * 2, w)


def api(img, cx, cy, w, aksen=None):
    """Nyala api berlapis."""
    poligon(img, [(cx, cy - 13), (cx + 8, cy + 2), (cx + 5, cy + 10), (cx - 5, cy + 10), (cx - 8, cy + 2)], w)
    poligon(img, [(cx, cy - 4), (cx + 4, cy + 3), (cx, cy + 8), (cx - 4, cy + 3)], aksen or w)


def ankh(img, cx, cy, w, aksen=None):
    cincin(img, cx, cy - 6, 5, w, 3)
    garis(img, cx, cy - 1, cx, cy + 12, w, 3)
    garis(img, cx - 7, cy + 2, cx + 7, cy + 2, w, 3)


def pusaran(img, cx, cy, w, aksen=None):
    import math
    for t in range(0, 150):
        a = t * 0.22
        r = t * 0.1
        x = cx + int(r * math.cos(a))
        y = cy + int(r * math.sin(a))
        garis(img, x, y, x + 1, y + 1, w if t < 100 else (aksen or w), 1)


def lubang_hitam(img, cx, cy, w, aksen=None):
    """Cakram gelap dengan cincin materi berputar."""
    lingkaran(img, cx, cy, 9, w)
    lingkaran(img, cx, cy, 6, aksen or w, isi=False, tebal=2)
    import math
    for i in range(16):
        a = i * math.pi / 8
        garis(img, cx + int(10 * math.cos(a)), cy + int(10 * math.sin(a)) - 1,
              cx + int(14 * math.cos(a)), cy + int(14 * math.sin(a)) - 1, aksen or w, 2)


def aura(img, cx, cy, w, aksen=None):
    for r, t in ((12, 1), (9, 2), (6, 1), (3, 2)):
        cincin(img, cx, cy, r, aksen or w, t)
    lingkaran(img, cx, cy, 2, w)


def segitiga(img, cx, cy, w, aksen=None):
    """Planchette papan Ouija: segitiga dengan lubang di tengah."""
    poligon(img, [(cx, cy - 12), (cx + 11, cy + 10), (cx - 11, cy + 10)], w, isi=False)
    lingkaran(img, cx, cy + 1, 3, aksen or w, isi=False, tebal=2)


def gumpalan(img, cx, cy, w, aksen=None):
    """Ektoplasma: gumpalan tak beraturan."""
    import math
    titik = []
    for i in range(12):
        a = i * math.pi / 6
        r = 10 + (3 if i % 2 else -1) + (2 if i % 3 == 0 else 0)
        titik.append((cx + r * math.cos(a), cy + r * math.sin(a) * 0.9))
    poligon(img, titik, w)
    lingkaran(img, cx - 3, cy - 2, 2, aksen or w)


def rune(img, cx, cy, w, aksen=None):
    """Tanda sigil: tongkat tegak dengan dua goresan silang."""
    garis(img, cx, cy - 12, cx, cy + 12, w, 3)
    garis(img, cx - 8, cy - 5, cx + 8, cy - 11, aksen or w, 2)
    garis(img, cx - 8, cy + 7, cx + 8, cy + 1, aksen or w, 2)
    cincin(img, cx, cy - 12, 3, w, 2)
