"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigmaProvider = exports.SigmaContext = void 0;
exports.useSigmaContext = useSigmaContext;
const react_1 = require("react");
/**
 * @hidden
 */
exports.SigmaContext = (0, react_1.createContext)(null);
/**
 * @hidden
 */
exports.SigmaProvider = exports.SigmaContext.Provider;
/**
 * React hook that store the sigma and html container reference.
 *
 * ```typescript
 * const {sigma, container} = useSigmaContext();
 *```
 *
 * See {@link SigmaContextInterface} for more information.
 *
 * @category Hook
 */
function useSigmaContext() {
    const context = (0, react_1.useContext)(exports.SigmaContext);
    if (context == null) {
        throw new Error('No context provided: useSigmaContext() can only be used in a descendant of <SigmaContainer>');
    }
    // cast context to the one with good generics
    return context;
}
//# sourceMappingURL=context.js.map