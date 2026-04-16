import { Attributes } from 'graphology-types';
import React, { CSSProperties, ReactElement } from 'react';
import { Sigma } from 'sigma';
import { Settings } from 'sigma/settings';
import { GraphType } from '../types';
/**
 * Properties for `SigmaContainer` component
 */
export interface SigmaContainerProps<N extends Attributes, E extends Attributes, G extends Attributes> {
    /**
     * Graphology instance or constructor
     */
    graph?: GraphType<N, E, G>;
    /**
     * Sigma settings
     */
    settings?: Partial<Settings<N, E, G>>;
    /**
     * HTML id
     */
    id?: string;
    /**
     * HTML class
     */
    className?: string;
    /**
     * HTML CSS style
     */
    style?: CSSProperties;
}
/**
 * The `SigmaContainer` component is responsible of create the Sigma instance, and provide it to its child components using a React Context that can be accessible via the hook {@link useSigma}.
 *
 * ```jsx
 * <SigmaContainer id="sigma-graph">
 *   <MyCustomGraph />
 * </SigmaContainer>
 *```
 *
 * See {@link SigmaContainerProps} for the component's properties.
 *
 * @category Component
 */
export declare const SigmaContainer: <N extends Attributes = Attributes, E extends Attributes = Attributes, G extends Attributes = Attributes>(props: SigmaContainerProps<N, E, G> & {
    children?: React.ReactNode | undefined;
} & React.RefAttributes<Sigma<N, E, G> | null>) => ReactElement;
