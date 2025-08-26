# Security Policy

## Overview

The Dice Roller TypeScript library is a side project with no commercial support, but we take security seriously. This library is designed to be a simple, elegant dice rolling solution that operates entirely locally without collecting, storing, or transmitting any user data.

## Data Privacy

- **No Data Collection**: This library does not collect any personal information or usage data
- **No External Communication**: The library operates entirely offline and makes no network requests
- **No Data Storage**: No user data is stored locally or remotely
- **No Tracking**: No analytics, telemetry, or tracking mechanisms are implemented

## Supported Versions

As a side project, we provide security updates on a best-effort basis for the latest version only.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Security Considerations

### Random Number Generation

- The library uses JavaScript's built-in `Math.random()` by default
- For cryptographically secure randomness, users can provide their own random function
- The default random implementation is suitable for gaming but not cryptographic purposes

### Input Validation

- All dice expressions are validated before parsing
- Invalid inputs throw descriptive errors rather than causing undefined behavior
- No code execution or eval() usage in expression parsing

### Dependencies

- Minimal dependency footprint to reduce attack surface
- All dependencies are regularly reviewed for known vulnerabilities
- Development dependencies are not included in production builds

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue for security vulnerabilities
2. Email security concerns to the repository maintainer
3. Include detailed steps to reproduce the issue
4. Allow reasonable time for assessment and fixes before public disclosure

### What to Report

Please report any issues that could potentially:

- Allow arbitrary code execution
- Cause denial of service
- Lead to information disclosure
- Bypass input validation

### What Not to Report

The following are not considered security vulnerabilities:

- Predictable random number sequences (this is expected behavior with `Math.random()`)
- Performance issues with very large dice expressions
- Feature requests or enhancement suggestions

## Response Process

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: We will assess the severity and impact of the reported issue
3. **Fix Development**: If confirmed, we will develop and test a fix
4. **Release**: Security fixes will be released as soon as possible
5. **Disclosure**: We will coordinate responsible disclosure timing with the reporter

## Security Best Practices for Users

### For Application Developers

- Always validate user input before passing to dice expressions
- Consider rate limiting if accepting dice expressions from untrusted sources
- Use cryptographically secure random functions for security-sensitive applications
- Keep the library updated to the latest version

### For End Users

- This library is safe for gaming and simulation purposes
- Not recommended for cryptographic or security-critical random number generation
- No personal data is processed by this library

## Scope

This security policy applies to:

- The core dice rolling library code
- Published npm packages
- Documentation and examples

This policy does not cover:

- Third-party applications using this library
- Custom modifications or forks
- Development tools and build scripts

## Contact

For security-related questions or concerns that don't constitute vulnerabilities, please open a regular GitHub issue with the "security" label.

## Updates

This security policy may be updated from time to time. Changes will be announced in release notes and commit messages.

---

**Last Updated**: August 26, 2025
