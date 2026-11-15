export const PUBLIC_BOUNDARY_PATTERNS = [
  {
    label: "Windows workspace path",
    pattern: /\b[A-Z]:[\\/]+/i,
  },
  {
    label: "NAS workspace path",
    pattern: /\\{2,}NAS_[^\\\s]+\\+/i,
  },
  { label: "UNC workspace path", pattern: /(?<![A-Za-z0-9:\\])\\{2,}[^\\\s"<>]+\\+[^\\\s"<>]+/i },
  { label: "local file URL", pattern: /\bfile:\/+/i },
  { label: "local-only marker", pattern: /\bLOCAL-ONLY\b/i },
  { label: "session update path", pattern: /\bsession-updates\b/i },
  { label: "workspace checkout metadata", pattern: /\bworkspace_checkouts\b/i },
  { label: "database connection string", pattern: /\bpostgres(?:ql)?:\/\//i },
  { label: "database environment variable", pattern: /\bDATABASE_URL\b/i },
];

export function findPublicBoundaryFindings(entries) {
  const findings = [];

  for (const { relativePath, content } of entries) {
    for (const rule of PUBLIC_BOUNDARY_PATTERNS) {
      if (rule.pattern.test(content)) {
        findings.push(`${relativePath}: ${rule.label}`);
      }
    }
  }

  return findings;
}
