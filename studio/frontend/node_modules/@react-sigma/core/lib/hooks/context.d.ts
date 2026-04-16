import { Attributes } from 'graphology-types';
import Sigma from 'sigma';
export interface SigmaContextInterface<N extends Attributes = Attributes, E extends Attributes = Attributes, G extends Attributes = Attributes> {
    sigma: Sigma<N, E, G>;
    container: HTMLElement;
}
/**
 * @hidden
 */
export declare const SigmaContext: import("react").Context<SigmaContextInterface<Attributes, Attributes, Attributes> | null>;
/**
 * @hidden
 */
export declare const SigmaProvider: import("react").Provider<SigmaContextInterface<Attributes, Attributes, Attributes> | null>;
/**
 * React hook that store the sigma and html container reference.
 *
 * ```typescript
 * const {sigma, container} = useSigmaContext();
 *```
 *
 * See {@link SigmaContextInterface} for more information.
 *
 * @category Hook
 */
export declare function useSigmaContext<N extends Attributes = Attributes, E extends Attributes = Attributes, G extends Attributes = Attributes>(): SigmaContextInterface<N, E, G>;
