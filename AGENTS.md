# Development boundaries

- Preserve `archive/official-1.0.6` as the immutable published baseline.
- Work in `src` and `scripts`; `out` is generated with `npm run build`.
- Prefer readable modules under `src/main/extensions` and `src/main/runtime` for new work. Add narrow preload methods and keep TypeScript interface declarations in sync.
- Keep development data, ports, protocol handlers and runtime separate from the official installation. Do not introduce automatic migration from official user profiles.
- Local identity represents development capabilities only. Hosted membership, subscriptions, provider credentials and quotas retain their real server validation.
- Upstream hosted cloud services have been removed from this edition. Do not reintroduce upstream login, billing, collaboration, telemetry, relay or publishing. Retain independent provider authentication and user-specified model endpoints; local-first does not mean blocking all network traffic. A separately designed self-hosted remote service is a future feature, not an existing capability.
- Preserve public skill and MCP markets, including official public registries: browsing, refresh, download and local installation do not require ShineAI hosted membership and must not be blocked as cloud account services.
- Keep renderer sandboxing, context isolation and main-process IPC source checks enabled. Privileged operations require explicit validated interfaces.
- Dependency snapshots preserve native ABI 149. Restore application dependencies from `scripts/restore-dependencies.py`, not from an unrelated Electron runtime.
- Run `npm run check` after changes to main/preload/renderer. Use focused tests for meaningful state, security or behavior changes.
- Report actual validation scope. An extraction hash or a rendered shell does not establish successful model calls, session persistence or cloud functionality.
