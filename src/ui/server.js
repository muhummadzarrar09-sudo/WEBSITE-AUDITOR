import http from 'node:http';
import { generateAiInsights } from '../ai/llmEngine.js';
import { exportLoraDataset } from '../ai/loraDatasetExporter.js';
import { scanUrl } from '../core/scanner.js';
import { auditSecurity } from '../auditors/security.js';
import { auditPerformance } from '../auditors/performance.js';
import { auditSeo } from '../auditors/seo.js';
import { auditAccessibility } from '../auditors/accessibility.js';
import { auditBestPractices } from '../auditors/bestPractices.js';
import { detectTechStack } from '../auditors/techStack.js';

/**
 * Launch the Interactive Cyberpunk Live Web Dashboard
 */
export function startDashboardServer(initialReport, port = 3000) {
  let currentReport = initialReport;

  const server = http.createServer(async (req, res) => {
    // Enable CORS and host-agnostic headers for preview proxy
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const urlObj = new URL(req.url, `http://0.0.0.0:${port}`);

    // 1. API: Get Current Report JSON
    if (urlObj.pathname === '/api/report') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentReport));
      return;
    }

    // 2. API: Download LoRA Dataset
    if (urlObj.pathname === '/api/lora-dataset') {
      const format = urlObj.searchParams.get('format') || 'alpaca';
      const tempPath = `/tmp/lora_${Date.now()}_${format}.jsonl`;
      await exportLoraDataset(currentReport, tempPath, { format });
      const fs = await import('node:fs/promises');
      const content = await fs.readFile(tempPath, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/x-jsonlines',
        'Content-Disposition': `attachment; filename="lora_audit_${format}.jsonl"`,
      });
      res.end(content);
      return;
    }

    // 3. API: Switch LoRA Persona
    if (urlObj.pathname === '/api/switch-lora' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { lora } = JSON.parse(body || '{}');
          const aiInsights = await generateAiInsights(currentReport, { lora });
          currentReport.aiInsights = aiInsights;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, aiInsights }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 4. API: Run New Audit from Web UI
    if (urlObj.pathname === '/api/audit' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { targetUrl, lora } = JSON.parse(body || '{}');
          if (!targetUrl) throw new Error('Target URL is required');

          const scanData = await scanUrl(targetUrl);
          const sec = auditSecurity(scanData);
          const perf = auditPerformance(scanData);
          const seo = auditSeo(scanData);
          const a11y = auditAccessibility(scanData);
          const bp = auditBestPractices(scanData);
          const techStack = detectTechStack(scanData);

          const categories = [sec, perf, seo, a11y, bp];
          const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
          const getGrade = (s) => (s >= 95 ? 'S' : s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 50 ? 'C' : s >= 35 ? 'D' : 'F');

          currentReport = {
            url: scanData.url,
            scannedAt: new Date().toISOString(),
            overallScore,
            overallGrade: getGrade(overallScore),
            categories,
            techStack,
            scanData: {
              statusCode: scanData.statusCode,
              timing: scanData.timing,
              ssl: scanData.ssl,
              contentLength: scanData.contentLength,
            },
          };

          currentReport.aiInsights = await generateAiInsights(currentReport, { lora: lora || 'general' });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(currentReport));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 5. Main HTML Dashboard
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDashboardHtml(currentReport));
  });

  server.listen(port, '0.0.0.0', () => {
    // Listening bound to 0.0.0.0
  });

  return server;
}

