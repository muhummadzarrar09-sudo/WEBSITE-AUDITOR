#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { runAudit } from '../src/index.js';
import { printBanner, printAuditReport } from '../src/ui/terminal.js';
import { exportLoraDataset } from '../src/ai/loraDatasetExporter.js';
import { exportHtmlReport } from '../src/exporters/htmlExporter.js';
import { exportJsonReport } from '../src/exporters/jsonExporter.js';
import { exportMarkdownReport } from '../src/exporters/markdownExporter.js';
import { startDashboardServer } from '../src/ui/server.js';
import open from 'open';

const program = new Command();

program
  .name('website-auditor')
  .description('⚡ Ultra-fast AI & LoRA-powered website intelligence and deep diagnostic CLI tool')
  .version('1.0.0')
  .argument('[url]', 'Target website URL or demo preset (e.g., https://example.com or saas, ecommerce, roast)', 'saas')
  .option('-d, --demo <preset>', 'Run against a preset demo showcase: saas | ecommerce | roast')
  .option('-l, --lora <adapter>', 'LoRA adapter persona: general | ecommerce | security | performance | saas | roast', 'general')
  .option('--llm <provider>', 'LLM provider: builtin | ollama | openai | anthropic | groq | custom', 'builtin')
  .option('--model <model>', 'LLM model name (e.g. llama3.2, gpt-4o-mini, claude-3-5-sonnet)')
  .option('--api-key <key>', 'API key for LLM provider')
  .option('--export-lora <path>', 'Export QLoRA fine-tuning dataset JSONL (Alpaca/ShareGPT)')
  .option('--export-json <path>', 'Export full diagnostic report as JSON')
  .option('--export-html <path>', 'Export standalone interactive HTML report')
  .option('--export-md <path>', 'Export executive Markdown report')
  .option('--serve [port]', 'Spin up the interactive Cyberpunk live Web Dashboard')
  .option('--open', 'Automatically open the web dashboard in your default browser')
  .option('--fail-under <score>', 'Exit with code 1 if overall score is below threshold (for CI/CD)')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '15000')
  .option('-q, --quiet', 'Quiet mode (output JSON result only without banner/TUI)')
  .action(async (targetUrl, options) => {
    try {
      const auditTarget = options.demo || targetUrl || 'saas';

      if (!options.quiet) {
        printBanner();
      }

      const spinner = !options.quiet ? ora({
        text: chalk.cyan(`Connecting to ${chalk.bold(auditTarget)} and initializing multi-pillar audit engine...`),
        color: 'cyan',
      }).start() : null;

      if (spinner) {
        setTimeout(() => {
          if (spinner.isSpinning) spinner.text = chalk.magenta('⚡ Auditing Performance, Assets & TTFB...');
        }, 150);
        setTimeout(() => {
          if (spinner.isSpinning) spinner.text = chalk.blue('🔒 Fortifying Security Headers & SSL Inspection...');
        }, 300);
        setTimeout(() => {
          if (spinner.isSpinning) spinner.text = chalk.yellow('🔍 Evaluating SEO, Social Graph & Heading Structure...');
        }, 450);
        setTimeout(() => {
          if (spinner.isSpinning) spinner.text = chalk.green('♿ Inspecting Accessibility (a11y) & ARIA landmarks...');
        }, 600);
        setTimeout(() => {
          if (spinner.isSpinning) spinner.text = chalk.magenta('🧠 Running LoRA Intelligence & Neural Synthesis...');
        }, 750);
      }

      const report = await runAudit(auditTarget, {
        lora: options.lora,
        llm: options.llm,
        model: options.model,
        apiKey: options.apiKey,
        timeout: parseInt(options.timeout, 10),
      });

      if (spinner) {
        spinner.succeed(chalk.green.bold(`Audit Complete! Overall Score: ${report.overallScore}/100 [Grade ${report.overallGrade}]`));
      }

      // Handle Exports
      if (options.exportLora) {
        const loraRes = await exportLoraDataset(report, options.exportLora);
        console.log(chalk.magenta(`🧠 Exported ${loraRes.totalPairs} LoRA fine-tuning training pairs to: ${chalk.bold(loraRes.filePath)}`));
      }

      if (options.exportHtml) {
        const htmlPath = await exportHtmlReport(report, options.exportHtml);
        console.log(chalk.cyan(`📄 Standalone HTML Report saved to: ${chalk.bold(htmlPath)}`));
      }

      if (options.exportJson) {
        const jsonPath = await exportJsonReport(report, options.exportJson);
        console.log(chalk.yellow(`💾 JSON Report saved to: ${chalk.bold(jsonPath)}`));
      }

      if (options.exportMd) {
        const mdPath = await exportMarkdownReport(report, options.exportMd);
        console.log(chalk.blue(`📝 Markdown Summary saved to: ${chalk.bold(mdPath)}`));
      }

      if (options.quiet) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printAuditReport(report, options);
      }

      // Handle Live Dashboard Server
      if (options.serve !== undefined || options.open) {
        const port = typeof options.serve === 'string' ? parseInt(options.serve, 10) : 3000;
        startDashboardServer(report, port);
        const serverUrl = `http://0.0.0.0:${port}`;
        console.log(chalk.bold.greenBright(`\n🚀 LIVE PREVIEW SERVER ACTIVE AT: ${chalk.underline(serverUrl)}`));
        console.log(chalk.gray(`Interactive filters, LoRA switching, and export buttons available.\n`));

        if (options.open) {
          try {
            await open(`http://localhost:${port}`);
          } catch {}
        }

        // Keep process running if serve was invoked directly
        return;
      }

      // Handle CI/CD threshold checking
      if (options.failUnder) {
        const threshold = parseInt(options.failUnder, 10);
        if (report.overallScore < threshold) {
          console.error(chalk.red.bold(`\n❌ CI/CD FAILURE: Site score ${report.overallScore}/100 is below required threshold ${threshold}/100`));
          process.exit(1);
        }
      }

    } catch (err) {
      console.error(chalk.red.bold(`\n❌ AUDIT ERROR: ${err.message}`));
      if (process.env.DEBUG) {
        console.error(err.stack);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
