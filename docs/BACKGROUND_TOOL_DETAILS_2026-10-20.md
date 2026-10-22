# Background command results in their tool cards

Successful background commands with an exact tool-use association no longer add
the standalone `后台任务已结束 (exited) · exit 0` notice to the conversation. Their
existing command card shows running/completed/failed/stopped status. Expanding
the card displays duration, exit code and the last 16,000 output characters.
The existing turn and operation-group collapse controls remain available.

## Implementation

- `src/main/extensions/background-tool-history.cjs` retains local per-session
  evidence through the existing background-shell IPC. Session filenames are
  hashed. Restarted processes never trust an old PID as proof of a live task.
- Native Bash and SDK jobs retain their originating tool-use ID. Matching never
  guesses from the command text, which can be repeated in the same session.
- `src/renderer/assets/dev-background-tools.mjs` adds status and details to the
  original tool card. A late initial read cannot overwrite a newer pushed state.
- `scripts/patch-background-tools.mjs` applies narrow, repeatable integration
  patches during the existing development transform/build workflow.

`background-completion-policy.cjs` now checks completion input both when it
arrives and when queued input is dispatched. Once a settled turn has an answer
after its latest tool, a background completion updates evidence without starting
another model request. An outstanding turn without a final answer retains the
continuation path. Exact originating tool IDs prevent an older user turn from
steering a newer request. This uses runtime/message boundaries, not guesses from
the wording of an answer or the state of a Todo list.

Failures, stopped commands and unknown outcomes appear in a `后台执行结果`
supplement immediately below the originating turn's formal answer, without a
new model turn. `dev-background-results.mjs` groups persisted jobs by exact
session/tool association, deduplicates by job ID, and keeps repeated commands
as separate results. Each row shows its command. `查看详情` expands the original
turn, operation group and command card, then scrolls to that card.

The formal answer remains outside collapsed process details. Standalone notices
already represented by the supplement are hidden in rendering, without changing
saved conversation messages. Legacy notices require an exact outcome and nearby
completion timestamp to be hidden. Unmatched failures retain a visible fallback.
Previously generated extra model replies are not deleted. SDK exit codes that
were not supplied are shown as unavailable. Output retention is a bounded tail,
not a full command log.

## Validation

- `npm run check`: all 136 unit tests, build, static verification, application,
  cloud-removal and Codex-provider checks passed. The local-runtime responsiveness
  check failed its 1500 ms IPC threshold (1651 ms; retry 1608 ms). This unrelated
  timing check remains a validation limitation; it was not weakened. The remaining
  editor check was run separately and passed. Logs are under
  `artifacts/background-answer-results/`.
- Focused tests cover native failure/stopped outcomes, SDK outcomes, persistence,
  matching, duration, patch idempotence, supplement deduplication, turn ownership
  and precise suppression of represented notices.
- `node scripts/background-tools-smoke.mjs` passed against a real native Bash
  process and real Electron renderer using an isolated profile and local model
  fixture. Six regression scenarios cover successful completion after an answer,
  queued completion before an answer settles, continuation without a final
  answer, failure before an answer, failure after an answer and two identical
  commands failing separately. Supplement links open the exact originating cards;
  restarting restores the answer, supplement, status and command output. All
  settled-answer scenarios stop at two model HTTP requests; only the outstanding
  task causes a third request. No test messages are added to user chats.
- Evidence: `artifacts/background-tools/smoke-report.json` and scenario-specific
  `*-answer-preserved.png` / `*-completed-expanded.png` screenshots. Full-check
  output is in `artifacts/background-answer-results/check.log`.

Installed-build verification uses the same isolated test with `--installed`.
Live updates check that tasks are idle and editor tabs are saved; they back up
changed application files and verify session IDs, skill contents and appearance.

Live-update verification uses saved history to verify pre-update sessions,
because saved sessions need not all be loaded in the runtime list immediately
after launch. This does not force a chat resume or rewrite chat records.

The installed edition was updated and restarted while idle, with all 6 saved
sessions, 30 skill records and appearance settings preserved. The installed
isolated-profile regression passed the same six scenarios and restart checks
with no renderer errors (`artifacts/background-tools-installed/smoke-report.json`).
The update report and preservation verification are under
`artifacts/background-answer-results/`. The update backed up the four changed
generated files before replacing them.
