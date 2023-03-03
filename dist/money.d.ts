import { Round } from './util';
import { BigInteger } from 'big-integer';
export declare class Money {
    currency: string;
    private value;
    private round;
    constructor(value: number | BigInteger | string, currency: string, round?: Round);
    /**
     * Return a string representation of the money value.
     *
     * Precision is a number of decimals that was requested. The decimals are
     * always returned, e.g.: new Money(1, 'USD').toFixed(2) returns '1.00'.
     *
     * This function rounds to even, a.k.a. it uses bankers rounding.
     */
    toFixed(precision: number): string;
    add(val: Money | number | string): Money;
    subtract(val: Money | number | string): Money;
    /**
     * Divide the current number with the specified number.
     *
     * This function returns a new Money object with the result.
     *
     * Unlike add, subtract, divide and multiply do accept mismatching
     * currencies. When calling divide, the currency of _this_ Money object will
     * be used for the resulting object.
     */
    divide(val: number | string | Money): Money;
    /**
     * Multiply
     *
     * Unlike add, subtract, divide and multiply do accept mismatching
     * currencies. When calling multiply, the currency of _this_ Money object will
     * be used for the resulting object.
     */
    multiply(val: number | string | Money): Money;
    /**
     * Pow returns the current value to it's exponent.
     *
     * pow currently only supports whole numbers.
     */
    pow(exponent: number | BigInteger): Money;
    /**
     * Returns the absolute value.
     */
    abs(): Money;
    /**
     * Return -1 if the value is less than zero, 0 if zero, and 1 if more than zero.
     */
    sign(): number;
    /**
     * Returns true if this Money object is _less_ than the passed value
     */
    isLesserThan(val: number | string | Money): boolean;
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isGreaterThan(val: number | string | Money): boolean;
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isEqual(val: number | string | Money): boolean;
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isLesserThanOrEqual(val: number | string | Money): boolean;
    /**
     * Returns true if this Money object is _more_ than the passed value
     */
    isGreaterThanOrEqual(val: number | string | Money): boolean;
    /**
     * Compares this Money object with another value.
     *
     * If the values are equal, 0 is returned.
     * If this object is considered to be lower, -1 is returned.
     * If this object is considered to be higher, 1 is returned.
     */
    compare(val: number | string | Money): number;
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
    allocate(parts: number, precision: number): Money[];
    /**
     * Returns the underlying BigInteger value.
     *
     * This is the current value of the object, multiplied by 10 ** 12.
     */
    toSource(): BigInteger;
    /**
     * A factory function to construct a Money object a 'source' value.
     *
     * The source value is just the underlying BigInteger used in the Money
     * class and can be obtained by calling Money.getSource().
     */
    static fromSource(val: BigInteger, currency: string, round?: Round): Money;
    /**
     * A default output for serializing to JSON
     */
    toJSON(): [string, string];
    /**
     * This function will return a string with all irrelevant 0's removed.
     */
    format(precision?: number): string;
}
