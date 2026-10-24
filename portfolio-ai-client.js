/**
 * portfolio-ai-client.js
 * ──────────────────────
 * Lightweight frontend helper that manages the AI Web Worker lifecycle.
 *
 * Features:
 *   - Silent background preload after page load (2500 ms delay)
 *   - Zero impact on initial paint / Lighthouse score
 *   - Simple API: askPortfolioAI(question, onTokenStream, onComplete)
 *   - Conversation reset: resetConversation()
 *
 * Usage:
 *   import { askPortfolioAI, resetConversation } from './portfolio-ai-client.js';
 *
 *   // Ask a question with streaming
 *   askPortfolioAI(
 *     'What projects have you built?',
 *     (token) => { display.textContent += token; },
 *     (fullReply) => { console.log('Done:', fullReply); }
 *   );
 *
 *   // Clear conversation history
 *   resetConversation();
 */

// ── Worker Instance ─────────────────────────────────────────────────────────────
let worker = null;
let modelReady = false;
const readyCallbacks = [];

/**
 * Initialise the worker (idempotent).
 */
function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./ai-worker.js", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

// ── Silent Background Preload ───────────────────────────────────────────────────
// Fires once the page has fully loaded + 2500 ms buffer so it never competes
// with critical resources.

window.addEventListener("load", () => {
  setTimeout(() => {
    const w = getWorker();

    w.addEventListener("message", function onPreload(e) {
      if (e.data.status === "MODEL_READY") {
        modelReady = true;
        console.log("[portfolio-ai] Model preloaded and ready.");
        // Flush any callbacks that were waiting
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks.length = 0;
        w.removeEventListener("message", onPreload);
      }
      if (e.data.status === "MODEL_ERROR") {
        console.error("[portfolio-ai] Preload failed:", e.data.error);
        w.removeEventListener("message", onPreload);
      }
    });

    w.postMessage({ action: "PRELOAD" });
  }, 2500);
});

// ── Public API ──────────────────────────────────────────────────────────────────

/**
 * Send a question to the portfolio AI.
 *
 * @param {string}   question       — The user's question.
 * @param {function} onTokenStream  — Called with each streamed token string.
 * @param {function} onComplete     — Called with the full reply string when done.
 */
export function askPortfolioAI(question, onTokenStream, onComplete) {
  const w = getWorker();

  function handleMessage(e) {
    const { status, token, reply, error } = e.data;

    switch (status) {
      case "MODEL_READY":
        // Model just loaded on-demand (first question before preload finished)
        modelReady = true;
        break;

      case "STREAM":
        if (typeof onTokenStream === "function") {
          onTokenStream(token);
        }
        break;

      case "DONE":
        if (typeof onComplete === "function") {
          onComplete(reply);
        }
        w.removeEventListener("message", handleMessage);
        break;

      case "ERROR":
        console.error("[portfolio-ai] Inference error:", error);
        if (typeof onComplete === "function") {
          onComplete(null, error);
        }
        w.removeEventListener("message", handleMessage);
        break;
    }
  }

  w.addEventListener("message", handleMessage);
  w.postMessage({ action: "ASK", userMessage: question });
}

/**
 * Clear the conversation history, keeping only the system prompt.
 */
export function resetConversation() {
  const w = getWorker();
  w.postMessage({ action: "RESET" });
}
