export class FakeHash {
    private keys = [ ]
    private vals = [ ]

    put(key: any, val: any) {
        var idx = this.keys.indexOf(key)
        if (idx < 0) {
            this.keys.push(key)
            this.vals.push(val)
        }
        else {
            this.vals[idx] = val
        }
        return val
    }

    get(key: any) {
        return this.vals[this.keys.indexOf(key)]
    }

    key(i: number = undefined) {
        return typeof i === 'number' ? this.keys[i] : this.keys.slice()
    }

    val(i: number = undefined) {
        return typeof i === 'number' ? this.vals[i] : this.vals.slice()
    }
}

export function debounce<T extends Function>(func: T, delay: number): T {
    var timeout = 0
    return function() {
        if (timeout)
            clearTimeout(timeout)
        var that = this,
            args = arguments
        timeout = setTimeout(function () {
            func.apply(that, args)
            timeout = 0
        }, delay)
    } as any
}

export function throttle<T extends Function>(func: T, interval: number): T {
    var timeout = 0
    return function exec() {
        if (timeout)
            return
        var that = this,
            args = arguments
        timeout = setTimeout(function () {
            func.apply(that, args)
            timeout = 0
        }, interval)
    } as any
}

export function clamp(x: number, min: number, max: number) {
    return x < min ? min : (x > max ? max : x)
}

// copied from https://github.com/legomushroom/mojs-demo-1/blob/master/dist%2Fmain.js
// TODO: rewrite this
export function generateBezier(mX1, mY1, mX2, mY2) {
    var A, B, C, NEWTON_ITERATIONS, NEWTON_MIN_SLOPE, SUBDIVISION_MAX_ITERATIONS, SUBDIVISION_PRECISION, _precomputed, binarySubdivide, calcBezier, calcSampleValues, f, float32ArraySupported, getSlope, getTForX, i, isNan, kSampleStepSize, kSplineTableSize, mSampleValues, newtonRaphsonIterate, precompute;
    NEWTON_ITERATIONS = 4;
    NEWTON_MIN_SLOPE = 0.001;
    SUBDIVISION_PRECISION = 0.0000001;
    SUBDIVISION_MAX_ITERATIONS = 10;
    kSplineTableSize = 11;
    kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
    float32ArraySupported = [].indexOf.call(window, 'Float32Array') >= 0;

    /* Must contain four arguments. */
    A = function(aA1, aA2) {
      return 1.0 - 3.0 * aA2 + 3.0 * aA1;
    };
    B = function(aA1, aA2) {
      return 3.0 * aA2 - 6.0 * aA1;
    };
    C = function(aA1) {
      return 3.0 * aA1;
    };
    calcBezier = function(aT, aA1, aA2) {
      return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
    };
    getSlope = function(aT, aA1, aA2) {
      return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    };
    newtonRaphsonIterate = function(aX, aGuessT) {
      var currentSlope, currentX, i;
      i = 0;
      while (i < NEWTON_ITERATIONS) {
        currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0.0) {
          return aGuessT;
        }
        currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
        ++i;
      }
      return aGuessT;
    };
    calcSampleValues = function() {
      var i;
      i = 0;
      while (i < kSplineTableSize) {
        mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        ++i;
      }
    };
    binarySubdivide = function(aX, aA, aB) {
      var currentT, currentX, i, isSubDiv;
      currentX = void 0;
      currentT = void 0;
      i = 0;
      while (true) {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
          aB = currentT;
        } else {
          aA = currentT;
        }
        isSubDiv = Math.abs(currentX) > SUBDIVISION_PRECISION;
        if (!(isSubDiv && ++i < SUBDIVISION_MAX_ITERATIONS)) {
          break;
        }
      }
      return currentT;
    };
    getTForX = function(aX) {
      var currentSample, dist, guessForT, initialSlope, intervalStart, lastSample, one;
      intervalStart = 0.0;
      currentSample = 1;
      lastSample = kSplineTableSize - 1;
      while (currentSample !== lastSample && mSampleValues[currentSample] <= aX) {
        intervalStart += kSampleStepSize;
        ++currentSample;
      }
      --currentSample;
      one = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1], dist = one - mSampleValues[currentSample]);
      guessForT = intervalStart + dist * kSampleStepSize;
      initialSlope = getSlope(guessForT, mX1, mX2);
      if (initialSlope >= NEWTON_MIN_SLOPE) {
        return newtonRaphsonIterate(aX, guessForT);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
      }
    };
    precompute = function() {
      var _precomputed;
      _precomputed = true;
      if (mX1 !== mY1 || mX2 !== mY2) {
        calcSampleValues();
      }
    };
    if (arguments.length !== 4) {
      return false;
    }

    /* Arguments must be numbers. */
    i = 0;
    while (i < 4) {
      isNan = isNaN(arguments[i]);
      if (typeof arguments[i] !== 'number' || isNan || !isFinite(arguments[i])) {
        return false;
      }
      ++i;
    }

    /* X values must be in the [0, 1] range. */
    mX1 = Math.min(mX1, 1);
    mX2 = Math.min(mX2, 1);
    mX1 = Math.max(mX1, 0);
    mX2 = Math.max(mX2, 0);
    mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    _precomputed = false;
    f = function(aX) {
      if (!_precomputed) {
        precompute();
      }
      if (mX1 === mY1 && mX2 === mY2) {
        return aX;
      }
      if (aX === 0) {
        return 0;
      }
      if (aX === 1) {
        return 1;
      }
      return calcBezier(getTForX(aX), mY1, mY2);
    };
    f.getControlPoints = function() {
      return [
        {
          x: mX1,
          y: mY1
        }, {
          x: mX2,
          y: mY2
        }
      ];
    };
    return f;
  };
