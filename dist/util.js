"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.divide = exports.bigintToFixed = exports.moneyValueToBigInt = exports.Round = exports.PRECISION_M = exports.PRECISION = exports.PRECISION_I = void 0;
const errors_1 = require("./errors");
const money_1 = require("./money");
const bn_js_1 = __importDefault(require("bn.js"));
// How many digits we support
exports.PRECISION_I = 20;
// BigInteger version. We keep both so there's less conversions.
exports.PRECISION = new bn_js_1.default(exports.PRECISION_I);
// Multiplication factor for internal values
exports.PRECISION_M = new bn_js_1.default(10).pow(exports.PRECISION);
var Round;
(function (Round) {
    // The following rules are round to the nearest integer, but have different
    // rules for when it's right in the middle (.5).
    Round[Round["HALF_TO_EVEN"] = 1] = "HALF_TO_EVEN";
    Round[Round["BANKERS"] = 1] = "BANKERS";
    Round[Round["HALF_AWAY_FROM_0"] = 2] = "HALF_AWAY_FROM_0";
    Round[Round["HALF_TOWARDS_0"] = 3] = "HALF_TOWARDS_0";
    // These cases don't always round to the nearest integer
    Round[Round["TOWARDS_0"] = 11] = "TOWARDS_0";
    Round[Round["TRUNCATE"] = 11] = "TRUNCATE";
})(Round = exports.Round || (exports.Round = {}));
/**
 * This helper function takes a string, number or anything that can
 * be used in the constructor of a Money object, and returns a BigInteger
 * with adjusted precision.
 */
function moneyValueToBigInt(input, round) {
    if (input instanceof money_1.Money) {
        return input.toSource();
    }
    if (input instanceof bn_js_1.default) {
        return input.mul(exports.PRECISION_M);
    }
    switch (typeof input) {
        case 'string': {
            const parts = input.match(/^(-)?([0-9]*)?(\.([0-9]*))?$/);
            if (!parts) {
                throw new TypeError('Input string must follow the pattern (-)##.## or -##');
            }
            const signPart = parts[1]; // Positive or negative
            const wholePart = parts[2]; // Whole numbers.
            const fracPart = parts[4];
            let output;
            // The whole part
            if (wholePart === undefined) {
                // For numbers like ".04" this part will be undefined.
                output = new bn_js_1.default(0);
            }
            else {
                output = new bn_js_1.default(wholePart).mul(exports.PRECISION_M);
            }
            if (fracPart !== undefined) {
                // The fractional part
                const precisionDifference = exports.PRECISION.sub(new bn_js_1.default(fracPart.length));
                if (precisionDifference.cmp(new bn_js_1.default(0)) !== -1) {
                    // Add 0's
                    output = output.add(new bn_js_1.default(fracPart).mul(new bn_js_1.default(10).pow(precisionDifference)));
                }
                else {
                    // Remove 0's
                    output = divide(new bn_js_1.default(fracPart), new bn_js_1.default(10).pow(precisionDifference.neg()), round);
                }
            }
            // negative ?
            if (signPart === '-') {
                output = output.neg();
            }
            return output;
        }
        case 'number':
            if (!Number.isSafeInteger(input)) {
                throw new errors_1.UnsafeIntegerError('The number ' + input + ' is not a "safe" integer. It must be converted before passing it');
            }
            return new bn_js_1.default(input).mul(exports.PRECISION_M);
        default:
            throw new TypeError('value must be a safe integer, bigint or string');
    }
}
exports.moneyValueToBigInt = moneyValueToBigInt;
/**
 * This function takes a BigInteger that was multiplied by PRECISON_M, and returns
 * a human readable string value with a specified precision.
 *
 * Precision is the number of decimals that are returned.
 */
function bigintToFixed(value, precision, round) {
    if (precision === 0) {
        // No decimals were requested.
        return divide(value, exports.PRECISION_M, round).toString(10);
    }
    let wholePart = value.div(exports.PRECISION_M);
    const negative = value.isNeg();
    let remainder = value.mod(exports.PRECISION_M);
    if (new bn_js_1.default(precision).cmp(exports.PRECISION) === 1) {
        // More precision was requested than we have, so we multiply
        // to add more 0's
        remainder = remainder.mul(new bn_js_1.default(10).pow(new bn_js_1.default(precision).sub(exports.PRECISION)));
    }
    else {
        // Less precision was requested, so we round
        remainder = divide(remainder, new bn_js_1.default(10).pow(new bn_js_1.default(exports.PRECISION).sub(new bn_js_1.default(precision))), round);
    }
    if (remainder.isNeg()) {
        remainder = remainder.neg();
    }
    let remainderStr = remainder.toString(10).padStart(precision, '0');
    if (remainderStr.length > precision) {
        // The remainder rounded all the way up to the the 'whole part'
        wholePart = wholePart.add(negative ? new bn_js_1.default(-1) : new bn_js_1.default(1));
        remainder = new bn_js_1.default(0);
        remainderStr = '0'.repeat(precision);
    }
    let wholePartStr = wholePart.toString(10);
    if (wholePartStr === '0' && negative) {
        wholePartStr = '-0';
    }
    return wholePartStr + '.' + remainderStr;
}
exports.bigintToFixed = bigintToFixed;
/**
 * This function takes 2 bigints and divides them.
 *
 * By default ecmascript will round to 0. For example,
 * 5n / 2n yields 2n.
 *
 * This function rounds to the nearest even number, also
 * known as 'bankers rounding'.
 */
function divide(a, b, round) {
    // Get absolute versions. We'll deal with the negatives later.
    const aAbs = new bn_js_1.default(a).abs();
    const bAbs = new bn_js_1.default(b).abs();
    let result = aAbs.div(bAbs);
    const rem = aAbs.mod(bAbs);
    // if remainder > half divisor
    if (rem.mul(new bn_js_1.default(2)).cmp(bAbs) === 1) {
        switch (round) {
            case Round.TRUNCATE:
                // do nothing
                break;
            default:
                // We should have rounded up instead of down.
                result = result.add(new bn_js_1.default(1));
                break;
        }
    }
    else if (rem.mul(new bn_js_1.default(2)).eq(bAbs)) {
        // If the remainder is exactly half the divisor, it means that the result is
        // exactly in between two numbers and we need to apply a specific rounding
        // method.
        switch (round) {
            case Round.HALF_TO_EVEN:
                // Add 1 if result is odd to get an even return value
                if (result.isOdd()) {
                    result = result.add(new bn_js_1.default(1));
                }
                break;
            case Round.HALF_AWAY_FROM_0:
                result = result.add(new bn_js_1.default(1));
                break;
            case Round.TRUNCATE:
            case Round.HALF_TOWARDS_0:
                // Do nothing
                break;
        }
    }
    if (!a.isNeg() !== !b.isNeg()) {
        // Either a XOR b is negative
        return new bn_js_1.default(result).neg();
    }
    else {
        return result;
    }
}
exports.divide = divide;
//# sourceMappingURL=util.js.map