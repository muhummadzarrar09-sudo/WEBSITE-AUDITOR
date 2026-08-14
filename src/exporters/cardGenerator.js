import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Generate a Cyberpunk Glassmorphic 1200x630 Social Share Card (SVG)
 */
export async function generateSocialCard(report, outputPath) {
  const { url, overallScore, overallGrade, categories, techStack, aiInsights } = report;

  const techNames = techStack.slice(0, 4).map(t => t.name).join(' • ') || 'Modern Web Stack';
  const gradeColor = overallScore >= 85 ? '#00FF9D' : (overallScore >= 70 ? '#FBBF24' : '#FF007A');

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0D17" />
      <stop offset="50%" stop-color="#141829" />
      <stop offset="100%" stop-color="#05070E" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="50%" stop-color="#7928CA" />
      <stop offset="100%" stop-color="#FF007A" />
    </linearGradient>
    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="100%" stop-color="#00FF9D" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  
  <!-- Subtle Grid Lines -->
  <path d="M0 100 H1200 M0 200 H1200 M0 300 H1200 M0 400 H1200 M0 500 H1200" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
  <path d="M200 0 V630 M400 0 V630 M600 0 V630 M800 0 V630 M1000 0 V630" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

  <!-- Top Decorative Bar -->
  <rect x="0" y="0" width="1200" height="8" fill="url(#accentGrad)" />

  <!-- Brand Header -->
  <text x="60" y="65" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="#00F0FF" letter-spacing="2">⚡ WEBSITE AUDITOR INTELLIGENCE</text>
  <text x="1140" y="65" text-anchor="end" font-family="monospace" font-size="14" fill="#7928CA" font-weight="bold">AI &amp; LoRA v1.0</text>

  <!-- Target URL -->
  <rect x="60" y="100" width="1080" height="60" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(0, 240, 255, 0.2)" stroke-width="1" />
  <text x="85" y="138" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#FFFFFF">${escapeXml(url)}</text>
  <text x="1115" y="138" text-anchor="end" font-family="monospace" font-size="14" fill="#94A3B8">${escapeXml(techNames)}</text>

  <!-- Left: Big Overall Score Dial -->
  <g transform="translate(60, 190)">
    <rect width="320" height="380" rx="20" fill="rgba(20, 24, 41, 0.8)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="160" y="50" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="14" fill="#94A3B8" letter-spacing="1.5">OVERALL HEALTH SCORE</text>
    
    <!-- Score Circle Glow -->
    <circle cx="160" cy="180" r="85" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12" />
    <circle cx="160" cy="180" r="85" fill="none" stroke="${gradeColor}" stroke-width="12" stroke-dasharray="534" stroke-dashoffset="${534 - (534 * (overallScore / 100))}" stroke-linecap="round" transform="rotate(-90 160 180)" />
    
    <text x="160" y="185" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="56" fill="#FFFFFF">${overallScore}</text>
    <text x="160" y="215" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#64748B">/ 100</text>

    <!-- Letter Grade Badge -->
    <rect x="110" y="295" width="100" height="42" rx="10" fill="${gradeColor}22" stroke="${gradeColor}" stroke-width="1.5" />
    <text x="160" y="323" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="${gradeColor}">GRADE ${overallGrade}</text>
  </g>

  <!-- Right: Pillar Breakdown Bars -->
  <g transform="translate(410, 190)">
    <rect width="730" height="380" rx="20" fill="rgba(20, 24, 41, 0.8)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="35" y="45" font-family="system-ui, sans-serif" font-weight="700" font-size="16" fill="#FFFFFF" letter-spacing="1">DIAGNOSTIC PILLARS</text>
    
    ${categories.map((c, i) => {
      const y = 80 + (i * 56);
      const barColor = c.score >= 85 ? '#00FF9D' : (c.score >= 70 ? '#FBBF24' : '#FF007A');
      return `
        <g transform="translate(35, ${y})">
          <text x="0" y="16" font-family="system-ui, sans-serif" font-weight="700" font-size="14" fill="#E2E8F0">${c.category}</text>
          <rect x="170" y="4" width="400" height="14" rx="7" fill="rgba(255,255,255,0.05)" />
          <rect x="170" y="4" width="${(c.score / 100) * 400}" height="14" rx="7" fill="${barColor}" />
          <text x="590" y="16" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="${barColor}">${c.score}</text>
          <rect x="625" y="0" width="36" height="20" rx="5" fill="rgba(255,255,255,0.05)" />
          <text x="643" y="15" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="11" fill="#CBD5E1">${c.grade}</text>
        </g>
      `;
    }).join('')}
  </g>
</svg>`;

  const resolvedPath = path.resolve(process.cwd(), outputPath);
  await fs.writeFile(resolvedPath, svg, 'utf8');
  return resolvedPath;
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
