import { Attributes } from 'graphology-types';
import Sigma from 'sigma';
/**
 * React hook to retrieve the sigma instance (from the context).
 *
 * ```typescript
 * const sigma = useSigma();
 *```
 * @category Hook
 */
export declare function useSigma<N extends Attributes = Attributes, E extends Attributes = Attributes, G extends Attributes = Attributes>(): Sigma<N, E, G>;
