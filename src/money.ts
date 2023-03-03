import { IncompatibleCurrencyError } from './errors';
import {
  bigintToFixed,
  divide,
  moneyValueToBigInt,
  PRECISION,
  PRECISION_I,
  PRECISION_M,
  Round,
} from './util';
import bigInt, { BigInteger } from 'big-integer';

export class Money {

  currency: string;
  private value: BigInteger;
  private round: Round;

  constructor(value: number | BigInteger | string, currency: string, round: Round = Round.HALF_TO_EVEN) {

    this.currency = currency;
    this.round = round;
    this.value = moneyValueToBigInt(value, this.round);

  }

  /**
   * Return a string representation of the money value.
   *
   * Precision is a number of decimals that was requested. The decimals are
   * always returned, e.g.: new Money(1, 'USD').toFixed(2) returns '1.00'.
   *
   * This function rounds to even, a.k.a. it uses bankers rounding.
   */
  toFixed(precision: number): string {

    return bigintToFixed(this.value, precision, this.round);

  }

  add(val: Money | number | string): Money {

    if (val instanceof Money && val.currency !== this.currency) {
      throw new IncompatibleCurrencyError('You cannot add Money from different currencies. Convert first');
    }

    const addVal = moneyValueToBigInt(val, this.round);
    const r = Money.fromSource(addVal.add(this.value), this.currency, this.round);
    return r;

  }

  subtract(val: Money | number | string): Money {

    if (val instanceof Money && val.currency !== this.currency) {
      throw new IncompatibleCurrencyError('You cannot subtract Money from different currencies. Convert first');
    }

    const subVal = moneyValueToBigInt(val, this.round);
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
  divide(val: number | string | Money): Money {

    // Even though val1 was already in 'BigInteger' format, we run this
    // again as otherwise we will lose precision.
    //
    // This means for an original of $1 this would now be $1 * 10**24.
    const val1 = moneyValueToBigInt(this.value, this.round);

    // Converting the dividor.
    const val2 = moneyValueToBigInt(val, this.round);

    return Money.fromSource(
      divide(val1, val2, this.round),
      this.currency,
      this.round,
    );

  }

  /**
   * Multiply
   *
   * Unlike add, subtract, divide and multiply do accept mismatching
   * currencies. When calling multiply, the currency of _this_ Money object will
   * be used for the resulting object.
   */
  multiply(val: number | string | Money): Money {

    const valBig = moneyValueToBigInt(val, this.round);

    // Converting the dividor.
    const resultBig = valBig.multiply(this.value);

    return Money.fromSource(
      divide(resultBig, PRECISION_M, this.round),
      this.currency,
      this.round,
    );

  }

  /**
   * Pow returns the current value to it's exponent.
   *
   * pow currently only supports whole numbers.
   */
  pow(exponent: number | BigInteger): Money {

    if (typeof exponent === 'number' && !Number.isInteger(exponent)) {
      throw new Error('You can currently only use pow() with whole numbers');
    }

    if (exponent > 1) {
      const resultBig = this.value.pow(bigInt(exponent as BigInteger));
      return Money.fromSource(
        divide(resultBig, bigInt(PRECISION_M).pow(bigInt(exponent as number).minus(1)), this.round),
        this.currency,
        this.round
      );
    } else if (exponent < 0) {
      return new Money(1, this.currency, this.round).divide(this.pow(-exponent));
    } else if (exponent === 1) {
      return this;
    } else {
      return new Money(1, this.currency, this.round);
    }
  }

  /**
   * Returns the absolute value.
   */
  abs(): Money {

    return this.multiply(this.sign());

  }

  /**
   * Return -1 if the value is less than zero, 0 if zero, and 1 if more than zero.
   */
  sign(): number {

    return this.compare(0);

  }

  /**
   * Returns true if this Money object is _less_ than the passed value
   */
  isLesserThan(val: number | string | Money): boolean {

    return this.compare(val) === -1;

  }

  /**
   * Returns true if this Money object is _more_ than the passed value
   */
  isGreaterThan(val: number | string | Money): boolean {

    return this.compare(val) === 1;

  }

  /**
   * Returns true if this Money object is _more_ than the passed value
   */
  isEqual(val: number | string | Money): boolean {

    return this.compare(val) === 0;

  }

  /**
   * Returns true if this Money object is _more_ than the passed value
   */
  isLesserThanOrEqual(val: number | string | Money): boolean {

    return this.compare(val) < 1;

  }

  /**
   * Returns true if this Money object is _more_ than the passed value
   */
  isGreaterThanOrEqual(val: number | string | Money): boolean {

    return this.compare(val) > -1;

  }

  /**
   * Compares this Money object with another value.
   *
   * If the values are equal, 0 is returned.
   * If this object is considered to be lower, -1 is returned.
   * If this object is considered to be higher, 1 is returned.
   */
  compare(val: number | string | Money){

    if (val instanceof Money && val.currency !== this.currency) {
      throw new IncompatibleCurrencyError('You cannot compare different currencies.');
    }

    const bigVal = moneyValueToBigInt(val, this.round);
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
  allocate(parts: number, precision: number): Money[] {

    const bParts = bigInt(parts);

    // Javascript will round to 0.
    const fraction = this.value.divide(bParts);
    const remainder = this.value.mod(bParts);

    // This value is used for rounding to the desired precision
    const precisionRounder = bigInt(10).pow(PRECISION.minus(precision));

    const roundedFraction = fraction.divide(precisionRounder);
    const roundedRemainder = fraction.mod(precisionRounder);

    // We had 2 division operators, and we want to keep remainders for both
    // of them.
    const totalRoundedRemainder = ((roundedRemainder.add(remainder)).multiply(bParts)).divide(precisionRounder);

    const result: BigInteger[] = Array(parts).fill(roundedFraction);

    // Figure out how many spare 'cents' we need to distribute. If the number
    // is negative, we need to spread debt instead.
    const add = bigInt(totalRoundedRemainder.isPositive() ? 1 : -1);

    for (let i = 0; i < Math.abs(Number(totalRoundedRemainder)); i++) {
      result[i] = result[i].add(add);
    }

    return result.map( item => {

      return Money.fromSource(
        item.multiply(precisionRounder),
        this.currency,
        this.round
      );

    });

  }

  /**
   * Returns the underlying BigInteger value.
   *
   * This is the current value of the object, multiplied by 10 ** 12.
   */
  toSource(): BigInteger {

    return this.value;

  }

  /**
   * A factory function to construct a Money object a 'source' value.
   *
   * The source value is just the underlying BigInteger used in the Money
   * class and can be obtained by calling Money.getSource().
   */
  static fromSource(val: BigInteger, currency: string, round: Round = Round.HALF_TO_EVEN): Money {

    const m = new Money(0, currency, round);
    m.value = val;

    return m;

  }

  /**
   * This function creates custom output in console.log statements.
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {

    return this.format() + ' ' + this.currency;

  }

  /**
   * A default output for serializing to JSON
   */
  toJSON(): [string, string] {

    return [this.format(), this.currency];

  }

  /**
   * This function will return a string with all irrelevant 0's removed.
   */
  format(precision = PRECISION_I): string {

    return this.toFixed(precision).replace(/\.?0+$/, '');

  }

}
