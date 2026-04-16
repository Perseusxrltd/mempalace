"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLoadGraph = useLoadGraph;
const react_1 = require("react");
const useSigma_1 = require("./useSigma");
/**
 * React hook that helps you to load a graph.
 * If a graph was previously loaded in Sigma/Graphology, per default it is cleared.
 * You can change this behaviour by settings the parameter `clear` to false.
 *
 * ```typescript
 * const loadGraph = useLoadGraph();
 * ...
 * useEffect(() => {
 *  loadGraph(erdosRenyi(UndirectedGraph, { order: 100, probability: 0.2 }), true);
 * }, []);
 *```
 * @category Hook
 */
function useLoadGraph() {
    const sigma = (0, useSigma_1.useSigma)();
    return (0, react_1.useCallback)((graph, clear = true) => {
        if (sigma && graph) {
            if (clear && sigma.getGraph().order > 0)
                sigma.getGraph().clear();
            sigma.getGraph().import(graph);
            sigma.refresh();
        }
    }, [sigma]);
}
//# sourceMappingURL=useLoadGraph.js.map