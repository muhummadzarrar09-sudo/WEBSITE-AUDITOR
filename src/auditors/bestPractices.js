/**
 * Best Practices Auditor: DOCTYPE, Charset, rel="noopener" on target="_blank", Mixed Content, Deprecated Tags, Schema.org JSON-LD
 */
export function auditBestPractices(scanData) {
  const { $, html, protocol } = scanData;
  const items = [];
  let totalPoints = 100;

  // 1. HTML5 DOCTYPE
  const hasDoctype = /^<!DOCTYPE\s+html/i.test(html.trim());
  if (hasDoctype) {
    items.push({
      id: 'bp-doctype',
      title: 'Standard HTML5 DOCTYPE Declared',
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'The standard HTML5 doctype prevents legacy quirks mode rendering in browsers.',
      details: '<!DOCTYPE html>',
    });
  } else {
    totalPoints -= 15;
    items.push({
      id: 'bp-doctype',
      title: 'Missing or Non-Standard DOCTYPE',
      status: 'fail',
      impact: 'high',
      scoreDelta: -15,
      description: 'Without a clean <!DOCTYPE html>, modern browsers may enter quirks mode causing layout bugs.',
      details: 'DOCTYPE missing or malformed',
      fixSnippet: `<!DOCTYPE html>`,
    });
  }

  // 2. Charset Declaration
  const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type" i]').attr('content');
  if (charset && /utf-8/i.test(charset)) {
    items.push({
      id: 'bp-charset',
      title: 'UTF-8 Character Encoding Specified',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'UTF-8 supports all global characters and symbols without garbled text.',
      details: `Charset: UTF-8`,
    });
  } else {
    totalPoints -= 10;
    items.push({
      id: 'bp-charset',
      title: 'Missing or Non-UTF-8 Charset',
      status: 'warn',
      impact: 'medium',
      scoreDelta: -10,
      description: 'Declaring <meta charset="utf-8"> early in <head> prevents character rendering errors.',
      details: charset ? `Charset: ${charset}` : 'No charset declared',
      fixSnippet: `<meta charset="utf-8">`,
    });
  }

  // 3. Unsafe target="_blank" Links (Tabnabbing defense)
  const externalBlanks = $('a[target="_blank"]');
  let unsafeBlanks = 0;

  externalBlanks.each((_, el) => {
    const rel = $(el).attr('rel') || '';
    const isSafe = rel.includes('noopener') || rel.includes('noreferrer');
    if (!isSafe) {
      unsafeBlanks++;
    }
  });

  if (unsafeBlanks === 0) {
    items.push({
      id: 'bp-tabnabbing',
      title: 'Safe External Links (rel="noopener")',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'External links with target="_blank" protect window.opener from reverse tabnabbing.',
      details: `${externalBlanks.length} links with target="_blank" secured`,
    });
  } else {
    totalPoints -= Math.min(12, unsafeBlanks * 3);
    items.push({
      id: 'bp-tabnabbing',
      title: `${unsafeBlanks} target="_blank" Links Missing rel="noopener"`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -Math.min(12, unsafeBlanks * 3),
      description: 'Opening links in new tabs without rel="noopener" allows the new page to manipulate the original window location.',
      details: `${unsafeBlanks} insecure external links`,
      fixSnippet: `<a href="https://partner.com" target="_blank" rel="noopener noreferrer">Partner</a>`,
    });
  }

  // 4. Mixed Content Check (HTTP assets on HTTPS page)
  if (protocol === 'https:') {
    let mixedContentCount = 0;
    $('img[src^="http://"], script[src^="http://"], link[href^="http://"], iframe[src^="http://"]').each(() => {
      mixedContentCount++;
    });

    if (mixedContentCount === 0) {
      items.push({
        id: 'bp-mixed-content',
        title: 'Zero Mixed-Content Requests',
        status: 'pass',
        impact: 'high',
        scoreDelta: 0,
        description: 'All embedded scripts, stylesheets, and images load securely over HTTPS.',
        details: '0 insecure asset references',
      });
    } else {
      totalPoints -= 20;
      items.push({
        id: 'bp-mixed-content',
        title: `${mixedContentCount} Insecure Mixed-Content Assets Detected`,
        status: 'fail',
        impact: 'high',
        scoreDelta: -20,
        description: 'Loading plaintext http:// assets on an https:// page triggers browser security blocks.',
        details: `${mixedContentCount} HTTP asset links`,
        fixSnippet: 'Update all asset URLs to use https:// or protocol-relative // paths.',
      });
    }
  }

  // 5. Deprecated HTML Tags (<marquee>, <font>, <center>, <blink>, <big>)
  const deprecatedTags = ['marquee', 'font', 'center', 'blink', 'big', 'strike', 'applet'];
  const foundDeprecated = [];
  for (const tag of deprecatedTags) {
    if ($(tag).length > 0) {
      foundDeprecated.push(`<${tag}>`);
    }
  }

  if (foundDeprecated.length === 0) {
    items.push({
      id: 'bp-deprecated-tags',
      title: 'Modern Semantic HTML (No Obsolete Tags)',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'Page uses modern CSS styling instead of obsolete HTML tags.',
      details: 'Clean HTML markup',
    });
  } else {
    totalPoints -= 8;
    items.push({
      id: 'bp-deprecated-tags',
      title: `Deprecated HTML Tags Found (${foundDeprecated.join(', ')})`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -8,
      description: 'Obsolete HTML tags are not compliant with modern HTML specifications.',
      details: `Detected: ${foundDeprecated.join(', ')}`,
      fixSnippet: 'Replace obsolete formatting tags with CSS flexbox/grid and font styles.',
    });
  }

  // 6. Schema.org / JSON-LD Structured Data
  const jsonLdScripts = $('script[type="application/ld+json"]');
  if (jsonLdScripts.length > 0) {
    let validJsonLd = 0;
    jsonLdScripts.each((_, el) => {
      try {
        const text = $(el).text();
        if (text) {
          JSON.parse(text);
          validJsonLd++;
        }
      } catch {}
    });

    if (validJsonLd > 0) {
      items.push({
        id: 'bp-schema-jsonld',
        title: `Structured Data Detected (${validJsonLd} Schema JSON-LD)`,
        status: 'pass',
        impact: 'medium',
        scoreDelta: 0,
        description: 'Search engines can parse structured Schema.org entities for rich snippets & knowledge graphs.',
        details: `${validJsonLd} JSON-LD schemas valid`,
      });
    }
  } else {
    items.push({
      id: 'bp-schema-jsonld',
      title: 'No JSON-LD Structured Data',
      status: 'info',
      impact: 'low',
      scoreDelta: 0,
      description: 'Adding Schema.org JSON-LD (Organization, WebSite, Product, Article) unlocks Google Rich Snippets.',
      details: '0 JSON-LD scripts found',
      fixSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "Your Brand",\n  "url": "${scanData.origin}"\n}\n</script>`,
    });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(totalPoints)));

  return {
    category: 'Best Practices',
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
