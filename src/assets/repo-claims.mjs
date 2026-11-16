// Shared by static templates and browser-rendered cards. No build date is evidence.
export function repositoryClaims(repo, now = new Date()) {
  const valid = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && Date.parse(value) <= new Date(now).getTime() + 300000;
  const date = value => valid(value) ? value.slice(0, 10) : 'unverified';
  const checked = repo.metadataCheckedAt;
  const stale = !valid(checked) || new Date(now) - new Date(checked) > 7 * 86400000;
  const status = repo.archived === true
    ? 'Archived repository. Historical reference; no further updates expected.'
    : !valid(checked) || repo.archived !== false
      ? 'Archive and maintenance status unverified.'
      : stale ? 'Archive and maintenance status may be stale; recheck upstream.'
        : valid(repo.pushedAt) && new Date(now) - new Date(repo.pushedAt) > 180 * 86400000
          ? 'Inactive snapshot: no recorded push in the past 180 days; maintenance unverified.'
          : 'Not archived when checked; ongoing maintenance unverified.';
  return {
    status,
    checked: `Identity and stars checked: ${date(repo.refreshedAt)}. Metadata checked: ${date(checked)}${stale && valid(checked) ? ' (stale snapshot)' : ''}.`,
    editorial: `Editorial snapshot. Review date: ${date(repo.editorialReviewedAt)}. Recheck upstream before use.`,
    activity: `Last upstream push: ${date(repo.pushedAt)}.`,
    licence: `Reported licence: ${repo.licenseSpdx || 'unverified'}${stale ? ' (unverified or stale snapshot)' : ''}. Check repository and component terms before reuse; model licences may differ.`,
  };
}
