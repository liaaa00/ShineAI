import type { DetectedElement } from '../../../helpers/ipc/protocol.js';
import type { MacOSAXSelector, MacOSElementNode } from './types.js';
export declare function selectorFromDetectedElement(element: DetectedElement): MacOSAXSelector;
export declare function toMacOSElementNode(element: DetectedElement): MacOSElementNode;
export declare function buildElementTree(elements: DetectedElement[]): {
    roots: MacOSElementNode[];
    flat: MacOSElementNode[];
};
export declare function flattenElementTree(nodes: MacOSElementNode[]): MacOSElementNode[];
export declare function elementMatchesSelector(element: MacOSElementNode, selector: MacOSAXSelector): boolean;
export declare function findBestElement(elements: MacOSElementNode[], selector: MacOSAXSelector): MacOSElementNode | null;
