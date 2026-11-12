# Security Policy

## Scope
This repository documents a platform that may eventually process identity, ownership, financial, and legal case documents. Treat security and privacy as launch-blocking requirements.

## Reporting a vulnerability
Do not publish exploit details or client data in public issues. Contact the repository owner through a private, verified channel and provide:
- A concise description and affected component.
- Reproduction steps that do not expose real personal data.
- Potential impact and suggested mitigation, if known.

A dedicated security contact and response SLA must be published before production launch.

## Immediate rules
- Never commit secrets, API keys, passwords, private keys, or production data.
- Do not upload real client documents to issues, pull requests, test fixtures, or public storage.
- Use least privilege, MFA for privileged accounts, and separate environments.
- Revoke exposed credentials immediately and investigate potential access.
- Log and review privileged access and sensitive document operations.

## Production readiness
A documented vulnerability-response process, incident owner, escalation path, and recovery procedure are required before launch. This file is not a guarantee of a formal security certification or 24/7 response service.
