import React, { CSSProperties } from 'react';
type ZoomLabelKeys = 'zoomIn' | 'zoomOut' | 'reset';
/**
 * Properties for `ZoomControl` component
 */
export interface ZoomControlProps {
    /**
     * HTML class that will be added to all div button wrapper
     */
    className?: string;
    /**
     * HTML CSS style that will be added to all div button wrapper
     */
    style?: CSSProperties;
    /**
     * Number of ms for the zoom animation (default is 200ms)
     */
    animationDuration?: number;
    /**
     * It's possible to customize the button, by passing to JSX Element.
     * First one is for the "zoom in", second for "zoom out" and third for "view whole graph".
     * Example :
     * ```jsx
     * <ZoomControl>
     *   <BsZoomIn />
     *   <BsZoomOut />
     *   <BiReset />
     * </FullScreenControl>
     * ```
     */
    children?: [React.JSX.Element, React.JSX.Element, React.JSX.Element];
    /**
     * Map of the labels we use in the component.
     * This is usefull for I18N
     */
    labels?: {
        [Key in ZoomLabelKeys]?: string;
    };
}
/**
 * The `ZoomControl` create three UI buttons that allows the user to
 * - zoom in
 * - zoom out
 * - reset zoom (ie. see the whole graph)
 *
 * ```jsx
 * <SigmaContainer>
 *   <ControlsContainer>
 *     <ZoomControl />
 *   </ControlsContainer>
 * </SigmaContainer>
 * ```
 *
 * See {@link ZoomControlProps} for the component's properties.
 *
 * @category Component
 */
export declare const ZoomControl: React.FC<ZoomControlProps>;
export {};
