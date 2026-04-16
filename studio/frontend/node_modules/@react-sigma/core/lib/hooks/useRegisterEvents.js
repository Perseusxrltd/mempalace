"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRegisterEvents = useRegisterEvents;
const react_1 = require("react");
const useSetSettings_1 = require("./useSetSettings");
const useSigma_1 = require("./useSigma");
function keySet(record) {
    return new Set(Object.keys(record));
}
const sigmaEvents = keySet({
    clickNode: true,
    rightClickNode: true,
    downNode: true,
    enterNode: true,
    leaveNode: true,
    doubleClickNode: true,
    wheelNode: true,
    clickEdge: true,
    rightClickEdge: true,
    downEdge: true,
    enterEdge: true,
    leaveEdge: true,
    doubleClickEdge: true,
    wheelEdge: true,
    clickStage: true,
    rightClickStage: true,
    downStage: true,
    doubleClickStage: true,
    wheelStage: true,
    beforeRender: true,
    afterRender: true,
    kill: true,
    upStage: true,
    upEdge: true,
    upNode: true,
    enterStage: true,
    leaveStage: true,
    resize: true,
    afterClear: true,
    afterProcess: true,
    beforeClear: true,
    beforeProcess: true,
    moveBody: true,
});
const mouseEvents = keySet({
    click: true,
    rightClick: true,
    doubleClick: true,
    mouseup: true,
    mousedown: true,
    mousemove: true,
    mousemovebody: true,
    mouseleave: true,
    mouseenter: true,
    wheel: true,
});
const touchEvents = keySet({
    touchup: true,
    touchdown: true,
    touchmove: true,
    touchmovebody: true,
    tap: true,
    doubletap: true,
});
const cameraEvents = keySet({ updated: true });
/**
 * React hook that helps you to listen Sigma’s events.
 * It handles for you all the lifecyle of listener (ie. on / remove)
 *
 * ```typescript
 * const registerEvents = useRegisterEvents();
 * const [setHoveredNode,setHoveredNode] = useState<string|null>(null);
 * ...
 * useEffect(() => {
 *  registerEvents({
 *    enterNode: event => setHoveredNode(event.node),
 *    leaveNode: event => setHoveredNode(null),
 *  });
 * }, []);
 *```
 *
 * See {@link EventHandlers} for the events.
 *
 * @category Hook
 */
function useRegisterEvents() {
    const sigma = (0, useSigma_1.useSigma)();
    const setSettings = (0, useSetSettings_1.useSetSettings)();
    const [eventHandlers, setEventHandlers] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => {
        if (!sigma || !eventHandlers) {
            return;
        }
        const userEvents = eventHandlers;
        // list of event types to register
        const eventTypes = Object.keys(userEvents);
        // register events
        eventTypes.forEach((event) => {
            const eventHandler = userEvents[event];
            if (sigmaEvents.has(event)) {
                sigma.on(event, eventHandler);
            }
            if (mouseEvents.has(event)) {
                sigma.getMouseCaptor().on(event, eventHandler);
            }
            if (touchEvents.has(event)) {
                sigma.getTouchCaptor().on(event, eventHandler);
            }
            if (cameraEvents.has(event)) {
                sigma.getCamera().on(event, eventHandler);
            }
        });
        // cleanup
        return () => {
            // remove events listener
            if (sigma) {
                eventTypes.forEach((event) => {
                    const eventHandler = userEvents[event];
                    if (sigmaEvents.has(event)) {
                        sigma.off(event, eventHandler);
                    }
                    if (mouseEvents.has(event)) {
                        sigma.getMouseCaptor().off(event, eventHandler);
                    }
                    if (touchEvents.has(event)) {
                        sigma.getTouchCaptor().off(event, eventHandler);
                    }
                    if (cameraEvents.has(event)) {
                        sigma.getCamera().off(event, eventHandler);
                    }
                });
            }
        };
    }, [sigma, eventHandlers, setSettings]);
    return setEventHandlers;
}
//# sourceMappingURL=useRegisterEvents.js.map