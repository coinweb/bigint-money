"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
const errors_1 = require("./errors");
const util_1 = require("./util");
const big_integer_1 = __importDefault(require("big-integer"));
class Money {
    constructor(value, currency, round = util_1.Round.HALF_TO_EVEN) {
        this.currency = currency;
        this.round = round;
        this.value = (0, util_1.moneyValueToBigInt)(value, this.round);
    }
    /**
     * Return a string representation of the money value.
     *
     * Precision is a number of decimals that was requested. The decimals are
     * always returned, e.g.: new Money(1, 'USD').toFixed(2) returns '1.00'.
     *
     * This function rounds to even, a.k.a. it uses bankers rounding.
     */
    toFixed(precision) {
        return (0, util_1.bigintToFixed)(this.value, precision, this.round);
    }
    add(val) {
        if (val instanceof Money && val.currency !== this.currency) {
            throw new errors_1.IncompatibleCurrencyError('You cannot add Money from different currencies. Convert first');
        }
        const addVal = (0, util_1.moneyValueToBigInt)(val, this.round);
        const r = Money.fromSource(addVal.add(this.value), this.currency, this.round);
        return r;
    }
    subtract(val) {
        if (val instanceof Money && val.currency !== this.currency) {
            throw new errors_1.IncompatibleCurrencyError('You cannot subtract Money from different currencies. Convert first');
        }
        const subVal = (0, util_1.moneyValueToBigInt)(val, this.round);
        return Money.fromSource(this.value.minus(subVal), this.currency, this.round);
    }
    /**
     * Divide the current number with the specified number.
     *
     * This function returns a new Money object with the result.
     *
     * Unlike add, subtract, divide and multiply do accept mismatching
     * currencies. When calling divide, the currency of _this_ Money object will
     * be used for the resulting object.
     */
    divide(val) {
        // Even though val1 was already in 'BigInteger' format, we run this
        // again as otherwise we will lose precision.
        //
        // This means for an original of $1 this would now be $1 * 10**24.
        const val1 = (0, util_1.moneyValueToBigInt)(this.value, this.round);
        // Converting the dividor.
        const val2 = (0, util_1.moneyValueToBigInt)(val, this.round);
        return Money.fromSource((0, util_1.divide)(val1, val2, this.round), this.currency, this.round);
    }
    /**
     * Multiply
     *
     * Unlike add, subtract, divide and multiply do accept mismatching
     * currencies. When calling multiply, the currency of _this_ Money object will
     * be used for the resulting object.
     */
    multiply(val) {
        const valBig = (0, util_1.moneyValueToBigInt)(val, this.round);
        // Converting the dividor.
        const resultBig = valBig.multiply(this.value);
        return Money.fromSource((0, util_1.divide)(resultBig, util_1.PRECISION_M, this.round), this.currency, this.round);
    }
    /**
     * Pow returns the current value to it's exponent.
     *
     * pow currently only supports whole numbers.
     */
    pow(exponent) {
        if (typeof exponent === 'number' && !Number.isInteger(exponent)) {
            throw new Error('You can currently only use pow() with whole numbers');
        }
        if (exponent > 1) {
            const resultBig = this.value.pow((0, big_integer_1.default)(exponent));
            return Money.fromSource((0, util_1.divide)(resultBig, (0, big_integer_1.default)(util_1.PRECISION_M).pow((0, big_integer_1.default)(exponent).minus(1)), this.round), this.currency, this.round);
        }
        else if (exponent < 0) {
            return new Money(1, this.currency, this.round).divide(this.pow(-exponent));
        }
        else if (exponent === 1) {
            return this;
        }
        else {
            return new Money(1, this.currency, this.round);
        }
    }
    /**
     * Returns the absolute value.
     */
    abs() {
        return this.multiply(this.sign());
    }
    /**
     * Return -1 if the value is less than zero, 0 if zero, and 1 if more than zero.
     */
    sign() {
        return this.compare(0);
    }
    /**
     * Returns true if this Money object is _less_ than the passed value
     */
    isLesserThan(val) {
        return this.compare(val) === -1;
    }
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isGreaterThan(val) {
        return this.compare(val) === 1;
    }
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isEqual(val) {
        return this.compare(val) === 0;
    }
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isLesserThanOrEqual(val) {
        return this.compare(val) < 1;
    }
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isGreaterThanOrEqual(val) {
        return this.compare(val) > -1;
    }
    /**
     * Compares this Money object with another value.
     *
     * If the values are equal, 0 is returned.
     * If this object is considered to be lower, -1 is returned.
     * If this object is considered to be higher, 1 is returned.
     */
    compare(val) {
        if (val instanceof Money && val.currency !== this.currency) {
            throw new errors_1.IncompatibleCurrencyError('You cannot compare different currencies.');
        }
        const bigVal = (0, util_1.moneyValueToBigInt)(val, this.round);
        return this.value.compare(bigVal);
    }
    /**
     * Allocate this value to different parts.
     *
     * This is useful in cases no money can be lost when splitting in different
     * parts. For example, when splitting $1 between 3 people, this function will
     * return 3.34, 3.33, 3.33.
     *
     * The remainder of the split will be added round-robin to the results,
     * starting with the first group.
     *
     * The reason precision must be specified, is because under the hood this
     * library uses 12 digits for precision. But when splitting a whole dollar,
     * you might only be interested in cents (precision = 2).
     *
     *
     */
    allocate(parts, precision) {
        const bParts = (0, big_integer_1.default)(parts);
        // Javascript will round to 0.
        const fraction = this.value.divide(bParts);
        const remainder = this.value.mod(bParts);
        // This value is used for rounding to the desired precision
        const precisionRounder = (0, big_integer_1.default)(10).pow(util_1.PRECISION.minus(precision));
        const roundedFraction = fraction.divide(precisionRounder);
        const roundedRemainder = fraction.mod(precisionRounder);
        // We had 2 division operators, and we want to keep remainders for both
        // of them.
        const totalRoundedRemainder = ((roundedRemainder.add(remainder)).multiply(bParts)).divide(precisionRounder);
        const result = Array(parts).fill(roundedFraction);
        // Figure out how many spare 'cents' we need to distribute. If the number
        // is negative, we need to spread debt instead.
        const add = (0, big_integer_1.default)(totalRoundedRemainder.isPositive() ? 1 : -1);
        for (let i = 0; i < Math.abs(Number(totalRoundedRemainder)); i++) {
            result[i] = result[i].add(add);
        }
        return result.map(item => {
            return Money.fromSource(item.multiply(precisionRounder), this.currency, this.round);
        });
    }
    /**
     * Returns the underlying BigInteger value.
     *
     * This is the current value of the object, multiplied by 10 ** 12.
     */
    toSource() {
        return this.value;
    }
    /**
     * A factory function to construct a Money object a 'source' value.
     *
     * The source value is just the underlying BigInteger used in the Money
     * class and can be obtained by calling Money.getSource().
     */
    static fromSource(val, currency, round = util_1.Round.HALF_TO_EVEN) {
        const m = new Money(0, currency, round);
        m.value = val;
        return m;
    }
    /**
     * This function creates custom output in console.log statements.
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.format() + ' ' + this.currency;
    }
    /**
     * A default output for serializing to JSON
     */
    toJSON() {
        return [this.format(), this.currency];
    }
    /**
     * This function will return a string with all irrelevant 0's removed.
     */
    format(precision = util_1.PRECISION_I) {
        return this.toFixed(precision).replace(/\.?0+$/, '');
    }
}
exports.Money = Money;
//# sourceMappingURL=money.js.map