/**
 * Deeply check if two objects are equals or not.
 *
 * @category Utils
 */
export declare function isEqual(x: unknown, y: unknown): boolean;
/**
 * Debounce a function.
 *
 * @category Utils
 */
export declare function debounce<A = unknown, R = void>(fn: (args: A) => R, ms: number): (args: A) => Promise<Awaited<R>>;
