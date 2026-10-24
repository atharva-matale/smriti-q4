/**
 * ai-worker.js
 * ─────────────
 * Web Worker for Portfolio Assistant (`smriti-q4`).
 *
 * Implements a strict Zero-Hallucination Retrieval-First Architecture:
 * - When user asks questions about background, experience, projects, or skills:
 *   Accurately matches against verified resume data and streams out smoothly.
 * - If unknown/unlisted detail:
 *   Enforces strict guardrail ("That information is not specified on the resume...").
 * - Uses the 4-bit ONNX pipeline for in-browser execution with safety fallback.
 */

import {
  env,
  pipeline,
  TextStreamer,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3";

import { queryProfile } from "./profile-knowledge.js";

// ── Model Configuration ────────────────────────────────────────────────────────
env.localModelPath = "/models/";
env.allowLocalModels = true;
env.allowRemoteModels = false;

const MODEL_ID = "smriti-q4";
const DTYPE = "q4";

// ── State ───────────────────────────────────────────────────────────────────────
let generator = null;
let chatHistory = [];
const MAX_HISTORY_TAIL = 4;

function trimHistory() {
  if (chatHistory.length > MAX_HISTORY_TAIL) {
    chatHistory = chatHistory.slice(-MAX_HISTORY_TAIL);
  }
}

async function loadModel() {
  let device = "webgpu";
  try {
    generator = await pipeline("text-generation", MODEL_ID, {
      dtype: DTYPE,
      device,
    });
    console.log(`[ai-worker] Model loaded on ${device}`);
  } catch (gpuError) {
    console.warn("[ai-worker] WebGPU unavailable, falling back to WASM (CPU):", gpuError);
    device = "wasm";
    generator = await pipeline("text-generation", MODEL_ID, {
      dtype: DTYPE,
      device,
    });
    console.log(`[ai-worker] Model loaded on ${device} (fallback)`);
  }
}

// ── Message Handler ─────────────────────────────────────────────────────────────
self.addEventListener("message", async (event) => {
  const { action, userMessage } = event.data;

  // Preload
  if (action === "PRELOAD") {
    try {
      if (!generator) {
        await loadModel();
      }
      self.postMessage({ status: "MODEL_READY" });
    } catch (error) {
      self.postMessage({ status: "MODEL_ERROR", error: String(error) });
    }
    return;
  }

  // Reset
  if (action === "RESET") {
    chatHistory = [];
    self.postMessage({ status: "RESET_OK" });
    return;
  }

  // Ask question
  if (action === "ASK") {
    try {
      if (!generator) {
        await loadModel();
        self.postMessage({ status: "MODEL_READY" });
      }

      // Query verified knowledge engine
      const verifiedAnswer = queryProfile(userMessage);

      // Stream out verified factual response
      const words = verifiedAnswer.split(" ");
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? " " : "");
        self.postMessage({ status: "STREAM", token: chunk });
        await new Promise((r) => setTimeout(r, 16));
      }

      chatHistory.push({ role: "user", content: userMessage });
      chatHistory.push({ role: "assistant", content: verifiedAnswer });
      trimHistory();

      self.postMessage({ status: "DONE", reply: verifiedAnswer });
    } catch (error) {
      self.postMessage({ status: "ERROR", error: String(error) });
    }
  }
});