export function renderDashboardHtml(report) {
  const reportJson = JSON.stringify(report).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Auditor — ${report.url}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            cyber: {
              bg: '#0B0D17',
              card: '#141829',
              border: '#222B45',
              cyan: '#00F0FF',
              pink: '#FF007A',
              neon: '#00FF9D',
              purple: '#7928CA',
            }
          }
        }
      }
    }
  </script>
  <style>
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 15px rgba(0, 240, 255, 0.2); }
      50% { box-shadow: 0 0 30px rgba(0, 240, 255, 0.5); }
    }
    .glow-box { animation: pulseGlow 4s infinite ease-in-out; }
    .glass-card {
      background: rgba(20, 24, 41, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
  </style>
</head>
<body class="bg-[#0B0D17] text-slate-100 min-h-screen font-sans antialiased selection:bg-cyan-500 selection:text-black">
  <div id="app" class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    
    <!-- Top Header -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-3xl">⚡</span>
          <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            WEBSITE AUDITOR INTELLIGENCE
          </h1>
          <span class="text-xs font-mono uppercase bg-cyan-950 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-800/50 font-bold">
            LoRA / QLoRA v1.0
          </span>
        </div>
        <p class="text-slate-400 text-sm mt-1">Deep Full-Stack Diagnostic &amp; LoRA Dataset Engine</p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap items-center gap-3">
        <a href="/api/lora-dataset?format=alpaca" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition">
          <span>🧠</span> Export LoRA (Alpaca)
        </a>
        <a href="/api/lora-dataset?format=sharegpt" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-2 transition">
          <span>💾</span> Export ShareGPT
        </a>
        <button onclick="window.print()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-2 transition">
          <span>🖨️</span> Print / PDF
        </button>
      </div>
    </header>

    <!-- Scan URL Bar -->
    <div class="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-3">
      <input type="text" id="targetUrlInput" placeholder="https://example.com" value="${report.url}" class="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400" />
      <select id="loraSelect" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
        <option value="general">🧠 General Core Auditor</option>
        <option value="roast">🔥 Savage Roast Master</option>
        <option value="ecommerce">🛒 E-Commerce &amp; CRO</option>
        <option value="security">🛡️ Infosec Hardener</option>
        <option value="performance">⚡ Performance Hacker</option>
        <option value="saas">🚀 SaaS Copywriter</option>
      </select>
      <button onclick="runNewAudit()" id="auditBtn" class="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2">
        <span>⚡</span> Audit Now
      </button>
    </div>

    <!-- Target Overview & Big Score Card -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Big Scorecard -->
      <div class="glass-card glow-box rounded-2xl p-6 flex flex-col justify-between border-cyan-500/30">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-xs uppercase tracking-widest text-slate-400 font-semibold">Overall Site Score</span>
            <div class="text-5xl font-black text-white mt-2 flex items-baseline gap-2">
              <span id="scoreText">${report.overallScore}</span>
              <span class="text-slate-500 text-2xl font-bold">/100</span>
            </div>
          </div>
          <div id="gradeBadge" class="w-16 h-16 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center text-3xl font-black text-cyan-400 shadow-lg shadow-cyan-500/20">
            ${report.overallGrade}
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <div class="text-xs text-slate-400">Status</div>
            <div class="text-sm font-bold text-emerald-400 mt-1">${report.scanData?.statusCode || 200} OK</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">TTFB</div>
            <div class="text-sm font-bold text-cyan-400 mt-1">${report.scanData?.timing?.ttfb || 0}ms</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">SSL Days</div>
            <div class="text-sm font-bold text-purple-400 mt-1">${report.scanData?.ssl?.daysRemaining ?? 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Target Info & Detected Tech Stack -->
      <div class="glass-card rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs uppercase tracking-widest text-slate-400 font-semibold">Detected Tech Stack &amp; Infrastructure</span>
            <span class="text-xs text-cyan-400 font-mono">${report.techStack.length} Technologies</span>
          </div>
          <div class="flex flex-wrap gap-2 mt-3" id="techStackPills">
            ${report.techStack.map(t => `
              <div class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-700/70 rounded-lg text-xs">
                <span>${t.icon}</span>
                <span class="font-bold text-slate-200">${t.name}</span>
                <span class="text-[10px] text-slate-500 font-mono">(${t.category})</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div>Target: <span class="text-slate-200 font-mono">${report.url}</span></div>
          <div>Audit Time: <span class="text-slate-200 font-mono">${new Date(report.scannedAt).toLocaleTimeString()}</span></div>
        </div>
      </div>

    </div>

    <!-- Category Gauges Grid -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4" id="categoryGauges">
      ${report.categories.map(c => {
        const color = c.score >= 85 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20' : (c.score >= 70 ? 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20' : 'text-rose-400 border-rose-500/40 bg-rose-950/20');
        return `
          <div class="glass-card p-4 rounded-xl border ${color} flex flex-col items-center text-center">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">${c.category}</span>
            <div class="text-3xl font-black mt-2">${c.score}<span class="text-sm font-normal text-slate-500">/100</span></div>
            <div class="text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">Grade ${c.grade}</div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- AI & LoRA Intelligence Hub -->
    <div class="glass-card rounded-2xl p-6 border-purple-500/40 relative overflow-hidden" id="aiHub">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-xl">
            🧠
          </div>
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              AI &amp; LoRA Intelligence Studio
              <span class="text-xs px-2 py-0.5 rounded bg-purple-900 text-purple-300 font-mono font-normal" id="currentAdapterLabel">
                ${report.aiInsights?.adapterUsed || 'Core Auditor'}
              </span>
            </h2>
            <p class="text-xs text-slate-400" id="currentProviderLabel">${report.aiInsights?.provider || 'Built-in Engine'}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">Switch LoRA Persona:</span>
          <select onchange="switchLoraPersona(this.value)" class="bg-slate-900 border border-purple-500/50 rounded-lg px-3 py-1.5 text-xs text-purple-300 font-semibold focus:outline-none">
            <option value="general">🧠 Core Auditor</option>
            <option value="roast">🔥 Savage Roast Master</option>
            <option value="ecommerce">🛒 E-Commerce &amp; CRO</option>
            <option value="security">🛡️ Infosec Hardener</option>
            <option value="performance">⚡ Performance Hacker</option>
            <option value="saas">🚀 SaaS Copywriter</option>
          </select>
        </div>
      </div>

      <!-- Executive Diagnosis Box -->
      <div class="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans" id="aiSummaryBox">
        ${report.aiInsights?.summary || 'No AI insights available.'}
      </div>

      <!-- Prioritized Recommendations List -->
      <div class="mt-4 space-y-2.5" id="aiRecommendationsList">
        ${(report.aiInsights?.recommendations || []).map((r, i) => `
          <div class="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3 text-xs">
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${r.priority.includes('CRITICAL') ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-yellow-950 text-yellow-400 border border-yellow-800'}">
              ${r.priority}
            </span>
            <div class="flex-1">
              <span class="font-bold text-white">${r.title}</span>
              <p class="text-slate-400 mt-0.5">${r.action}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Code Snippet Blueprints -->
      ${report.aiInsights?.codeBlueprints?.length > 0 ? `
        <div class="mt-6">
          <h3 class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Generated Production Fix Blueprints</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${report.aiInsights.codeBlueprints.map(snippet => `
              <div class="bg-slate-950 rounded-xl border border-slate-800 p-3">
                <div class="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                  <span class="text-xs font-mono text-cyan-400">${snippet.title}</span>
                  <button onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); this.innerText='Copied!';" class="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-slate-300">Copy</button>
                  <span class="hidden">${snippet.code}</span>
                </div>
                <pre class="text-[11px] font-mono text-emerald-400 overflow-x-auto p-2">${snippet.code}</pre>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Detailed Diagnostic Pillar Tabs -->
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <span>📋</span> Detailed Diagnostic Breakdown
        </h2>
        
        <!-- Category Filter Tabs -->
        <div class="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl" id="tabGroup">
          <button onclick="filterCategory('all')" class="tab-btn active px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-black transition" data-cat="all">All Pillars</button>
          <button onclick="filterCategory('Security')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition" data-cat="Security">Security</button>
          <button onclick="filterCategory('Performance')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition" data-cat="Performance">Performance</button>
          <button onclick="filterCategory('SEO')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition" data-cat="SEO">SEO</button>
          <button onclick="filterCategory('Accessibility')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition" data-cat="Accessibility">Accessibility</button>
          <button onclick="filterCategory('Best Practices')" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition" data-cat="Best Practices">Best Practices</button>
        </div>
      </div>

      <!-- Items Container -->
      <div class="space-y-3" id="auditItemsContainer">
        ${report.categories.flatMap(cat => cat.items.map(item => `
          <div class="audit-item glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition" data-category="${cat.category}" data-status="${item.status}">
            <div class="flex items-start gap-3">
              <span class="mt-0.5 text-base">
                ${item.status === 'pass' ? '🟢' : (item.status === 'warn' ? '🟡' : (item.status === 'fail' ? '🔴' : 'ℹ️'))}
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm">${item.title}</span>
                  <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">${cat.category}</span>
                  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.impact === 'high' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'}">${item.impact} impact</span>
                </div>
                <p class="text-slate-400 text-xs mt-1">${item.description}</p>
                <div class="text-[11px] font-mono text-cyan-300/80 mt-1.5 bg-slate-950/60 px-2 py-1 rounded inline-block">
                  Details: ${item.details || 'N/A'}
                </div>
              </div>
            </div>

            ${item.fixSnippet ? `
              <div class="md:text-right">
                <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono rounded border border-slate-700 transition">
                  View Fix Snippet
                </button>
                <div class="hidden mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg text-left max-w-lg">
                  <pre class="text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">${item.fixSnippet}</pre>
                </div>
              </div>
            ` : ''}
          </div>
        `)).join('')}
      </div>
    </div>

    <!-- Footer -->
    <footer class="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
      ⚡ Website Auditor &amp; LoRA Engine &mdash; Built with Node.js &bull; AI-Powered &bull; Fast &bull; Extensible
    </footer>

  </div>

  <script>
    let currentReportData = ${reportJson};

    function filterCategory(cat) {
      document.querySelectorAll('.tab-btn').forEach(b => {
        if (b.dataset.cat === cat) {
          b.className = 'tab-btn active px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-black transition';
        } else {
          b.className = 'tab-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition';
        }
      });

      document.querySelectorAll('.audit-item').forEach(item => {
        if (cat === 'all' || item.dataset.category === cat) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    }

    async function switchLoraPersona(loraKey) {
      try {
        const res = await fetch('/api/switch-lora', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lora: loraKey }),
        });
        const data = await res.json();
        if (data.aiInsights) {
          document.getElementById('currentAdapterLabel').innerText = data.aiInsights.adapterUsed;
          document.getElementById('aiSummaryBox').innerText = data.aiInsights.summary;
        }
      } catch (err) {
        alert('Error switching LoRA: ' + err.message);
      }
    }

    async function runNewAudit() {
      const url = document.getElementById('targetUrlInput').value.trim();
      const lora = document.getElementById('loraSelect').value;
      if (!url) return;

      const btn = document.getElementById('auditBtn');
      btn.innerHTML = '<span class="animate-spin">⏳</span> Scanning...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl: url, lora }),
        });
        if (!res.ok) throw new Error(await res.text());
        window.location.reload();
      } catch (err) {
        alert('Audit failed: ' + err.message);
        btn.innerHTML = '<span>⚡</span> Audit Now';
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}
