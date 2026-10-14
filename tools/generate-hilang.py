#!/usr/bin/env python3
"""Membuat PNG yang hilang untuk 18 voucher dan 5 boss.

Latar: UI merujuk assets/img/items/<jenis>/<id>.png dan jatuh ke ikon SVG bila
berkasnya tidak ada. Karena 23 berkas belum pernah dibuat, tiap perujukan
mencatat net::ERR_FILE_NOT_FOUND di konsol peramban.

Bentuk glyph di sini SAMA dengan ikon SVG di js/pixelart.js, supaya tampilan
sebelum dan sesudah berkasnya ada tidak berubah banyak - hanya galatnya hilang.
Semua digambar tangan sebagai matriks piksel, tidak mengambil dari mana pun.
"""
import pathlib
from PIL import Image, ImageDraw

PAL = {"R": "#E23C50", "P": "#FC84FC", "G": "#FCE40C", "B": "#5EC8F8",
       "N": "#7CE6B2", "W": "#F7F1E3", "D": "#2B2B3A", "V": "#8E5CF8",
       "O": "#F29C50", "S": "#9C93B8", "K": "#171521", "b": "#A0663C",
       "C": "#7CE6E0"}
TEPI, MUKA, INK, AKSEN = "#0D0A15", "#221C2E", "#EFE9F7", "#E9A13B"
W, H = 192, 272

GLYPH = {
 "overstockplus": ["..DDDDDD...","..D....D...","..D....D...","..DDDDDD...","....G......","..GGGGG....","....G......"],
 "clearance":     ["..GGGGGGG..","..G.....G..","..G..R..G..","..G.RRR.G..","..G..R..G..","..G.....G..","..GGGGGGG.."],
 "glowup":        ["....G......","..G.G.G....",".G..G..G...","..G.G.G....","GGGGGGGGG..","..G.G.G....",".G..G..G..."],
 "rerollsurplus": ["..BBBBB....",".BB...BB...","BB.....BB..","...........","...B.......","...BB......","...B......."],
 "rerollglut":    ["..CCCCC....",".CC...CC...","CC.....CC..","...........","...C.......","...CC......","...C......."],
 "crystalball":   ["..WWWWW....",".WWWWWWW...","WW.BBB.WW..","WW.BBB.WW..",".WWWWWWW...","..WWWWW....","...SSS....."],
 "omenglobe":     ["..PPPP.....",".PPPPPP....","PPP..PPP...","PP....PP...","PPP..PPP...",".PPPPPP....","..PPPP....."],
 "nachotong":     ["...GGG.....","..GGGGG....",".GGGGGGG...","GGG.G.GGG..",".GGGGGGG...","..GGGGG....","...GGG....."],
 "tarotmerchant": ["..WWWWW....","..W...W....","..W.V.W....","..W...W....","..W.V.W....","..W...W....","..WWWWW...."],
 "tarottycoon":   ["WWWWW..WWWW","W...W..W..W","W.V.W..W.VW","W...W..W..W","W.V.W..W..W","W...W..W..W","WWWWW..WWWW"],
 "planetmerchant":["..BBBBB....",".BBBBBBB...","BB.OOO.BB..","BB.OOO.BB..",".BBBBBBB...","..BBBBB....","..........."],
 "planettycoon":  ["..OOOOO....",".OOOOOOO...","OO.VVV.OO..","OO.VVV.OO..",".OOOOOOO...","..OOOOO....","..........."],
 "seedmoney":     ["...GGG.....","..GGGGG....","..G.G.G....","..GGGGG....","...GGG.....","..GGGGG....","..........."],
 "moneytree":     ["....NN.....","..NNNNN....",".NNNNNNN...",".b.NNN.b...",".b.NNN.b...","...bbb.....","...bbb....."],
 "magictrick":    [".......G...","......G....",".....G.....","....G......","...G.......","..G........","..W........"],
 "directorscut":  ["..S.....S..","..SS...SS..","...SS.SS...","....SSS....","...SS.SS...","..SS...SS..","..S.....S.."],
 "paintbrush":    [".......b...","......bb...",".....bb....","....bb.....","...bb......","..bbW......",".bb........"],
 "palette":       ["..WWWWW....",".WWGGRWW...","WWGGRRWWW..","WW.RRR.WW..",".WW...WW...","..WWWWW....","..........."],
 "crimson":       ["..RR.RR....",".RRRRRRR...","RRRRRRRRR..",".RRRRRRR...","..RRRRR....","....R......","..........."],
 "cerulean":      ["...CCCC....","..CCCCCC...",".CC....CC..",".CC....CC..",".CC....CC..","..CCCCCC...","...CCCC...."],
 "verdant":       ["....NN.....","...NNNN....","..NNNNNN...",".NNNNNNNN..","..NNNNNN...","...NNNN....","....NN....."],
 "amber":         ["....bb.....","...bbbb....","..bbbbbb...",".bbbbbbbb..","..bbbbbb...","...bbbb....","....bb....."],
 "violet":        ["..VV...VV..","..VV...VV..","..VVVVVVV..","...VVVVV...","...VVVVV...","..VVVVVVV..",".VVVVVVVVV."],
}
VOUCHER = ["overstockplus","clearance","glowup","rerollsurplus","rerollglut","crystalball",
           "omenglobe","nachotong","tarotmerchant","tarottycoon","planetmerchant",
           "planettycoon","seedmoney","moneytree","magictrick","directorscut",
           "paintbrush","palette"]
BOSS = ["crimson","cerulean","verdant","amber","violet"]

def gambar(sel):
    """Menggambar satu petak item: bingkai gelap, garis aksen di atas, glyph."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=18, fill=MUKA, outline=TEPI, width=4)
    d.rounded_rectangle([10, 10, W - 11, 46], radius=10, fill=TEPI)
    d.rounded_rectangle([16, 16, W - 17, 40], radius=6, fill=AKSEN)
    baris = GLYPH[sel]
    sel_px = 14
    lebar, tinggi = len(baris[0]) * sel_px, len(baris) * sel_px
    x0, y0 = (W - lebar) // 2, (H - tinggi) // 2 + 12
    for y, b in enumerate(baris):
        for x, ch in enumerate(b):
            warna = PAL.get(ch)
            if not warna:
                continue
            d.rectangle([x0 + x * sel_px, y0 + y * sel_px,
                         x0 + (x + 1) * sel_px - 1, y0 + (y + 1) * sel_px - 1], fill=warna)
    d.rounded_rectangle([16, H - 46, W - 17, H - 16], radius=8, outline=Aksen(), width=3)
    return im

def Aksen():
    return AKSEN

akar = pathlib.Path(__file__).resolve().parent.parent
jumlah = 0
for jenis, daftar in (("voucher", VOUCHER), ("boss", BOSS)):
    map_ = akar / "assets" / "img" / "items" / jenis
    map_.mkdir(parents=True, exist_ok=True)
    for sel in daftar:
        gambar(sel).save(map_ / f"{sel}.png")
        jumlah += 1
print(f"   {jumlah} PNG dibuat")
