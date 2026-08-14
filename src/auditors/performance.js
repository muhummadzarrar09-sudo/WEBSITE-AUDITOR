/**
 * Performance Auditor: TTFB, Assets, DOM Weight, Compression, Caching, Parser Blocking Scripts, Image Optimization
 */
export function auditPerformance(scanData) {
  const { headers, timing, $, html, contentLength } = scanData;
  const items = [];
  let totalPoints = 100;

  // Helper for headers
  const getHeader = (name) => {
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? String(headers[key]) : null;
  };

  // 1. TTFB (Time To First Byte)
  const ttfb = timing?.ttfb || 0;
  if (ttfb <= 300) {
    items.push({
      id: 'perf-ttfb',
      title: `Lightning TTFB (${ttfb}ms)`,
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'Time to First Byte is outstanding, indicating fast server response & CDN caching.',
      details: `${ttfb}ms (Recommended: < 600ms)`,
    });
  } else if (ttfb <= 800) {
    totalPoints -= 8;
    items.push({
      id: 'perf-ttfb',
      title: `Moderate TTFB (${ttfb}ms)`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -8,
      description: 'Server response time is acceptable but could be accelerated with edge caching or SSR optimizations.',
      details: `${ttfb}ms`,
      fixSnippet: 'Enable edge caching on Cloudflare or Vercel Edge Middleware to serve static cache under 200ms.',
    });
  } else {
    totalPoints -= 20;
    items.push({
      id: 'perf-ttfb',
      title: `Slow TTFB (${ttfb}ms)`,
      status: 'fail',
      impact: 'high',
      scoreDelta: -20,
      description: 'High server latency delays initial render and hurts Core Web Vitals (LCP/FCP).',
      details: `${ttfb}ms (> 800ms threshold)`,
      fixSnippet: 'Audit server database queries, enable Redis/Memcached object caching, and deploy CDN edge caching.',
    });
  }

  // 2. HTTP Compression (gzip / brotli / zstd)
  const contentEncoding = getHeader('content-encoding');
  if (contentEncoding && /br|gzip|zstd|deflate/i.test(contentEncoding)) {
    items.push({
      id: 'perf-compression',
      title: `Compression Enabled (${contentEncoding})`,
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: `Payload is compressed over the wire using ${contentEncoding}.`,
      details: `Content-Encoding: ${contentEncoding}`,
    });
  } else {
    totalPoints -= 12;
    items.push({
      id: 'perf-compression',
      title: 'Missing Text Compression',
      status: 'fail',
      impact: 'medium',
      scoreDelta: -12,
      description: 'Text assets (HTML/CSS/JS) are transferred uncompressed, multiplying bandwidth consumption.',
      details: 'No gzip or brotli encoding detected',
      fixSnippet: `# Nginx config:\ngzip on;\ngzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\n\n# Or enable Brotli (brotli on;)`,
    });
  }

  // 3. Cache-Control & Asset Freshness
  const cacheControl = getHeader('cache-control');
  const etag = getHeader('etag');
  if (cacheControl) {
    items.push({
      id: 'perf-caching',
      title: 'Cache-Control Header Configured',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'Browser and CDN caching policies are explicitly defined.',
      details: `Cache-Control: ${cacheControl}`,
    });
  } else if (etag) {
    items.push({
      id: 'perf-caching',
      title: 'ETag Conditional Validation Active',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'ETags allow clients to validate cached resources with 304 Not Modified responses.',
      details: `ETag: ${etag}`,
    });
  } else {
    totalPoints -= 8;
    items.push({
      id: 'perf-caching',
      title: 'Missing Cache Headers',
      status: 'warn',
      impact: 'medium',
      scoreDelta: -8,
      description: 'No Cache-Control or ETag header found. Repeat visitors will re-download assets repeatedly.',
      details: 'No cache headers present',
      fixSnippet: `add_header Cache-Control "public, max-age=3600, stale-while-revalidate=86400";`,
    });
  }

  // 4. HTML Payload Size
  const kbSize = Math.round(contentLength / 1024);
  if (kbSize <= 100) {
    items.push({
      id: 'perf-html-size',
      title: `Lean HTML Payload (${kbSize} KB)`,
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'Initial HTML document is lightweight and parses quickly.',
      details: `${kbSize} KB`,
    });
  } else if (kbSize <= 300) {
    totalPoints -= 5;
    items.push({
      id: 'perf-html-size',
      title: `Moderate HTML Payload (${kbSize} KB)`,
      status: 'warn',
      impact: 'low',
      scoreDelta: -5,
      description: 'HTML document is slightly heavy. Consider pruning inline SVGs, excessive script tags, or hydration JSON.',
      details: `${kbSize} KB`,
    });
  } else {
    totalPoints -= 15;
    items.push({
      id: 'perf-html-size',
      title: `Heavy HTML Payload (${kbSize} KB)`,
      status: 'fail',
      impact: 'medium',
      scoreDelta: -15,
      description: 'Excessive initial HTML payload slows down DOM construction and mobile parsing.',
      details: `${kbSize} KB (> 300 KB)`,
      fixSnippet: 'Extract large inline Base64 images and large inline JSON scripts into external cacheable resources.',
    });
  }

  // 5. DOM Element Count & Tree Depth
  const totalElements = $('*').length;
  if (totalElements <= 800) {
    items.push({
      id: 'perf-dom-size',
      title: `Optimized DOM Size (${totalElements} nodes)`,
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'DOM node count is well within the recommended threshold (< 800 nodes).',
      details: `${totalElements} DOM elements`,
    });
  } else if (totalElements <= 1500) {
    totalPoints -= 5;
    items.push({
      id: 'perf-dom-size',
      title: `Moderate DOM Size (${totalElements} nodes)`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -5,
      description: 'DOM node count is acceptable but approaching high complexity.',
      details: `${totalElements} DOM elements`,
    });
  } else {
    totalPoints -= 12;
    items.push({
      id: 'perf-dom-size',
      title: `Excessive DOM Complexity (${totalElements} nodes)`,
      status: 'fail',
      impact: 'medium',
      scoreDelta: -12,
      description: 'Large DOM trees increase memory usage, trigger longer style recalculations, and cause sluggish scroll performance.',
      details: `${totalElements} DOM elements (Recommended: < 1500)`,
      fixSnippet: 'Virtualize long lists and remove redundant wrapper `<div>` elements.',
    });
  }

  // 6. Parser-Blocking Head Scripts
  const headScripts = $('head script[src]');
  let blockingScripts = 0;
  headScripts.each((_, el) => {
    const asyncAttr = $(el).attr('async');
    const deferAttr = $(el).attr('defer');
    const typeAttr = $(el).attr('type');
    const isModule = typeAttr === 'module';
    if (asyncAttr === undefined && deferAttr === undefined && !isModule) {
      blockingScripts++;
    }
  });

  if (blockingScripts === 0) {
    items.push({
      id: 'perf-blocking-scripts',
      title: 'Zero Parser-Blocking Head Scripts',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'All external head scripts use async, defer, or ES module loading.',
      details: `${headScripts.length} head scripts inspected`,
    });
  } else {
    totalPoints -= Math.min(15, blockingScripts * 4);
    items.push({
      id: 'perf-blocking-scripts',
      title: `${blockingScripts} Parser-Blocking Scripts in <head>`,
      status: 'fail',
      impact: 'medium',
      scoreDelta: -Math.min(15, blockingScripts * 4),
      description: 'Synchronous scripts in <head> block HTML parsing until downloaded and executed.',
      details: `${blockingScripts} script(s) lacking async or defer`,
      fixSnippet: `Add 'defer' or 'async' to head scripts:\n<script src="app.js" defer></script>`,
    });
  }

  // 7. Image Optimization (dimensions & lazy loading)
  const images = $('img');
  let missingDimensions = 0;
  let missingLazy = 0;
  let modernFormatCount = 0;

  images.each((idx, el) => {
    const src = $(el).attr('src') || '';
    const width = $(el).attr('width');
    const height = $(el).attr('height');
    const loading = $(el).attr('loading');

    if (!width || !height) {
      missingDimensions++;
    }
    if (idx > 2 && loading !== 'lazy') {
      missingLazy++;
    }
    if (/\.(webp|avif|svg)(\?.*)?$/i.test(src) || src.startsWith('data:image/svg+xml')) {
      modernFormatCount++;
    }
  });

  if (images.length > 0) {
    if (missingDimensions === 0) {
      items.push({
        id: 'perf-img-cls',
        title: 'Explicit Dimensions on All Images',
        status: 'pass',
        impact: 'medium',
        scoreDelta: 0,
        description: 'Explicit width & height attributes prevent Cumulative Layout Shifts (CLS).',
        details: `${images.length} images properly dimensioned`,
      });
    } else {
      const penalty = Math.min(10, Math.ceil((missingDimensions / images.length) * 10));
      totalPoints -= penalty;
      items.push({
        id: 'perf-img-cls',
        title: `${missingDimensions}/${images.length} Images Missing Explicit Dimensions`,
        status: 'warn',
        impact: 'medium',
        scoreDelta: -penalty,
        description: 'Images without width and height cause visual jank and high CLS while loading.',
        details: `${missingDimensions} unconstrained image elements`,
        fixSnippet: `<img src="hero.jpg" width="800" height="600" alt="Hero banner" />`,
      });
    }

    if (missingLazy > 0 && images.length > 3) {
      totalPoints -= 4;
      items.push({
        id: 'perf-img-lazy',
        title: `${missingLazy} Below-the-Fold Images Lack Lazy Loading`,
        status: 'warn',
        impact: 'low',
        scoreDelta: -4,
        description: 'Off-screen images should use loading="lazy" to avoid consuming initial page load bandwidth.',
        details: `${missingLazy} non-lazy image elements`,
        fixSnippet: `<img src="product.jpg" loading="lazy" alt="Product" />`,
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(totalPoints)));

  return {
    category: 'Performance',
    score: finalScore,
    grade: getGrade(finalScore),
    items,
  };
}

function getGrade(score) {
  if (score >= 95) return 'S';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}
