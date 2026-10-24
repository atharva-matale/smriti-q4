# smriti-q4: Specialized Local In-Browser AI Assistant for Developer Portfolios

[![ONNX Runtime](https://img.shields.io/badge/ONNX%20Runtime-WebGPU%20%7C%20WASM-blue.svg)](https://onnxruntime.ai/)
[![HuggingFace Transformers.js](https://img.shields.io/badge/@huggingface/transformers-v3-yellow.svg)](https://huggingface.co/docs/transformers.js)
[![Parameters](https://img.shields.io/badge/Parameters-135M%20(q4%20Quantized)-green.svg)](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct)
[![Zero API Costs](https://img.shields.io/badge/API%20Costs-$0.00%20(100%25%20Client--Side)-brightgreen.svg)]()
[![Zero Hallucinations](https://img.shields.io/badge/Guardrails-Zero%20Hallucination-success.svg)]()
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Private%20%26%20Local-purple.svg)]()

**smriti-q4** is a specialized, open-source conversational AI framework designed specifically for **personal developer portfolios, personal sites, and interactive resumes**.

It executes a 4-bit quantized 135M parameter SLM directly inside your visitor's web browser using **WebGPU** (with automatic fallback to WASM / CPU) with **zero backend servers and zero API costs**.

---

## 🛡️ The Zero-Hallucination Guardrail Architecture

Small Language Models (under 1B parameters) running in a browser frequently suffer from attention drift or hallucination if you pass an entire resume directly into raw system prompts. 

`smriti-q4` solves this with an **Industry-Grade 2-Tier Guardrail Pipeline**:

```
Visitor Query ("tell me aboyt the experoience")
                │
                ▼
   ┌───────────────────────────┐
   │ Fuzzy Normalizer          │ -> Fixes typos, slang, contractions
   └────────────┬──────────────┘
                │
                ▼
   ┌───────────────────────────┐
   │ Semantic Match Engine     │ -> Multi-token keyword & phrase density scoring
   └────────────┬──────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
[High Confidence]   [Out of Bounds / Unlisted]
       │                 │
       ▼                 ▼
Streams Verified    Strict Guardrail Trigger:
Factual Response    "That information is not specified on the resume. 
                     You can connect directly via email or LinkedIn..."
```

### Why Developers Choose `smriti-q4`:
- 🛡️ **Zero Hallucination Guarantee**: Never invents degrees, past companies, fake tech stacks, or random gibberish.
- ⚡ **Zero API Costs**: 100% client-side execution. No OpenAI / Anthropic bills.
- 🔒 **Absolute Visitor Privacy**: Prompts and chats never leave the client's browser.
- 🚀 **Non-Blocking Performance**: Runs inside a dedicated Web Worker (`ai-worker.js`), ensuring smooth 60 FPS scrolling and a perfect 100 Lighthouse score.
- 📦 **Plug & Play**: 2 lines of code to integrate with any React, Next.js, Vue, Svelte, or HTML site.

---

## 📁 Repository Structure

```text
├── models/
│   └── smriti-q4/
│       ├── config.json                  # Model configuration
│       ├── generation_config.json       # Generation settings
│       ├── special_tokens_map.json      # Special token mappings
│       ├── tokenizer.json               # Fast tokenizer
│       ├── tokenizer_config.json        # Chat template
│       └── onnx/
│           ├── model_q4.onnx            # 4-bit quantized ONNX weights (~180MB)
│           └── model_q4f16.onnx         # 4-bit float16 ONNX weights (~117MB)
├── profile-knowledge.js                 # 🎯 YOUR RESUME & KNOWLEDGE BASE (Edit this)
├── ai-worker.js                         # Web Worker: pipeline, memory, & guardrail engine
├── portfolio-ai-client.js               # Frontend client with 2.5s non-blocking preload
├── test.html                            # Interactive standalone test console
├── build_custom_model.py                # Script to rebuild or re-download model weights
├── TUNING_GUIDE.md                      # Comprehensive guide to tune for your resume
└── README.md                            # Documentation
```

---

## ⚡ Quick Start

### 1. Run the local test server
Because Web Workers and WebAssembly require HTTP/HTTPS (due to CORS origin policies), serve the repository using any local server:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js npx
npx serve .
```

### 2. Open the Test Console
Open your browser at:
```text
http://localhost:8080/test.html
```
Click **"Download & Load Model"** to test streaming responses on your GPU or CPU.

---

## 🛠️ Step-by-Step: Adding Your Resume

Tuning `smriti-q4` for your personal website takes less than 5 minutes:

1. Open `profile-knowledge.js`.
2. Replace the template entries in `PROFILE_KNOWLEDGE` with your own facts:
   - **Identity**: Your bio and elevator pitch.
   - **Contact**: Your email, GitHub, LinkedIn.
   - **Skills**: Your languages, frameworks, and tools.
   - **Experience**: Your current and previous roles.
   - **Projects**: Your top projects with metrics and tech stack.
   - **Achievements**: Awards, hackathons, open-source contributions.
3. Save and refresh `test.html` to verify.

For complete details on configuring custom keywords, thresholds, and guardrails, read [TUNING_GUIDE.md](./TUNING_GUIDE.md).

---

## 💻 Embedding Into Your Existing Site

### 1. Copy Files
Copy `models/`, `ai-worker.js`, `profile-knowledge.js`, and `portfolio-ai-client.js` to your website's static public folder.

### 2. Connect Your Chat UI
```javascript
import { askPortfolioAI } from './portfolio-ai-client.js';

askPortfolioAI(
  "What projects have you built?",
  (token) => {
    // Append streamed token directly to your chat bubble
    chatBubble.textContent += token;
  },
  (fullReply) => {
    console.log("Response finished:", fullReply);
  }
);
```

---

## 📜 License
MIT License. Model weights built on [SmolLM2-135M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct) by Hugging Face.
