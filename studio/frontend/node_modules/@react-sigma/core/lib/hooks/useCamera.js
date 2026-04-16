"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCamera = useCamera;
const react_1 = require("react");
const utils_1 = require("../utils");
const useSigma_1 = require("./useSigma");
/**
 * React hook that helps you to manage the camera.
 *
 * ```typescript
 * const {zoomIn, zoomOut, reset, goto, gotoNode } = useCamera();
 *```
 *
 * @category Hook
 */
function useCamera(options) {
    const sigma = (0, useSigma_1.useSigma)();
    // Default camera options
    const [defaultOptions, setDefaultOptions] = (0, react_1.useState)(options || {});
    (0, react_1.useEffect)(() => {
        setDefaultOptions((prev) => {
            if (!(0, utils_1.isEqual)(prev, options || {}))
                return options || {};
            return prev;
        });
    }, [options]);
    const zoomIn = (0, react_1.useCallback)((options) => {
        sigma.getCamera().animatedZoom(Object.assign(Object.assign({}, defaultOptions), options));
    }, [sigma, defaultOptions]);
    const zoomOut = (0, react_1.useCallback)((options) => {
        sigma.getCamera().animatedUnzoom(Object.assign(Object.assign({}, defaultOptions), options));
    }, [sigma, defaultOptions]);
    const reset = (0, react_1.useCallback)((options) => {
        sigma.getCamera().animatedReset(Object.assign(Object.assign({}, defaultOptions), options));
    }, [sigma, defaultOptions]);
    const goto = (0, react_1.useCallback)((state, options) => {
        sigma.getCamera().animate(state, Object.assign(Object.assign({}, defaultOptions), options));
    }, [sigma, defaultOptions]);
    const gotoNode = (0, react_1.useCallback)((nodeKey, options) => {
        const nodeDisplayData = sigma.getNodeDisplayData(nodeKey);
        if (nodeDisplayData)
            sigma.getCamera().animate(nodeDisplayData, Object.assign(Object.assign({}, defaultOptions), options));
        else
            console.warn(`Node ${nodeKey} not found`);
    }, [sigma, defaultOptions]);
    return { zoomIn, zoomOut, reset, goto, gotoNode };
}
//# sourceMappingURL=useCamera.js.map