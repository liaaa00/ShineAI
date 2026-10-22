# Desktop completion notifications

## Cause

Startup resumes recreate the runtime of old sessions. Their `running` →
`waiting_input` transition, together with a historical `initialPrompt`, passed
the old completion predicate even though no new user request or answer occurred.
The notification manager's in-memory deduplication resets on restart and cannot
distinguish this replay from a new completion.

## Behavior

- Arm completion eligibility only when a visible initial request or a new user
  request is actually handed to the adapter. Cover direct sends, scheduled/live
  queue delivery and messages buffered while a session starts.
- Hidden recovery prompts, native resume, internal/background follow-ups,
  internal sessions, child sessions and existing excluded goal sessions do not
  acquire new eligibility.
- Require a new, final assistant text and a settled runtime. Thinking, streaming
  drafts and tool progress do not qualify. Errors and user cancellation remove
  eligibility. Failed delivery rolls back the attempted send.
- Consume each qualifying round once. A subsequent actual user round rearms it;
  repeated idle events and application restarts do not replay old results.
- Report a separate visible-conversation topic through the existing trusted IPC
  subscription channel. Ordinary data subscriptions can also contain hidden
  mounted tabs, so they are insufficient. Combine the view topic with window
  visibility, minimization and focus to suppress the desktop toast for a viewed
  conversation. Allow the existing 100ms subscription reporting debounce to
  settle for 150ms; this delay affects only notifications, not model requests.
- Preserve existing error/permission reminders, notification settings and
  notification-click navigation. Windows notification-center history is not
  automatically erased.

## Implementation and verification

Readable policy: `src/main/extensions/task-completion-policy.cjs`.
Reproducible bundle edits: `scripts/patch-task-notifications.mjs`.

`test/task-notifications.test.mjs` covers recovery, fresh initial requests,
foreground consumption, repeated rounds, failed sends, cancellation, tools,
exact viewed-window checks and extracted real application event/dispatch wiring.

`scripts/task-completion-smoke.mjs` exercises actual Electron IPC, the native API
adapter and a deterministic local HTTP model fixture with an isolated profile
and Butler directory. It checks background rounds, a focused rendered
conversation, restart and post-restart delivery. Native toast presentation is
intercepted; this does not claim real Windows notification-center interaction or
remote model correctness. Reports are under `artifacts/task-completion/`.

`npm run check` is the full required validation; its report for this change is
`artifacts/task-completion-check.log`.

Final verification: full check passed (166 tests and required application smoke
checks). Both development and installed completion smoke reports passed all six
scenarios. An earlier local-runtime latency check measured 1570ms against its
1500ms threshold while copying the installation; the final full run passed
with 251ms maximum sampled unrelated IPC latency.

The four changed payload files were copied to `E:/AI/ShineAI/resources/app/out`
with source/build/installed hash equality verified. Backup:
`artifacts/installed-update-1792564429810/report.json`.
The user's running application was not forcibly restarted; a complete exit and
relaunch is required. Isolated installed verification did not use their profile.
