# Development Workflow

## Overview

This document defines the development standards and workflow for the Asset Management application.

The project follows a feature-based Git workflow with production-oriented development practices.

## Git Branching Strategy

The `main` branch represents the stable integration branch.

Significant features, enhancements, fixes, and infrastructure changes must be developed in separate branches.

### Branch Naming

Use the following conventions:

- `feature/<feature-name>` — New functionality
- `fix/<issue-name>` — Bug fixes
- `chore/<task-name>` — Project configuration or maintenance
- `refactor/<area-name>` — Code restructuring without behavior changes
- `docs/<topic-name>` — Documentation-only changes
- `test/<area-name>` — Test-related changes

### Examples

```text
feature/authentication
feature/file-upload
feature/email-service
fix/asset-allocation-validation
chore/project-foundation
refactor/user-module