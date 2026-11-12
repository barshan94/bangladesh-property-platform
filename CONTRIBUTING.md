# Contributing

## Before making changes
- Read README.md, PROJECT.md, ROADMAP.md, ARCHITECTURE.md, and relevant docs.
- Confirm the change fits the approved scope and does not bypass a legal, privacy, or security decision.
- For material decisions, update MEMORY.md and the relevant design document.

## Development expectations
- Use focused branches and pull requests.
- Keep changes small enough to review, but complete each feature end-to-end.
- Include tests for behavior and authorization boundaries.
- Never commit credentials, tokens, private client data, production exports, or confidential documents.
- Do not use real client information in fixtures, screenshots, logs, or test environments.
- Add migration and rollback considerations for schema changes.
- Document operational changes and update CHANGELOG.md.

## Pull request checklist
- [ ] Scope and acceptance criteria are clear.
- [ ] Authorization and validation are enforced server-side.
- [ ] Tests cover normal, invalid, and unauthorized cases.
- [ ] Accessibility and responsive behavior are considered.
- [ ] No secrets or private data are included.
- [ ] Documentation and roadmap are updated.
- [ ] Legal/compliance review is attached where required.
