/**
 * Thrown when trying to use unsafe integers.
 *
 * These require explicit conversions first.
 */
export declare class UnsafeIntegerError extends Error {
}
/**
 * Thrown when, for example trying to add USD to YEN
 */
export declare class IncompatibleCurrencyError extends Error {
}
