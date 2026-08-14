import { URL } from 'node:url';
import * as cheerio from 'cheerio';
import axios from 'axios';

/**
 * Recursive Multi-Page Internal Crawler & Broken Link Detector
 */
export async function crawlSite(initialUrl, options = {}) {
  const maxDepth = options.depth || 2;
  const maxPages = options.maxPages || 15;
  const concurrency = options.concurrency || 3;
  const timeout = options.timeout || 10000;

  let rootUrl = initialUrl;
  if (!/^https?:\/\//i.test(rootUrl)) {
    rootUrl = 'https://' + rootUrl;
  }

  const rootOrigin = new URL(rootUrl).origin;
  const visited = new Set();
  const queue = [{ url: rootUrl, depth: 0 }];
  const crawledPages = [];
  const brokenLinks = [];

  const client = axios.create({
    timeout,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAuditorCrawler/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    validateStatus: () => true,
  });

  while (queue.length > 0 && crawledPages.length < maxPages) {
    // Process in batches according to concurrency
    const batch = queue.splice(0, concurrency);

    await Promise.all(batch.map(async ({ url, depth }) => {
      if (visited.has(url)) return;
      visited.add(url);

      const startTime = Date.now();
      try {
        const res = await client.get(url);
        const duration = Date.now() - startTime;

        if (res.status >= 400) {
          brokenLinks.push({
            url,
            statusCode: res.status,
            depth,
          });
          return;
        }

        const isHtml = res.headers['content-type']?.includes('text/html');
        if (!isHtml) return;

        const html = typeof res.data === 'string' ? res.data : '';
        const $ = cheerio.load(html);
        const title = $('title').text().trim() || 'No title';

        crawledPages.push({
          url,
          title,
          statusCode: res.status,
          duration,
          depth,
          linksCount: $('a[href]').length,
        });

        // Discover more internal links if depth < maxDepth
        if (depth < maxDepth) {
          $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            try {
              const fullUrl = new URL(href, url).href;
              const linkOrigin = new URL(fullUrl).origin;

              if (linkOrigin === rootOrigin && !visited.has(fullUrl) && !queue.some(q => q.url === fullUrl)) {
                queue.push({ url: fullUrl, depth: depth + 1 });
              }
            } catch {}
          });
        }
      } catch (err) {
        brokenLinks.push({
          url,
          error: err.message,
          depth,
        });
      }
    }));
  }

  return {
    rootUrl,
    totalPagesCrawled: crawledPages.length,
    pages: crawledPages,
    brokenLinks,
    allLinksHealthy: brokenLinks.length === 0,
  };
}
