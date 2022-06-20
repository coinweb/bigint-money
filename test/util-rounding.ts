import bigInt from 'big-integer';
import { expect } from 'chai';
import { divide, Round } from '../src/util';

describe('divide', () => {

  describe('HALF_TO_EVEN', () => {
    const tests = [

      // .5 cases
      [7n, 2n, 4n],
      [5n, 2n, 2n],
      [-7n, 2n, -4n],
      [-5n, 2n, -2n],

      // Common cases
      [8n, 3n, 3n],
      [9n, 4n, 2n],
      [-9n, 4n, -2n],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(bigInt(test[0]), bigInt(test[1]), Round.HALF_TO_EVEN),
        ).to.equal(bigInt(test[2]));

      });

    }

  });

  describe('HALF_AWAY_FROM_0', () => {
    const tests = [

      // .5 cases
      [7n, 2n, 4n],
      [5n, 2n, 3n],
      [-7n, 2n, -4n],
      [-5n, 2n, -3n],

      // Common cases
      [8n, 3n, 3n],
      [9n, 4n, 2n],
      [-9n, 4n, -2n],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(bigInt(test[0]), bigInt(test[1]), Round.HALF_AWAY_FROM_0),
        ).to.equal(bigInt(test[2]));

      });

    }

  });

  describe('HALF_TOWARDS_0', () => {
    const tests = [

      // .5 cases
      [7n, 2n, 3n],
      [5n, 2n, 2n],
      [-7n, 2n, -3n],
      [-5n, 2n, -2n],

      // Common cases
      [8n, 3n, 3n],
      [9n, 4n, 2n],
      [-9n, 4n, -2n],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(bigInt(test[0]), bigInt(test[1]), Round.HALF_TOWARDS_0),
        ).to.equal(bigInt(test[2]));

      });

    }

  });

  describe('TRUNCATE', () => {
    const tests = [

      // .5 cases
      [7n, 2n, 3n],
      [5n, 2n, 2n],
      [-7n, 2n, -3n],
      [-5n, 2n, -2n],

      // Common cases
      [8n, 3n, 2n],
      [9n, 4n, 2n],
      [-8n, 3n, -2n],
      [-9n, 4n, -2n],
    ];

    for(const test of tests) {

      it(`${test[0]} / ${test[1]} = ${test[2]}`, () => {

        expect(
          divide(bigInt(test[0]), bigInt(test[1]), Round.TRUNCATE),
        ).to.equal(bigInt(test[2]));

      });

    }

  });

});
