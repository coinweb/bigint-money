import { UnsafeIntegerError } from './errors';
import { Money } from './money';
import bigInt, { BigInteger } from 'big-integer';

// How many digits we support
export const PRECISION_I = 20;

// BigInteger version. We keep both so there's less conversions.
export const PRECISION = bigInt(PRECISION_I);

// Multiplication factor for internal values
export const PRECISION_M = bigInt(10).pow(PRECISION);

export enum Round {

  // The following rules are round to the nearest integer, but have different
  // rules for when it's right in the middle (.5).
  HALF_TO_EVEN = 1,
  BANKERS = 1, // Alias
  HALF_AWAY_FROM_0 = 2,
  HALF_TOWARDS_0 = 3,

  // These cases don't always round to the nearest integer
  TOWARDS_0 = 11, // Effectively drops the fractional part
  TRUNCATE = 11, // Alias
}


/**
 * This helper function takes a string, number or anything that can
 * be used in the constructor of a Money object, and returns a BigInteger
 * with adjusted precision.
 */
export function moneyValueToBigInt(input: Money | string | number | BigInteger, round: Round): BigInteger {

  if (input instanceof Money) {
    return input.toSource();
  }

  switch (typeof input) {
    case 'string' : {

      const parts = input.match(/^(-)?([0-9]*)?(\.([0-9]*))?$/);

      if (!parts) {
        throw new TypeError('Input string must follow the pattern (-)##.## or -##');
      }

      const signPart: '-'|undefined = parts[1] as ('-' | undefined); // Positive or negative
      const wholePart: string|undefined = parts[2]; // Whole numbers.
      const fracPart: string|undefined = parts[4];

      let output: BigInteger;
      // The whole part
      if (wholePart === undefined) {
        // For numbers like ".04" this part will be undefined.
        output = bigInt(0);
      } else {
        output = bigInt(wholePart).multiply(PRECISION_M);
      }

      if (fracPart !== undefined) {
        // The fractional part
        const precisionDifference: BigInteger = PRECISION.minus(fracPart.length);

        if (precisionDifference.compare(0) !== -1) {
          // Add 0's
          output = output.plus(bigInt(fracPart).multiply(bigInt(10).pow(precisionDifference)));
        } else {
          // Remove 0's
          output = divide(bigInt(fracPart), bigInt(10).pow(-precisionDifference), round);
        }
      }

      // negative ?
      if (signPart === '-') {
        output = output.multiply(-1);
      }
      return output;
    }
    case 'number' :
      if (!Number.isSafeInteger(input)) {
        throw new UnsafeIntegerError('The number ' + input + ' is not a "safe" integer. It must be converted before passing it');
      }
      return bigInt(input).multiply(PRECISION_M);
    default :
      return bigInt(input).multiply(PRECISION_M);

  }

}

/**
 * This function takes a BigInteger that was multiplied by PRECISON_M, and returns
 * a human readable string value with a specified precision.
 *
 * Precision is the number of decimals that are returned.
 */
export function bigintToFixed(value: BigInteger, precision: number, round: Round): string {

  if (precision === 0) {
    // No decimals were requested.
    return divide(value, PRECISION_M, round).toString();
  }

  let wholePart = value.divide(PRECISION_M);
  const negative = value.isNegative();
  let remainder = value.mod(PRECISION_M);

  if (bigInt(precision).compare(PRECISION)) {
    // More precision was requested than we have, so we multiply
    // to add more 0's
    remainder = remainder.multiply( bigInt(10).pow(bigInt(precision).minus(PRECISION)));
  } else {
    // Less precision was requested, so we round
    remainder = divide(remainder, bigInt(10).pow(bigInt(PRECISION).minus(precision)), round);
  }

  if (remainder.isPositive()) { remainder = remainder.multiply(-1); }

  let remainderStr = remainder.toString().padStart(precision, '0');

  if (remainderStr.length > precision) {
    // The remainder rounded all the way up to the the 'whole part'
    wholePart = wholePart.add(negative ? -1 : 1);
    remainder = bigInt(0);
    remainderStr = '0'.repeat(precision);
  }

  let wholePartStr = wholePart.toString();
  if (wholePartStr === '0' && negative) {
    wholePartStr = '-0';
  }

  return wholePartStr + '.' + remainderStr;
}

/**
 * This function takes 2 bigints and divides them.
 *
 * By default ecmascript will round to 0. For example,
 * 5n / 2n yields 2n.
 *
 * This function rounds to the nearest even number, also
 * known as 'bankers rounding'.
 */
export function divide(a: BigInteger, b: BigInteger, round: Round): BigInteger {

  // Get absolute versions. We'll deal with the negatives later.
  const aAbs = bigInt(a).isPositive() ? bigInt(a) : bigInt(-a);
  const bAbs = bigInt(b).isPositive() ? bigInt(b) : bigInt(-b);

  let result = aAbs.divide(bAbs);
  const rem = aAbs.mod(bAbs);

  // if remainder > half divisor
  if (rem.multiply(2).compare(bAbs)) {
    switch (round) {
      case Round.TRUNCATE:
        // do nothing
        break;
      default :
        // We should have rounded up instead of down.
        result = result.plus(1);
        break;
    }
  } else if (rem.multiply(2).equals(bAbs)) {
    // If the remainder is exactly half the divisor, it means that the result is
    // exactly in between two numbers and we need to apply a specific rounding
    // method.
    switch (round) {
      case Round.HALF_TO_EVEN:
        // Add 1 if result is odd to get an even return value
        if (result.mod(2).equals(1)) { result = result.plus(1); }
        break;
      case Round.HALF_AWAY_FROM_0:
        result = result.plus(1);
        break;
      case Round.TRUNCATE:
      case Round.HALF_TOWARDS_0:
        // Do nothing
        break;
    }
  }

  if (a.isPositive() !== b.isPositive()) {
    // Either a XOR b is negative
    return bigInt(-result);
  } else {
    return result;
  }

}
