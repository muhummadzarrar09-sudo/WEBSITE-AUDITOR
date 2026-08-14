import fs from 'node:fs/promises';
import path from 'node:path';

export async function exportMarkdownReport(report, outputPath) {
  const { url, scannedAt, overallScore, overallGrade, categories, techStack, aiInsights } = report;

  let md = `# ⚡ Website Audit Report: ${url}\n\n`;
  md += `**Date:** ${new Date(scannedAt).toUTCString()}  \n`;
  md += `**Overall Score:** \`${overallScore}/100\` (Grade **${overallGrade}**)  \n`;
  md += `**Technologies:** ${techStack.map(t => t.name).join(', ') || 'Standard Web'}\n\n`;

  md += `## 📊 Pillar Scorecard\n\n`;
  md += `| Category | Score | Grade | Status |\n`;
  md += `| :--- | :---: | :---: | :--- |\n`;
  for (const cat of categories) {
    const icon = cat.score >= 85 ? '🟢' : (cat.score >= 70 ? '🟡' : '🔴');
    md += `| **${cat.category}** | \`${cat.score}/100\` | **${cat.grade}** | ${icon} |\n`;
  }
  md += `\n---\n\n`;

  if (aiInsights) {
    md += `## 🧠 AI & LoRA Intelligence Diagnosis (${aiInsights.adapterUsed})\n\n`;
    md += `> ${aiInsights.summary.replace(/\n/g, '\n> ')}\n\n`;

    md += `### 🚀 Action Roadmap\n\n`;
    for (let i = 0; i < (aiInsights.recommendations || []).length; i++) {
      const r = aiInsights.recommendations[i];
      md += `${i + 1}. **[${r.priority}] ${r.title}**  \n   ${r.action}\n\n`;
    }
  }

  md += `## 📋 Detailed Diagnostic Items\n\n`;
  for (const cat of categories) {
    md += `### ${cat.category} (${cat.score}/100)\n\n`;
    for (const item of cat.items) {
      const icon = item.status === 'pass' ? '✔' : (item.status === 'warn' ? '⚠' : '✖');
      md += `- **[${icon} ${item.status.toUpperCase()}]** ${item.title}  \n`;
      md += `  *${item.description}*  \n`;
      if (item.details) md += `  \`${item.details}\`  \n`;
      if (item.fixSnippet) {
        md += `  \`\`\`\n  ${item.fixSnippet.replace(/\n/g, '\n  ')}\n  \`\`\`\n`;
      }
      md += `\n`;
    }
  }

  const resolvedPath = path.resolve(process.cwd(), outputPath);
  await fs.writeFile(resolvedPath, md, 'utf8');
  return resolvedPath;
}
