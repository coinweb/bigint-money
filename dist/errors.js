"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncompatibleCurrencyError = exports.UnsafeIntegerError = void 0;
/**
 * Thrown when trying to use unsafe integers.
 *
 * These require explicit conversions first.
 */
class UnsafeIntegerError extends Error {
}
exports.UnsafeIntegerError = UnsafeIntegerError;
/**
 * Thrown when, for example trying to add USD to YEN
 */
class IncompatibleCurrencyError extends Error {
}
exports.IncompatibleCurrencyError = IncompatibleCurrencyError;
//# sourceMappingURL=errors.js.map