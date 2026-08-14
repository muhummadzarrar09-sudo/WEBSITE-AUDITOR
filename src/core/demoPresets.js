/**
 * Preset Demo / Showcase Website Payloads for instant evaluation and testing
 */
export const DEMO_PRESETS = {
  saas: {
    url: 'https://saas-startup-demo.io',
    origin: 'https://saas-startup-demo.io',
    hostname: 'saas-startup-demo.io',
    pathname: '/',
    protocol: 'https:',
    statusCode: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-encoding': 'br',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'cf-ray': '8a12bc9038d1234-IAD',
      'server': 'cloudflare',
    },
    timing: { ttfb: 112, totalTime: 230, sslTime: 45 },
    ssl: {
      authorized: true,
      issuer: { O: "Let's Encrypt", CN: 'R3' },
      validFrom: '2026-01-01T00:00:00Z',
      validTo: '2026-12-31T00:00:00Z',
      daysRemaining: 180,
      protocol: 'TLSv1.3',
    },
    contentLength: 34200,
    auxiliary: {
      robotsTxt: { exists: true, status: 200, content: 'User-agent: *\nAllow: /\nSitemap: https://saas-startup-demo.io/sitemap.xml' },
      sitemapXml: { exists: true, status: 200, url: 'https://saas-startup-demo.io/sitemap.xml' },
      exposedPaths: [],
    },
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VortexAI — The Autonomous Web Intelligence Platform</title>
  <meta name="description" content="Deploy AI-driven web optimization and automated security audits with zero-latency edge inference.">
  <link rel="canonical" href="https://saas-startup-demo.io/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:title" content="VortexAI — The Autonomous Web Intelligence Platform">
  <meta property="og:description" content="Deploy AI-driven web optimization with zero-latency edge inference.">
  <meta property="og:image" content="https://saas-startup-demo.io/og-preview.png">
  <meta name="twitter:card" content="summary_large_image">
  <script src="/_next/static/chunks/main.js" defer></script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "VortexAI",
    "applicationCategory": "DeveloperApplication"
  }
  </script>
</head>
<body class="bg-slate-950 text-white">
  <header>
    <nav aria-label="Main Navigation">
      <a href="/" aria-label="Home">VortexAI</a>
      <a href="/pricing">Pricing</a>
      <a href="/docs">Docs</a>
    </nav>
  </header>
  <main id="main">
    <h1>Autonomous Web Intelligence for Modern Engineering Teams</h1>
    <p>Audit, optimize, and fortify your web applications in seconds.</p>
    <img src="https://saas-startup-demo.io/hero.webp" width="1200" height="600" alt="VortexAI Dashboard Preview" />
    <form action="/signup" method="POST">
      <label for="email">Work Email</label>
      <input type="email" id="email" name="email" placeholder="name@company.com" />
      <button type="submit">Start Free Trial</button>
    </form>
  </main>
  <footer>
    <p>&copy; 2026 VortexAI Inc.</p>
  </footer>
</body>
</html>`,
  },
  ecommerce: {
    url: 'https://shop-sneakers-demo.com',
    origin: 'https://shop-sneakers-demo.com',
    hostname: 'shop-sneakers-demo.com',
    pathname: '/',
    protocol: 'https:',
    statusCode: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'max-age=600',
      'server': 'nginx/1.18.0',
      'x-powered-by': 'Shopify',
    },
    timing: { ttfb: 420, totalTime: 890, sslTime: 85 },
    ssl: {
      authorized: true,
      issuer: { O: 'Cloudflare Inc', CN: 'Cloudflare Inc ECC CA-3' },
      validFrom: '2026-05-01T00:00:00Z',
      validTo: '2026-11-01T00:00:00Z',
      daysRemaining: 78,
      protocol: 'TLSv1.3',
    },
    contentLength: 145000,
    auxiliary: {
      robotsTxt: { exists: true, status: 200, content: 'User-agent: *\nDisallow: /checkout' },
      sitemapXml: { exists: true, status: 200, url: 'https://shop-sneakers-demo.com/sitemap.xml' },
      exposedPaths: [],
    },
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SneakerLab — Limited Edition Drops</title>
  <meta name="description" content="Shop authenticated limited edition sneakers with instant checkout and global shipping.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.shopify.com/s/files/1/00/bundle.js"></script>
</head>
<body>
  <header>
    <h1>SneakerLab Drops</h1>
    <a href="/cart">Cart (0)</a>
  </header>
  <main>
    <div class="product-grid">
      <img src="sneaker1.jpg" alt="Air Velocity 2026 edition" />
      <img src="sneaker2.jpg" />
      <a href="/buy">Click here</a>
    </div>
  </main>
</body>
</html>`,
  },
  roast: {
    url: 'https://broken-legacy-site.org',
    origin: 'http://broken-legacy-site.org',
    hostname: 'broken-legacy-site.org',
    pathname: '/',
    protocol: 'http:',
    statusCode: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/html',
      'server': 'Apache/2.2.8 (Ubuntu) PHP/5.2.4',
      'x-powered-by': 'PHP/5.2.4',
    },
    timing: { ttfb: 1450, totalTime: 2800, sslTime: 0 },
    ssl: null,
    contentLength: 280000,
    auxiliary: {
      robotsTxt: { exists: false },
      sitemapXml: { exists: false },
      exposedPaths: [{ path: '/.env', label: 'Exposed .env database password file', risk: 'CRITICAL' }],
    },
    html: `<html>
<head>
  <script src="heavy-blocking-script.js"></script>
</head>
<body bgcolor="#FFFFFF">
  <center>
    <font size="6" color="red">Welcome to My 1999 Page</font>
    <marquee>Under Construction! Best viewed in Netscape Navigator</marquee>
    <img src="banner.png">
    <a href="http://unsafe-partner.com" target="_blank">Click here</a>
    <input type="text" name="user">
  </center>
</body>
</html>`,
  },
};
