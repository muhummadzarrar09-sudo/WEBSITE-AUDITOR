import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';
import Table from 'cli-table3';

const cyberGradient = gradient(['#00F0FF', '#7000FF', '#FF007A']);
const goldGradient = gradient(['#FFE000', '#799F0C']);
const fireGradient = gradient(['#FF4E50', '#F9D423']);

export function printBanner() {
  const ascii = `
  ██╗    ██╗███████╗██████╗ ███████╗██╗████████╗███████╗     █████╗ ██╗   ██╗██████╗ ██╗████████╗ ██████╗ ██████╗ 
  ██║    ██║██╔════╝██╔══██╗██╔════╝██║╚══██╔══╝██╔════╝    ██╔══██╗██║   ██║██╔══██╗██║╚══██╔══╝██╔═══██╗██╔══██╗
  ██║ █╗ ██║█████╗  ██████╔╝███████╗██║   ██║   █████╗      ███████║██║   ██║██║  ██║██║   ██║   ██║   ██║██████╔╝
  ██║███╗██║██╔══╝  ██╔══██╗╚════██║██║   ██║   ██╔══╝      ██╔══██║██║   ██║██║  ██║██║   ██║   ██║   ██║██╔══██╗
  ╚███╔███╔╝███████╗██████╔╝███████║██║   ██║   ███████╗    ██║  ██║╚██████╔╝██████╔╝██║   ██║   ╚██████╔╝██║  ██║
   ╚══╝╚══╝ ╚══════╝╚═════╝ ╚══════╝╚═╝   ╚═╝   ╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
  `;

  console.log(cyberGradient(ascii));
  console.log(chalk.bold.cyan('  ⚡ ULTRA-FAST AI & LoRA POWERED WEBSITE INTELLIGENCE ENGINE v1.0.0 ⚡\n'));
}

export function printAuditReport(report, options = {}) {
  const { url, overallScore, overallGrade, categories, techStack, aiInsights, scanData } = report;

  // 1. Target Overview Box
  const ttfb = scanData?.timing?.ttfb || 0;
  const sslDays = scanData?.ssl?.daysRemaining ?? 'N/A';
  const techPills = techStack.map(t => chalk.bgHex('#2D124D').white(` ${t.icon} ${t.name} `)).join(' ') || chalk.gray('Generic HTML');

  const metaBox = `
${chalk.bold.white('🌐 TARGET URL :')} ${chalk.cyan.bold(url)}
${chalk.bold.white('⚡ TTFB       :')} ${formatLatency(ttfb)}  ${chalk.gray('|')}  ${chalk.bold.white('🔒 SSL EXPIRY:')} ${sslDays !== 'N/A' ? chalk.green(`${sslDays} days`) : chalk.gray('N/A')}  ${chalk.gray('|')}  ${chalk.bold.white('📦 STATUS:')} ${chalk.green.bold(scanData.statusCode)}
${chalk.bold.white('🛠️ TECH STACK :')} ${techPills}
  `.trim();

  console.log(boxen(metaBox, {
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderColor: 'cyan',
    borderStyle: 'round',
    title: chalk.bold.cyan(' 🎯 AUDIT TARGET PROFILE '),
  }));

  // 2. Scorecard & Gauges
  console.log(renderScoreboard(overallScore, overallGrade, categories));

  // 3. Category Breakdown Tables
  for (const cat of categories) {
    printCategoryTable(cat);
  }

  // 4. AI Insights & LoRA Persona Commentary Box
  if (aiInsights) {
    const aiContent = `
${chalk.bold.magenta('🧠 LoRA ADAPTER :')} ${chalk.bold.yellow(aiInsights.adapterUsed)}
${chalk.bold.white('🤖 ENGINE       :')} ${chalk.gray(aiInsights.provider)}

${chalk.bold.cyan('📋 EXECUTIVE SYNTHESIS:')}
${chalk.white(aiInsights.summary)}

${chalk.bold.green('🚀 HIGH-PRIORITY ACTION ROADMAP:')}
${aiInsights.recommendations.map((r, i) => `${chalk.bold.yellow(`[${i + 1}]`)} ${chalk.bold.red(r.priority)} - ${chalk.bold.white(r.title)}\n   ${chalk.gray(r.action)}`).join('\n\n')}
    `.trim();

    console.log(boxen(aiContent, {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderColor: 'magenta',
      borderStyle: 'double',
      title: chalk.bold.magenta(' ⚡ AI & LoRA INTELLIGENCE DIAGNOSIS ⚡ '),
    }));
  }

  // 5. Ready Code Fix Snippets (if available)
  if (aiInsights?.codeBlueprints?.length > 0) {
    console.log(chalk.bold.cyan('\n🛠️ PRODUCTION-READY HARDENING SNIPPETS:'));
    for (const snippet of aiInsights.codeBlueprints) {
      console.log(boxen(chalk.greenBright(snippet.code), {
        padding: 1,
        borderColor: 'gray',
        borderStyle: 'single',
        title: chalk.bold.yellow(` 📁 ${snippet.title} (${snippet.language}) `),
      }));
    }
  }

  // 6. Actionable Next Steps Footer
  console.log(chalk.bold.gray('\n─────────────────────────────────────────────────────────────────────────────────────────'));
  console.log(chalk.bold.cyan('💡 PRO HINTS:'));
  console.log(`  • Run ${chalk.green('audit ' + url + ' --serve')} to launch the interactive live Cyberpunk Web Dashboard.`);
  console.log(`  • Run ${chalk.green('audit ' + url + ' --export-lora dataset.jsonl')} to generate AI fine-tuning training pairs.`);
  console.log(`  • Run ${chalk.green('audit ' + url + ' --lora roast')} for savage viral roasting mode.`);
  console.log(chalk.bold.gray('─────────────────────────────────────────────────────────────────────────────────────────\n'));
}

