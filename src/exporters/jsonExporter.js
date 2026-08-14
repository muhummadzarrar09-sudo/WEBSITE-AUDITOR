import fs from 'node:fs/promises';
import path from 'node:path';

export async function exportJsonReport(report, outputPath) {
  const json = JSON.stringify(report, null, 2);
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  await fs.writeFile(resolvedPath, json, 'utf8');
  return resolvedPath;
}
