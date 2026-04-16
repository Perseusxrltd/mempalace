import { CameraState } from 'sigma/types';
import { AnimateOptions } from 'sigma/utils';
type CameraOptions = Partial<AnimateOptions> & {
    factor?: number;
};
/**
 * React hook that helps you to manage the camera.
 *
 * ```typescript
 * const {zoomIn, zoomOut, reset, goto, gotoNode } = useCamera();
 *```
 *
 * @category Hook
 */
export declare function useCamera(options?: CameraOptions): {
    zoomIn: (options?: CameraOptions) => void;
    zoomOut: (options?: CameraOptions) => void;
    reset: (options?: Partial<AnimateOptions>) => void;
    goto: (state: Partial<CameraState>, options?: Partial<AnimateOptions>) => void;
    gotoNode: (nodeKey: string, options?: Partial<AnimateOptions>) => void;
};
export {};
