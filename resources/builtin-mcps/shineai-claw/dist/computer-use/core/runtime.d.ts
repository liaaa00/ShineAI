import { ProviderRegistry, type ProviderRouteOptions } from '../registry.js';
import { type AppTarget, type CanonicalReport, type ComputerUseActionInput, type VerificationRequest } from '../types.js';
import { TraceRecorder } from './trace.js';
export interface ExecuteActionOptions extends ProviderRouteOptions {
    verify?: VerificationRequest;
    continueOnProviderFailure?: boolean;
    /** When set to true, execution trace recording is enabled. Default: false (opt-in). */
    enableTrace?: boolean;
    /** Optional recorder instance to use (testing / external consumers). */
    recorder?: TraceRecorder;
}
export interface ReadStateRuntimeOptions extends ProviderRouteOptions {
    includeTree?: boolean;
    includeWindows?: boolean;
    background?: boolean;
}
export declare class ComputerUseRuntime {
    readonly registry: ProviderRegistry;
    constructor(registry?: ProviderRegistry);
    canonicalReport(report: CanonicalReport): CanonicalReport;
    capabilityReport(target?: AppTarget): Promise<CanonicalReport>;
    route(actionInput: ComputerUseActionInput, options?: ProviderRouteOptions): Promise<CanonicalReport>;
    readState(target: AppTarget, options?: ReadStateRuntimeOptions): Promise<CanonicalReport>;
    executeAction(actionInput: ComputerUseActionInput, options?: ExecuteActionOptions): Promise<CanonicalReport>;
}
export declare const defaultComputerUseRuntime: ComputerUseRuntime;
