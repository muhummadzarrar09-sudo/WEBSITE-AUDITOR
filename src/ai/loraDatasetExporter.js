import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * LoRA & QLoRA Fine-Tuning Dataset Exporter
 * Generates training pairs in Alpaca and ShareGPT JSONL format for fine-tuning LLMs (Unsloth, Axolotl, HuggingFace LLaMA-Factory).
 */
export async function exportLoraDataset(report, outputPath, options = {}) {
  const format = options.format || 'alpaca'; // 'alpaca' or 'sharegpt'
  const entries = generateTrainingPairs(report);

  let jsonlContent = '';
  if (format === 'sharegpt') {
    jsonlContent = entries.map(e => JSON.stringify({
      conversations: [
        { from: 'human', value: `${e.instruction}\n\nContext:\n${e.input}` },
        { from: 'gpt', value: e.output },
      ],
    })).join('\n');
  } else {
    // Standard Alpaca format
    jsonlContent = entries.map(e => JSON.stringify({
      instruction: e.instruction,
      input: e.input,
      output: e.output,
    })).join('\n');
  }

  const resolvedPath = path.resolve(process.cwd(), outputPath);
  await fs.writeFile(resolvedPath, jsonlContent, 'utf8');

  return {
    filePath: resolvedPath,
    totalPairs: entries.length,
    format,
  };
}

/**
 * Generate diverse instruction/input/output triplets from audit findings
 */
export function generateTrainingPairs(report) {
  const { url, overallScore, overallGrade, categories, techStack, aiInsights } = report;
  const pairs = [];
  const techList = techStack.map(t => t.name).join(', ') || 'Standard Web Stack';

  // 1. Overall Audit Evaluation Pair
  pairs.push({
    instruction: 'Perform a comprehensive architectural audit and security review of this website based on the provided diagnostic metrics.',
    input: `Website URL: ${url}\nOverall Score: ${overallScore}/100 (Grade ${overallGrade})\nDetected Technologies: ${techList}\nScores by Category:\n${categories.map(c => `- ${c.category}: ${c.score}/100`).join('\n')}`,
    output: `${aiInsights.summary}\n\n### Strategic Action Roadmap:\n${aiInsights.recommendations.map((r, i) => `${i + 1}. [${r.priority}] ${r.title}\n   ${r.action}`).join('\n\n')}`,
  });

  // 2. Security Header Hardening Pair
  const secCategory = categories.find(c => c.category === 'Security');
  if (secCategory) {
    const failedSec = secCategory.items.filter(i => i.status !== 'pass');
    pairs.push({
      instruction: 'Generate a hardened web server configuration and Content-Security-Policy to resolve the detected security header vulnerabilities.',
      input: `Target: ${url}\nSecurity Score: ${secCategory.score}/100\nDetected Deficiencies:\n${failedSec.map(f => `- ${f.title}: ${f.details}`).join('\n')}`,
      output: `To achieve an A+ security rating and mitigate XSS, MIME-sniffing, and clickjacking attacks on ${url}, deploy the following hardened headers:\n\n` +
        `\`\`\`nginx\n` +
        `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\n` +
        `add_header X-Content-Type-Options "nosniff" always;\n` +
        `add_header X-Frame-Options "SAMEORIGIN" always;\n` +
        `add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n` +
        `add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:;" always;\n` +
        `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;\n` +
        `\`\`\`\n\n` +
        `These directives enforce HTTPS persistence via HSTS preload, eliminate iframe clickjacking, and restrict unvetted third-party script execution.`,
    });
  }

  // 3. Performance & Core Web Vitals Optimization Pair
  const perfCategory = categories.find(c => c.category === 'Performance');
  if (perfCategory) {
    const failedPerf = perfCategory.items.filter(i => i.status !== 'pass');
    pairs.push({
      instruction: 'Analyze the frontend performance bottlenecks and propose concrete optimizations for Time to First Byte (TTFB) and Cumulative Layout Shift (CLS).',
      input: `Target: ${url}\nPerformance Score: ${perfCategory.score}/100\nDiagnostics:\n${failedPerf.map(p => `- ${p.title}: ${p.details}`).join('\n')}`,
      output: `Key performance optimizations for ${url}:\n\n` +
        `1. **Layout Stability (CLS)**: Ensure every \`<img>\` tag specifies explicit \`width\` and \`height\` attributes or CSS \`aspect-ratio\` to reserve layout boxes before assets load.\n` +
        `2. **Parser Blocking Elimination**: Add \`defer\` or \`async\` to head scripts, or migrate to ES modules (\`<script type="module">\`).\n` +
        `3. **Edge Compression & Caching**: Enable Brotli / Gzip compression and configure static asset \`Cache-Control: public, max-age=31536000, immutable\`.`,
    });
  }

  // 4. SEO & Social Metadata Optimization Pair
  const seoCategory = categories.find(c => c.category === 'SEO');
  if (seoCategory) {
    pairs.push({
      instruction: 'Formulate an optimized SEO and OpenGraph social metadata schema for the target webpage.',
      input: `Target: ${url}\nSEO Score: ${seoCategory.score}/100\nDetected SEO State:\n${seoCategory.items.map(s => `- [${s.status.toUpperCase()}] ${s.title}: ${s.details}`).join('\n')}`,
      output: `Deploy the following production-grade meta tags in the document \`<head>\`:\n\n` +
        `\`\`\`html\n` +
        `<title>${url.replace(/https?:\/\//, '')} — Official Site & Core Services</title>\n` +
        `<meta name="description" content="Discover features, documentation, and solutions on ${url.replace(/https?:\/\//, '')}." />\n` +
        `<link rel="canonical" href="${url}" />\n` +
        `<!-- OpenGraph / Facebook / WhatsApp -->\n` +
        `<meta property="og:type" content="website" />\n` +
        `<meta property="og:url" content="${url}" />\n` +
        `<meta property="og:title" content="${url.replace(/https?:\/\//, '')}" />\n` +
        `<meta property="og:description" content="Explore solutions and documentation." />\n` +
        `<meta property="og:image" content="${url}/og-image.jpg" />\n` +
        `<!-- Twitter Cards -->\n` +
        `<meta name="twitter:card" content="summary_large_image" />\n` +
        `\`\`\``,
    });
  }

  return pairs;
}
