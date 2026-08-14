/**
 * Tech Stack & Framework Fingerprinting Engine
 */
export function detectTechStack(scanData) {
  const { headers, html, $ } = scanData;
  const technologies = [];

  const addTech = (name, category, confidence = 'High', icon = '📦') => {
    if (!technologies.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      technologies.push({ name, category, confidence, icon });
    }
  };

  const getHeader = (name) => {
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? String(headers[key]) : '';
  };

  const serverHeader = getHeader('server').toLowerCase();
  const xPoweredBy = getHeader('x-powered-by').toLowerCase();
  const cfRay = getHeader('cf-ray');
  const xVercelId = getHeader('x-vercel-id');
  const xNetlify = getHeader('x-nf-request-id');

  // 1. CDNs & Infrastructure
  if (cfRay || serverHeader.includes('cloudflare')) {
    addTech('Cloudflare', 'CDN & Edge Infrastructure', 'Definite', '☁️');
  }
  if (xVercelId || getHeader('x-vercel-cache') || serverHeader.includes('vercel')) {
    addTech('Vercel', 'Hosting & Deployment', 'Definite', '▲');
  }
  if (xNetlify || serverHeader.includes('netlify')) {
    addTech('Netlify', 'Hosting & Deployment', 'Definite', '🌐');
  }
  if (getHeader('x-amz-cf-id') || getHeader('x-amz-cf-pop')) {
    addTech('AWS CloudFront', 'CDN & Edge Infrastructure', 'Definite', '📦');
  }
  if (getHeader('x-fastly-request-id') || serverHeader.includes('fastly')) {
    addTech('Fastly', 'CDN & Edge Infrastructure', 'Definite', '⚡');
  }

  // 2. Web Servers
  if (serverHeader.includes('nginx')) addTech('Nginx', 'Web Server', 'High', '⚙️');
  if (serverHeader.includes('apache')) addTech('Apache HTTP Server', 'Web Server', 'High', '🪶');
  if (serverHeader.includes('litespeed')) addTech('LiteSpeed', 'Web Server', 'High', '⚡');
  if (serverHeader.includes('caddy')) addTech('Caddy', 'Web Server', 'High', '🔒');
  if (xPoweredBy.includes('express')) addTech('Express.js', 'Backend Framework', 'Definite', '🚀');
  if (xPoweredBy.includes('php') || html.includes('wp-content')) addTech('PHP', 'Programming Language', 'High', '🐘');

  // 3. Frontend Frameworks & SSR Engines
  if (html.includes('__NEXT_DATA__') || html.includes('/_next/static') || $('script[src*="/_next/"]').length > 0) {
    addTech('Next.js', 'React Framework / SSR', 'Definite', '▲');
    addTech('React', 'UI Library', 'Definite', '⚛️');
  } else if (html.includes('data-reactroot') || html.includes('_reactListening') || $('script[src*="react"]').length > 0) {
    addTech('React', 'UI Library', 'High', '⚛️');
  }

  if (html.includes('__NUXT__') || html.includes('/_nuxt/') || $('script[src*="/_nuxt/"]').length > 0) {
    addTech('Nuxt.js', 'Vue Framework / SSR', 'Definite', '💚');
    addTech('Vue.js', 'UI Framework', 'Definite', '🟢');
  } else if (html.includes('data-v-') || html.includes('v-cloak') || $('script[src*="vue"]').length > 0) {
    addTech('Vue.js', 'UI Framework', 'High', '🟢');
  }

  if (html.includes('astro-island') || html.includes('data-astro-cid')) {
    addTech('Astro', 'Static Site Generator / Islands', 'Definite', '🚀');
  }

  if (html.includes('svelte-') || html.includes('__sveltekit')) {
    addTech('Svelte / SvelteKit', 'UI Framework', 'Definite', '🔥');
  }

  if (html.includes('ng-version') || html.includes('ng-app') || $('[ng-version]').length > 0) {
    addTech('Angular', 'UI Framework', 'Definite', '🅰️');
  }

  if (html.includes('remix-run') || html.includes('window.__remixContext')) {
    addTech('Remix', 'Fullstack Framework', 'Definite', '💿');
  }

  if (html.includes('hx-get') || html.includes('hx-post') || $('script[src*="htmx"]').length > 0) {
    addTech('HTMX', 'Hypermedia Framework', 'Definite', '⚡');
  }

  if (html.includes('x-data') || $('script[src*="alpine"]').length > 0) {
    addTech('Alpine.js', 'UI Framework', 'Definite', '🏔️');
  }

  if (html.includes('jquery') || $('script[src*="jquery"]').length > 0 || html.includes('jQuery')) {
    addTech('jQuery', 'JavaScript Utility', 'High', '📜');
  }

  // 4. CMS & E-Commerce Platforms
  if (html.includes('/wp-content/') || html.includes('/wp-includes/') || $('meta[name="generator" i][content*="WordPress"]').length > 0) {
    addTech('WordPress', 'Content Management System', 'Definite', '📝');
  }
  if (html.includes('Shopify.shop') || html.includes('cdn.shopify.com') || $('script[src*="cdn.shopify.com"]').length > 0) {
    addTech('Shopify', 'E-Commerce Platform', 'Definite', '🛍️');
  }
  if (html.includes('data-wf-page') || html.includes('data-wf-site') || $('html[data-wf-page]').length > 0) {
    addTech('Webflow', 'Website Builder / CMS', 'Definite', '🎨');
  }
  if (html.includes('ghost-portal') || $('meta[name="generator" i][content*="Ghost"]').length > 0) {
    addTech('Ghost', 'Publishing Platform', 'Definite', '👻');
  }
  if (html.includes('squarespace.com') || $('meta[name="generator" i][content*="Squarespace"]').length > 0) {
    addTech('Squarespace', 'Website Builder', 'Definite', '⬛');
  }
  if (html.includes('wix.com') || $('meta[name="generator" i][content*="Wix.com"]').length > 0) {
    addTech('Wix', 'Website Builder', 'Definite', '✨');
  }

  // 5. CSS & Styling
  if (html.includes('tailwindcss') || $('link[href*="tailwind"]').length > 0 || /class="[^"]*(flex|grid|hidden|bg-|text-|p-|m-|rounded-)/.test(html.slice(0, 5000))) {
    addTech('Tailwind CSS', 'Utility-First CSS', 'High', '🌊');
  }
  if (html.includes('bootstrap') || $('link[href*="bootstrap"]').length > 0) {
    addTech('Bootstrap', 'UI Component Framework', 'High', '🅱️');
  }

  // 6. Analytics & Marketing
  if (html.includes('googletagmanager.com/gtag/js') || html.includes('G-') || $('script[src*="googletagmanager.com/gtag"]').length > 0) {
    addTech('Google Analytics 4', 'Analytics & Measurement', 'Definite', '📊');
  }
  if (html.includes('googletagmanager.com/gtm.js') || $('script[src*="gtm.js"]').length > 0) {
    addTech('Google Tag Manager', 'Tag Management', 'Definite', '🏷️');
  }
  if (html.includes('hotjar.com') || $('script[src*="hotjar"]').length > 0) {
    addTech('Hotjar', 'User Behavior & Heatmaps', 'Definite', '🔥');
  }
  if (html.includes('posthog') || $('script[src*="posthog"]').length > 0) {
    addTech('PostHog', 'Product Analytics', 'Definite', '🦔');
  }
  if (html.includes('plausible.io') || $('script[src*="plausible"]').length > 0) {
    addTech('Plausible Analytics', 'Privacy-First Analytics', 'Definite', '📈');
  }
  if (html.includes('connect.facebook.net/en_US/fbevents.js') || html.includes('fbq(')) {
    addTech('Meta Pixel', 'Ad Conversion Tracking', 'Definite', '🎯');
  }

  return technologies;
}
