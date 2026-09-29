import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDocument,
  CONTENT_SECURITY_POLICY,
  REFERRER_POLICY,
} from "../src/templates/layout.mjs";

function buildFixture() {
  return buildDocument({
    audience: "public",
    title: "Security fixture",
    description: "Security metadata regression fixture.",
    currentKey: "home",
    navItems: [],
    canonicalPath: "",
    eyebrow: "Fixture",
    heroTitle: "Security fixture",
    heroBody: "Static fixture.",
    content: "<p>Fixture content.</p>",
    scriptPath: "assets/public-app.js",
  });
}

test("public documents declare one early, resource-compatible security policy", () => {
  const html = buildFixture();
  const cspTag = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`;
  const referrerTag = `<meta name="referrer" content="${REFERRER_POLICY}" />`;

  assert.equal(html.split(cspTag).length - 1, 1);
  assert.equal(html.split(referrerTag).length - 1, 1);
  assert.ok(html.indexOf(cspTag) < html.indexOf("<title>"));

  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ]) {
    assert.ok(CONTENT_SECURITY_POLICY.includes(directive), `missing CSP directive: ${directive}`);
  }

  assert.equal(CONTENT_SECURITY_POLICY.includes("*"), false);
  assert.equal(CONTENT_SECURITY_POLICY.includes("unsafe-eval"), false);
  assert.equal(CONTENT_SECURITY_POLICY.includes("frame-ancestors"), false);
});
