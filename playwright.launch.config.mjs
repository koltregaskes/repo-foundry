import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/launch',testMatch:'launch.spec.mjs',globalTimeout:600000,fullyParallel:true,workers:1,retries:0,timeout:45000,use:{browserName:'chromium',channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block'},reporter:'list'});
