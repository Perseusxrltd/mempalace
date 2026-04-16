"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetSettings = useSetSettings;
const react_1 = require("react");
const context_1 = require("./context");
/**
 * React hook that helps you to update Sigma’s settings.
 *
 * ```typescript
 * const setSettings = useSetSettings();
 * ...
 * useEffect(() => {
 *  setSettings({
 *    hideEdgesOnMove: true,
 *    hideLabelsOnMove: true,
 *  });
 * }, []);
 *```
 * @category Hook
 */
function useSetSettings() {
    const { sigma } = (0, context_1.useSigmaContext)();
    const setSettings = (0, react_1.useCallback)((newSettings) => {
        if (!sigma)
            return;
        Object.keys(newSettings).forEach((key) => {
            // as never because of https://stackoverflow.com/questions/58656353/how-to-avoid-dynamic-keyof-object-assign-error-in-typescript
            sigma.setSetting(key, newSettings[key]);
        });
    }, [sigma]);
    return setSettings;
}
//# sourceMappingURL=useSetSettings.js.map