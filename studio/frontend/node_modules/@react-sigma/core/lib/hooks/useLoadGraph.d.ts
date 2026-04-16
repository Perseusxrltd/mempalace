import Graph from 'graphology';
import { Attributes } from 'graphology-types';
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
export declare function useLoadGraph<N extends Attributes = Attributes, E extends Attributes = Attributes, G extends Attributes = Attributes>(): (graph: Graph<N, E, G>, clear?: boolean) => void;
