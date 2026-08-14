/**
 * Security Auditor: HTTP Security Headers, SSL/TLS, Cookies, Sensitive Endpoints, Mixed Content
 */
export function auditSecurity(scanData) {
  const { headers, ssl, protocol, auxiliary, $, url } = scanData;
  const items = [];
  let totalPoints = 100;

  // Helper to safely get header value case-insensitively
  const getHeader = (name) => {
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? String(headers[key]) : null;
  };

  // 1. HTTPS Protocol Check
  const isHttps = protocol === 'https:';
  if (isHttps) {
    items.push({
      id: 'sec-https',
      title: 'HTTPS Protocol Enabled',
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'The site transmits data over an encrypted HTTPS connection.',
      details: `Protocol: ${protocol}`,
    });
  } else {
    totalPoints -= 30;
    items.push({
      id: 'sec-https',
      title: 'Missing HTTPS Encryption',
      status: 'fail',
      impact: 'high',
      scoreDelta: -30,
      description: 'The site is served over insecure plaintext HTTP. Traffic can be intercepted or modified.',
      details: 'Served over HTTP',
      fixSnippet: 'Redirect all HTTP traffic to HTTPS via your web server or Cloudflare (Always Use HTTPS).',
    });
  }

  // 2. SSL/TLS Certificate Health
  if (ssl) {
    if (ssl.authorized) {
      if (ssl.daysRemaining > 30) {
        items.push({
          id: 'sec-ssl-cert',
          title: 'Valid SSL/TLS Certificate',
          status: 'pass',
          impact: 'high',
          scoreDelta: 0,
          description: `SSL certificate is valid and expires in ${ssl.daysRemaining} days.`,
          details: `Issuer: ${ssl.issuer?.O || ssl.issuer?.CN || 'Unknown'}, Expiry: ${ssl.validTo}`,
        });
      } else if (ssl.daysRemaining > 0) {
        totalPoints -= 10;
        items.push({
          id: 'sec-ssl-cert',
          title: 'SSL Certificate Expiring Soon',
          status: 'warn',
          impact: 'high',
          scoreDelta: -10,
          description: `SSL certificate expires in ${ssl.daysRemaining} days. Renew promptly to avoid browser security warnings.`,
          details: `Expires in ${ssl.daysRemaining} days`,
          fixSnippet: 'Renew certificate with Certbot: certbot renew',
        });
      } else {
        totalPoints -= 35;
        items.push({
          id: 'sec-ssl-cert',
          title: 'Expired SSL Certificate',
          status: 'fail',
          impact: 'high',
          scoreDelta: -35,
          description: 'SSL certificate has expired. Browsers will block visitors with security warnings.',
          details: `Expired on ${ssl.validTo}`,
        });
      }
    } else {
      totalPoints -= 30;
      items.push({
        id: 'sec-ssl-cert',
        title: 'Untrusted SSL Certificate',
        status: 'fail',
        impact: 'high',
        scoreDelta: -30,
        description: 'The SSL certificate is self-signed or not issued by a trusted Certificate Authority.',
        details: 'Unauthorized certificate',
      });
    }
  }

  // 3. Strict-Transport-Security (HSTS)
  const hsts = getHeader('strict-transport-security');
  if (hsts) {
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    const hasPreload = /preload/i.test(hsts);
    const hasSubdomains = /includeSubDomains/i.test(hsts);

    if (maxAge >= 15768000) { // 6 months+
      items.push({
        id: 'sec-hsts',
        title: 'HSTS (Strict-Transport-Security) Configured',
        status: 'pass',
        impact: 'medium',
        scoreDelta: 0,
        description: 'HSTS enforces HTTPS connections and protects against SSL stripping attacks.',
        details: `Value: ${hsts} (max-age: ${maxAge}s, subdomains: ${hasSubdomains}, preload: ${hasPreload})`,
      });
    } else {
      totalPoints -= 5;
      items.push({
        id: 'sec-hsts',
        title: 'HSTS Max-Age Too Low',
        status: 'warn',
        impact: 'medium',
        scoreDelta: -5,
        description: 'HSTS max-age should be at least 6 months (15,768,000 seconds) or 1 year (31,536,000 seconds).',
        details: `Current max-age: ${maxAge}s`,
        fixSnippet: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
      });
    }
  } else {
    totalPoints -= 12;
    items.push({
      id: 'sec-hsts',
      title: 'Missing HSTS Header',
      status: 'fail',
      impact: 'medium',
      scoreDelta: -12,
      description: 'Without HSTS, the browser can attempt unencrypted HTTP connections before redirecting.',
      details: 'Header not present',
      fixSnippet: `# Nginx config:\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\n\n# Next.js (next.config.js):\n{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }`,
    });
  }

  // 4. Content-Security-Policy (CSP)
  const csp = getHeader('content-security-policy');
  if (csp) {
    items.push({
      id: 'sec-csp',
      title: 'Content-Security-Policy (CSP) Active',
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'CSP mitigates Cross-Site Scripting (XSS) and data injection attacks.',
      details: `Policy defined (${csp.length} chars)`,
    });
  } else {
    totalPoints -= 15;
    items.push({
      id: 'sec-csp',
      title: 'Missing Content-Security-Policy (CSP)',
      status: 'fail',
      impact: 'high',
      scoreDelta: -15,
      description: 'No Content-Security-Policy header detected. This leaves the site vulnerable to XSS and clickjacking.',
      details: 'Header not present',
      fixSnippet: `# Example CSP Header for Nginx:\nadd_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https:;" always;`,
    });
  }

  // 5. X-Frame-Options / Frame-Ancestors
  const xfo = getHeader('x-frame-options');
  const hasCspFrameAncestors = csp && /frame-ancestors/i.test(csp);
  if (xfo || hasCspFrameAncestors) {
    items.push({
      id: 'sec-clickjacking',
      title: 'Clickjacking Protection Active',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'Clickjacking attacks via iframe embedding are blocked.',
      details: xfo ? `X-Frame-Options: ${xfo}` : 'frame-ancestors CSP directive active',
    });
  } else {
    totalPoints -= 10;
    items.push({
      id: 'sec-clickjacking',
      title: 'Missing Clickjacking Defense',
      status: 'fail',
      impact: 'medium',
      scoreDelta: -10,
      description: 'Neither X-Frame-Options nor CSP frame-ancestors is configured. Malicious sites can embed this page in an invisible iframe.',
      details: 'No anti-framing headers',
      fixSnippet: `# Nginx:\nadd_header X-Frame-Options "SAMEORIGIN" always;\n\n# Apache:\nHeader always set X-Frame-Options "SAMEORIGIN"`,
    });
  }

  // 6. X-Content-Type-Options
  const xcto = getHeader('x-content-type-options');
  if (xcto && xcto.toLowerCase().includes('nosniff')) {
    items.push({
      id: 'sec-nosniff',
      title: 'MIME Sniffing Protection (nosniff)',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'Prevents browsers from MIME-sniffing a response away from the declared content-type.',
      details: `X-Content-Type-Options: ${xcto}`,
    });
  } else {
    totalPoints -= 8;
    items.push({
      id: 'sec-nosniff',
      title: 'Missing X-Content-Type-Options Header',
      status: 'warn',
      impact: 'low',
      scoreDelta: -8,
      description: 'Browsers may attempt to sniff response content types, potentially executing user-uploaded files as scripts.',
      details: 'Header not set to nosniff',
      fixSnippet: `add_header X-Content-Type-Options "nosniff" always;`,
    });
  }

  // 7. Referrer-Policy
  const referrerPolicy = getHeader('referrer-policy');
  if (referrerPolicy) {
    items.push({
      id: 'sec-referrer-policy',
      title: 'Referrer-Policy Configured',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'Controls how much referrer information is sent with outbound requests.',
      details: `Referrer-Policy: ${referrerPolicy}`,
    });
  } else {
    totalPoints -= 5;
    items.push({
      id: 'sec-referrer-policy',
      title: 'Missing Referrer-Policy Header',
      status: 'warn',
      impact: 'low',
      scoreDelta: -5,
      description: 'Without a Referrer-Policy, private URL query parameters may leak to third-party domains.',
      details: 'Default browser fallback used',
      fixSnippet: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
    });
  }

  // 8. Permissions-Policy
  const permissionsPolicy = getHeader('permissions-policy') || getHeader('feature-policy');
  if (permissionsPolicy) {
    items.push({
      id: 'sec-permissions-policy',
      title: 'Permissions-Policy Configured',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'Restricts browser features like camera, microphone, and geolocation.',
      details: `Permissions-Policy active`,
    });
  } else {
    items.push({
      id: 'sec-permissions-policy',
      title: 'Permissions-Policy Recommended',
      status: 'info',
      impact: 'low',
      scoreDelta: 0,
      description: 'Explicitly disable unused device capabilities (e.g. camera, microphone, geolocation).',
      details: 'Header not configured',
      fixSnippet: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`,
    });
  }

  // 9. Server Banner / Technology Disclosure
  const server = getHeader('server');
  const xPoweredBy = getHeader('x-powered-by');
  if (xPoweredBy || (server && /\d+\.\d+/.test(server))) {
    totalPoints -= 6;
    items.push({
      id: 'sec-tech-disclosure',
      title: 'Server & Tech Version Disclosed',
      status: 'warn',
      impact: 'medium',
      scoreDelta: -6,
      description: 'Server or framework version numbers are exposed in headers, assisting automated exploit scanners.',
      details: [server && `Server: ${server}`, xPoweredBy && `X-Powered-By: ${xPoweredBy}`].filter(Boolean).join(' | '),
      fixSnippet: `# Nginx:\nserver_tokens off;\n\n# Express.js:\napp.disable('x-powered-by');`,
    });
  } else {
    items.push({
      id: 'sec-tech-disclosure',
      title: 'Server Headers Obfuscated',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'No detailed server version or X-Powered-By banners were exposed.',
      details: server ? `Server: ${server}` : 'Minimal server telemetry',
    });
  }

  // 10. Exposed Sensitive Files Check
  if (auxiliary?.exposedPaths?.length > 0) {
    for (const exp of auxiliary.exposedPaths) {
      totalPoints -= 25;
      items.push({
        id: `sec-exposed-${exp.path.replace(/[^a-z0-9]/gi, '_')}`,
        title: `CRITICAL: ${exp.label}`,
        status: 'fail',
        impact: 'high',
        scoreDelta: -25,
        description: `Sensitive resource publicly accessible at ${exp.path}! Immediate action required.`,
        details: `Accessible at ${url}${exp.path}`,
        fixSnippet: `Block access in web server config:\nlocation ~ /\\.(env|git) { deny all; return 404; }`,
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(totalPoints)));

  return {
    category: 'Security',
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
