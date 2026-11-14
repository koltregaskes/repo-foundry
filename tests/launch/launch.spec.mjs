import {findOverflow} from '../../scripts/overflow-check.mjs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const cfg=JSON.parse(await fs.readFile('launch-config.json','utf8'));
const root = path.resolve(cfg.root);
const base=cfg.base;
const origin = new URL(base).origin;
const prefix = new URL(base).pathname;
const localPath = url => { if(!url.pathname.startsWith(prefix)) throw Error(`Outside published project: ${url.href}`); return path.resolve(root,'.'+decodeURIComponent(url.pathname.slice(prefix.length-1))); };
async function pages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? pages(path.join(dir,e.name)) : e.name.endsWith('.html') ? [path.join(dir,e.name)] : []))).flat();
}
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml'};
for (const file of await pages(root)) {
 const relative = path.relative(root,file).replaceAll('\\','/');
 const html = await fs.readFile(file,'utf8');
 for (const width of [320,390,1280]) test(`${relative} at ${width}px`, async ({page}) => {
  await page.addInitScript(() => { window.cspViolations=[]; document.addEventListener("securitypolicyviolation", e => window.cspViolations.push({directive:e.effectiveDirective,blocked:e.blockedURI})); });
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/*', async route => {
   const url = new URL(route.request().url());
   if(url.origin !== origin) return route.abort();
   const target = localPath(url);
   if(!target.startsWith(root+path.sep) && target !== root) return route.abort();
   let resolved = target;
   try { if((await fs.stat(resolved)).isDirectory()) resolved=path.join(resolved,'index.html');
    await route.fulfill({body:await fs.readFile(resolved),contentType:types[path.extname(resolved)] || 'application/octet-stream'});
   } catch { await route.fulfill({status:404,body:'Not found'}); }
  });
  await page.goto(new URL(relative,base).href);
  const redirect = html.match(/http-equiv=["']refresh["'][^>]*content=["']0;\s*url=([^"']+)/i);
  if (redirect) await page.waitForURL(new URL(redirect[1], new URL(relative,base)).href);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.locator('body').getAttribute('class')).not.toContain('has-motion');
  const overflow = await page.evaluate(findOverflow);
  expect(overflow).toEqual([]);
  if(relative==='about/index.html'&&width===1280){
   const heading=page.locator('.operator-card h2');
   await heading.evaluate(e=>{e.style.fontFamily='monospace';e.style.fontSize='80px';e.style.maxWidth='370px';e.style.letterSpacing='4px';});
   await expect(heading).toHaveCSS('font-size','80px');
   await expect(heading).toHaveCSS('letter-spacing','4px');
   expect(await page.evaluate(findOverflow),'About heading must wrap with wider fallback metrics').toEqual([]);
   await heading.evaluate(e=>{e.style.removeProperty('font-family');e.style.removeProperty('font-size');e.style.removeProperty('max-width');e.style.removeProperty('letter-spacing');});
  }
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  expect(await page.evaluate(()=>window.cspViolations)).toEqual([]);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const result = await new AxeBuilder({page}).analyze();
  const incompleteContrast=result.incomplete.filter(v=>v.id==='color-contrast').reduce((n,v)=>n+v.nodes.length,0);
  if(incompleteContrast)console.log(relative+' '+width+': '+incompleteContrast+' contrast nodes need human review');
  expect(result.violations.filter(v => ['serious','critical'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  if(relative==='visualisations/index.html') {
   const bars=await page.locator('.visual-bar__fill').evaluateAll(nodes=>nodes.map(n=>({expected:Number(n.dataset.width),fill:n.getBoundingClientRect().width,track:n.closest(".visual-bar__meter").getBoundingClientRect().width})));
   expect(bars.length).toBeGreaterThan(0);
   for(const bar of bars) {
    expect(Number.isFinite(bar.expected)).toBe(true);
    expect(bar.expected).toBeGreaterThanOrEqual(0);
    expect(bar.expected).toBeLessThanOrEqual(100);
    expect(bar.track).toBeGreaterThan(0);
    // Half a percentage point accommodates subpixel layout rounding at narrow widths.
    expect(Math.abs(bar.fill / bar.track * 100 - bar.expected)).toBeLessThanOrEqual(0.5);
   }
  }
  const links = await page.locator('[href], [src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')||n.getAttribute('src')).filter(Boolean).map(value=>new URL(value,document.baseURI).href));
  for(const link of links) {
   const url=new URL(link,page.url());
   if(url.origin!==origin || !url.pathname.startsWith(prefix) || !['https:','http:'].includes(url.protocol)) continue;
   const target=localPath(url);
   expect(target===root || target.startsWith(root+path.sep)).toBe(true);
   let stat; try {stat=await fs.stat(target)} catch {throw new Error(`Broken internal target: ${relative} -> ${url.pathname}`)}
   if(stat.isDirectory()) await fs.access(path.join(target,'index.html'));
  }
 });
}
