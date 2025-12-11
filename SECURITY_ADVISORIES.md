# Security Advisories

## Current Audit Snapshot
- `npm run security:audit` generates `security/npm-audit-latest.json`.
- Latest review: 7 dev-only vulnerabilities (esbuild/dev-server toolchain). No production runtime risk as of this audit because the affected packages are only used in local builds.

## How to Re-run
```bash
npm run security:audit
```
The script writes fresh JSON output and never fails the build so that audit data is always captured.

## Policy: Dev vs Prod Vulnerabilities
- **Production dependencies**: Must be triaged and patched or explicitly risk-accepted with an owner and due date.
- **Dev-only dependencies**: Documented in the advisory with rationale. Patch on the next toolchain upgrade cycle unless an exploit is known to be weaponized.
- Always capture evidence in the audit JSON and link issues to the advisory when filing tickets.

