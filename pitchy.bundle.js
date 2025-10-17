// Pitchy library bundled for browser use
// Contains fft.js and pitchy combined into a single file

(function(window) {
  'use strict';

  // ============================================================================
  // FFT.JS - Fast Fourier Transform library
  // ============================================================================

  function FFT(size) {
    this.size = size | 0;
    if (this.size <= 1 || (this.size & (this.size - 1)) !== 0)
      throw new Error('FFT size must be a power of two and bigger than 1');

    this._csize = size << 1;

    var table = new Array(this.size * 2);
    for (var i = 0; i < table.length; i += 2) {
      const angle = Math.PI * i / this.size;
      table[i] = Math.cos(angle);
      table[i + 1] = -Math.sin(angle);
    }
    this.table = table;

    var power = 0;
    for (var t = 1; this.size > t; t <<= 1)
      power++;

    this._width = power % 2 === 0 ? power - 1 : power;

    this._bitrev = new Array(1 << this._width);
    for (var j = 0; j < this._bitrev.length; j++) {
      this._bitrev[j] = 0;
      for (var shift = 0; shift < this._width; shift += 2) {
        var revShift = this._width - shift - 2;
        this._bitrev[j] |= ((j >>> shift) & 3) << revShift;
      }
    }

    this._out = null;
    this._data = null;
    this._inv = 0;
  }

  FFT.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
    var res = storage || new Array(complex.length >>> 1);
    for (var i = 0; i < complex.length; i += 2)
      res[i >>> 1] = complex[i];
    return res;
  };

  FFT.prototype.createComplexArray = function createComplexArray() {
    const res = new Array(this._csize);
    for (var i = 0; i < res.length; i++)
      res[i] = 0;
    return res;
  };

  FFT.prototype.toComplexArray = function toComplexArray(input, storage) {
    var res = storage || this.createComplexArray();
    for (var i = 0; i < res.length; i += 2) {
      res[i] = input[i >>> 1];
      res[i + 1] = 0;
    }
    return res;
  };

  FFT.prototype.completeSpectrum = function completeSpectrum(spectrum) {
    var size = this._csize;
    var half = size >>> 1;
    for (var i = 2; i < half; i += 2) {
      spectrum[size - i] = spectrum[i];
      spectrum[size - i + 1] = -spectrum[i + 1];
    }
  };

  FFT.prototype.transform = function transform(out, data) {
    if (out === data)
      throw new Error('Input and output buffers must be different');

    this._out = out;
    this._data = data;
    this._inv = 0;
    this._transform4();
    this._out = null;
    this._data = null;
  };

  FFT.prototype.realTransform = function realTransform(out, data) {
    if (out === data)
      throw new Error('Input and output buffers must be different');

    this._out = out;
    this._data = data;
    this._inv = 0;
    this._realTransform4();
    this._out = null;
    this._data = null;
  };

  FFT.prototype.inverseTransform = function inverseTransform(out, data) {
    if (out === data)
      throw new Error('Input and output buffers must be different');

    this._out = out;
    this._data = data;
    this._inv = 1;
    this._transform4();
    for (var i = 0; i < out.length; i++)
      out[i] /= this.size;
    this._out = null;
    this._data = null;
  };

  FFT.prototype._transform4 = function _transform4() {
    var out = this._out;
    var size = this._csize;

    var width = this._width;
    var step = 1 << width;
    var len = (size / step) << 1;

    var outOff;
    var t;
    var bitrev = this._bitrev;
    if (len === 4) {
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = bitrev[t];
        this._singleTransform2(outOff, off, step);
      }
    } else {
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = bitrev[t];
        this._singleTransform4(outOff, off, step);
      }
    }

    var inv = this._inv ? -1 : 1;
    var table = this.table;
    for (step >>= 2; step >= 2; step >>= 2) {
      len = (size / step) << 1;
      var quarterLen = len >>> 2;

      for (outOff = 0; outOff < size; outOff += len) {
        var limit = outOff + quarterLen;
        for (var i = outOff, k = 0; i < limit; i += 2, k += step) {
          const A = i;
          const B = A + quarterLen;
          const C = B + quarterLen;
          const D = C + quarterLen;

          const Ar = out[A];
          const Ai = out[A + 1];
          const Br = out[B];
          const Bi = out[B + 1];
          const Cr = out[C];
          const Ci = out[C + 1];
          const Dr = out[D];
          const Di = out[D + 1];

          const MAr = Ar;
          const MAi = Ai;

          const tableBr = table[k];
          const tableBi = inv * table[k + 1];
          const MBr = Br * tableBr - Bi * tableBi;
          const MBi = Br * tableBi + Bi * tableBr;

          const tableCr = table[2 * k];
          const tableCi = inv * table[2 * k + 1];
          const MCr = Cr * tableCr - Ci * tableCi;
          const MCi = Cr * tableCi + Ci * tableCr;

          const tableDr = table[3 * k];
          const tableDi = inv * table[3 * k + 1];
          const MDr = Dr * tableDr - Di * tableDi;
          const MDi = Dr * tableDi + Di * tableDr;

          const T0r = MAr + MCr;
          const T0i = MAi + MCi;
          const T1r = MAr - MCr;
          const T1i = MAi - MCi;
          const T2r = MBr + MDr;
          const T2i = MBi + MDi;
          const T3r = inv * (MBr - MDr);
          const T3i = inv * (MBi - MDi);

          const FAr = T0r + T2r;
          const FAi = T0i + T2i;
          const FCr = T0r - T2r;
          const FCi = T0i - T2i;
          const FBr = T1r + T3i;
          const FBi = T1i - T3r;
          const FDr = T1r - T3i;
          const FDi = T1i + T3r;

          out[A] = FAr;
          out[A + 1] = FAi;
          out[B] = FBr;
          out[B + 1] = FBi;
          out[C] = FCr;
          out[C + 1] = FCi;
          out[D] = FDr;
          out[D + 1] = FDi;
        }
      }
    }
  };

  FFT.prototype._singleTransform2 = function _singleTransform2(outOff, off, step) {
    const out = this._out;
    const data = this._data;

    const evenR = data[off];
    const evenI = data[off + 1];
    const oddR = data[off + step];
    const oddI = data[off + step + 1];

    const leftR = evenR + oddR;
    const leftI = evenI + oddI;
    const rightR = evenR - oddR;
    const rightI = evenI - oddI;

    out[outOff] = leftR;
    out[outOff + 1] = leftI;
    out[outOff + 2] = rightR;
    out[outOff + 3] = rightI;
  };

  FFT.prototype._singleTransform4 = function _singleTransform4(outOff, off, step) {
    const out = this._out;
    const data = this._data;
    const inv = this._inv ? -1 : 1;
    const step2 = step * 2;
    const step3 = step * 3;

    const Ar = data[off];
    const Ai = data[off + 1];
    const Br = data[off + step];
    const Bi = data[off + step + 1];
    const Cr = data[off + step2];
    const Ci = data[off + step2 + 1];
    const Dr = data[off + step3];
    const Di = data[off + step3 + 1];

    const T0r = Ar + Cr;
    const T0i = Ai + Ci;
    const T1r = Ar - Cr;
    const T1i = Ai - Ci;
    const T2r = Br + Dr;
    const T2i = Bi + Di;
    const T3r = inv * (Br - Dr);
    const T3i = inv * (Bi - Di);

    const FAr = T0r + T2r;
    const FAi = T0i + T2i;
    const FBr = T1r + T3i;
    const FBi = T1i - T3r;
    const FCr = T0r - T2r;
    const FCi = T0i - T2i;
    const FDr = T1r - T3i;
    const FDi = T1i + T3r;

    out[outOff] = FAr;
    out[outOff + 1] = FAi;
    out[outOff + 2] = FBr;
    out[outOff + 3] = FBi;
    out[outOff + 4] = FCr;
    out[outOff + 5] = FCi;
    out[outOff + 6] = FDr;
    out[outOff + 7] = FDi;
  };

  FFT.prototype._realTransform4 = function _realTransform4() {
    var out = this._out;
    var size = this._csize;

    var width = this._width;
    var step = 1 << width;
    var len = (size / step) << 1;

    var outOff;
    var t;
    var bitrev = this._bitrev;
    if (len === 4) {
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = bitrev[t];
        this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
      }
    } else {
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = bitrev[t];
        this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
      }
    }

    var inv = this._inv ? -1 : 1;
    var table = this.table;
    for (step >>= 2; step >= 2; step >>= 2) {
      len = (size / step) << 1;
      var halfLen = len >>> 1;
      var quarterLen = halfLen >>> 1;
      var hquarterLen = quarterLen >>> 1;

      for (outOff = 0; outOff < size; outOff += len) {
        for (var i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
          var A = outOff + i;
          var B = A + quarterLen;
          var C = B + quarterLen;
          var D = C + quarterLen;

          var Ar = out[A];
          var Ai = out[A + 1];
          var Br = out[B];
          var Bi = out[B + 1];
          var Cr = out[C];
          var Ci = out[C + 1];
          var Dr = out[D];
          var Di = out[D + 1];

          var MAr = Ar;
          var MAi = Ai;

          var tableBr = table[k];
          var tableBi = inv * table[k + 1];
          var MBr = Br * tableBr - Bi * tableBi;
          var MBi = Br * tableBi + Bi * tableBr;

          var tableCr = table[2 * k];
          var tableCi = inv * table[2 * k + 1];
          var MCr = Cr * tableCr - Ci * tableCi;
          var MCi = Cr * tableCi + Ci * tableCr;

          var tableDr = table[3 * k];
          var tableDi = inv * table[3 * k + 1];
          var MDr = Dr * tableDr - Di * tableDi;
          var MDi = Dr * tableDi + Di * tableDr;

          var T0r = MAr + MCr;
          var T0i = MAi + MCi;
          var T1r = MAr - MCr;
          var T1i = MAi - MCi;
          var T2r = MBr + MDr;
          var T2i = MBi + MDi;
          var T3r = inv * (MBr - MDr);
          var T3i = inv * (MBi - MDi);

          var FAr = T0r + T2r;
          var FAi = T0i + T2i;
          var FBr = T1r + T3i;
          var FBi = T1i - T3r;

          out[A] = FAr;
          out[A + 1] = FAi;
          out[B] = FBr;
          out[B + 1] = FBi;

          if (i === 0) {
            var FCr = T0r - T2r;
            var FCi = T0i - T2i;
            out[C] = FCr;
            out[C + 1] = FCi;
            continue;
          }

          if (i === hquarterLen)
            continue;

          var ST0r = T1r;
          var ST0i = -T1i;
          var ST1r = T0r;
          var ST1i = -T0i;
          var ST2r = -inv * T3i;
          var ST2i = -inv * T3r;
          var ST3r = -inv * T2i;
          var ST3i = -inv * T2r;

          var SFAr = ST0r + ST2r;
          var SFAi = ST0i + ST2i;
          var SFBr = ST1r + ST3i;
          var SFBi = ST1i - ST3r;

          var SA = outOff + quarterLen - i;
          var SB = outOff + halfLen - i;

          out[SA] = SFAr;
          out[SA + 1] = SFAi;
          out[SB] = SFBr;
          out[SB + 1] = SFBi;
        }
      }
    }
  };

  FFT.prototype._singleRealTransform2 = function _singleRealTransform2(outOff, off, step) {
    const out = this._out;
    const data = this._data;

    const evenR = data[off];
    const oddR = data[off + step];

    const leftR = evenR + oddR;
    const rightR = evenR - oddR;

    out[outOff] = leftR;
    out[outOff + 1] = 0;
    out[outOff + 2] = rightR;
    out[outOff + 3] = 0;
  };

  FFT.prototype._singleRealTransform4 = function _singleRealTransform4(outOff, off, step) {
    const out = this._out;
    const data = this._data;
    const inv = this._inv ? -1 : 1;
    const step2 = step * 2;
    const step3 = step * 3;

    const Ar = data[off];
    const Br = data[off + step];
    const Cr = data[off + step2];
    const Dr = data[off + step3];

    const T0r = Ar + Cr;
    const T1r = Ar - Cr;
    const T2r = Br + Dr;
    const T3r = inv * (Br - Dr);

    const FAr = T0r + T2r;
    const FBr = T1r;
    const FBi = -T3r;
    const FCr = T0r - T2r;
    const FDr = T1r;
    const FDi = T3r;

    out[outOff] = FAr;
    out[outOff + 1] = 0;
    out[outOff + 2] = FBr;
    out[outOff + 3] = FBi;
    out[outOff + 4] = FCr;
    out[outOff + 5] = 0;
    out[outOff + 6] = FDr;
    out[outOff + 7] = FDi;
  };

  // ============================================================================
  // PITCHY - Pitch Detection Library (McLeod Pitch Method)
  // ============================================================================

  function ceilPow2(v) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
  }

  class Autocorrelator {
    constructor(inputLength, bufferSupplier) {
      if (inputLength < 1) {
        throw new Error('Input length must be at least one');
      }
      this._inputLength = inputLength;
      this._fft = new FFT(ceilPow2(2 * inputLength));
      this._bufferSupplier = bufferSupplier;
      this._paddedInputBuffer = this._bufferSupplier(this._fft.size);
      this._transformBuffer = this._bufferSupplier(2 * this._fft.size);
      this._inverseBuffer = this._bufferSupplier(2 * this._fft.size);
    }

    static forFloat32Array(inputLength) {
      return new Autocorrelator(inputLength, (length) => new Float32Array(length));
    }

    static forFloat64Array(inputLength) {
      return new Autocorrelator(inputLength, (length) => new Float64Array(length));
    }

    static forNumberArray(inputLength) {
      return new Autocorrelator(inputLength, (length) => Array(length));
    }

    get inputLength() {
      return this._inputLength;
    }

    autocorrelate(input, output = this._bufferSupplier(input.length)) {
      if (input.length !== this._inputLength) {
        throw new Error(
          `Input must have length ${this._inputLength} but had length ${input.length}`
        );
      }

      for (let i = 0; i < input.length; i++) {
        this._paddedInputBuffer[i] = input[i];
      }
      for (let i = input.length; i < this._paddedInputBuffer.length; i++) {
        this._paddedInputBuffer[i] = 0;
      }

      this._fft.realTransform(this._transformBuffer, this._paddedInputBuffer);
      this._fft.completeSpectrum(this._transformBuffer);

      const tb = this._transformBuffer;
      for (let i = 0; i < tb.length; i += 2) {
        tb[i] = tb[i] * tb[i] + tb[i + 1] * tb[i + 1];
        tb[i + 1] = 0;
      }

      this._fft.inverseTransform(this._inverseBuffer, this._transformBuffer);

      for (let i = 0; i < input.length; i++) {
        output[i] = this._inverseBuffer[2 * i];
      }
      return output;
    }
  }

  function getKeyMaximumIndices(input) {
    const keyIndices = [];
    let lookingForMaximum = false;
    let max = -Infinity;
    let maxIndex = -1;

    for (let i = 1; i < input.length - 1; i++) {
      if (input[i - 1] <= 0 && input[i] > 0) {
        lookingForMaximum = true;
        maxIndex = i;
        max = input[i];
      } else if (input[i - 1] > 0 && input[i] <= 0) {
        lookingForMaximum = false;
        if (maxIndex !== -1) {
          keyIndices.push(maxIndex);
        }
      } else if (lookingForMaximum && input[i] > max) {
        max = input[i];
        maxIndex = i;
      }
    }

    return keyIndices;
  }

  function refineResultIndex(index, data) {
    const [x0, x1, x2] = [index - 1, index, index + 1];
    const [y0, y1, y2] = [data[x0], data[x1], data[x2]];

    const a = y0 / 2 - y1 + y2 / 2;
    const b = -(y0 / 2) * (x1 + x2) + y1 * (x0 + x2) - (y2 / 2) * (x0 + x1);
    const c = (y0 * x1 * x2) / 2 - y1 * x0 * x2 + (y2 * x0 * x1) / 2;

    const xMax = -b / (2 * a);
    const yMax = a * xMax * xMax + b * xMax + c;
    return [xMax, yMax];
  }

  class PitchDetector {
    constructor(inputLength, bufferSupplier) {
      this._autocorrelator = new Autocorrelator(inputLength, bufferSupplier);
      this._nsdfBuffer = bufferSupplier(inputLength);
      this._clarityThreshold = 0.9;
      this._minVolumeAbsolute = 0.0;
      this._maxInputAmplitude = 1.0;
    }

    static forFloat32Array(inputLength) {
      return new PitchDetector(inputLength, (length) => new Float32Array(length));
    }

    static forFloat64Array(inputLength) {
      return new PitchDetector(inputLength, (length) => new Float64Array(length));
    }

    static forNumberArray(inputLength) {
      return new PitchDetector(inputLength, (length) => Array(length));
    }

    get inputLength() {
      return this._autocorrelator.inputLength;
    }

    set clarityThreshold(threshold) {
      if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
        throw new Error('clarityThreshold must be a number in the range (0, 1]');
      }
      this._clarityThreshold = threshold;
    }

    set minVolumeAbsolute(volume) {
      if (!Number.isFinite(volume) || volume < 0 || volume > this._maxInputAmplitude) {
        throw new Error(
          `minVolumeAbsolute must be a number in the range [0, ${this._maxInputAmplitude}]`
        );
      }
      this._minVolumeAbsolute = volume;
    }

    set minVolumeDecibels(db) {
      if (!Number.isFinite(db) || db > 0) {
        throw new Error('minVolumeDecibels must be a number <= 0');
      }
      this._minVolumeAbsolute = this._maxInputAmplitude * 10 ** (db / 10);
    }

    set maxInputAmplitude(amplitude) {
      if (!Number.isFinite(amplitude) || amplitude <= 0) {
        throw new Error('maxInputAmplitude must be a number > 0');
      }
      this._maxInputAmplitude = amplitude;
    }

    findPitch(input, sampleRate) {
      if (this._belowMinimumVolume(input)) return [0, 0];
      this._nsdf(input);
      const keyMaximumIndices = getKeyMaximumIndices(this._nsdfBuffer);
      if (keyMaximumIndices.length === 0) {
        return [0, 0];
      }

      const nMax = Math.max(...keyMaximumIndices.map((i) => this._nsdfBuffer[i]));
      const resultIndex = keyMaximumIndices.find(
        (i) => this._nsdfBuffer[i] >= this._clarityThreshold * nMax
      );

      const [refinedResultIndex, clarity] = refineResultIndex(resultIndex, this._nsdfBuffer);

      return [sampleRate / refinedResultIndex, Math.min(clarity, 1.0)];
    }

    _belowMinimumVolume(input) {
      if (this._minVolumeAbsolute === 0) return false;
      let squareSum = 0;
      for (let i = 0; i < input.length; i++) {
        squareSum += input[i] ** 2;
      }
      return Math.sqrt(squareSum / input.length) < this._minVolumeAbsolute;
    }

    _nsdf(input) {
      this._autocorrelator.autocorrelate(input, this._nsdfBuffer);

      let m = 2 * this._nsdfBuffer[0];
      let i;
      for (i = 0; i < this._nsdfBuffer.length && m > 0; i++) {
        this._nsdfBuffer[i] = (2 * this._nsdfBuffer[i]) / m;
        m -= input[i] ** 2 + input[input.length - i - 1] ** 2;
      }

      for (; i < this._nsdfBuffer.length; i++) {
        this._nsdfBuffer[i] = 0;
      }
    }
  }

  // Export to window object
  window.Pitchy = {
    PitchDetector: PitchDetector,
    Autocorrelator: Autocorrelator
  };

  console.log('Pitchy library loaded successfully (bundled version)');

})(window);