function renderScoreboard(overallScore, overallGrade, categories) {
  const gradeColor = getGradeColor(overallGrade);
  const scoreColor = getScoreColor(overallScore);

  const gradeDisplay = gradeColor(`
     ██████╗ ██████╗  █████╗ ██████╗ ███████╗
    ██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔════╝
    ██║  ███╗██████╔╝███████║██║  ██║█████╗  
    ██║   ██║██╔══██╗██╔══██║██║  ██║██╔══╝  
    ╚██████╔╝██║  ██║██║  ██║██████╔╝███████╗
     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝
                     [ ${overallGrade} ]
  `);

  let gaugeText = `\n  ${chalk.bold.white('OVERALL HEALTH SCORE:')} ${scoreColor.bold(`${overallScore}/100`)} ${gradeColor.bold(`[GRADE ${overallGrade}]`)}\n\n`;

  for (const cat of categories) {
    const cColor = getScoreColor(cat.score);
    const bar = renderProgressBar(cat.score);
    gaugeText += `  ${chalk.bold.white(cat.category.padEnd(16))} ${bar}  ${cColor.bold(String(cat.score).padStart(3) + '/100')} ${getGradeColor(cat.grade)(`(${cat.grade})`)}\n`;
  }

  return boxen(gaugeText, {
    padding: 1,
    borderColor: overallScore >= 80 ? 'green' : (overallScore >= 60 ? 'yellow' : 'red'),
    borderStyle: 'round',
    title: chalk.bold(' 📊 OVERALL PERFORMANCE SCORECARD '),
  });
}

function renderProgressBar(score, width = 24) {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  const cColor = getScoreColor(score);
  return cColor('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function printCategoryTable(cat) {
  const table = new Table({
    head: [
      chalk.bold.cyan('Status'),
      chalk.bold.cyan('Check / Audit Item'),
      chalk.bold.cyan('Impact'),
      chalk.bold.cyan('Diagnostic Details'),
    ],
    colWidths: [10, 36, 12, 40],
    wordWrap: true,
  });

  for (const item of cat.items) {
    let statusBadge = chalk.green('✔ PASS');
    if (item.status === 'fail') statusBadge = chalk.red.bold('✖ FAIL');
    if (item.status === 'warn') statusBadge = chalk.yellow('⚠ WARN');
    if (item.status === 'info') statusBadge = chalk.blue('ℹ INFO');

    let impactBadge = chalk.gray('LOW');
    if (item.impact === 'high') impactBadge = chalk.red.bold('HIGH');
    if (item.impact === 'medium') impactBadge = chalk.yellow('MED');

    table.push([
      statusBadge,
      chalk.bold.white(item.title),
      impactBadge,
      chalk.gray(item.details || item.description),
    ]);
  }

  console.log(`\n${chalk.bold.yellow(`📂 ${cat.category.toUpperCase()} PILLAR`)} ${chalk.gray(`(Score: ${cat.score}/100 - Grade: ${cat.grade})`)}`);
  console.log(table.toString());
}

function formatLatency(ms) {
  if (ms < 300) return chalk.green.bold(`${ms}ms (Ultra-Fast)`);
  if (ms < 800) return chalk.yellow.bold(`${ms}ms (Moderate)`);
  return chalk.red.bold(`${ms}ms (Slow)`);
}

function getScoreColor(score) {
  if (score >= 90) return chalk.hex('#00FF9D');
  if (score >= 75) return chalk.hex('#A3E635');
  if (score >= 60) return chalk.hex('#FBBF24');
  if (score >= 40) return chalk.hex('#FB923C');
  return chalk.hex('#F87171');
}

function getGradeColor(grade) {
  if (grade === 'S') return chalk.hex('#00F0FF').bold;
  if (grade === 'A') return chalk.green.bold;
  if (grade === 'B') return chalk.yellow.bold;
  if (grade === 'C') return chalk.hex('#FB923C').bold;
  if (grade === 'D') return chalk.red.bold;
  return chalk.bgRed.white.bold;
}
