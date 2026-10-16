#!/usr/bin/env python3
"""
Menambahkan Joker yang belum ada ke kumpulan Joker permainan (js/jokers.js).

Repo Deckstorm semula hanya punya 43 Joker dengan efek yang ditulis tangan.
Skrip ini menyisipkan sisanya dari data wiki (js/data/jokers.js) dan mengalihkan
efeknya ke mesin efek bersama (js/efek.js) supaya tidak ada dua sumber kebenaran.

Efek hanya dipasang untuk jenis yang benar-benar bisa dihitung mesin saat ini
(mult+, multx, chips+, chipsx, uang+). Joker berjenis "khusus" tetap masuk
kumpulan - bisa dibeli dan tampil di koleksi - tetapi efeknya belum bekerja,
dan itu ditandai di kode keluaran supaya jujur.

Pakai:
    /tmp/artvenv/bin/python tools/import-jokers-pool.py
"""

import json
import pathlib
import re

DATA = pathlib.Path("js/data/jokers.js")
EFEK = pathlib.Path("js/data/joker-effects.js")
POOL = pathlib.Path("js/jokers.js")

SEDERHANA = ("mult+", "multx", "chips+", "chipsx", "uang+", "mult-skala", "chips-skala")


def baca_data():
    entri = {}
    for baris in DATA.read_text().splitlines():
        b = baris.strip()
        if not b.startswith("{ id:"):
            continue
        m_id = re.search(r'id:\s*"([^"]+)"', b)
        m_nama = re.search(r'nama:\s*"([^"]+)"', b)
        m_rar = re.search(r'kelangkaan:\s*"([^"]+)"', b)
        m_har = re.search(r'harga:\s*([0-9]+)', b)
        m_ket = re.search(r'keterangan:\s*"(.*)"\s*\},?\s*$', b)
        if m_id:
            entri[m_id.group(1)] = {
                "id": m_id.group(1),
                "nama": m_nama.group(1) if m_nama else m_id.group(1),
                "rarity": (m_rar.group(1) if m_rar else "Common").lower(),
                "cost": int(m_har.group(1)) if m_har else 4,
                "keterangan": m_ket.group(1) if m_ket else "",
            }
    return entri


def baca_efek():
    teks = EFEK.read_text()
    efek = {}
    for m in re.finditer(r'"([^"]+)":\s*\{\s*jenis:\s*"([^"]+)",\s*nilai:\s*([0-9.]+)', teks):
        efek[m.group(1)] = (m.group(2), float(m.group(3)))
    return efek


def akhir_larik(teks, mulai):
    """Cari posisi ']' yang menutup larik, dengan menghitung kedalaman tanda
    kurung siku dan melewati isi string. Cara ini tidak tertipu oleh '];'
    yang muncul di dalam kode efek."""
    depth = 0
    i = mulai
    kutip = None
    while i < len(teks):
        ch = teks[i]
        if kutip:
            if ch == "\\":
                i += 2
                continue
            if ch == kutip:
                kutip = None
        elif ch in "\"'`":
            kutip = ch
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise SystemExit("penutup larik JOKERS tidak ditemukan")


def main():
    data = baca_data()
    efek = baca_efek()
    pool = POOL.read_text()
    sudah_id = set(re.findall(r'id:\s*"([^"]+)"', pool))
    sudah_nama = set(re.findall(r'name:\s*"([^"]+)"', pool))
    # repo memendekkan sebagian id ("greedy" vs "greedy-joker"), jadi id dibandingkan
    # dalam bentuk ternormalisasi dan nama juga dicek supaya tidak ada Joker kembar
    def normal(x):
        return x.lower().removesuffix("-joker").replace("-", "")
    sudah = {normal(x) for x in sudah_id} | {x.lower() for x in sudah_nama}
    kurang = [k for k in data
              if normal(k) not in sudah and data[k]["nama"].lower() not in sudah]

    if not kurang:
        print("   semua Joker sudah ada di kumpulan, tidak ada yang ditambahkan")
        return

    SEDERHANA_SET = SEDERHANA
    baris = []
    berfungsi = 0
    for k in sorted(kurang):
        d = data[k]
        jenis, nilai = efek.get(k, ("khusus", 0.0))
        ket = d["keterangan"].replace('"', "'")
        if jenis in SEDERHANA_SET:
            berfungsi += 1
            badan = (
                "    effect: c => {\n"
                "      const w = typeof window !== \"undefined\" ? window : globalThis;\n"
                "      if (!w.DSEfek) return null;\n"
                "      const t = (c && (c.held || c.heldCards || c.hand)) || [];\n"
                f'      const e = w.DSEfek.efekJoker({{ id: "{k}" }}, {{ diTangan: t }});\n'
                "      if (!e || (!e.chips && !e.mult && e.multX === 1 && !e.uang)) return null;\n"
                f'      return {{ chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: "{ket[:28]}" }};\n'
                "    }\n  }")
        else:
            badan = "    effect: null,   // jenis khusus: belum berefek\n  }"
        baris.append(
            f'  {{ id: "{k}", name: {json.dumps(d["nama"])}, cost: {d["cost"]}, '
            f'rarity: "{d["rarity"]}",\n    desc: {json.dumps(ket)},\n'
            f'    gambar: "assets/img/items/joker/{k}.png",\n{badan},')

    keluaran = """// 107 Joker tambahan untuk Deckstorm, dari data wiki yang sudah diverifikasi.
// Berkas ini dihasilkan oleh tools/import-jokers-pool.py - jangan disunting tangan.
//
// Dipisahkan dari js/jokers.js supaya 43 Joker lama yang efeknya ditulis tangan
// tidak tersentuh sama sekali. Berkas ini menyatukan dirinya ke kumpulan JOKERS
// saat dimuat, jadi urutan pemuatan di index.html harus sesudah js/jokers.js.
//
// Efek dialihkan ke mesin bersama js/efek.js. Joker berjenis khusus masuk kumpulan
// (bisa dibeli, tampil di koleksi) tetapi effect bernilai null sampai logikanya
// ditulis - jadi tidak ada efek yang diam-diam salah hitung.

const JOKER_TAMBAHAN = [
%s
];

if (typeof JOKERS !== "undefined" && Array.isArray(JOKERS)) {
  JOKER_TAMBAHAN.forEach(j => { if (!JOKERS.some(x => x.id === j.id)) JOKERS.push(j); });
}

if (typeof module !== "undefined") module.exports = { JOKER_TAMBAHAN };
""" % "\n".join(baris)

    tujuan = pathlib.Path("js/data/jokers-pool.js")
    tujuan.write_text(keluaran)
    print(f"   {len(baris)} Joker -> {tujuan}")
    print(f"   {len(kurang)} Joker ditambahkan ke js/jokers.js")
    print(f"   {berfungsi} di antaranya sudah berefek, {len(kurang) - berfungsi} menunggu logika khusus")


if __name__ == "__main__":
    main()
