"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSigma = useSigma;
const context_1 = require("./context");
/**
 * React hook to retrieve the sigma instance (from the context).
 *
 * ```typescript
 * const sigma = useSigma();
 *```
 * @category Hook
 */
function useSigma() {
    return (0, context_1.useSigmaContext)().sigma;
}
//# sourceMappingURL=useSigma.js.map