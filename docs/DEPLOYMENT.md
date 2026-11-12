# Deployment Plan

## Status
No hosting provider, production domain, or deployment pipeline has been selected or configured.

## Environment separation
- Local development: synthetic data and isolated credentials.
- Preview/staging: non-production data and restricted access where needed.
- Production: approved domain, production secrets, monitoring, backup, and controlled staff access.

## Deployment requirements
- Reproducible builds and pinned dependencies.
- CI checks for lint, type checking, unit tests, and security-sensitive tests.
- Protected production branch and reviewed changes.
- Secrets managed outside source control.
- Database migrations reviewed and applied through a controlled process.
- Health checks, error monitoring, and rollback plan.
- Private storage permissions validated after deployment.
- DNS, TLS, email domain authentication, and privacy notices configured.
- No production launch until legal, security, operations, and support gates are signed off.

## Provider selection
Evaluate pricing, free-tier limits, Bangladesh/Asia latency, data location, backups, access controls, portability, and operational complexity. Do not select a provider solely because a free tier exists.
