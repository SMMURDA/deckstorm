// Mesin penilaian Deckstorm — mengikuti urutan aktivasi Balatro yang terverifikasi.
//
// Urutan yang diterapkan (sesuai wiki "Guide: Activation Sequence"):
//   1. level tangan menentukan chips dan mult awal
//   2. Joker berkemampuan "on played" (dipicu sebelum kartu dinilai)
//   3. tiap kartu yang dinilai, kiri ke kanan:
//        chips dasar kartu -> enhancement -> seal -> edisi -> Joker "on scored" -> retrigger
//   4. kartu yang dipegang di tangan: Steel -> Joker "on held" -> retrigger Mime
//   5. edisi Joker dan Joker mandiri, kiri ke kanan, Polychrome dihitung paling akhir
//   6. skor akhir = chips x mult, dibulatkan ke bawah, minimum 1

(function (root) {
  "use strict";

  var EFEK = null;
  var JOKER = null;
  if (typeof require !== "undefined") {
    EFEK = require("./data/joker-effects.js").JOKER_EFFECTS;
    JOKER = require("./data/jokers.js").JOKER_DATA;
  }

  var NILAI_RANK = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 10, Q: 10, K: 10, A: 11 };

  var CHIPS_ENHANCEMENT = { bonus: 30, stone: 50, gold: 0, glass: 0, steel: 0, mult: 0, wild: 0, lucky: 0 };
  var MULT_ENHANCEMENT = { mult: 4 };
  var EDISI_KARTU = {
    foil: { chips: 50, mult: 0, multX: 1 },
    holo: { chips: 0, mult: 10, multX: 1 },
    poly: { chips: 0, mult: 0, multX: 1.5 },
  };
  var EDISI_JOKER = {
    foil: { chips: 50, mult: 0, multX: 1 },
    holo: { chips: 0, mult: 10, multX: 1 },
    poly: { chips: 0, mult: 0, multX: 1.5 },
    negative: { chips: 0, mult: 0, multX: 1 },
  };

  function chipsKartu(card) {
    if (card.enhancement === "stone") return CHIPS_ENHANCEMENT.stone;
    var nilai = NILAI_RANK[card.rank] || 0;
    return nilai + (CHIPS_ENHANCEMENT[card.enhancement] || 0);
  }

  // Efek satu kartu yang sedang dinilai.
  function efekKartu(card) {
    var out = { chips: chipsKartu(card), mult: MULT_ENHANCEMENT[card.enhancement] || 0, multX: 1, uang: 0 };
    var ed = EDISI_KARTU[card.edition];
    if (ed) { out.chips += ed.chips; out.mult += ed.mult; out.multX *= ed.multX; }
    if (card.enhancement === "glass") out.multX *= 2;
    return out;
  }

  // Efek satu kartu yang dipegang di tangan (Steel dan Gold hanya bekerja di sini).
  function efekDiTangan(card) {
    var out = { chips: 0, mult: 0, multX: 1, uang: 0 };
    if (card.enhancement === "steel") out.multX *= 1.5;
    if (card.enhancement === "gold") out.uang += 3;
    var ed = EDISI_KARTU[card.edition];
    if (ed) { out.chips += ed.chips; out.mult += ed.mult; out.multX *= ed.multX; }
    return out;
  }

  // Joker dari data terstruktur: hanya jenis sederhana yang dihitung di sini.
  // Jenis "khusus" ditangani tabel KHUSUS di bawah.
  function efekJoker(joker, ctx, abaikanData) {
    var out = { chips: 0, mult: 0, multX: 1, uang: 0, catatan: [] };
    var e = !abaikanData && EFEK && EFEK[joker.id];
    if (e) {
      var nilai = Number(e.nilai) || 0;
      if (e.jenis === "mult+") out.mult += nilai;
      else if (e.jenis === "multx") out.multX *= nilai;
      else if (e.jenis === "chips+") out.chips += nilai;
      else if (e.jenis === "chipsx") out.chips *= nilai;
      else if (e.jenis === "uang+") out.uang += nilai;
      else if (e.jenis === "mult-skala" || e.jenis === "chips-skala") {
        var tumpuk = (joker.tumpukan || 0) * nilai;
        if (e.jenis === "mult-skala") out.mult += tumpuk; else out.chips += tumpuk;
      } else if (e.jenis === "peluang") {
        var peluang = nilai / (Number(e.nilai2) || 1);
        if (ctx && ctx.undian && ctx.undian(joker.id) < peluang) out.catatan.push("peluang berhasil");
      }
    }
    var ed = EDISI_JOKER[joker.edition];
    if (ed) {
      if (ed.multX > 1) {
        out.poly = true;      // Polychrome dihitung paling akhir...
        out.multX = ed.multX; // ...tetapi penggandanya tetap harus terpasang
      } else {
        out.chips += ed.chips;
        out.mult += ed.mult;
      }
    }
    return out;
  }

  // Bentuk tangan dari kartu yang dinilai: dipakai Joker yang bergantung isi tangan.
  function bentukTangan(kartu) {
    var hitung = {};
    (kartu || []).forEach(function (c) { hitung[c.rank] = (hitung[c.rank] || 0) + 1; });
    var n = Object.keys(hitung).map(function (k) { return hitung[k]; }).sort(function (a, b) { return b - a; });
    return {
      tertinggi: n[0] || 0,
      adaPair: (n[0] || 0) >= 2,
      adaTwoPair: (n[0] || 0) >= 2 && (n[1] || 0) >= 2,
      adaThree: (n[0] || 0) >= 3,
      adaFour: (n[0] || 0) >= 4,
      adaFive: (n[0] || 0) >= 5,
    };
  }

  function semuaSuit(kartu, suit) {
    return (kartu || []).length > 0 && kartu.every(function (c) { return c.suit === suit; });
  }

  // Joker yang butuh logika tersendiri (60 Joker "khusus" dari hasil klasifikasi).
  var KHUSUS = {
    baron: function (ctx) {
      var raja = ctx.diTangan.filter(function (c) { return c.rank === "K"; }).length;
      return { multX: Math.pow(1.5, raja), catatan: [raja + " King di tangan"] };
    },
    "steel-joker": function (ctx) {
      var n = ctx.diTangan.filter(function (c) { return c.enhancement === "steel"; }).length;
      return { multX: Math.pow(1.5, n) };
    },
    mime: function (ctx) { return { retriggerTangan: 1 }; },
    "sock-and-buskin": function (ctx) { return { retriggerKartu: 1 }; },
    dna: function (ctx) { return { catatan: ["salin kartu — perlu slot kosong"] }; },
    blueprint: function (ctx) { return { salinJoker: ctx.joker && ctx.joker.index !== undefined ? ctx.joker.index + 1 : null }; },
    // keluarga pengganda bentuk tangan: x2 sampai x5
    "the-duo": function (ctx) { return bentukTangan(ctx.dinilai).adaPair ? { multX: 2 } : {}; },
    "the-trio": function (ctx) { return bentukTangan(ctx.dinilai).adaThree ? { multX: 3 } : {}; },
    "the-family": function (ctx) { return bentukTangan(ctx.dinilai).adaFour ? { multX: 4 } : {}; },
    "the-order": function (ctx) { return bentukTangan(ctx.dinilai).adaFive ? { multX: 5 } : {}; },
    "the-tribe": function (ctx) { return bentukTangan(ctx.dinilai).adaFive ? { multX: 5 } : {}; },
    // lima Joker "+Mult bila tangan memuat bentuk tertentu"
    "jolly": function (ctx) { return bentukTangan(ctx.dinilai).adaPair ? { mult: 8 } : {}; },
    "zany": function (ctx) { return bentukTangan(ctx.dinilai).adaThree ? { mult: 12 } : {}; },
    "mad": function (ctx) { return bentukTangan(ctx.dinilai).adaTwoPair ? { mult: 10 } : {}; },
    "crazy": function (ctx) { return bentukTangan(ctx.dinilai).adaFour ? { mult: 12 } : {}; },
    "droll": function (ctx) { return bentukTangan(ctx.dinilai).adaFive ? { mult: 10 } : {}; },
    // +Mult untuk tiap Joker yang dimiliki
    "abstract-joker": function (ctx) { return { mult: 3 * (ctx.jumlahJoker || 0) }; },
    // x3 bila seluruh kartu di tangan berwarna sekop atau hati
    "blackboard": function (ctx) {
      var t = ctx.diTangan || [];
      return semuaSuit(t, "spades") || semuaSuit(t, "hearts") ? { multX: 3 } : {};
    },
    // menyalin Joker paling kiri
    "brainstorm": function (ctx) {
      var kiri = ctx.jokerPertama;
      if (!kiri || kiri.id === "brainstorm") return {};
      var e = efekJoker(kiri, ctx, !!KHUSUS[kiri.id]);
      return { chips: e.chips, mult: e.mult, multX: e.multX, uang: e.uang };
    },
    // pengganda datar: Cavendish x3 dan Gros Michel +15 Mult
    "cavendish": function () { return { multX: 3 }; },
    "gros-michel": function () { return { mult: 15 }; },
    // x1.5 untuk tiap Joker kelangkaan Uncommon lain yang dimiliki
    "baseball-card": function (ctx) {
      var lain = (ctx.semuaJoker || []).filter(function (j) {
        return j && j.id !== "baseball-card" && j.rarity === "uncommon";
      }).length;
      return lain ? { multX: Math.pow(1.5, lain) } : {};
    },
    // Joker yang nilainya berubah sepanjang run. Angkanya disimpan di
    // joker.tumpukan oleh js/game.js pada kejadian yang sesuai.
    // Popcorn: -4 Mult tiap ronde, mulai dari +20
    "popcorn": function (ctx) { return { mult: Math.max(0, 20 - 4 * (ctx.ronde || 0)) }; },
    // Ramen: x2 Mult, berkurang 0,01 tiap kartu yang dibuang
    "ramen": function (ctx) {
      var x = 2 - 0.01 * (ctx.joker && ctx.joker.tumpukan || 0);
      return x > 0 ? { multX: x } : {};
    },
    // Burnt Joker: +0,5 Mult tiap discard
    "burnt-joker": function (ctx) { return { mult: 0.5 * (ctx.joker && ctx.joker.tumpukan || 0) }; },
    // Ceremonial Dagger: +2 Mult tiap kali menyerap Joker
    "ceremonial-dagger": function (ctx) { return { mult: 2 * (ctx.joker && ctx.joker.tumpukan || 0) }; },
    // Loyalty Card: x4 Mult tiap 6 hand yang dimainkan
    "loyalty-card": function (ctx) {
      var n = ctx.joker && ctx.joker.tumpukan || 0;
      return n > 0 && n % 6 === 0 ? { multX: 4 } : {};
    },
    // Throwback: x1,25 Mult tiap Blind yang dilewati
    "throwback": function (ctx) {
      var n = ctx.joker && ctx.joker.tumpukan || 0;
      return n ? { multX: Math.pow(1.25, n) } : {};
    },
    // Hit the Road: x0,5 Mult tiap Jack yang dibuang ronde ini
    "hit-the-road": function (ctx) {
      var n = ctx.joker && ctx.joker.tumpukan || 0;
      return n ? { multX: Math.pow(1.5, n) } : {};
    },
    // Seeing Double: x2 Mult bila tangan memuat sekop/keriting dan suit lain
    "seeing-double": function (ctx) {
      var suit = {};
      (ctx.dinilai || []).forEach(function (c) { if (c.suit) suit[c.suit] = true; });
      var klub = suit.clubs || suit.spades;
      var lain = Object.keys(suit).some(function (k) { return k !== "clubs" && k !== "spades"; });
      return klub && lain ? { multX: 2 } : {};
    },
    // Swashbuckler: +Mult sebesar total nilai jual Joker lain
    "swashbuckler": function (ctx) {
      var total = (ctx.semuaJoker || []).reduce(function (n, j) {
        if (!j || j.id === "swashbuckler") return n;
        return n + Math.max(1, Math.floor((j.cost || 0) / 2));
      }, 0);
      return total ? { mult: total } : {};
    },
    // Supernova: +Mult sebesar berapa kali bentuk tangan ini sudah dimainkan.
    // Bentuk catatan statistik belum dipastikan, jadi dibaca hati-hati dan
    // menghasilkan 0 bila tidak ada - tidak pernah menebak angka.
    "supernova": function (ctx) {
      var st = ctx.stats || {};
      var nama = String(ctx.handName || "").toLowerCase().replace(/\s+/g, "_");
      var n = 0;
      if (st.handsPlayed && typeof st.handsPlayed === "object") n = st.handsPlayed[nama] || 0;
      else if (typeof st[nama] === "number") n = st[nama];
      return n ? { mult: n } : {};
    },
    // Acrobat: x3 Mult pada hand terakhir
    "acrobat": function (ctx) { return ctx.sisaTangan === 1 ? { multX: 3 } : {}; },
    // Oops! All 6s: menggandakan semua peluang
    "oops-all-6s": function () { return { gandakanPeluang: true }; },
    "joker-stencil": function (ctx) {
      // x1 Mult untuk tiap slot Joker kosong, dan Stencil sendiri ikut dihitung
      var kosong = Math.max(1, ctx.slotJoker - ctx.jumlahJoker + 1);
      return { multX: kosong };
    },
  };

  // Hitung total satu tangan.
  function hitungSkor(pilihan, opsi) {
    opsi = opsi || {};
    var dasar = opsi.dasar || { chips: 5, mult: 1 };
    var chips = Number(dasar.chips) || 0;
    var mult = Number(dasar.mult) || 1;
    var uang = 0;
    var langkah = [];
    var diTangan = opsi.diTangan || [];
    var jokerList = opsi.joker || [];

    function catat(label, c, m, x) {
      langkah.push({ label: label, chips: c, mult: m, multX: x || 1 });
    }

    // 2. Joker "on played" (disederhanakan: semua Joker dihitung setelah kartu,
    //    kecuali yang bertanda onPlayed)
    var polyTertunda = [];

    // 3. kartu yang dinilai, kiri ke kanan
    (pilihan || []).forEach(function (card) {
      var ulang = 1 + (card.seal === "red" ? 1 : 0);
      for (var i = 0; i < ulang; i++) {
        var e = efekKartu(card);
        chips += e.chips;
        mult += e.mult;
        mult *= e.multX;
        if (card.seal === "gold") uang += 3;
        catat("kartu " + card.rank, e.chips, e.mult, e.multX);
      }
    });

    // 4. kartu yang dipegang di tangan
    var retriggerTangan = 1;
    jokerList.forEach(function (j) {
      var k = KHUSUS[j.id];
      if (k) { var h = k({ diTangan: diTangan, dinilai: pilihan || [], joker: j, jokerPertama: jokerList[0], semuaJoker: jokerList,
        sisaTangan: opsi.sisaTangan, ronde: opsi.ronde,
        handName: opsi.handName, stats: opsi.stats,
        jumlahJoker: jokerList.length, slotJoker: opsi.slotJoker || 5 });
        if (h.retriggerTangan) retriggerTangan += h.retriggerTangan; }
    });
    for (var r = 0; r < retriggerTangan; r++) {
      diTangan.forEach(function (card) {
        var e = efekDiTangan(card);
        chips += e.chips;
        mult += e.mult;
        mult *= e.multX;
        uang += e.uang;
      });
    }
    if (diTangan.length) catat(diTangan.length + " kartu di tangan", 0, 0, 1);

    // 5. Joker dan edisinya, kiri ke kanan; Polychrome paling akhir
    jokerList.forEach(function (j) {
      var k = KHUSUS[j.id];
      // Joker yang punya logika khusus tidak dihitung lagi dari data mentah
      var e = efekJoker(j, { undian: opsi.undian }, !!k);
      if (k) {
        var h = k({ diTangan: diTangan, dinilai: pilihan || [], joker: j, jokerPertama: jokerList[0], semuaJoker: jokerList,
        sisaTangan: opsi.sisaTangan, ronde: opsi.ronde,
        handName: opsi.handName, stats: opsi.stats,
          jumlahJoker: jokerList.length, slotJoker: opsi.slotJoker || 5 });
        if (h.mult) e.mult += h.mult;
        if (h.multX && h.multX !== 1) e.multX *= h.multX;
        if (h.chips) e.chips += h.chips;
      }
      chips += e.chips;
      mult += e.mult;
      if (e.poly) polyTertunda.push(e);
      else mult *= e.multX;
      uang += e.uang;
      catat("joker " + j.id, e.chips, e.mult, e.poly ? 1 : e.multX);
    });
    polyTertunda.forEach(function (e) { mult *= e.multX; catat("polychrome", 0, 0, e.multX); });

    var skor = Math.max(1, Math.floor(chips * mult));
    return { chips: chips, mult: mult, skor: skor, uang: uang, langkah: langkah };
  }

  // Jembatan untuk permainan: js/game.js menilai Joker satu per satu dengan
  // konteksnya sendiri. Fungsi ini menyadur konteks itu ke bentuk yang dipakai
  // hitungSkor, lalu memilih penangan khusus bila ada - kalau tidak, efek
  // terstruktur dari data yang dipakai.
  function efekLengkap(joker, c) {
    c = c || {};
    var semua = c.allJokers || [];
    var ctx = {
      dinilai: c.scoringCards || [],
      diTangan: c.heldCards || [],
      tanganDinilai: c.scoringCards || [],
      sisaTangan: c.handsLeft,
      handName: c.handName, stats: c.stats,
      ronde: (typeof c.ante === "number" ? (c.ante - 1) * 3 + (c.blindIndex || 0) : undefined),
      slotJoker: (c.emptySlots || 0) + semua.length,
      jumlahJoker: c.jokerCount || semua.length,
      semuaJoker: semua,
      jokerPertama: semua[0],
      joker: joker,
    };
    var k = KHUSUS[joker && joker.id];
    if (k) {
      var h = k(ctx) || {};
      return { chips: h.chips || 0, mult: h.mult || 0, xmult: h.multX || 1,
               money: h.uang || 0, label: h.label || null };
    }
    var e = efekJoker(joker || {}, { diTangan: ctx.diTangan }, false);
    return { chips: e.chips, mult: e.mult, xmult: e.multX, money: e.uang, label: null };
  }

  // Uang yang diterima di akhir babak. Dipanggil js/game.js saat menghitung
  // hadiah, jadi Joker pemberi uang tetap bekerja walau efeknya bukan bagian
  // dari penilaian tangan.
  function uangAkhirRonde(joker, keadaan) {
    if (!joker) return 0;
    var k = keadaan || {};
    switch (joker.id) {
      case "golden-joker": return 4;
      case "rocket": return 2;
      // Delayed Gratification: $2 bila tidak ada discard yang terpakai
      case "delayed-gratification": return (k.discardsLeft === 3 || k.discardsLeft === k.discardMaks) ? 2 : 0;
      // To the Moon: tambahan $1 untuk tiap $5 yang dimiliki
      case "to-the-moon": return Math.floor((k.money || 0) / 5);
      default: return 0;
    }
  }

  // Pengubah penilaian tangan dari Joker yang sedang terpasang.
  function aturanTangan(daftar) {
    var id = {};
    (daftar || []).forEach(function (j) { if (j && j.id) id[j.id] = true; });
    return {
      empatJari: !!id["four-fingers"],
      jalanPintas: !!id["shortcut"],
      suitKabur: !!id["smeared-joker"],
      semuaNilai: !!id["splash"],
    };
  }

  var API = {
    NILAI_RANK: NILAI_RANK,
    chipsKartu: chipsKartu,
    efekKartu: efekKartu,
    efekDiTangan: efekDiTangan,
    efekJoker: efekJoker,
    hitungSkor: hitungSkor,
    KHUSUS: KHUSUS,
    bentukTangan: bentukTangan,
    efekLengkap: efekLengkap,
    uangAkhirRonde: uangAkhirRonde,
    aturanTangan: aturanTangan,
    // Daftar Joker yang punya penangan khusus, supaya bisa dihitung mesin
    // dan tidak perlu ditebak dari isi berkas.
    daftarKhusus: function () { return Object.keys(KHUSUS); },
    // Joker yang efeknya bukan bagian dari penilaian tangan, melainkan
    // disambungkan js/game.js ke kejadian lain: pembuatan kartu, pembuatan
    // Joker/Konsumabel, pengubah aturan tangan, dan uang akhir babak.
    daftarTersambung: function () { return [
      "dna", "marble-joker", "riff-raff", "8-ball", "certificate",
      "four-fingers", "shortcut", "smeared-joker", "splash",
      "golden-joker", "rocket", "delayed-gratification", "to-the-moon",
      "throwback", "burnt-joker", "ramen", "hit-the-road", "loyalty-card",
      "popcorn", "acrobat", "oops-all-6s",
    ]; },
  };

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.DSEfek = API;
})(typeof window !== "undefined" ? window : globalThis);
