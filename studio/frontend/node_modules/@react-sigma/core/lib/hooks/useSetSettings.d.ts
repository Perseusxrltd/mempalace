import { Attributes } from 'graphology-types';
import { Settings } from 'sigma/settings';
/**
 * React hook that helps you to update Sigma’s settings.
 *
 * ```typescript
 * const setSettings = useSetSettings();
 * ...
 * useEffect(() => {
 *  setSettings({
 *    hideEdgesOnMove: true,
 *    hideLabelsOnMove: true,
 *  });
 * }, []);
 *```
 * @category Hook
 */
export declare function useSetSettings<N extends Attributes = Attributes, E extends Attributes = Attributes, G extends Attributes = Attributes>(): (newSettings: Partial<Settings<N, E, G>>) => void;
