import { CanonicalReportSchema, } from '../types.js';
export function routeToReportSteps(candidates) {
    return candidates.map((candidate) => ({
        providerId: candidate.provider.id,
        providerKind: candidate.provider.kind,
        priority: candidate.priority,
        reason: candidate.reason,
    }));
}
export function fallbackProviderIds(candidates) {
    return candidates
        .filter((candidate) => candidate.fallback)
        .map((candidate) => candidate.provider.id);
}
export function canonicalSuccess(args) {
    return CanonicalReportSchema.parse({
        ok: true,
        status: 'success',
        phase: args.phase,
        providerId: args.providerId,
        providerKind: args.providerKind,
        action: args.action,
        target: args.target,
        result: args.result,
        state: args.state,
        capabilities: args.capabilities ?? [],
        verification: args.verification,
        route: args.route ?? [],
        fallbackSuggested: false,
        fallbackProviders: [],
        warnings: args.warnings ?? [],
    });
}
export function canonicalFailure(args) {
    return CanonicalReportSchema.parse({
        ok: false,
        status: 'failure',
        phase: args.phase,
        providerId: args.providerId,
        providerKind: args.providerKind,
        action: args.action,
        target: args.target,
        result: args.result,
        state: args.state,
        capabilities: args.capabilities ?? [],
        verification: args.verification,
        route: args.route ?? [],
        fallbackSuggested: args.fallbackSuggested ?? false,
        fallbackProviders: args.fallbackProviders ?? [],
        error: {
            code: args.code,
            message: args.message,
            details: args.details,
        },
        warnings: args.warnings ?? [],
    });
}
export function actionFailureResult(args) {
    return {
        ok: false,
        actionId: args.action.id,
        actionType: args.action.type,
        providerId: args.providerId,
        providerKind: args.providerKind,
        fallbackSuggested: args.fallbackSuggested,
        fallbackReason: args.fallbackReason,
        verification: args.verification,
        error: {
            code: args.code,
            message: args.message,
            details: args.details,
        },
        warnings: args.warnings ?? [],
    };
}
