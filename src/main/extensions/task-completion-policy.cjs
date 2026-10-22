'use strict';

// Status transitions alone are not evidence of a completed user request.
// Recovery, connection setup and compaction all produce the same transitions.
const trackers = new WeakMap();
const settled = new Set(['waiting_input', 'idle', 'completed']);
const cancelled = new Set(['error', 'terminated', 'interrupted', 'stopped']);

function isSessionViewed({ BrowserWindow, subscriptions, sessionId }) {
  for (const { wc, topics } of subscriptions.values()) {
    if (wc.isDestroyed() || !topics.has('task-notification-view:' + sessionId)) continue;
    const window = BrowserWindow.fromWebContents(wc);
    if (window && !window.isDestroyed() && window.isVisible() &&
        !window.isMinimized() && window.isFocused()) return true;
  }
  return false;
}

// The renderer reports viewed conversations with a 100ms debounce. Allow that
// report to settle before deciding whether a desktop interruption is useful.
function createTracker({ sessions, notifications, isViewed = () => false, isEligible = () => true, schedule = callback => setTimeout(callback, 150) }) {
  const turns = new Map();
  function check(sessionId) {
    const turn = turns.get(sessionId);
    if (!turn || turn.scheduled) return;
    turn.scheduled = true;
    schedule(() => {
      if (turns.get(sessionId) !== turn) return;
      turn.scheduled = false;
      const session = sessions.getSession(sessionId);
      if (!session || cancelled.has(session.status)) return void turns.delete(sessionId);
      if (!settled.has(session.status) || !turn.answer) return;
      // Consume the round even when the user is looking at it. Switching
      // windows or replaying a status later must not deliver it again.
      turns.delete(sessionId);
      if (!isViewed(sessionId)) notifications.onTaskCompleted(sessionId, session.name || sessionId);
    });
  }
  const tracker = {
    begin(sessionId, options = {}) {
      const session = sessions.getSession(sessionId);
      if (!session || !isEligible(session) || session.config?.internal || session.config?.parentSessionId ||
          (options.source && options.source !== 'user') || options.syntheticMeta) return () => {};
      const turn = { answer: false, scheduled: false };
      const previous = turns.get(sessionId);
      turns.set(sessionId, turn);
      notifications.acknowledge(sessionId, 'taskComplete');
      return () => {
        if (turns.get(sessionId) === turn) {
          if (previous) {
            previous.scheduled = false;
            turns.set(sessionId, previous);
            check(sessionId);
          }
          else turns.delete(sessionId);
        }
      };
    },
    message(sessionId, message) {
      const turn = turns.get(sessionId);
      if (!turn || message.isThinking || message.isDelta) return;
      if (message.role === 'tool_use' || message.role === 'tool_result') turn.answer = false;
      if (message.role === 'assistant' && (!message.type || message.type === 'text') &&
          !message.metadata?.backgroundToolNotice && message.content?.trim()) {
        turn.answer = true;
        check(sessionId);
      }
    },
    status(sessionId, status) {
      if (cancelled.has(status)) turns.delete(sessionId);
      else if (settled.has(status)) check(sessionId);
    },
    activity(sessionId, event) {
      if (event.type === 'user_input' && event.metadata?.reason === 'user_abort') turns.delete(sessionId);
    }
  };
  trackers.set(sessions, tracker);
  return tracker;
}

function beginTurn(sessions, sessionId, options) {
  return trackers.get(sessions)?.begin(sessionId, options) || (() => {});
}

function beginInitialTurn(sessions, sessionId, config, recovery) {
  if (recovery?.mode === 'resume' || config.initialPromptVisibility === 'hidden' ||
      !config.initialPrompt?.trim()) return;
  beginTurn(sessions, sessionId);
}

async function sendTurn(sessions, sessionId, options, send) {
  const cancel = beginTurn(sessions, sessionId, options);
  try { return await send(); }
  catch (error) { cancel(); throw error; }
}

module.exports = { createTracker, beginTurn, beginInitialTurn, isSessionViewed, sendTurn };
