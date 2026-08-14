# ⚡ WEBSITE-AUDITOR

> **Ultra-Fast, Deep Website Intelligence CLI & AI Diagnostic Engine powered by LoRA / QLoRA Adapters, Cyberpunk Terminal Gauges, and Live Web Dashboard.**

```
  ██╗    ██╗███████╗██████╗ ███████╗██╗████████╗███████╗     █████╗ ██╗   ██╗██████╗ ██╗████████╗ ██████╗ ██████╗ 
  ██║    ██║██╔════╝██╔══██╗██╔════╝██║╚══██╔══╝██╔════╝    ██╔══██╗██║   ██║██╔══██╗██║╚══██╔══╝██╔═══██╗██╔══██╗
  ██║ █╗ ██║█████╗  ██████╔╝███████╗██║   ██║   █████╗      ███████║██║   ██║██║  ██║██║   ██║   ██║   ██║██████╔╝
  ██║███╗██║██╔══╝  ██╔══██╗╚════██║██║   ██║   ██╔══╝      ██╔══██║██║   ██║██║  ██║██║   ██║   ██║   ██║██╔══██╗
  ╚███╔███╔╝███████╗██████╔╝███████║██║   ██║   ███████╗    ██║  ██║╚██████╔╝██████╔╝██║   ██║   ╚██████╔╝██║  ██║
   ╚══╝╚══╝ ╚══════╝╚═════╝ ╚══════╝╚═╝   ╚═╝   ╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
```

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B%20%7C%2022%2B-green.svg)](https://nodejs.org)
[![LoRA Fine-Tuning Ready](https://img.shields.io/badge/AI-LoRA%20%26%20QLoRA-ff007a.svg)](#-lora--qlora-system)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-00f0ff.svg)](#)

---

## 🔥 Features at a Glance

- 🏎️ **Ultra-Fast Multi-Pillar Diagnostics**: Deep audit of **Security**, **Performance (TTFB & Assets)**, **SEO**, **Accessibility (a11y)**, and **Modern Best Practices**.
- 🧠 **LoRA & QLoRA Specialized Personas**:
  - `ecommerce` 🛒: E-Commerce Conversion Rate Optimization, checkout friction & trust indicators.
  - `security` 🛡️: OWASP Top 10, CSP policy generation & header fortification.
  - `performance` ⚡: Core Web Vitals (LCP/CLS/INP), critical rendering path & edge caching.
  - `saas` 🚀: Above-the-fold value prop, headline punchiness & signup friction.
  - `roast` 🔥: Savage, hilarious, viral constructive critique designed for internet fame.
  - `general` 🧠: Full-spectrum executive architectural diagnosis.
- 💾 **AI Fine-Tuning Dataset Exporter**: Automatically synthesizes Alpaca & ShareGPT format `JSONL` datasets directly from real-world site audits to train your own local Unsloth / Hugging Face LoRA models.
- 📦 **100+ Framework & Infrastructure Fingerprinter**: Detects Next.js, Nuxt, React, Vue, Svelte, Tailwind, Cloudflare, Vercel, Shopify, WordPress, and more.
- 💻 **Cyberpunk Terminal TUI**: High-energy ANSI gradient banners, colored gauges, letter grades (S / A / B / C / D / F), and instant copy-paste fix snippets.
- 🌐 **Interactive Live Web Dashboard (`--serve`)**: Standalone dark-mode web viewer with real-time score dials, interactive filters, dynamic LoRA persona switcher, and 1-click downloads.
- 📄 **Multi-Format Reports**: Export to standalone **HTML**, **JSON**, or **Markdown**.
- 🤖 **Zero-Dependency Heuristic AI + Pluggable LLMs**: Works 100% offline with built-in neural heuristics or connects to Ollama, OpenAI, Anthropic, or Groq.
- 🔄 **CI/CD Ready**: Fail builds if health score drops below target using `--fail-under 85`.

---

## 🚀 Quick Start

### Installation

```bash
npm install -g website-auditor
# Or run with npx without installing:
# npx website-auditor <url>
```

### 1. Basic Audit
```bash
# Run audit against any website
audit https://example.com

# Or use the demo showcases:
audit saas
audit ecommerce
audit roast
```

### 2. LoRA Persona Audits
```bash
# Savage viral roast mode
audit https://mysite.com --lora roast

# E-commerce CRO mode
audit https://myshop.com --lora ecommerce

# DevSecOps infosec hardener
audit https://myapi.com --lora security
```

### 3. Spin up the Interactive Live Web Dashboard
```bash
audit https://mysite.com --serve 3000
```
Then visit `http://localhost:3000` to interact with the visual dashboard, filter issues, and switch AI personas on the fly.

### 4. Export LoRA / QLoRA Fine-Tuning Datasets
```bash
audit https://mysite.com --export-lora dataset.jsonl
```
This generates standard `{"instruction": "...", "input": "...", "output": "..."}` pairs ready to fine-tune LLaMA 3, Mistral, or Qwen models with Unsloth / Axolotl!

### 5. Multi-Format Report Export
```bash
# Export standalone HTML report, JSON data, and Markdown summary all at once
audit https://mysite.com --export-html report.html --export-json report.json --export-md report.md
```

### 6. CI/CD GitHub Actions Integration
```bash
# Fail CI build if overall site health score is under 80
audit https://preview.mysite.com --fail-under 80
```

---

## 🛠️ CLI Options

| Flag | Shorthand | Description | Default |
| :--- | :---: | :--- | :--- |
| `[url]` | | Target URL or demo preset (`saas`, `ecommerce`, `roast`) | `saas` |
| `--lora <adapter>` | `-l` | LoRA adapter persona (`general`, `ecommerce`, `security`, `performance`, `saas`, `roast`) | `general` |
| `--llm <provider>` | | LLM Engine (`builtin`, `ollama`, `openai`, `anthropic`, `groq`, `custom`) | `builtin` |
| `--model <model>` | | Custom LLM model name (e.g. `llama3.2`, `gpt-4o-mini`) | `null` |
| `--api-key <key>` | | LLM API key (or read from environment variable) | `null` |
| `--export-lora <file>` | | Export LoRA fine-tuning JSONL training dataset | `null` |
| `--export-html <file>` | | Export single-file interactive HTML report | `null` |
| `--export-json <file>` | | Export full raw diagnostic report as JSON | `null` |
| `--export-md <file>` | | Export executive Markdown report | `null` |
| `--serve [port]` | | Launch interactive Cyberpunk live Web Dashboard | `3000` |
| `--fail-under <score>` | | Exit with code 1 if score is under threshold | `null` |
| `--timeout <ms>` | | Request timeout in milliseconds | `15000` |
| `--quiet` | `-q` | Quiet output mode (JSON only) | `false` |

---

## 🧠 LoRA & QLoRA System Architecture

```
                               ┌─────────────────────────────┐
                               │     Website Auditor Core    │
                               │  (DOM, SSL, Headers, TTFB)  │
                               └──────────────┬──────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     │                                                 │
          ┌──────────▼──────────┐                           ┌──────────▼──────────┐
          │  LoRA Persona Engine │                           │ LoRA Dataset Synth  │
          │                     │                           │                     │
          │ • E-Commerce CRO    │                           │ • Alpaca Format     │
          │ • Infosec Hardener  │                           │ • ShareGPT Format   │
          │ • Performance Hacker│                           │ • Axolotl / Unsloth │
          │ • SaaS Copywriter   │                           │   Ready JSONL       │
          │ • Roast Master      │                           └─────────────────────┘
          └─────────────────────┘
```

### Fine-Tuning With Your Generated Dataset
To fine-tune your own local model using the exported `dataset.jsonl`, run Unsloth or Axolotl:

```python
from unsloth import FastLanguageModel
import torch

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3.2-3b-bnb-4bit",
    max_seq_length = 2048,
    load_in_4bit = True,
)

model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
)
```

---

## 🧩 Programmatic Node.js API

You can also import and use the auditor directly in your Node/TypeScript projects:

```javascript
import { runAudit, exportLoraDataset, exportHtmlReport } from 'website-auditor';

const report = await runAudit('https://example.com', {
  lora: 'security',
  llm: 'builtin'
});

console.log(`Overall Health Score: ${report.overallScore}/100 (${report.overallGrade})`);
console.log(`Tech Stack: ${report.techStack.map(t => t.name).join(', ')}`);

// Export fine-tuning dataset
await exportLoraDataset(report, './lora_dataset.jsonl');

// Export HTML report
await exportHtmlReport(report, './audit_report.html');
```

---

## 🧪 Testing

Run the automated test suite:

```bash
npm test
```

---

## 📄 License

MIT License &copy; 2026 WEBSITE-AUDITOR Team.
