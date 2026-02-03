# Security Rules

This document defines strict security rules for the `system-notes` repository. These rules must be followed to prevent vulnerabilities, specifically path traversal and unauthorized file access.

## 1. Path Traversal Prevention

### Rule 1.1: No Direct User Input in Path Construction

**Violation:** Using unvalidated user input directly in `os.path.join`, `pathlib.Path.joinpath`, or the `/` operator.
**Requirement:** All user-provided strings used for file paths must be strictly validated _before_ being used in any path construction function.

### Rule 1.2: Ban ".."

**Violation:** Allowing the string `..` in any path variable derived from user input.
**Requirement:** Explicitly reject any input containing `..` before doing any filesystem operations or path resolution.

### Rule 1.3: Strict Allowlist for Filenames (when possible)

**Guidance:** If the set of files is known, map user input to specific allowed filenames/IDs rather than accepting raw paths.
**Requirement:** If raw paths are necessary, enforce a strict character set (e.g., `^[a-zA-Z0-9_./-]+$`).

### Rule 1.4: Resolve and Verify Root

**Requirement:**

1. Resolve the final path to an absolute path.
2. Verify that the resolved path is within the intended directory (sandbox).
3. Use `pathlib.Path.is_relative_to()` (Python) or equivalent secure methods.

## 2. File Extension Restrictions

### Rule 2.1: Safe Extensions Only

**Violation:** Serving potential script files or secrets (e.g., `.py`, `.env`, `.sh`, `.yml`).
**Requirement:** When serving static content or docs, strictly whitelist allowed extensions (e.g., `.md`, `.json`, `.txt`).

## 3. Review Process

- Any change touching file access logic must be reviewed against these rules.
- Automated security scanners (CodeQL, etc.) must pass.
