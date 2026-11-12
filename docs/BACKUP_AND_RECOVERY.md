# Backup and Recovery

## Requirements
- Identify critical data: user accounts, property listings, case records, document metadata, audit events, and content.
- Back up database and private file storage with a documented schedule.
- Encrypt backups and restrict access to named operators.
- Keep backup credentials separate from application credentials.
- Define retention, deletion, and legal-hold rules.
- Monitor backup job success and alert on failure.
- Document recovery point objective (RPO) and recovery time objective (RTO).

## Restore testing
A backup is not proven until restored. Perform a restore drill in an isolated environment before launch and at a defined interval thereafter. Record date, operator, data scope, duration, validation results, and corrective actions.

## Incident response
Document who can declare an incident, isolate affected systems, rotate credentials, restore data, communicate with affected parties, and approve return to service.

## Current status
No backup provider, schedule, RPO/RTO, or restore drill has been configured or verified.
