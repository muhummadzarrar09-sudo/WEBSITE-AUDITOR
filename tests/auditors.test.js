import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { auditSecurity } from '../src/auditors/security.js';
import { auditPerformance } from '../src/auditors/performance.js';
import { auditSeo } from '../src/auditors/seo.js';
import { auditAccessibility } from '../src/auditors/accessibility.js';
import { auditBestPractices } from '../src/auditors/bestPractices.js';
import { detectTechStack } from '../src/auditors/techStack.js';
import { compareWebsites } from '../src/auditors/comparator.js';
import { generateSocialCard } from '../src/exporters/cardGenerator.js';
import { runAudit } from '../src/index.js';
import { exportLoraDataset } from '../src/ai/loraDatasetExporter.js';

describe('Auditors Test Suite', () => {

  test('auditSecurity checks HTTPS, HSTS, CSP, and headers', () => {
    const mockScanData = {
      url: 'https://test.com',
      headers: {
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'content-security-policy': "default-src 'self'",
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
      },
      protocol: 'https:',
      ssl: { authorized: true, daysRemaining: 90, validTo: '2026-12-31' },
      auxiliary: { exposedPaths: [] },
      $: cheerio.load('<html></html>'),
    };

    const res = auditSecurity(mockScanData);
    assert.equal(res.category, 'Security');
    assert.ok(res.score >= 90, `Expected score >= 90, got ${res.score}`);
    assert.equal(res.grade, 'S');
  });

  test('auditPerformance flags missing compression and high TTFB', () => {
    const mockScanData = {
      headers: {},
      timing: { ttfb: 1500, totalTime: 3000 },
      contentLength: 500000,
      html: '<html><body>' + '<div></div>'.repeat(2000) + '</body></html>',
      $: cheerio.load('<html><body>' + '<div></div>'.repeat(2000) + '</body></html>'),
    };

    const res = auditPerformance(mockScanData);
    assert.equal(res.category, 'Performance');
    assert.ok(res.score < 60, `Expected low score for slow TTFB, got ${res.score}`);
  });

  test('auditSeo detects title, meta description, and heading hierarchy', () => {
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <title>Accurate and Engaging Page Title 45 chars long</title>
        <meta name="description" content="This is an optimal meta description that contains detailed keywords and is between 120 and 160 characters long to boost search CTR.">
        <link rel="canonical" href="https://test.com/">
        <meta property="og:title" content="Test">
        <meta property="og:description" content="Test">
        <meta property="og:image" content="https://test.com/img.jpg">
      </head>
      <body>
        <h1>Main Single Topic</h1>
      </body>
    </html>`;

    const mockScanData = {
      origin: 'https://test.com',
      html,
      $: cheerio.load(html),
      auxiliary: {
        robotsTxt: { exists: true },
        sitemapXml: { exists: true },
      },
    };

    const res = auditSeo(mockScanData);
    assert.equal(res.category, 'SEO');
    assert.ok(res.score >= 90, `Expected high SEO score, got ${res.score}`);
  });

  test('auditAccessibility flags unlabelled inputs and missing alt tags', () => {
    const html = `<html>
      <body>
        <img src="pic.jpg">
        <input type="text" name="badInput">
      </body>
    </html>`;

    const mockScanData = {
      $: cheerio.load(html),
    };

    const res = auditAccessibility(mockScanData);
    assert.equal(res.category, 'Accessibility');
    assert.ok(res.items.some(i => i.id === 'a11y-img-alt' && i.status === 'fail'));
    assert.ok(res.items.some(i => i.id === 'a11y-form-labels' && i.status === 'fail'));
  });

  test('detectTechStack identifies Next.js, Cloudflare, Tailwind CSS', () => {
    const mockScanData = {
      headers: {
        'server': 'cloudflare',
        'cf-ray': '12345',
      },
      html: `<html><head><script src="/_next/static/chunks/main.js"></script></head><body class="flex bg-slate-900 text-white"></body></html>`,
      $: cheerio.load('<html></html>'),
    };

    const tech = detectTechStack(mockScanData);
    const names = tech.map(t => t.name);
    assert.ok(names.includes('Cloudflare'));
    assert.ok(names.includes('Next.js'));
    assert.ok(names.includes('React'));
    assert.ok(names.includes('Tailwind CSS'));
  });

  test('end-to-end runAudit and LoRA fine-tuning export works', async () => {
    const report = await runAudit('saas', { lora: 'ecommerce' });
    assert.ok(report.overallScore > 0);
    assert.ok(report.categories.length === 5);
    assert.ok(report.aiInsights);
    assert.equal(report.aiInsights.adapterUsed, '🛒 E-Commerce & CRO LoRA');

    const loraExport = await exportLoraDataset(report, '/tmp/test_lora.jsonl');
    assert.ok(loraExport.totalPairs >= 3);
  });

  test('head-to-head compareWebsites battle works', async () => {
    const battle = await compareWebsites('saas', 'roast');
    assert.ok(battle.siteA);
    assert.ok(battle.siteB);
    assert.ok(battle.overallWinner.includes('saas'));
    assert.ok(battle.categoryComparisons.length === 5);
  });

  test('generateSocialCard exports a valid SVG file', async () => {
    const report = await runAudit('saas');
    const svgPath = '/tmp/test_card.svg';
    await generateSocialCard(report, svgPath);
    const content = await fs.readFile(svgPath, 'utf8');
    assert.ok(content.includes('<svg'));
    assert.ok(content.includes('OVERALL HEALTH SCORE'));
  });

});
