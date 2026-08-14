import { runAudit } from '../index.js';

/**
 * Head-to-Head Website Battle Comparator
 */
export async function compareWebsites(urlA, urlB, options = {}) {
  const [reportA, reportB] = await Promise.all([
    runAudit(urlA, options),
    runAudit(urlB, options),
  ]);

  const scoreDiff = reportA.overallScore - reportB.overallScore;
  let winner = 'TIE';
  if (scoreDiff > 0) winner = reportA.url;
  else if (scoreDiff < 0) winner = reportB.url;

  const categoryComparisons = reportA.categories.map((catA) => {
    const catB = reportB.categories.find(c => c.category === catA.category) || { score: 0, grade: 'F' };
    const diff = catA.score - catB.score;
    let catWinner = 'TIE';
    if (diff > 0) catWinner = reportA.url;
    else if (diff < 0) catWinner = reportB.url;

    return {
      category: catA.category,
      scoreA: catA.score,
      gradeA: catA.grade,
      scoreB: catB.score,
      gradeB: catB.grade,
      diff,
      winner: catWinner,
    };
  });

  const ttfbA = reportA.scanData?.timing?.ttfb || 0;
  const ttfbB = reportB.scanData?.timing?.ttfb || 0;
  const fasterSite = ttfbA < ttfbB ? reportA.url : (ttfbB < ttfbA ? reportB.url : 'Equal');

  let verdict = '';
  if (winner === reportA.url) {
    verdict = `🏆 ${reportA.url} outclasses ${reportB.url} by +${scoreDiff} points! (Superior ${categoryComparisons.filter(c => c.winner === reportA.url).map(c => c.category).join(', ')})`;
  } else if (winner === reportB.url) {
    verdict = `🏆 ${reportB.url} beats ${reportA.url} by +${Math.abs(scoreDiff)} points! (Superior ${categoryComparisons.filter(c => c.winner === reportB.url).map(c => c.category).join(', ')})`;
  } else {
    verdict = `⚖️ Dead heat tie between ${reportA.url} and ${reportB.url} (${reportA.overallScore}/100)`;
  }

  return {
    siteA: reportA,
    siteB: reportB,
    overallWinner: winner,
    scoreDiff: Math.abs(scoreDiff),
    fasterSite,
    verdict,
    categoryComparisons,
  };
}
