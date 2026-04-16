import React, { CSSProperties, RefObject } from 'react';
type FullScreenLabelKeys = 'enter' | 'exit';
/**
 * Properties for `FullScreenControl` component.
 */
export interface FullScreenControlProps {
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
    /**
     * If defined, this container will be taken for the fullscreen instead of the sigma one.
     */
    container?: RefObject<HTMLElement | null>;
    /**
     * It's possible to customize the button, by passing to JSX Element.
     * First one is for the "enter fullscreen", and the second to "exit fullscreen".
     * Example :
     * ```jsx
     * <FullScreenControl>
     *   <BiFullscreen />
     *   <BiExitFullscreen />
     * </FullScreenControl>
     * ```
     */
    children?: [React.JSX.Element, React.JSX.Element];
    /**
     * Map of the labels we use in the component.
     * This is usefull for I18N
     */
    labels?: {
        [Key in FullScreenLabelKeys]?: string;
    };
}
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
export declare const FullScreenControl: React.FC<FullScreenControlProps>;
export {};
