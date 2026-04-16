"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullScreenControl = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const compress_solid_svg_1 = require("../../assets/icons/compress-solid.svg");
const expand_solid_svg_1 = require("../../assets/icons/expand-solid.svg");
const useFullScreen_1 = require("../../hooks/useFullScreen");
/**
 * The `FullScreenControl` create a UI button that allows the user to display the graph in fullscreen
 *
 * ```jsx
 * <SigmaContainer>
 *   <ControlsContainer>
 *     <FullScreenControl />
 *   </ControlsContainer>
 * </SigmaContainer>
 * ```
 *
 * See {@link FullScreenControlProps} for the component's properties.
 *
 * @category Component
 */
const FullScreenControl = ({ id, className, style, container, children, labels = {}, }) => {
    // Get Sigma
    const { isFullScreen, toggle } = (0, useFullScreen_1.useFullScreen)(container === null || container === void 0 ? void 0 : container.current);
    // Common html props for the div
    const htmlProps = {
        className: `react-sigma-control ${className || ''}`,
        id,
        style,
    };
    if (!document.fullscreenEnabled)
        return null;
    return (react_1.default.createElement("div", Object.assign({}, htmlProps),
        react_1.default.createElement("button", { onClick: toggle, title: isFullScreen ? labels['exit'] || 'Exit fullscreen' : labels['enter'] || 'Enter fullscreen' },
            children && !isFullScreen && children[0],
            children && isFullScreen && children[1],
            !children && !isFullScreen && react_1.default.createElement(expand_solid_svg_1.ReactComponent, { style: { width: '1em' } }),
            !children && isFullScreen && react_1.default.createElement(compress_solid_svg_1.ReactComponent, { style: { width: '1em' } }))));
};
exports.FullScreenControl = FullScreenControl;
//# sourceMappingURL=FullScreenControl.js.map