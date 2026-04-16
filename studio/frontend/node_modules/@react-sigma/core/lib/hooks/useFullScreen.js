"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFullScreen = useFullScreen;
const react_1 = require("react");
const context_1 = require("./context");
function toggleFullScreen(dom) {
    if (document.fullscreenElement !== dom) {
        dom.requestFullscreen();
    }
    else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
/**
 * React hook that helps you to set graph in fullmode.
 *
 * ```typescript
 * const {toggle, isFullScreen} = useFullscreen();
 *```
 * @category Hook
 */
function useFullScreen(container) {
    const context = (0, context_1.useSigmaContext)();
    const [isFullScreen, setFullScreen] = (0, react_1.useState)(false);
    const [element, setElement] = (0, react_1.useState)(container ? container : context.container);
    const toggleState = (0, react_1.useCallback)(() => setFullScreen((v) => !v), []);
    (0, react_1.useEffect)(() => {
        document.addEventListener('fullscreenchange', toggleState);
        return () => document.removeEventListener('fullscreenchange', toggleState);
    }, [toggleState]);
    (0, react_1.useEffect)(() => {
        setElement(container || context.container);
    }, [container, context.container]);
    const toggle = (0, react_1.useCallback)(() => {
        toggleFullScreen(element);
    }, [element]);
    return {
        toggle,
        isFullScreen,
    };
}
//# sourceMappingURL=useFullScreen.js.map