import fs from 'node:fs/promises';
import path from 'node:path';
import { renderDashboardHtml } from '../ui/server.js';

export async function exportHtmlReport(report, outputPath) {
  const html = renderDashboardHtml(report);
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  await fs.writeFile(resolvedPath, html, 'utf8');
  return resolvedPath;
}
