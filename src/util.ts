import { UnsafeIntegerError } from './errors';
import { Money } from './money';
import BN from 'bn.js';

// How many digits we support
export const PRECISION_I = 20;

// BigInteger version. We keep both so there's less conversions.
export const PRECISION = new BN(PRECISION_I);

// Multiplication factor for internal values
export const PRECISION_M = new BN(10).pow(PRECISION);

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
export function moneyValueToBigInt(input: Money | string | number | BN, round: Round): BN {

  if (input instanceof Money) {
    return input.toSource();
  }

  if(input instanceof BN){
    return input.mul(PRECISION_M);
  }

  switch (typeof input) {
    case 'string' : {

      const parts = (input as string).match(/^(-)?([0-9]*)?(\.([0-9]*))?$/);

      if (!parts) {
        throw new TypeError('Input string must follow the pattern (-)##.## or -##');
      }

      const signPart: '-'|undefined = parts[1] as ('-' | undefined); // Positive or negative
      const wholePart: string|undefined = parts[2]; // Whole numbers.
      const fracPart: string|undefined = parts[4];

      let output: BN;
      // The whole part
      if (wholePart === undefined) {
        // For numbers like ".04" this part will be undefined.
        output = new BN(0);
      } else {
        output = new BN(wholePart).mul(PRECISION_M);
      }

      if (fracPart !== undefined) {
        // The fractional part
        const precisionDifference: BN = PRECISION.sub(new BN(fracPart.length));

        if (precisionDifference.cmp(new BN(0)) !== -1) {
          // Add 0's
          output = output.add(new BN(fracPart).mul(new BN(10).pow(precisionDifference)));
        } else {
          // Remove 0's
          output = divide(new BN(fracPart), new BN(10).pow(precisionDifference.neg()), round);
        }
      }

      // negative ?
      if (signPart === '-') {
        output = output.neg();
      }
      return output;
    }
    case 'number' :
      if (!Number.isSafeInteger(input)) {
        throw new UnsafeIntegerError('The number ' + input + ' is not a "safe" integer. It must be converted before passing it');
      }
      return new BN(input as number).mul(PRECISION_M);
    default :
      throw new TypeError('value must be a safe integer, bigint or string');

  }

}

/**
 * This function takes a BigInteger that was multiplied by PRECISON_M, and returns
 * a human readable string value with a specified precision.
 *
 * Precision is the number of decimals that are returned.
 */
export function bigintToFixed(value: BN, precision: number, round: Round): string {

  if (precision === 0) {
    // No decimals were requested.
    return divide(value, PRECISION_M, round).toString(10);
  }

  let wholePart = value.div(PRECISION_M);
  const negative = value.isNeg();
  let remainder = value.mod(PRECISION_M);

  if (new BN(precision).cmp(PRECISION) === 1) {
    // More precision was requested than we have, so we multiply
    // to add more 0's
    remainder = remainder.mul( new BN(10).pow(new BN(precision).sub(PRECISION)));
  } else {
    // Less precision was requested, so we round
    remainder = divide(remainder, new BN(10).pow(new BN(PRECISION).sub(new BN(precision))), round);
  }

  if (remainder.isNeg()) { remainder = remainder.neg(); }

  let remainderStr = remainder.toString(10).padStart(precision, '0');

  if (remainderStr.length > precision) {
    // The remainder rounded all the way up to the the 'whole part'
    wholePart = wholePart.add(negative ? new BN(-1) : new BN(1));
    remainder = new BN(0);
    remainderStr = '0'.repeat(precision);
  }

  let wholePartStr = wholePart.toString(10);
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
export function divide(a: BN, b: BN, round: Round): BN {

  // Get absolute versions. We'll deal with the negatives later.
  const aAbs = new BN(a).abs();
  const bAbs = new BN(b).abs();

  let result = aAbs.div(bAbs);
  const rem = aAbs.mod(bAbs);

  // if remainder > half divisor
  if (rem.mul(new BN(2)).cmp(bAbs) === 1) {
    switch (round) {
      case Round.TRUNCATE:
        // do nothing
        break;
      default :
        // We should have rounded up instead of down.
        result = result.add(new BN(1));
        break;
    }
  } else if (rem.mul(new BN(2)).eq(bAbs)) {
    // If the remainder is exactly half the divisor, it means that the result is
    // exactly in between two numbers and we need to apply a specific rounding
    // method.
    switch (round) {
      case Round.HALF_TO_EVEN:
        // Add 1 if result is odd to get an even return value
        if (result.isOdd()) { result = result.add(new BN(1)); }
        break;
      case Round.HALF_AWAY_FROM_0:
        result = result.add(new BN(1));
        break;
      case Round.TRUNCATE:
      case Round.HALF_TOWARDS_0:
        // Do nothing
        break;
    }
  }

  if (!a.isNeg() !== !b.isNeg()) {
    // Either a XOR b is negative
    return new BN(result).neg();
  } else {
    return result;
  }

}
