---
name: security-guidance
description: >-
  Use this skill for deep dives into secure coding practices, cryptography basics, authentication flows, and data sanitization.
---

# Security Guidance Skill

This skill provides foundational and advanced security knowledge for building robust systems.

## Key Security Pillars

1.  **Authentication & Authorization**: Implement robust JWT or session-based auth. Ensure Role-Based Access Control (RBAC) is enforced at the API layer, not just the UI.
2.  **Data Sanitization**: Never trust client data. Validate strictly on the server-side. Sanitize inputs before database storage and output encoding before rendering (prevent XSS).
3.  **Cryptography**: Use industry-standard algorithms (e.g., Argon2 for hashing, AES-GCM for encryption). Never roll your own crypto. Manage keys securely (KMS, environment variables).
4.  **Secure Headers**: Implement restrictive Content Security Policy (CSP), HSTS, X-Frame-Options, and other security headers to harden the browser context.
