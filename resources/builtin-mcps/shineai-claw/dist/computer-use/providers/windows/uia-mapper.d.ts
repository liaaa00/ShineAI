import { type Bounds, type ElementCapability, type ElementNode, type ElementSelector, type WindowsActionKind, type WindowsElementSource } from './types.js';
export declare function inferElementCapability(input: {
    source?: WindowsElementSource;
    controlType?: string;
    className?: string;
    patterns?: string[];
    isEnabled?: boolean;
    isFocusable?: boolean;
    nativeWindowHandle?: number;
    bounds?: Bounds;
}): ElementCapability;
export declare function mapUiaNode(rawValue: unknown, index?: number, path?: number[], windowId?: string): ElementNode;
export declare function mapUiaTree(rawValue: unknown, windowId?: string): ElementNode[];
export declare function flattenElements(nodes: ElementNode[]): ElementNode[];
export declare function scoreElementSelector(element: ElementNode, selector: ElementSelector): number;
export declare function elementMatchesSelector(element: ElementNode, selector: ElementSelector): boolean;
export declare function findElementsInTree(nodes: ElementNode[], selector: ElementSelector): ElementNode[];
export declare function canUseActionInBackground(element: ElementNode, action: WindowsActionKind): boolean;
