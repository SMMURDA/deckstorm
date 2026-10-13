#!/usr/bin/env python3
"""
Mengubah data 150 Joker (hasil riset terverifikasi wiki) menjadi berkas data repo.

Sumber: /tmp/jokers150.json — 150 entri dengan kunci name, rarity, cost, desc.
Keluaran: js/data/jokers.js — dipakai mesin permainan Deckstorm.

Pakai:
    /tmp/artvenv/bin/python tools/import-jokers.py
"""

import json
import pathlib
import re
from collections import Counter

SUMBER = pathlib.Path("/tmp/jokers150.json")
TUJUAN = pathlib.Path("js/data/jokers.js")
KELANGKAAN = ("Common", "Uncommon", "Rare", "Legendary")


def rapikan(teks):
    return re.sub(r"\s+", " ", str(teks or "").replace('"', "'")).strip()


def angka(nilai):
    if isinstance(nilai, int):
        return nilai
    s = str(nilai or "")
    return int(s) if s.isdigit() else 0


def main():
    data = json.loads(SUMBER.read_text())
    if isinstance(data, dict):
        data = list(data.values())

    baris = []
    for item in data:
        nama = rapikan(item.get("name"))
        kelangkaan = str(item.get("rarity") or "Common").strip().capitalize()
        if kelangkaan not in KELANGKAAN:
            kelangkaan = "Common"
        berkas = re.sub(r"[^a-z0-9]+", "-", nama.lower()).strip("-")
        baris.append(
            "  { id: %s, nama: %s, kelangkaan: %s, harga: %d, gambar: %s, keterangan: %s },"
            % (json.dumps(berkas), json.dumps(nama), json.dumps(kelangkaan),
               angka(item.get("cost")),
               json.dumps("assets/img/items/joker/%s.png" % berkas),
               json.dumps(rapikan(item.get("desc")))))

    isi = """// Data 150 Joker Balatro untuk Deckstorm.
// Berkas ini dihasilkan oleh tools/import-jokers.py dari data terverifikasi wiki.
// Jangan disunting tangan: ubah sumbernya lalu jalankan ulang generatornya.

const JOKER_DATA = [
%s
];

if (typeof module !== "undefined") module.exports = { JOKER_DATA };
""" % "\n".join(baris)

    TUJUAN.parent.mkdir(parents=True, exist_ok=True)
    TUJUAN.write_text(isi)

    sebaran = Counter(json.loads(b.split("kelangkaan: ")[1].split(",")[0]) for b in baris)
    print(f"   {len(baris)} joker -> {TUJUAN}")
    print("   sebaran: " + ", ".join(f"{k} {v}" for k, v in sorted(sebaran.items())))


if __name__ == "__main__":
    main()
