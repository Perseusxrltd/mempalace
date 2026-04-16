import React, { CSSProperties, ReactNode } from 'react';
/**
 * Properties for `ControlsContainer` component.
 */
export interface ControlsContainerProps {
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
     * Position of the container
     */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    children?: ReactNode;
}
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
export declare const ControlsContainer: React.FC<ControlsContainerProps>;
