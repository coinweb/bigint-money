import BN from 'bn.js';
import { expect } from 'chai';
import { bigintToFixed, Round, PRECISION } from '../src/util';

describe('bigintToFixed', () => {

  const P = PRECISION;

  const tests = [
    [                     new BN(1), 0, '0'],
    [   new BN(1).mul(new BN(10).pow(P)),      0, '1'],
    [   new BN(1).mul(new BN(10).pow(new BN(P).sub(new BN(1)))), 0, '0'],
    [   new BN(1).mul(new BN(10).pow(new BN(P).sub(new BN(1)))), 1, '0.1'],
    [   new BN(1).mul(new BN(10).pow(new BN(P).sub(new BN(2)))), 2, '0.01'],
    [   new BN(4).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '0.00'],
    [   new BN(5).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '0.00'],
    [   new BN(6).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '0.01'],
    [   new BN(99).mul(new BN(10).pow(new BN(P).sub(new BN(2)))), 2, '0.99'],
    [   new BN(995).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '1.00'],
    [                    new BN(-1), 0, '0'],
    [       new BN(-1).mul(new BN(10).pow(P)), 0, '-1'],
    [       new BN(-1).mul(new BN(10).pow(new BN(P).sub(new BN(1)))), 0, '0'],
    [       new BN(-1).mul(new BN(10).pow(new BN(P).sub(new BN(1)))), 1, '-0.1'],
    [       new BN(-1).mul(new BN(10).pow(new BN(P).sub(new BN(2)))), 2, '-0.01'],
    [       new BN(-4).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '-0.00'],
    [       new BN(-5).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '-0.00'],
    [       new BN(-6).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '-0.01'],
    [       new BN(-99).mul(new BN(10).pow(new BN(P).sub(new BN(2)))), 2, '-0.99'],
    [       new BN(-995).mul(new BN(10).pow(new BN(P).sub(new BN(3)))), 2, '-1.00'],
  ];

  for(const test of tests) {
    it(`bigintToFixed(${test[0]},${test[1]}) === ${test[2]}`, () => {

      const result = bigintToFixed(test[0] as BN, test[1] as number, Round.BANKERS);
      expect(result).to.equal(test[2]);

    });
  }

});
