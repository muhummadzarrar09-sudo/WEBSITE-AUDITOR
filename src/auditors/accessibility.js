/**
 * Accessibility (a11y) Auditor: HTML Lang, Image Alt Text, Form Labels, Semantic Landmarks, Button/Link Clarity, Viewport Scaling
 */
export function auditAccessibility(scanData) {
  const { $ } = scanData;
  const items = [];
  let totalPoints = 100;

  // 1. Document Lang Attribute
  const htmlLang = $('html').attr('lang');
  if (htmlLang && htmlLang.trim().length > 0) {
    items.push({
      id: 'a11y-lang',
      title: `Document Language Declared (lang="${htmlLang}")`,
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'Screen readers use the lang attribute to choose proper pronunciation rules.',
      details: `lang="${htmlLang}"`,
    });
  } else {
    totalPoints -= 15;
    items.push({
      id: 'a11y-lang',
      title: 'Missing HTML lang Attribute',
      status: 'fail',
      impact: 'high',
      scoreDelta: -15,
      description: 'The <html> element does not specify a language, causing screen readers to default to the user system locale.',
      details: '<html lang="..."> not found',
      fixSnippet: `<html lang="en">`,
    });
  }

  // 2. Image Alt Attributes
  const allImages = $('img');
  let missingAlt = 0;
  let hasAlt = 0;

  allImages.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined) {
      missingAlt++;
    } else {
      hasAlt++;
    }
  });

  if (allImages.length === 0) {
    items.push({
      id: 'a11y-img-alt',
      title: 'No Images on Page',
      status: 'pass',
      impact: 'low',
      scoreDelta: 0,
      description: 'No image elements requiring alt text.',
      details: '0 images detected',
    });
  } else if (missingAlt === 0) {
    items.push({
      id: 'a11y-img-alt',
      title: `All ${allImages.length} Images Have Alt Attributes`,
      status: 'pass',
      impact: 'high',
      scoreDelta: 0,
      description: 'Every image contains an alt attribute (or empty alt="" for decorative graphics).',
      details: `${hasAlt}/${allImages.length} images compliant`,
    });
  } else {
    const penalty = Math.min(20, Math.ceil((missingAlt / allImages.length) * 20));
    totalPoints -= penalty;
    items.push({
      id: 'a11y-img-alt',
      title: `${missingAlt}/${allImages.length} Images Missing alt Attribute`,
      status: 'fail',
      impact: 'high',
      scoreDelta: -penalty,
      description: 'Screen readers cannot describe images without an alt attribute.',
      details: `${missingAlt} image elements without alt tag`,
      fixSnippet: `<img src="photo.jpg" alt="Descriptive summary of the visual" />`,
    });
  }

  // 3. Form Input Labels
  const inputs = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea, select');
  let unlabelledInputs = 0;

  inputs.each((_, el) => {
    const id = $(el).attr('id');
    const ariaLabel = $(el).attr('aria-label');
    const ariaLabelledBy = $(el).attr('aria-labelledby');
    const title = $(el).attr('title');
    const placeholder = $(el).attr('placeholder');
    const hasParentLabel = $(el).closest('label').length > 0;
    const hasForLabel = id ? $(`label[for="${id}"]`).length > 0 : false;

    if (!ariaLabel && !ariaLabelledBy && !title && !hasParentLabel && !hasForLabel) {
      unlabelledInputs++;
    }
  });

  if (inputs.length > 0) {
    if (unlabelledInputs === 0) {
      items.push({
        id: 'a11y-form-labels',
        title: `All ${inputs.length} Form Inputs Properly Labeled`,
        status: 'pass',
        impact: 'high',
        scoreDelta: 0,
        description: 'Interactive form inputs have accessible names associated via <label> or aria-label.',
        details: `${inputs.length} inputs compliant`,
      });
    } else {
      const penalty = Math.min(15, unlabelledInputs * 5);
      totalPoints -= penalty;
      items.push({
        id: 'a11y-form-labels',
        title: `${unlabelledInputs} Form Inputs Missing Accessible Labels`,
        status: 'fail',
        impact: 'high',
        scoreDelta: -penalty,
        description: 'Form controls without labels prevent assistive technology users from knowing what to enter.',
        details: `${unlabelledInputs} unlabelled form controls`,
        fixSnippet: `<label for="email">Email Address</label>\n<input type="email" id="email" name="email" />`,
      });
    }
  }

  // 4. Meaningful Link Text
  const vaguePatterns = /^(click here|read more|more|here|link|learn more|details|go)$/i;
  let vagueLinks = 0;
  let emptyLinks = 0;
  const links = $('a[href]');

  links.each((_, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr('aria-label');
    const hasImgWithAlt = $(el).find('img[alt]:not([alt=""])').length > 0;
    
    if (!text && !ariaLabel && !hasImgWithAlt) {
      emptyLinks++;
    } else if (text && vaguePatterns.test(text) && !ariaLabel) {
      vagueLinks++;
    }
  });

  if (emptyLinks > 0 || vagueLinks > 0) {
    const penalty = Math.min(10, (emptyLinks * 3) + (vagueLinks * 2));
    totalPoints -= penalty;
    items.push({
      id: 'a11y-link-text',
      title: `Suboptimal Link Text (${emptyLinks} empty, ${vagueLinks} generic)`,
      status: 'warn',
      impact: 'medium',
      scoreDelta: -penalty,
      description: 'Generic anchor text like "click here" or empty icon links without aria-labels confuse screen reader users.',
      details: `${emptyLinks} empty links, ${vagueLinks} ambiguous links`,
      fixSnippet: `<a href="/pricing" aria-label="Explore our enterprise pricing plans">Explore Pricing</a>`,
    });
  } else if (links.length > 0) {
    items.push({
      id: 'a11y-link-text',
      title: 'Descriptive Anchor Text',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'Links provide meaningful context for assistive navigation.',
      details: `${links.length} hyperlinks evaluated`,
    });
  }

  // 5. Semantic Landmarks (<header>, <main>, <nav>, <footer>)
  const hasMain = $('main, [role="main"]').length > 0;
  const hasNav = $('nav, [role="navigation"]').length > 0;
  const hasHeader = $('header, [role="banner"]').length > 0;
  const hasFooter = $('footer, [role="contentinfo"]').length > 0;

  if (hasMain) {
    items.push({
      id: 'a11y-landmarks',
      title: 'Semantic <main> Landmark Present',
      status: 'pass',
      impact: 'medium',
      scoreDelta: 0,
      description: 'Page structure includes landmark tags allowing screen readers to jump straight to content.',
      details: `Main: ${hasMain}, Nav: ${hasNav}, Header: ${hasHeader}, Footer: ${hasFooter}`,
    });
  } else {
    totalPoints -= 8;
    items.push({
      id: 'a11y-landmarks',
      title: 'Missing <main> Landmark Element',
      status: 'warn',
      impact: 'medium',
      scoreDelta: -8,
      description: 'No <main> landmark found. Screen reader users cannot bypass navigation to reach main content.',
      details: '0 <main> landmarks found',
      fixSnippet: `<main id="main-content">\n  <!-- Primary page content goes here -->\n</main>`,
    });
  }

  // 6. Viewport Zoom Lock Check
  const viewport = $('meta[name="viewport"]').attr('content');
  if (viewport) {
    if (viewport.includes('user-scalable=no') || viewport.includes('maximum-scale=1')) {
      totalPoints -= 12;
      items.push({
        id: 'a11y-zoom-lock',
        title: 'Pinch-to-Zoom Disabled (user-scalable=no)',
        status: 'fail',
        impact: 'high',
        scoreDelta: -12,
        description: 'Disabling pinch-to-zoom in the viewport meta tag blocks visually impaired users from enlarging text.',
        details: `Viewport: "${viewport}"`,
        fixSnippet: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
      });
    } else {
      items.push({
        id: 'a11y-zoom-lock',
        title: 'Pinch-to-Zoom Enabled',
        status: 'pass',
        impact: 'medium',
        scoreDelta: 0,
        description: 'Users are free to zoom and scale page text on mobile devices.',
        details: `Viewport: "${viewport}"`,
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(totalPoints)));

  return {
    category: 'Accessibility',
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
