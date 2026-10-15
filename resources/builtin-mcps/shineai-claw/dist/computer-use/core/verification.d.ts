import type { ComputerUseProvider } from './provider.js';
import { type AppTarget, type ComputerUseAction, type ElementNode, type ElementSelector, type VerificationRequest, type VerificationResult } from '../types.js';
export declare function selectorFromAction(action: ComputerUseAction): ElementSelector | undefined;
export declare function appTargetFromAction(action: ComputerUseAction): AppTarget | undefined;
export declare function verifyAction(args: {
    provider: ComputerUseProvider;
    action: ComputerUseAction;
    request?: VerificationRequest;
    targetElement?: ElementNode;
}): Promise<VerificationResult>;
