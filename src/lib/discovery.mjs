import { categoryCopy } from './manual-content.mjs';
import { slugify } from './io.mjs';

export function canonicalCategory(value) {
  for (const [name, copy] of Object.entries(categoryCopy)) {
    if (value === name || copy.aliases?.includes(value)) return name;
  }
  throw new Error(`Unknown repository category: ${value}`);
}

export function discoveryData(siteData) {
  const repos = siteData.repos.map(repo => ({...repo, category: canonicalCategory(repo.category)}));
  const categories = Object.entries(categoryCopy).map(([name,copy]) => ({
    id: copy.id || slugify(name), name, shortLabel: copy.shortLabel,
    description: copy.description, count: repos.filter(repo => repo.category === name).length,
  }));
  return {...siteData, repos, categories,
    featured: repos.filter(repo => repo.featured).slice(0,6)};
}
