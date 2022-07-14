import BN from 'bn.js';
import { expect } from 'chai';
import { divide, Round } from '../src/util';

describe('divide', () => {

  describe('HALF_TO_EVEN', () => {
    const tests = [

      // .5 cases
      [7, 2, 4],
      [5, 2, 2],
      [-7, 2, -4],
      [-5, 2, -2],

      // Common cases
      [8, 3, 3],
      [9, 4, 2],
      [-9, 4, -2],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(new BN(test[0]), new BN(test[1]), Round.HALF_TO_EVEN),
        ).to.equal(new BN(test[2]));

      });

    }

  });

  describe('HALF_AWAY_FROM_0', () => {
    const tests = [

      // .5 cases
      [7, 2, 4],
      [5, 2, 3],
      [-7, 2, -4],
      [-5, 2, -3],

      // Common cases
      [8, 3, 3],
      [9, 4, 2],
      [-9, 4, -2],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(new BN(test[0]), new BN(test[1]), Round.HALF_AWAY_FROM_0),
        ).to.equal(new BN(test[2]));

      });

    }

  });

  describe('HALF_TOWARDS_0', () => {
    const tests = [

      // .5 cases
      [7, 2, 3],
      [5, 2, 2],
      [-7, 2, -3],
      [-5, 2, -2],

      // Common cases
      [8, 3, 3],
      [9, 4, 2],
      [-9, 4, -2],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(new BN(test[0]), new BN(test[1]), Round.HALF_TOWARDS_0),
        ).to.equal(new BN(test[2]));

      });

    }

  });

  describe('TRUNCATE', () => {
    const tests = [

      // .5 cases
      [7, 2, 3],
      [5, 2, 2],
      [-7, 2, -3],
      [-5, 2, -2],

      // Common cases
      [8, 3, 2],
      [9, 4, 2],
      [-8, 3, -2],
      [-9, 4, -2],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(new BN(test[0]), new BN(test[1]), Round.TRUNCATE),
        ).to.equal(new BN(test[2]));

      });

    }

  });

});
