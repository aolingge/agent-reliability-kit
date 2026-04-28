# Security Policy

Agent Reliability Kit is local-first and should not collect source code, secrets, cookies, browser profiles, private URLs, or raw private logs.

## Reporting

Please report vulnerabilities privately to the maintainer. Include:

- affected version or commit,
- impact,
- minimal reproduction,
- safe proof of concept with no real secrets.

Do not open public issues for suspected credential leaks or exploitable vulnerabilities.

## Secret Handling

Fixtures may include synthetic token-looking values only when they are obviously fake and used to test redaction. Real credentials must never be committed.

