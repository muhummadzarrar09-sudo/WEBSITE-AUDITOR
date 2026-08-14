import { scanUrl } from './core/scanner.js';
import { auditSecurity } from './auditors/security.js';
import { auditPerformance } from './auditors/performance.js';
import { auditSeo } from './auditors/seo.js';
import { auditAccessibility } from './auditors/accessibility.js';
import { auditBestPractices } from './auditors/bestPractices.js';
import { detectTechStack } from './auditors/techStack.js';
import { generateAiInsights } from './ai/llmEngine.js';

export { scanUrl } from './core/scanner.js';
export { auditSecurity } from './auditors/security.js';
export { auditPerformance } from './auditors/performance.js';
export { auditSeo } from './auditors/seo.js';
export { auditAccessibility } from './auditors/accessibility.js';
export { auditBestPractices } from './auditors/bestPractices.js';
export { detectTechStack } from './auditors/techStack.js';
export { generateAiInsights } from './ai/llmEngine.js';
export { exportLoraDataset } from './ai/loraDatasetExporter.js';
export { exportHtmlReport } from './exporters/htmlExporter.js';
export { exportJsonReport } from './exporters/jsonExporter.js';
export { exportMarkdownReport } from './exporters/markdownExporter.js';
export { startDashboardServer } from './ui/server.js';
export { printBanner, printAuditReport } from './ui/terminal.js';

/**
 * Execute a complete end-to-end website audit with AI/LoRA analysis
 */
export async function runAudit(targetUrl, options = {}) {
  const scanData = await scanUrl(targetUrl, options);

  const sec = auditSecurity(scanData);
  const perf = auditPerformance(scanData);
  const seo = auditSeo(scanData);
  const a11y = auditAccessibility(scanData);
  const bp = auditBestPractices(scanData);
  const techStack = detectTechStack(scanData);

  const categories = [sec, perf, seo, a11y, bp];
  const overallScore = Math.round(categories.reduce((acc, cat) => acc + cat.score, 0) / categories.length);

  const getGrade = (s) => {
    if (s >= 95) return 'S';
    if (s >= 85) return 'A';
    if (s >= 70) return 'B';
    if (s >= 50) return 'C';
    if (s >= 35) return 'D';
    return 'F';
  };

  const report = {
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

  // Generate AI & LoRA Insights
  report.aiInsights = await generateAiInsights(report, options);

  return report;
}
