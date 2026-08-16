# Security Policy

## Supported versions

Security fixes are applied to the current `7.x` release line and the latest
container image built from `main`. Older releases are unsupported.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Report it through a
[private GitHub Security Advisory](https://github.com/dvgamerr-app/notice-manager/security/advisories/new)
and include:

- affected version, image tag, and digest when available;
- reproduction steps and the expected security impact;
- logs or screenshots with credentials and personal data removed.

Never include LINE tokens, LIFF tokens, database URLs, API keys, session tokens,
or credential-encryption keys in a report.

## Automated security gates

The container workflow blocks publication and deployment when Trivy finds a
fixable `HIGH` or `CRITICAL` repository, secret, configuration, operating-system,
or application-library finding. Container findings are also uploaded to GitHub
code scanning as SARIF. CI runs Trivy from a container image pinned by digest;
all workflow actions are pinned to immutable commit SHAs. CodeQL and Dependabot
remain enabled independently.

Published images include an SBOM and build provenance. Deployment uses the
published multi-platform manifest digest rather than a mutable tag.
