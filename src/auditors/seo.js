/**
 * SEO Auditor: Title, Meta Description, Heading Tree, Canonical, OpenGraph, Twitter Cards, Robots/Sitemap, Viewport
 */
export function auditSeo(scanData) {
  const { $, html, auxiliary, origin } = scanData;
  const items = [];
  let totalPoints = 100;

  // 1. Title Tag
  const title = $('title').first().text().trim();
  if (!title) {
    totalPoints -= 20;
    items.push({
      id: 'seo-title',
      title: 'Missing <title> Tag',
      status: 'fail',
      impact: 'high',
      scoreDelta: -20,
      description: 'Search engines require a descriptive <title> to rank and display your page snippet.',
      details: 'No title element found',
      fixSnippet: `<title>Brand Name — Clear & Catchy Value Proposition (50-60 chars)</title>`,
    });
  } else if (title.length < 25) {
    totalPoints -= 5;
    items.push({
      id: 'seo-title',
      title: `Short <title> Tag (${title.length} chars)`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -5,
      description: `Title tag is too short (${title.length} chars). Ideal length is 40–60 characters.`,
      details: `"${title}"`,
      fixSnippet: `<title>Expand title with primary keyword and brand name</title>`,
    });
  } else if (title.length > 70) {
    totalPoints -= 4;
    items.push({
      id: 'seo-title',
      title: `Long <title> Tag (${title.length} chars)`,
      status: 'warn',
      impact: 'low',
      scoreDelta: -4,
      description: `Title tag exceeds 60–70 characters and will be truncated in Google search results.`,
      details: `"${title}"`,
    });
  } else {
    items.push({
      id: 'seo-title',
      title: `Optimized <title> Tag (${title.length} chars)`,
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'Title tag length is in the optimal sweet spot (30–65 characters).',
      details: `"${title}"`,
    });
  }

  // 2. Meta Description
  const metaDesc = $('meta[name="description" i]').attr('content')?.trim();
  if (!metaDesc) {
    totalPoints -= 15;
    items.push({
      id: 'seo-meta-desc',
      title: 'Missing Meta Description',
      status: 'fail',
      impact: 'high',
      scoreDelta: -15,
      description: 'A meta description is crucial for click-through rate (CTR) on search engine results pages.',
      details: 'Meta description tag not found',
      fixSnippet: `<meta name="description" content="Engaging summary of this page with a strong call to action (120-160 characters)." />`,
    });
  } else if (metaDesc.length < 60) {
    totalPoints -= 5;
    items.push({
      id: 'seo-meta-desc',
      title: `Short Meta Description (${metaDesc.length} chars)`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -5,
      description: `Meta description is too short (${metaDesc.length} chars). Aim for 120–160 characters.`,
      details: `"${metaDesc}"`,
    });
  } else if (metaDesc.length > 170) {
    totalPoints -= 3;
    items.push({
      id: 'seo-meta-desc',
      title: `Long Meta Description (${metaDesc.length} chars)`,
      status: 'warn',
      impact: 'low',
      scoreDelta: -3,
      description: `Meta description exceeds 160 characters and will be cut off in search snippets.`,
      details: `"${metaDesc.slice(0, 80)}..."`,
    });
  } else {
    items.push({
      id: 'seo-meta-desc',
      title: `Optimized Meta Description (${metaDesc.length} chars)`,
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'Meta description length is well within the 120–160 character target.',
      details: `"${metaDesc}"`,
    });
  }

  // 3. Heading Hierarchy (H1)
  const h1s = $('h1');
  if (h1s.length === 1) {
    items.push({
      id: 'seo-h1',
      title: 'Perfect H1 Heading Structure',
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'Page has exactly one top-level <h1> heading.',
      details: `H1: "${h1s.first().text().trim().slice(0, 60)}"`,
    });
  } else if (h1s.length === 0) {
    totalPoints -= 12;
    items.push({
      id: 'seo-h1',
      title: 'Missing <h1> Heading',
      status: 'fail',
      impact: 'high',
      scoreDelta: -12,
      description: 'No <h1> heading found. H1 communicates the main topic of your page to search crawlers.',
      details: '0 <h1> elements detected',
      fixSnippet: `<h1>Primary Headline for this Page</h1>`,
    });
  } else {
    totalPoints -= 6;
    items.push({
      id: 'seo-h1',
      title: `Multiple <h1> Headings (${h1s.length} found)`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -6,
      description: 'Pages should typically contain a single primary <h1> to preserve clear semantic hierarchy.',
      details: `${h1s.length} H1 tags detected`,
      fixSnippet: 'Demote extra <h1> tags to <h2> or <h3> headings.',
    });
  }

  // 4. Canonical Link
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) {
    items.push({
      id: 'seo-canonical',
      title: 'Canonical URL Specified',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'Canonical tag prevents duplicate content indexing penalties.',
      details: `Canonical: ${canonical}`,
    });
  } else {
    totalPoints -= 8;
    items.push({
      id: 'seo-canonical',
      title: 'Missing Canonical Tag',
      status: 'warn',
      impact: 'medium',
      scoreDelta: -8,
      description: 'Without a canonical link, URL query strings or protocol variations can dilute search ranking.',
      details: 'No canonical link found',
      fixSnippet: `<link rel="canonical" href="${origin}/" />`,
    });
  }

  // 5. Open Graph Meta Tags (Social Media Previews)
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogUrl = $('meta[property="og:url"]').attr('content');

  const ogMissing = [];
  if (!ogTitle) ogMissing.push('og:title');
  if (!ogDesc) ogMissing.push('og:description');
  if (!ogImage) ogMissing.push('og:image');

  if (ogMissing.length === 0) {
    items.push({
      id: 'seo-opengraph',
      title: 'Complete OpenGraph Social Metadata',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'Rich previews are fully configured for WhatsApp, LinkedIn, Discord, and Facebook.',
      details: `og:title, og:description, og:image active`,
    });
  } else {
    totalPoints -= Math.min(10, ogMissing.length * 3);
    items.push({
      id: 'seo-opengraph',
      title: `Missing OpenGraph Tags (${ogMissing.join(', ')})`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -Math.min(10, ogMissing.length * 3),
      description: 'Incomplete OpenGraph tags result in blank or broken preview cards when links are shared on social media.',
      details: `Missing: ${ogMissing.join(', ')}`,
      fixSnippet: `<meta property="og:title" content="${title || 'Page Title'}" />\n<meta property="og:description" content="Engaging description" />\n<meta property="og:image" content="${origin}/og-image.jpg" />`,
    });
  }

  // 6. Twitter Card Meta Tags
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || $('meta[property="twitter:card"]').attr('content');
  const twitterImage = $('meta[name="twitter:image"]').attr('content') || $('meta[property="twitter:image"]').attr('content');

  if (twitterCard) {
    items.push({
      id: 'seo-twitter-card',
      title: `Twitter Card Configured (${twitterCard})`,
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'X / Twitter rich summary cards will render properly.',
      details: `twitter:card="${twitterCard}"`,
    });
  } else {
    totalPoints -= 4;
    items.push({
      id: 'seo-twitter-card',
      title: 'Missing Twitter Card Tag',
      status: 'warn',
      impact: 'low',
      scoreDelta: -4,
      description: 'Twitter / X will fall back to basic text without a rich image preview.',
      details: 'twitter:card tag not specified',
      fixSnippet: `<meta name="twitter:card" content="summary_large_image" />`,
    });
  }

  // 7. Robots.txt & Sitemap.xml
  if (auxiliary?.robotsTxt?.exists) {
    items.push({
      id: 'seo-robots-txt',
      title: 'robots.txt Detected',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'Search engine crawling directives are defined.',
      details: `Found at ${origin}/robots.txt`,
    });
  } else {
    totalPoints -= 6;
    items.push({
      id: 'seo-robots-txt',
      title: 'Missing robots.txt File',
      status: 'warn',
      impact: 'medium',
      scoreDelta: -6,
      description: 'No robots.txt file found. Search engine bots will crawl without guidelines.',
      details: '404 Not Found',
      fixSnippet: `# Example robots.txt:\nUser-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`,
    });
  }

  if (auxiliary?.sitemapXml?.exists) {
    items.push({
      id: 'seo-sitemap-xml',
      title: 'XML Sitemap Detected',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'XML sitemap helps search engines discover all indexable pages.',
      details: `Located at ${auxiliary.sitemapXml.url || origin + '/sitemap.xml'}`,
    });
  } else {
    totalPoints -= 6;
    items.push({
      id: 'seo-sitemap-xml',
      title: 'Missing XML Sitemap',
      status: 'warn',
      impact: 'medium',
      scoreDelta: -6,
      description: 'No sitemap.xml discovered in root or declared in robots.txt.',
      details: 'Sitemap not detected',
    });
  }

  // 8. Robots Meta Tag Indexing Check
  const robotsMeta = $('meta[name="robots" i]').attr('content')?.toLowerCase();
  if (robotsMeta && (robotsMeta.includes('noindex') || robotsMeta.includes('none'))) {
    totalPoints -= 25;
    items.push({
      id: 'seo-noindex',
      title: 'WARNING: Page is marked NOINDEX',
      status: 'fail',
      impact: 'high',
      scoreDelta: -25,
      description: 'The robots meta tag explicitly instructs search engines NOT to index this page.',
      details: `robots content: "${robotsMeta}"`,
      fixSnippet: `Remove or update <meta name="robots" content="index, follow" />`,
    });
  }

  // 9. Favicon Presence
  const favicon = $('link[rel*="icon"]').attr('href');
  if (favicon) {
    items.push({
      id: 'seo-favicon',
      title: 'Favicon Configured',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'Browser tab and Google mobile search results will display brand icon.',
      details: `Favicon: ${favicon}`,
    });
  } else {
    totalPoints -= 3;
    items.push({
      id: 'seo-favicon',
      title: 'Missing Favicon Link Tag',
      status: 'warn',
      impact: 'low',
      scoreDelta: -3,
      description: 'No <link rel="icon"> tag found in HTML head.',
      details: 'Missing favicon tag',
      fixSnippet: `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`,
    });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(totalPoints)));

  return {
    category: 'SEO',
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
