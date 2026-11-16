// Adapted from StackScout fix/source-tagging. Publisher tags are never evidence.
// Fixed editorial rule weights are independent of a site's acceptance threshold.
export function classifyArticle(entry) {
  const title=String(entry.title || '').toLowerCase();
  const metadata=[...(entry.metadata || []), ...(entry.articleTags || [])].filter(x=>typeof x==='string').join(' ');
  const text=`${title} ${entry.summary || ''} ${metadata}`.toLowerCase();
  if (/\b(?:without (?:any )?|no (?:new )?)(?:updates?|releases?)\b/.test(title)) return {tags:[],importance:0};
  if (/\b(?:advertis(?:ing|ement)|ad campaign|court[ -]ruling|court rules|lawsuit|office[ -]opening|opens? (?:an? |new )?office|funding|valuation|acquisition|ceo|layoffs?)\b/.test(title)) return {tags:[],importance:0};
  let releaseURL=false;
  try {const url=new URL(entry.url);releaseURL=['github.com','gitlab.com','codeberg.org'].includes(url.hostname) && /^\/[^/]+\/[^/]+\/(?:-\/)?releases?(?:\/|$)/.test(url.pathname);} catch {}
  const open=/\bopen[ -]source\b|\bopen_source\b/.test(text);
  const software=/\b(?:repository|repo|library|framework|sdk|cli|command.line|developer tools?|software|package|code|model weights)\b/.test(text);
  const update=/\b(?:releas(?:e[ds]?|ing)|launch(?:ed|es)?|introduc(?:e[ds]?|ing)|adds?|added|updates?|changelog|security fix|v\d+\.\d+)\b/.test(text);
  if (!releaseURL && !(open && software && update)) return {tags:[],importance:0};
  const tags=['open_source','repo_update'];
  if (releaseURL) tags.push('github_release');
  if (/\bcrypto(?:currency)?\b/.test(text)) tags.push('crypto');
  return {tags,importance:releaseURL?0.9:0.7};
}
export function tagEntries(entries,source) {
  return entries.map(entry=>({title:entry.title,url:entry.url,source:source.name,
    ...classifyArticle(entry),date:entry.date,summary:(entry.summary||entry.title).slice(0,700),
    metadata: (entry.metadata || []).filter(value=>typeof value==='string'),
    category:source.categories?.[0]||source.section||''}));
}
