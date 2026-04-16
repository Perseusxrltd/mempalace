"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlsContainer = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
/**
 * The `ControlsContainer` is just a wrapper for other control components.
 * It defines their position and also their style with its CSS class `react-sigma-controls`.
 *
 * ```jsx
 * <SigmaContainer>
 *   <ControlsContainer position={"bottom-right"}>
 *     <ForceAtlasControl autoRunFor={2000} />
 *   </ControlsContainer>
 * </SigmaContainer>
 * ```
 *
 * See {@link ControlsContainerProps} for the component's properties.
 *
 * @category Component
 */
const ControlsContainer = ({ id, className, style, children, position = 'bottom-left', }) => {
    // Common html props for the container
    const props = { className: `react-sigma-controls ${className ? className : ''} ${position}`, id, style };
    return react_1.default.createElement("div", Object.assign({}, props), children);
};
exports.ControlsContainer = ControlsContainer;
//# sourceMappingURL=ControlsContainer.js.map