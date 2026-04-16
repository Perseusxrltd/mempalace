"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEqual = isEqual;
exports.debounce = debounce;
/**
 * Deeply check if two objects are equals or not.
 *
 * @category Utils
 */
function isEqual(x, y) {
    // check the ref
    if (x === y)
        return true;
    // if both are object
    if (typeof x == 'object' && x != null && typeof y == 'object' && y != null) {
        // Check the number of properties
        if (Object.keys(x).length != Object.keys(y).length)
            return false;
        // for every props of x
        for (const prop in x) {
            // prop is missing in y, false
            if (!Object.hasOwn(y, prop))
                return false;
            // prop in y is diff than the one in x, false
            if (!isEqual(x[prop], y[prop]))
                return false;
        }
        return true;
    }
    return false;
}
/**
 * Debounce a function.
 *
 * @category Utils
 */
function debounce(fn, ms) {
    let timer;
    const debouncedFunc = (args) => new Promise((resolve) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            resolve(fn(args));
        }, ms);
    });
    return debouncedFunc;
}
//# sourceMappingURL=utils.js.map