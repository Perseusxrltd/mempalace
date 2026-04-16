import { Attributes } from 'graphology-types';
import { EventHandlers } from '../types';
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
export declare function useRegisterEvents<N extends Attributes = Attributes, E extends Attributes = Attributes, G extends Attributes = Attributes>(): (eventHandlers: Partial<EventHandlers>) => void;
