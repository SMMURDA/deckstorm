#!/usr/bin/env python3
"""
Jembatan kecil: memuat generator kartu remi sebagai modul supaya berkas lain
(emblems.py, generate-items.py) bisa memakai kerangka kartu, palet, dan fungsinya
tanpa menduplikasi kode.
"""

import importlib.util
import os

_akar = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("kartu", os.path.join(_akar, "generate-cards.py"))
kartu = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(kartu)

W, H = kartu.BASE_W, kartu.BASE_H
SCALE = kartu.SCALE
