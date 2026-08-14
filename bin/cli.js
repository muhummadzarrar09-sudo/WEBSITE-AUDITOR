#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import Table from 'cli-table3';
import { runAudit, crawlSite, compareWebsites, generateSocialCard } from '../src/index.js';
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
  .version('1.0.0');

// Main Default Audit Action
program
  .argument('[url]', 'Target website URL or demo preset (e.g., https://example.com or saas, ecommerce, roast)', 'saas')
  .option('-d, --demo <preset>', 'Run against a preset demo showcase: saas | ecommerce | roast')
  .option('-l, --lora <adapter>', 'LoRA adapter persona: general | ecommerce | security | performance | saas | roast', 'general')
  .option('--llm <provider>', 'LLM provider: builtin | ollama | openai | anthropic | groq | custom', 'builtin')
  .option('--model <model>', 'LLM model name (e.g. llama3.2, gpt-4o-mini, claude-3-5-sonnet)')
  .option('--api-key <key>', 'API key for LLM provider')
  .option('--export-lora <path>', 'Export QLoRA fine-tuning dataset JSONL (Alpaca/ShareGPT)')
  .option('--export-card <path>', 'Export Cyberpunk 1200x630 Social Scorecard SVG')
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

      if (options.exportCard) {
        const cardPath = await generateSocialCard(report, options.exportCard);
        console.log(chalk.magentaBright(`🎨 Cyberpunk Social Scorecard SVG saved to: ${chalk.bold(cardPath)}`));
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

// Subcommand: Compare two websites
program
  .command('compare <urlA> <urlB>')
  .description('⚔️ Compare two websites side-by-side in a head-to-head performance & security showdown')
  .action(async (urlA, urlB) => {
    printBanner();
    const spinner = ora(chalk.cyan(`Engaging Battle: ${chalk.bold(urlA)} VS ${chalk.bold(urlB)}...`)).start();

    try {
      const battle = await compareWebsites(urlA, urlB);
      spinner.succeed(chalk.green.bold('Head-to-Head Comparison Complete!'));

      const table = new Table({
        head: [chalk.bold.cyan('Pillar'), chalk.bold.yellow(urlA), chalk.bold.magenta(urlB), chalk.bold.green('Advantage')],
        colWidths: [18, 22, 22, 26],
      });

      for (const comp of battle.categoryComparisons) {
        const adv = comp.diff > 0 ? chalk.yellow(`+${comp.diff} (${urlA})`) : (comp.diff < 0 ? chalk.magenta(`+${Math.abs(comp.diff)} (${urlB})`) : chalk.gray('TIE'));
        table.push([
          chalk.bold.white(comp.category),
          `${comp.scoreA}/100 (${comp.gradeA})`,
          `${comp.scoreB}/100 (${comp.gradeB})`,
          adv,
        ]);
      }

      console.log('\n' + table.toString());
      console.log(boxen(chalk.bold.greenBright(`🏆 VERDICT: ${battle.verdict}`), {
        padding: 1,
        borderColor: 'cyan',
        borderStyle: 'double',
      }));
    } catch (err) {
      spinner.fail(chalk.red(`Comparison failed: ${err.message}`));
    }
  });

// Subcommand: Crawl site for broken links
program
  .command('crawl <url>')
  .description('🕷️ Recursively crawl site pages and detect broken links (404s, 500s)')
  .option('-d, --depth <depth>', 'Maximum crawl depth', '2')
  .option('-m, --max-pages <max>', 'Maximum pages to inspect', '15')
  .action(async (url, opts) => {
    printBanner();
    const spinner = ora(chalk.cyan(`🕷️ Crawling ${chalk.bold(url)} (depth: ${opts.depth}, max: ${opts.maxPages})...`)).start();

    try {
      const crawlResult = await crawlSite(url, {
        depth: parseInt(opts.depth, 10),
        maxPages: parseInt(opts.maxPages, 10),
      });

      spinner.succeed(chalk.green(`Crawl Finished: ${crawlResult.totalPagesCrawled} pages indexed.`));

      const table = new Table({
        head: [chalk.bold.cyan('Status'), chalk.bold.cyan('Page URL'), chalk.bold.cyan('Title'), chalk.bold.cyan('Speed')],
        colWidths: [10, 45, 30, 12],
        wordWrap: true,
      });

      for (const p of crawlResult.pages) {
        table.push([chalk.green(p.statusCode), p.url, p.title.slice(0, 28), `${p.duration}ms`]);
      }

      console.log('\n' + table.toString());

      if (crawlResult.brokenLinks.length > 0) {
        console.log(chalk.red.bold(`\n❌ BROKEN LINKS FOUND (${crawlResult.brokenLinks.length}):`));
        for (const bl of crawlResult.brokenLinks) {
          console.log(chalk.red(`  • [${bl.statusCode || 'FAIL'}] ${bl.url} (${bl.error || 'HTTP Error'})`));
        }
      } else {
        console.log(chalk.green.bold('\n✔ 100% HEALTHY: Zero broken internal links detected!'));
      }
    } catch (err) {
      spinner.fail(chalk.red(`Crawl failed: ${err.message}`));
    }
  });

// Subcommand: Train LoRA Model Helper
program
  .command('train [dataset]')
  .description('🧠 Generate ready-to-run Unsloth & PyTorch QLoRA fine-tuning training script')
  .action((dataset = 'dataset.jsonl') => {
    printBanner();
    const script = `
# ==========================================================
# 🧠 UNSLOTH & QLoRA WEBSITE AUDITOR FINE-TUNING PIPELINE
# ==========================================================
import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

max_seq_length = 2048
model_name = "unsloth/llama-3.2-3b-bnb-4bit"

# 1. Load 4-bit Quantized Base Model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=model_name,
    max_seq_length=max_seq_length,
    load_in_4bit=True,
)

# 2. Attach LoRA Adapter
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
)

# 3. Load Exported Audit Dataset
dataset = load_dataset("json", data_files="${dataset}", split="train")

# 4. Train with SFTTrainer
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="output",
    max_seq_length=max_seq_length,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=60,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        output_dir="lora_audit_output",
    ),
)
trainer.train()

# 5. Save LoRA Model
model.save_pretrained("lora_website_auditor")
print("🎉 Model Fine-Tuning Complete! Saved to ./lora_website_auditor")
`;

    console.log(boxen(chalk.greenBright(script.trim()), {
      padding: 1,
      borderColor: 'magenta',
      borderStyle: 'round',
      title: chalk.bold.magenta(' 🧠 UNSLOTH / PYTORCH QLoRA FINE-TUNING SCRIPT '),
    }));
    console.log(chalk.cyan(`\n💡 Run ${chalk.bold('audit <url> --export-lora ' + dataset)} first, then run this Python script!`));
  });

program.parse(process.argv);
