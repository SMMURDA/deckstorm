#!/usr/bin/env python3
"""
Mengubah keterangan Joker (prosa) menjadi efek terstruktur yang bisa dijalankan mesin.

Sumber: js/data/jokers.js — 150 entri hasil import-jokers.py
Keluaran: js/data/joker-effects.js — tiap Joker dapat jenis efek, nilai, dan
penanda apakah masih perlu logika khusus di mesin permainan.

Pakai:
    /tmp/artvenv/bin/python tools/klasifikasi-joker.py
"""

import json
import pathlib
import re
from collections import Counter

SUMBER = pathlib.Path("js/data/jokers.js")
TUJUAN = pathlib.Path("js/data/joker-effects.js")

# urutan penting: pola paling spesifik diperiksa lebih dulu
POLA = [
    # bertingkat (naik terus selama syaratnya terpenuhi) - diperiksa lebih dulu
    ("mult-skala",  r"gains?\s*\+?([0-9.]+)\s*Mult", 1),
    ("chips-skala", r"gains?\s*\+?([0-9.]+)\s*Chips", 1),
    ("mult-skala",  r"\+\s*([0-9.]+)\s*Mult\s*(?:per|for each|every)", 1),
    # pengganda: "gives 1.5 Mult" (tanda kali hilang saat ekstraksi data)
    ("multx",       r"gives\s*([0-9.]+)\s*Mult", 1),
    ("multx",       r"[xX\u00d7]\s*([0-9.]+)\s*Mult", 1),
    # tetap
    ("mult+",       r"\+\s*([0-9.]+)\s*Mult", 1),
    ("chips+",      r"\+\s*([0-9.]+)\s*Chips", 1),
    ("chipsx",      r"[xX\u00d7]\s*([0-9.]+)\s*Chips", 1),
    ("uang+",       r"\$\s*([0-9]+)", 1),
    ("peluang",     r"([0-9]+)\s+in\s+([0-9]+)\s+chance", 2),
    ("ukuran",      r"\+\s*([0-9]+)\s*(hand size|discard|Joker slot|hand)", 2),
]

# pengganda tersirat: angka Mult > 1 tanpa tanda + di depannya berarti pengali
POLA_IMPLISIT = ("multx", r"(?<![+0-9.])([0-9]+\.[0-9]+)\s*Mult")

PENJELASAN = {
    "mult+":   "menambah Mult tetap",
    "multx":   "mengalikan Mult",
    "chips+":  "menambah Chips tetap",
    "chipsx":  "mengalikan Chips",
    "uang+":   "memberi uang",
    "peluang": "efek berpeluang (perlu undian acak)",
    "ukuran":  "mengubah ukuran/jumlah (hand, discard, slot)",
    "mult-skala":  "naik bertingkat selama syarat terpenuhi",
    "chips-skala": "Chips naik bertingkat",
    "khusus":  "butuh logika khusus di mesin",
}


def klasifikasi(keterangan):
    teks = keterangan or ""
    for jenis, pola, grup in POLA:
        cocok = re.search(pola, teks)
        if cocok:
            try:
                nilai = float(cocok.group(1).rstrip("."))
            except (ValueError, IndexError):
                nilai = 0.0
            nilai2 = 0.0
            if jenis == "peluang":
                # "1 in 4" -> nilai = 1, nilai2 = 4
                try:
                    nilai = float(cocok.group(1))
                    nilai2 = float(cocok.group(2))
                except (ValueError, IndexError):
                    pass
            return jenis, nilai, nilai2
    # angka Mult berpuluh tanpa tanda + = pengganda tersirat (mis. Baron 1.5 Mult)
    jenis, pola = POLA_IMPLISIT
    cocok = re.search(pola, teks)
    if cocok:
        nilai = float(cocok.group(1))
        if nilai > 1:
            return jenis, nilai, 0.0
    return "khusus", 0.0, 0.0


def main():
    isi = SUMBER.read_text()
    # ambil objek Joker dari berkas data (satu objek per baris)
    entri = []
    for baris in isi.splitlines():
        b = baris.strip()
        if not b.startswith("{ id:"):
            continue
        idm = re.search(r'id:\s*"([^"]+)"', b)
        nm = re.search(r'nama:\s*"([^"]+)"', b)
        kl = re.search(r'kelangkaan:\s*"([^"]+)"', b)
        hg = re.search(r'harga:\s*([0-9]+)', b)
        kt = re.search(r'keterangan:\s*"(.*)"\s*\},?\s*$', b)
        if not (idm and nm and kt):
            continue
        jenis, nilai, nilai2 = klasifikasi(kt.group(1))
        entri.append({
            "id": idm.group(1), "nama": nm.group(1),
            "kelangkaan": kl.group(1) if kl else "Common",
            "harga": int(hg.group(1)) if hg else 0,
            "jenis": jenis, "nilai": nilai, "nilai2": nilai2,
            "keterangan": kt.group(1),
        })

    baris = []
    for e in entri:
        baris.append(
            "  { id: %s, jenis: %s, nilai: %s, nilai2: %s, %s },"
            % (json.dumps(e["id"]), json.dumps(e["jenis"]),
               json.dumps(e["nilai"]), json.dumps(e["nilai2"]),
               json.dumps(e["keterangan"])))

    keluaran = """// Efek terstruktur untuk 150 Joker Deckstorm.
// Berkas ini dihasilkan oleh tools/klasifikasi-joker.py dari keterangan resmi wiki.
// jenis: mult+ | multx | chips+ | chipsx | uang+ | peluang | ukuran | kali | khusus
// Joker berjenis "khusus" butuh logika tersendiri di js/game.js.

const JOKER_EFFECTS = {
%s
};

if (typeof module !== "undefined") module.exports = { JOKER_EFFECTS };
""" % "\n".join("  %s: { jenis: %s, nilai: %s, nilai2: %s }," % (
        json.dumps(e["id"]), json.dumps(e["jenis"]), json.dumps(e["nilai"]), json.dumps(e["nilai2"]))
        for e in entri)

    TUJUAN.write_text(keluaran)
    sebaran = Counter(e["jenis"] for e in entri)
    print(f"   {len(entri)} efek -> {TUJUAN}")
    for jenis, jumlah in sebaran.most_common():
        print(f"   {jenis:8s} {jumlah:3d}  {PENJELASAN.get(jenis, '')}")
    siap = len(entri) - sebaran.get("khusus", 0)
    print(f"   terklasifikasi otomatis: {siap}/{len(entri)} ({siap * 100 // max(1, len(entri))}%)")


if __name__ == "__main__":
    main()
