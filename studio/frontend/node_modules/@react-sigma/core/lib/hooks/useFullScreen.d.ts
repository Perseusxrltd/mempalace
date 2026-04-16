/**
 * React hook that helps you to set graph in fullmode.
 *
 * ```typescript
 * const {toggle, isFullScreen} = useFullscreen();
 *```
 * @category Hook
 */
export declare function useFullScreen(container?: HTMLElement | null): {
    toggle: () => void;
    isFullScreen: boolean;
};
