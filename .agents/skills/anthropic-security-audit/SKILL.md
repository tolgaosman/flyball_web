---
name: anthropic-security-audit
description: >-
  Use this skill to conduct a comprehensive security audit of the application, focusing on LLM vulnerabilities, OWASP Top 10, and data privacy.
---

# Anthropic Security Audit

When performing a security audit, follow these strict guidelines to identify and mitigate vulnerabilities.

## Audit Checklist

1.  **LLM Specific Risks**:
    *   **Prompt Injection**: Ensure all user inputs are sanitized and isolated from system prompts. Use parameterized prompts if possible.
    *   **Data Leakage**: Verify that PII or sensitive data is not inadvertently fed into the LLM or exposed in its outputs.
    *   **Denial of Wallet**: Check for rate limiting and token usage caps to prevent abuse of expensive LLM APIs.
2.  **OWASP Top 10**:
    *   **Broken Access Control**: Ensure endpoints verify user authorization.
    *   **Injection (SQL, XSS, Command)**: Validate and encode all inputs and outputs.
    *   **Insecure Design**: Review architectural decisions for inherent flaws.
3.  **Dependencies**: Check for outdated or vulnerable third-party packages.
4.  **Reporting**: Document all findings clearly with severity levels (Critical, High, Medium, Low) and provide actionable remediation steps.
