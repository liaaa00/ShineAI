# Task notification activation

The task notification manager previously displayed native notifications without
a click callback and discarded the session ID at the display boundary. Windows
could display completion notifications, but clicking them performed no action.

`main/extensions/task-notifications.cjs` now retains native notifications until
click, dismissal or failure. Clicking restores a minimized main window, shows
a hidden window, focuses it, and routes the session ID through the existing
`butler:navigate-session` event and renderer navigation. Finished sessions open
their history without starting another model request. General notifications
without a session ID reveal the main window.

Navigation waits for a loading main document; preload buffers the latest event
until React subscribes. No new privileged IPC methods or renderer permissions
are introduced. Notification settings, sound, do-not-disturb and duplicate
suppression remain controlled by the existing notification manager.

## Validation

- `npm test`: window loading/destruction, latest target, early preload delivery,
  native callback registration, and repeatable source patching.
- `npm run smoke:notifications`: reads the actual task notification manager from
  the running application's bundle, replaces only native notification display
  with an event emitter, and emits its click. Verifies real BrowserWindow
  restore/show/focus and visible conversation navigation from settings, including
  completed sessions, notification preferences and renderer reload.
- `node scripts/task-notifications-smoke.mjs --executable="E:/AI/SpectrAI Dev/SpectrAI Dev.exe"`:
  same checks against the independent installed desktop application, with an
  isolated temporary profile and restored protocol registrations.

The smoke test does not click a real Windows Action Center toast or make model
requests. It verifies the callback and application behavior following that event.

## Updating an independent installation

After `npm run build`, run
`node scripts/update-installed-task-notifications.mjs "<installation directory>"`.
The updater accepts only known development packages, patches main/preload in
place, copies the readable notification extension, and records hashes and backups
under `artifacts/installed-task-notifications-*`. It preserves the existing
profile, executable, bridge and installation metadata. Changes take effect after
restarting the application; wait for active tasks and save edits first.
