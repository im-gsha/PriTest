(function () {
  // 自己完結のQRコード（バイトモード専用）エンコーダ。
  // Reed-Solomon誤り訂正・マスク選択などのアルゴリズムとテーブルは
  // ISO/IEC 18004準拠の実装（Python "qrcode" パッケージのソース）を
  // 忠実に移植したもの。外部依存なし。

  // ---- ガロア体 GF(256) ----
  var EXP_TABLE = new Array(256);
  var LOG_TABLE = new Array(256);
  (function initGaloisField() {
    for (var i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
    for (var i = 8; i < 256; i++) {
      EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;
  })();

  function gexp(n) {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return EXP_TABLE[n];
  }

  // ---- Reed-Solomonブロック構成表（バージョン1〜40 × L/M/Q/H） ----
  var RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
    [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
    [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
    [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
    [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
    [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
    [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
    [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
    [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
    [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
    [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
    [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
    [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
    [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
    [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13],
    [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
    [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
    [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
    [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
    [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
    [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
    [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13],
    [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
    [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
    [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
    [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
    [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
    [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
    [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
    [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
    [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
    [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
    [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
    [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
    [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
    [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
    [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
    [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
    [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
    [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16],
  ];
  var RS_BLOCK_OFFSET = { L: 0, M: 1, Q: 2, H: 3 };
  var EC_LEVEL_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  function rsBlocksFor(version, level) {
    var row = RS_BLOCK_TABLE[(version - 1) * 4 + RS_BLOCK_OFFSET[level]];
    var blocks = [];
    for (var i = 0; i < row.length; i += 3) {
      var count = row[i];
      var totalCount = row[i + 1];
      var dataCount = row[i + 2];
      for (var k = 0; k < count; k++) blocks.push({ totalCount: totalCount, dataCount: dataCount });
    }
    return blocks;
  }

  // ---- 誤り訂正符号生成多項式（誤り訂正語数ごとの係数、事前計算済み） ----
  var RS_POLY_LUT = {
    7: [1, 127, 122, 154, 164, 11, 68, 117],
    10: [1, 216, 194, 159, 111, 199, 94, 95, 113, 157, 193],
    13: [1, 137, 73, 227, 17, 177, 17, 52, 13, 46, 43, 83, 132, 120],
    15: [1, 29, 196, 111, 163, 112, 74, 10, 105, 105, 139, 132, 151, 32, 134, 26],
    16: [1, 59, 13, 104, 189, 68, 209, 30, 8, 163, 65, 41, 229, 98, 50, 36, 59],
    17: [1, 119, 66, 83, 120, 119, 22, 197, 83, 249, 41, 143, 134, 85, 53, 125, 99, 79],
    18: [1, 239, 251, 183, 113, 149, 175, 199, 215, 240, 220, 73, 82, 173, 75, 32, 67, 217, 146],
    20: [1, 152, 185, 240, 5, 111, 99, 6, 220, 112, 150, 69, 36, 187, 22, 228, 198, 121, 121, 165, 174],
    22: [1, 89, 179, 131, 176, 182, 244, 19, 189, 69, 40, 28, 137, 29, 123, 67, 253, 86, 218, 230, 26, 145, 245],
    24: [1, 122, 118, 169, 70, 178, 237, 216, 102, 115, 150, 229, 73, 130, 72, 61, 43, 206, 1, 237, 247, 127, 217, 144, 117],
    26: [1, 246, 51, 183, 4, 136, 98, 199, 152, 77, 56, 206, 24, 145, 40, 209, 117, 233, 42, 135, 68, 70, 144, 146, 77, 43, 94],
    28: [1, 252, 9, 28, 13, 18, 251, 208, 150, 103, 174, 100, 41, 167, 12, 247, 56, 117, 119, 233, 127, 181, 100, 121, 147, 176, 74, 58, 197],
    30: [1, 212, 246, 77, 73, 195, 192, 75, 98, 5, 70, 103, 177, 22, 217, 138, 51, 181, 246, 72, 25, 18, 46, 228, 74, 216, 195, 11, 106, 130, 150],
  };

  // ---- アライメントパターン位置表 ----
  var PATTERN_POSITION_TABLE = [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62],
    [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
    [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
  ];

  var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
  var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
  var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

  function bchDigit(data) {
    var digit = 0;
    while (data !== 0) {
      digit += 1;
      data = data >>> 1;
    }
    return digit;
  }

  function bchTypeInfo(data) {
    var d = data << 10;
    while (bchDigit(d) - bchDigit(G15) >= 0) {
      d ^= G15 << (bchDigit(d) - bchDigit(G15));
    }
    return ((data << 10) | d) ^ G15_MASK;
  }

  function bchTypeNumber(data) {
    var d = data << 12;
    while (bchDigit(d) - bchDigit(G18) >= 0) {
      d ^= G18 << (bchDigit(d) - bchDigit(G18));
    }
    return (data << 12) | d;
  }

  function maskFunc(pattern) {
    switch (pattern) {
      case 0: return function (i, j) { return (i + j) % 2 === 0; };
      case 1: return function (i, j) { return i % 2 === 0; };
      case 2: return function (i, j) { return j % 3 === 0; };
      case 3: return function (i, j) { return (i + j) % 3 === 0; };
      case 4: return function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; };
      case 5: return function (i, j) { return ((i * j) % 2) + ((i * j) % 3) === 0; };
      case 6: return function (i, j) { return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0; };
      case 7: return function (i, j) { return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0; };
    }
  }

  // ---- ビットバッファ ----
  function BitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  BitBuffer.prototype.put = function (num, length) {
    for (var i = 0; i < length; i++) {
      this.putBit(((num >> (length - i - 1)) & 1) === 1);
    }
  };
  BitBuffer.prototype.putBit = function (bit) {
    var bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >> (this.length % 8);
    this.length += 1;
  };

  // ---- GF(256) 多項式の剰余（Reed-Solomon誤り訂正符号の算出） ----
  function polyMod(dividend, divisor) {
    var num = dividend.slice();
    while (num.length > 0 && num[0] === 0) num.shift();
    while (num.length - divisor.length >= 0) {
      var ratio = LOG_TABLE[num[0]] - LOG_TABLE[divisor[0]];
      for (var i = 0; i < divisor.length; i++) {
        var dv = divisor[i];
        if (dv !== 0) num[i] ^= gexp(LOG_TABLE[dv] + ratio);
      }
      while (num.length > 0 && num[0] === 0) num.shift();
    }
    return num;
  }

  function createECCodewords(dataCodewords, ecCount) {
    var generator = RS_POLY_LUT[ecCount];
    var rawPoly = dataCodewords.concat(new Array(ecCount).fill(0));
    var modPoly = polyMod(rawPoly, generator);
    var ec = [];
    var modOffset = modPoly.length - ecCount;
    for (var i = 0; i < ecCount; i++) {
      var modIndex = i + modOffset;
      ec.push(modIndex >= 0 ? modPoly[modIndex] : 0);
    }
    return ec;
  }

  function createBytes(buffer, rsBlocks) {
    var offset = 0;
    var maxDc = 0;
    var maxEc = 0;
    var dcdata = [];
    var ecdata = [];
    rsBlocks.forEach(function (block) {
      var dcCount = block.dataCount;
      var ecCount = block.totalCount - dcCount;
      maxDc = Math.max(maxDc, dcCount);
      maxEc = Math.max(maxEc, ecCount);
      var dc = [];
      for (var i = 0; i < dcCount; i++) dc.push(buffer.buffer[i + offset] & 0xff);
      offset += dcCount;
      dcdata.push(dc);
      ecdata.push(createECCodewords(dc, ecCount));
    });
    var data = [];
    for (var i = 0; i < maxDc; i++) {
      dcdata.forEach(function (dc) {
        if (i < dc.length) data.push(dc[i]);
      });
    }
    for (var i = 0; i < maxEc; i++) {
      ecdata.forEach(function (ec) {
        if (i < ec.length) data.push(ec[i]);
      });
    }
    return data;
  }

  function bitLimitFor(version, level) {
    var total = 0;
    rsBlocksFor(version, level).forEach(function (b) {
      total += b.dataCount;
    });
    return total * 8;
  }

  function chooseVersion(byteLen, level) {
    for (var version = 1; version <= 40; version++) {
      var lengthBits = version < 10 ? 8 : 16;
      var neededBits = 4 + lengthBits + byteLen * 8;
      if (neededBits <= bitLimitFor(version, level)) return version;
    }
    return null;
  }

  function createData(version, level, bytes) {
    var buffer = new BitBuffer();
    buffer.put(4, 4); // MODE_8BIT_BYTE
    var lengthBits = version < 10 ? 8 : 16;
    buffer.put(bytes.length, lengthBits);
    for (var i = 0; i < bytes.length; i++) buffer.put(bytes[i], 8);

    var rsBlocks = rsBlocksFor(version, level);
    var bitLimit = 0;
    rsBlocks.forEach(function (b) {
      bitLimit += b.dataCount * 8;
    });
    if (buffer.length > bitLimit) throw new Error("QR data overflow");

    for (var i = 0; i < Math.min(bitLimit - buffer.length, 4); i++) buffer.putBit(false);
    while (buffer.length % 8 !== 0) buffer.putBit(false);
    var bytesToFill = (bitLimit - buffer.length) / 8;
    for (var i = 0; i < bytesToFill; i++) buffer.put(i % 2 === 0 ? 0xec : 0x11, 8);

    return createBytes(buffer, rsBlocks);
  }

  // ---- マトリクス構築 ----
  function setupPositionProbePattern(modules, count, row, col) {
    for (var r = -1; r <= 7; r++) {
      if (row + r <= -1 || count <= row + r) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c <= -1 || count <= col + c) continue;
        if ((r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6)) || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          modules[row + r][col + c] = true;
        } else {
          modules[row + r][col + c] = false;
        }
      }
    }
  }

  function setupTimingPattern(modules, count) {
    for (var r = 8; r < count - 8; r++) {
      if (modules[r][6] !== null) continue;
      modules[r][6] = r % 2 === 0;
    }
    for (var c = 8; c < count - 8; c++) {
      if (modules[6][c] !== null) continue;
      modules[6][c] = c % 2 === 0;
    }
  }

  function setupPositionAdjustPattern(modules, count, version) {
    var pos = PATTERN_POSITION_TABLE[version - 1];
    for (var i = 0; i < pos.length; i++) {
      for (var j = 0; j < pos.length; j++) {
        var row = pos[i];
        var col = pos[j];
        if (modules[row][col] !== null) continue;
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              modules[row + r][col + c] = true;
            } else {
              modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  function setupTypeNumber(modules, count, version, test) {
    var bits = bchTypeNumber(version);
    for (var i = 0; i < 18; i++) {
      var mod = !test && ((bits >> i) & 1) === 1;
      modules[Math.floor(i / 3)][(i % 3) + count - 8 - 3] = mod;
    }
    for (var i = 0; i < 18; i++) {
      var mod = !test && ((bits >> i) & 1) === 1;
      modules[(i % 3) + count - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  function setupTypeInfo(modules, count, test, maskPattern, level) {
    var data = (EC_LEVEL_BITS[level] << 3) | maskPattern;
    var bits = bchTypeInfo(data);
    for (var i = 0; i < 15; i++) {
      var mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) modules[i][8] = mod;
      else if (i < 8) modules[i + 1][8] = mod;
      else modules[count - 15 + i][8] = mod;
    }
    for (var i = 0; i < 15; i++) {
      var mod = !test && ((bits >> i) & 1) === 1;
      if (i < 8) modules[8][count - i - 1] = mod;
      else if (i < 9) modules[8][15 - i - 1 + 1] = mod;
      else modules[8][15 - i - 1] = mod;
    }
    modules[count - 8][8] = !test;
  }

  function mapData(modules, count, data, maskPattern) {
    var inc = -1;
    var row = count - 1;
    var bitIndex = 7;
    var byteIndex = 0;
    var maskF = maskFunc(maskPattern);
    var dataLen = data.length;

    for (var col = count - 1; col > 0; col -= 2) {
      if (col <= 6) col -= 1;
      var colRange = [col, col - 1];
      for (;;) {
        for (var ci = 0; ci < 2; ci++) {
          var c = colRange[ci];
          if (modules[row][c] === null) {
            var dark = false;
            if (byteIndex < dataLen) dark = ((data[byteIndex] >> bitIndex) & 1) === 1;
            if (maskF(row, c)) dark = !dark;
            modules[row][c] = dark;
            bitIndex -= 1;
            if (bitIndex === -1) {
              byteIndex += 1;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || count <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  // ---- マスク評価（ペナルティスコア） ----
  function lostPointLevel1(modules, count) {
    var lost = 0;
    for (var row = 0; row < count; row++) {
      var prev = modules[row][0];
      var len = 0;
      for (var col = 0; col < count; col++) {
        if (modules[row][col] === prev) {
          len += 1;
        } else {
          if (len >= 5) lost += len - 2;
          len = 1;
          prev = modules[row][col];
        }
      }
      if (len >= 5) lost += len - 2;
    }
    for (var col = 0; col < count; col++) {
      var prev = modules[0][col];
      var len = 0;
      for (var row = 0; row < count; row++) {
        if (modules[row][col] === prev) {
          len += 1;
        } else {
          if (len >= 5) lost += len - 2;
          len = 1;
          prev = modules[row][col];
        }
      }
      if (len >= 5) lost += len - 2;
    }
    return lost;
  }

  function lostPointLevel2(modules, count) {
    var lost = 0;
    for (var row = 0; row < count - 1; row++) {
      for (var col = 0; col < count - 1; col++) {
        var a = modules[row][col];
        if (a === modules[row][col + 1] && a === modules[row + 1][col] && a === modules[row + 1][col + 1]) {
          lost += 3;
        }
      }
    }
    return lost;
  }

  function lostPointLevel3(modules, count) {
    var lost = 0;
    for (var row = 0; row < count; row++) {
      for (var col = 0; col < count - 10; col++) {
        if (
          !modules[row][col + 1] &&
          modules[row][col + 4] &&
          !modules[row][col + 5] &&
          modules[row][col + 6] &&
          !modules[row][col + 9] &&
          ((modules[row][col + 0] && modules[row][col + 2] && modules[row][col + 3] && !modules[row][col + 7] && !modules[row][col + 8] && !modules[row][col + 10]) ||
            (!modules[row][col + 0] && !modules[row][col + 2] && !modules[row][col + 3] && modules[row][col + 7] && modules[row][col + 8] && modules[row][col + 10]))
        ) {
          lost += 40;
        }
      }
    }
    for (var col = 0; col < count; col++) {
      for (var row = 0; row < count - 10; row++) {
        if (
          !modules[row + 1][col] &&
          modules[row + 4][col] &&
          !modules[row + 5][col] &&
          modules[row + 6][col] &&
          !modules[row + 9][col] &&
          ((modules[row + 0][col] && modules[row + 2][col] && modules[row + 3][col] && !modules[row + 7][col] && !modules[row + 8][col] && !modules[row + 10][col]) ||
            (!modules[row + 0][col] && !modules[row + 2][col] && !modules[row + 3][col] && modules[row + 7][col] && modules[row + 8][col] && modules[row + 10][col]))
        ) {
          lost += 40;
        }
      }
    }
    return lost;
  }

  function lostPointLevel4(modules, count) {
    var dark = 0;
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (modules[r][c]) dark += 1;
      }
    }
    var percent = dark / (count * count);
    var rating = Math.floor(Math.abs(percent * 100 - 50) / 5);
    return rating * 10;
  }

  function lostPoint(modules, count) {
    return lostPointLevel1(modules, count) + lostPointLevel2(modules, count) + lostPointLevel3(modules, count) + lostPointLevel4(modules, count);
  }

  function toUtf8Bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff) {
        i += 1;
        var low = str.charCodeAt(i);
        var codepoint = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        bytes.push(
          0xf0 | (codepoint >> 18),
          0x80 | ((codepoint >> 12) & 0x3f),
          0x80 | ((codepoint >> 6) & 0x3f),
          0x80 | (codepoint & 0x3f)
        );
      } else {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    return bytes;
  }

  function buildMatrix(bytes, level) {
    var version = chooseVersion(bytes.length, level);
    if (!version) return null;
    var count = version * 4 + 17;

    function blankModules() {
      var m = [];
      for (var i = 0; i < count; i++) m.push(new Array(count).fill(null));
      setupPositionProbePattern(m, count, 0, 0);
      setupPositionProbePattern(m, count, count - 7, 0);
      setupPositionProbePattern(m, count, 0, count - 7);
      setupPositionAdjustPattern(m, count, version);
      setupTimingPattern(m, count);
      return m;
    }

    var dataCache = createData(version, level, bytes);

    var bestMask = 0;
    var bestLost = null;
    for (var mp = 0; mp < 8; mp++) {
      var trial = blankModules();
      setupTypeInfo(trial, count, true, mp, level);
      if (version >= 7) setupTypeNumber(trial, count, version, true);
      mapData(trial, count, dataCache, mp);
      var lost = lostPoint(trial, count);
      if (bestLost === null || lost < bestLost) {
        bestLost = lost;
        bestMask = mp;
      }
    }

    var modules = blankModules();
    setupTypeInfo(modules, count, false, bestMask, level);
    if (version >= 7) setupTypeNumber(modules, count, version, false);
    mapData(modules, count, dataCache, bestMask);

    return { modules: modules, count: count, version: version };
  }

  function generateMatrix(text, level) {
    var bytes = toUtf8Bytes(text);
    return buildMatrix(bytes, level || "L");
  }

  function renderToCanvas(canvas, text, options) {
    options = options || {};
    var level = options.level || "L";
    var scale = options.scale || 4;
    var margin = options.margin === undefined ? 4 : options.margin;
    var result = generateMatrix(text, level);
    if (!result) return null;
    var size = (result.count + margin * 2) * scale;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    for (var r = 0; r < result.count; r++) {
      for (var c = 0; c < result.count; c++) {
        if (result.modules[r][c]) {
          ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
        }
      }
    }
    return result;
  }

  window.PriTestQRCode = {
    generateMatrix: generateMatrix,
    renderToCanvas: renderToCanvas,
  };
})();
