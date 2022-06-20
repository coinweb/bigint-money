import bigInt, { BigInteger } from 'big-integer';
import { expect } from 'chai';
import { bigintToFixed, Round, PRECISION } from '../src/util';

describe('bigintToFixed', () => {

  const P = PRECISION;

  const tests = [
    [                     bigInt(1n), 0, '0'],
    [   bigInt(1n).multiply(bigInt(10n).pow(P)),      0, '1'],
    [   bigInt(1n).multiply(bigInt(10n).pow(bigInt(P).minus(1n))), 0, '0'],
    [   bigInt(1n).multiply(bigInt(10n).pow(bigInt(P).minus(1n))), 1, '0.1'],
    [   bigInt(1n).multiply(bigInt(10n).pow(bigInt(P).minus(2n))), 2, '0.01'],
    [   bigInt(4n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '0.00'],
    [   bigInt(5n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '0.00'],
    [   bigInt(6n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '0.01'],
    [   bigInt(99n).multiply(bigInt(10n).pow(bigInt(P).minus(2n))), 2, '0.99'],
    [   bigInt(995n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '1.00'],
    [                    bigInt(-1n), 0, '0'],
    [       bigInt(-1n).multiply(bigInt(10n).pow(P)), 0, '-1'],
    [       bigInt(-1n).multiply(bigInt(10n).pow(bigInt(P).minus(1n))), 0, '0'],
    [       bigInt(-1n).multiply(bigInt(10n).pow(bigInt(P).minus(1n))), 1, '-0.1'],
    [       bigInt(-1n).multiply(bigInt(10n).pow(bigInt(P).minus(2n))), 2, '-0.01'],
    [       bigInt(-4n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '-0.00'],
    [       bigInt(-5n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '-0.00'],
    [       bigInt(-6n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '-0.01'],
    [       bigInt(-99n).multiply(bigInt(10n).pow(bigInt(P).minus(2n))), 2, '-0.99'],
    [       bigInt(-995n).multiply(bigInt(10n).pow(bigInt(P).minus(3n))), 2, '-1.00'],
  ];

  for(const test of tests) {
    it(`bigintToFixed(${test[0]},${test[1]}) === ${test[2]}`, () => {

      const result = bigintToFixed(test[0] as BigInteger, test[1] as number, Round.BANKERS);
      expect(result).to.equal(test[2]);

    });
  }

});
