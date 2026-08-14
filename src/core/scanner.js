import https from 'node:https';
import http from 'node:http';
import tls from 'node:tls';
import { URL } from 'node:url';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { DEMO_PRESETS } from './demoPresets.js';

/**
 * Perform deep HTTP/HTTPS inspection on a target URL or Demo Preset
 */
export async function scanUrl(rawUrl, options = {}) {
  // Check for demo presets
  const cleanKey = rawUrl.replace(/^demo:?/i, '').toLowerCase();
  if (DEMO_PRESETS[cleanKey] || options.demo) {
    const preset = DEMO_PRESETS[cleanKey] || DEMO_PRESETS[options.demo] || DEMO_PRESETS.saas;
    const $ = cheerio.load(preset.html);
    return {
      ...preset,
      $,
    };
  }

  const timeout = options.timeout || 15000;
  const userAgent = options.userAgent || 'Mozilla/5.0 (compatible; WebsiteAuditor/1.0; +https://github.com/muhummadzarrar09-sudo/WEBSITE-AUDITOR)';

  let targetUrl = rawUrl;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const parsedUrl = new URL(targetUrl);
  const startTime = Date.now();
  let ttfb = 0;
  let sslTime = 0;
  let certInfo = null;

  // 1. SSL Certificate & TLS handshake inspection (if HTTPS)
  if (parsedUrl.protocol === 'https:') {
    try {
      const port = parsedUrl.port || 443;
      const tlsStart = Date.now();
      certInfo = await new Promise((resolve) => {
        const socket = tls.connect({
          host: parsedUrl.hostname,
          port: Number(port),
          servername: parsedUrl.hostname,
          rejectUnauthorized: false,
          timeout: 5000,
        }, () => {
          sslTime = Date.now() - tlsStart;
          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const protocol = socket.getProtocol();
          const cipher = socket.getCipher();
          socket.end();
          
          if (cert && Object.keys(cert).length > 0) {
            const validTo = new Date(cert.valid_to);
            const validFrom = new Date(cert.valid_from);
            const daysRemaining = Math.max(0, Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            resolve({
              subject: cert.subject,
              issuer: cert.issuer,
              validFrom: validFrom.toISOString(),
              validTo: validTo.toISOString(),
              daysRemaining,
              authorized,
              protocol,
              cipher: cipher?.name,
              san: cert.subjectaltname,
            });
          } else {
            resolve(null);
          }
        });

        socket.on('error', () => resolve(null));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(null);
        });
      });
    } catch {
      certInfo = null;
    }
  }

  // 2. Fetch page content with detailed timing
  const axiosInstance = axios.create({
    timeout,
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    },
    maxRedirects: 5,
    validateStatus: () => true, // Don't throw on 4xx/5xx
  });

  const reqStart = Date.now();
  let response;
  try {
    response = await axiosInstance.get(targetUrl);
    ttfb = Date.now() - reqStart;
  } catch (err) {
    if (parsedUrl.protocol === 'https:' && !rawUrl.startsWith('https://')) {
      try {
        targetUrl = targetUrl.replace('https://', 'http://');
        response = await axiosInstance.get(targetUrl);
        ttfb = Date.now() - reqStart;
      } catch (fallbackErr) {
        throw new Error(`Failed to reach ${targetUrl}: ${err.message}`);
      }
    } else {
      throw new Error(`Failed to reach ${targetUrl}: ${err.message}`);
    }
  }

  const totalTime = Date.now() - startTime;
  const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  const $ = cheerio.load(html || '');

  // 3. Scan auxiliary files (robots.txt, sitemap.xml, sensitive endpoints)
  const auxiliary = await scanAuxiliaryFiles(parsedUrl.origin, axiosInstance);

  return {
    url: targetUrl,
    origin: parsedUrl.origin,
    hostname: parsedUrl.hostname,
    pathname: parsedUrl.pathname,
    protocol: parsedUrl.protocol,
    statusCode: response.status,
    statusText: response.statusText,
    headers: response.headers,
    timing: {
      ttfb,
      totalTime,
      sslTime,
    },
    ssl: certInfo,
    html,
    $,
    auxiliary,
    contentLength: Buffer.byteLength(html, 'utf8'),
  };
}

/**
 * Scan auxiliary endpoints like robots.txt, sitemap.xml, and exposed config checks
 */
async function scanAuxiliaryFiles(origin, client) {
  const results = {
    robotsTxt: { exists: false, status: 404, content: '' },
    sitemapXml: { exists: false, status: 404, url: '' },
    exposedPaths: [],
  };

  // Check robots.txt
  try {
    const robotsRes = await client.get(`${origin}/robots.txt`, { timeout: 3000 });
    if (robotsRes.status === 200 && typeof robotsRes.data === 'string' && robotsRes.data.includes('User-agent')) {
      results.robotsTxt = {
        exists: true,
        status: robotsRes.status,
        content: robotsRes.data.slice(0, 1000),
      };
      
      const sitemapMatch = robotsRes.data.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
      if (sitemapMatch) {
        results.sitemapXml.url = sitemapMatch[1];
      }
    }
  } catch {}

  // Check standard sitemap.xml
  if (!results.sitemapXml.url) {
    try {
      const sitemapRes = await client.get(`${origin}/sitemap.xml`, { timeout: 3000 });
      if (sitemapRes.status === 200 && (sitemapRes.headers['content-type']?.includes('xml') || typeof sitemapRes.data === 'string' && sitemapRes.data.includes('<?xml'))) {
        results.sitemapXml = {
          exists: true,
          status: sitemapRes.status,
          url: `${origin}/sitemap.xml`,
        };
      }
    } catch {}
  } else {
    results.sitemapXml.exists = true;
  }

  // Check for common accidentally exposed sensitive files
  const sensitivePaths = [
    { path: '/.env', label: 'Exposed .env environment file' },
    { path: '/.git/HEAD', label: 'Exposed .git repository directory' },
    { path: '/wp-config.php.bak', label: 'Exposed WordPress backup configuration' },
    { path: '/server-status', label: 'Exposed Apache server-status diagnostic' },
  ];

  for (const { path, label } of sensitivePaths) {
    try {
      const checkRes = await client.get(`${origin}${path}`, { timeout: 2000 });
      if (checkRes.status === 200 && checkRes.data) {
        const text = String(checkRes.data);
        if (path === '/.git/HEAD' && text.includes('ref:')) {
          results.exposedPaths.push({ path, label, risk: 'CRITICAL' });
        } else if (path === '/.env' && (text.includes('DB_') || text.includes('KEY=') || text.includes('SECRET='))) {
          results.exposedPaths.push({ path, label, risk: 'CRITICAL' });
        } else if (path === '/server-status' && text.includes('Apache Server Status')) {
          results.exposedPaths.push({ path, label, risk: 'HIGH' });
        }
      }
    } catch {}
  }

  return results;
}
