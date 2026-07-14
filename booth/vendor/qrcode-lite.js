/* ============================================================
   qrcode-lite — 외부 의존 없는 QR 코드 생성기 (byte mode)
   지원: 버전 1–10, EC level L/M, 마스크 0 고정
   API는 qrcodejs(davidshimjs)와 호환:
       new QRCode(el, { text, width, height, colorDark, colorLight, correctLevel })
       QRCode.CorrectLevel.{L,M,Q,H}   (Q/H 요청 시 M으로 처리)
   ============================================================ */
(function () {
  if (window.QRCode) return;

  /* ---------- GF(256) ---------- */
  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1; if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  /* Reed–Solomon generator poly of degree n */
  function rsGenPoly(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= gmul(poly[j], EXP[i]);
        next[j + 1] ^= poly[j];
      }
      poly = next;
    }
    return poly; // ascending? -> built as descending powers below usage
  }
  function rsEncode(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var res = data.concat(new Array(ecLen).fill(0));
    for (var i = 0; i < data.length; i++) {
      var coef = res[i];
      if (coef !== 0) {
        for (var j = 1; j < gen.length; j++) {
          res[i + j] ^= gmul(gen[gen.length - 1 - j], coef) ;
        }
      }
    }
    return res.slice(data.length);
  }

  /* ---------- 버전 테이블 (level: blocks [{count, dataCw}], ecPerBlock) ---------- */
  // [totalDataCw, ecPerBlock, [blockGroup: [numBlocks, dataCwPerBlock], ...]]
  var TABLE = {
    L: {
      1: [19, 7, [[1, 19]]], 2: [34, 10, [[1, 34]]], 3: [55, 15, [[1, 55]]],
      4: [80, 20, [[1, 80]]], 5: [108, 26, [[1, 108]]], 6: [136, 18, [[2, 68]]],
      7: [156, 20, [[2, 78]]], 8: [194, 24, [[2, 97]]], 9: [232, 30, [[2, 116]]],
      10: [274, 18, [[2, 68], [2, 69]]],
    },
    M: {
      1: [16, 10, [[1, 16]]], 2: [28, 16, [[1, 28]]], 3: [44, 26, [[1, 44]]],
      4: [64, 18, [[2, 32]]], 5: [86, 24, [[2, 43]]], 6: [108, 16, [[4, 27]]],
      7: [124, 18, [[4, 31]]], 8: [154, 22, [[2, 38], [2, 39]]],
      9: [182, 22, [[3, 36], [2, 37]]], 10: [216, 26, [[4, 43], [1, 44]]],
    },
  };
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  var EC_BITS = { L: 1, M: 0 }; // format info 상위 2비트

  /* ---------- 인코딩 ---------- */
  function pickVersion(byteLen, level) {
    for (var v = 1; v <= 10; v++) {
      var cap = TABLE[level][v][0];
      var headerBits = 4 + (v <= 9 ? 8 : 16);
      if (byteLen * 8 + headerBits <= cap * 8) return v;
    }
    throw new Error('qrcode-lite: data too long (' + byteLen + ' bytes)');
  }

  function toUtf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.codePointAt(i);
      if (c > 0xFFFF) i++;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function buildCodewords(bytes, version, level) {
    var spec = TABLE[level][version];
    var totalData = spec[0], ecLen = spec[1], groups = spec[2];

    // bit stream
    var bits = [];
    function push(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    push(4, 4);                                  // byte mode
    push(bytes.length, version <= 9 ? 8 : 16);   // char count
    bytes.forEach(function (b) { push(b, 8); });
    // terminator
    var capBits = totalData * 8;
    var t = Math.min(4, capBits - bits.length);
    for (var i = 0; i < t; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    // pad bytes
    var pads = [0xEC, 0x11], pi = 0;
    while (bits.length < capBits) { push(pads[pi % 2], 8); pi++; }

    var data = [];
    for (var b2 = 0; b2 < bits.length; b2 += 8) {
      var v8 = 0;
      for (var k = 0; k < 8; k++) v8 = (v8 << 1) | bits[b2 + k];
      data.push(v8);
    }

    // 블록 분할 + RS
    var blocks = [], ecBlocks = [], pos = 0;
    groups.forEach(function (g) {
      for (var n = 0; n < g[0]; n++) {
        var chunk = data.slice(pos, pos + g[1]); pos += g[1];
        blocks.push(chunk);
        ecBlocks.push(rsEncode(chunk, ecLen));
      }
    });

    // 인터리브
    var out = [];
    var maxD = Math.max.apply(null, blocks.map(function (b) { return b.length; }));
    for (var c = 0; c < maxD; c++) blocks.forEach(function (b) { if (c < b.length) out.push(b[c]); });
    for (var e = 0; e < ecLen; e++) ecBlocks.forEach(function (b) { out.push(b[e]); });
    return out;
  }

  /* ---------- 매트릭스 ---------- */
  function buildMatrix(codewords, version, level) {
    var size = 17 + version * 4;
    var m = [], used = [];
    for (var r = 0; r < size; r++) { m.push(new Array(size).fill(0)); used.push(new Array(size).fill(false)); }

    function set(r, c, v) { m[r][c] = v ? 1 : 0; used[r][c] = true; }

    // finder + separator
    function finder(r0, c0) {
      for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
        var rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6)) || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        set(rr, cc, on);
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    // alignment
    var ap = ALIGN[version];
    for (var i = 0; i < ap.length; i++) for (var j = 0; j < ap.length; j++) {
      var cr = ap[i], cc2 = ap[j];
      if (used[cr][cc2]) continue; // finder와 겹치면 skip
      for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
        var on2 = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
        set(cr + dr, cc2 + dc, on2);
      }
    }

    // timing
    for (var t = 8; t < size - 8; t++) {
      if (!used[6][t]) set(6, t, t % 2 === 0);
      if (!used[t][6]) set(t, 6, t % 2 === 0);
    }

    // dark module
    set(size - 8, 8, 1);

    // format info 영역 예약 (값은 나중에)
    for (var f = 0; f < 9; f++) {
      if (!used[8][f]) set(8, f, 0);
      if (!used[f][8]) set(f, 8, 0);
    }
    for (var f2 = size - 8; f2 < size; f2++) {
      if (!used[8][f2]) set(8, f2, 0);
      if (!used[f2][8]) set(f2, 8, 0);
    }

    // version info (v>=7)
    if (version >= 7) {
      var vinfo = versionInfoBits(version);
      for (var vb = 0; vb < 18; vb++) {
        var bit = (vinfo >> vb) & 1;
        var rr2 = Math.floor(vb / 3), cc3 = size - 11 + (vb % 3);
        set(rr2, cc3, bit);       // 우상단
        set(cc3, rr2, bit);       // 좌하단 (전치)
      }
    }

    // 데이터 배치 (zigzag) + mask 0
    var bitIdx = 0, totalBits = codewords.length * 8;
    function dataBit(n) { return (codewords[n >> 3] >> (7 - (n & 7))) & 1; }
    var col = size - 1, upward = true;
    while (col > 0) {
      if (col === 6) col--; // timing column skip
      for (var step = 0; step < size; step++) {
        var row = upward ? size - 1 - step : step;
        for (var side = 0; side < 2; side++) {
          var c4 = col - side;
          if (used[row][c4]) continue;
          var bitv = bitIdx < totalBits ? dataBit(bitIdx) : 0;
          bitIdx++;
          if ((row + c4) % 2 === 0) bitv ^= 1; // mask 0
          m[row][c4] = bitv;
          used[row][c4] = true;
        }
      }
      upward = !upward;
      col -= 2;
    }

    // format info 기록 (mask 0)
    var fmt = formatInfoBits(level, 0);
    var fpos1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    for (var fb = 0; fb < 15; fb++) m[fpos1[fb][0]][fpos1[fb][1]] = (fmt >> (14 - fb)) & 1;
    for (var fb2 = 0; fb2 < 7; fb2++) m[size - 1 - fb2][8] = (fmt >> (14 - fb2)) & 1;
    for (var fb3 = 7; fb3 < 15; fb3++) m[8][size - 15 + fb3] = (fmt >> (14 - fb3)) & 1;

    return m;
  }

  function formatInfoBits(level, mask) {
    var data = (EC_BITS[level] << 3) | mask; // 5 bits
    var v = data << 10;
    var g = 0x537;
    for (var i = 14; i >= 10; i--) if ((v >> i) & 1) v ^= g << (i - 10);
    return ((data << 10) | v) ^ 0x5412;
  }
  function versionInfoBits(version) {
    var v = version << 12;
    var g = 0x1F25;
    for (var i = 17; i >= 12; i--) if ((v >> i) & 1) v ^= g << (i - 12);
    return (version << 12) | v;
  }

  /* ---------- 렌더 ---------- */
  function QRCode(el, opts) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (typeof opts === 'string') opts = { text: opts };
    var text = opts.text || '';
    var w = opts.width || 256, h = opts.height || 256;
    var dark = opts.colorDark || '#000', light = opts.colorLight || '#fff';
    var level = (opts.correctLevel === QRCode.CorrectLevel.L) ? 'L' : 'M';

    var bytes = toUtf8(text);
    var version = pickVersion(bytes.length, level);
    var cw = buildCodewords(bytes, version, level);
    var matrix = buildMatrix(cw, version, level);
    var n = matrix.length;

    var quiet = 4;
    var scale = Math.max(1, Math.floor(Math.min(w, h) / (n + quiet * 2)));
    var px = (n + quiet * 2) * scale;
    var canvas = document.createElement('canvas');
    canvas.width = px; canvas.height = px;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = light; ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = dark;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (matrix[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
    el.appendChild(canvas);
    this._el = el;
    this.clear = function () { el.innerHTML = ''; };
  }
  QRCode.CorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };

  window.QRCode = QRCode;
})();
