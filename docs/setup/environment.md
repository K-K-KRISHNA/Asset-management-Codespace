# Environment Configuration

## 1. Overview

The Asset Management application uses environment variables for configuration and environment-specific values.

The application must be able to run across different environments without requiring changes to the source code.

The expected environments are:

- Development
- Testing
- Staging
- Production

Sensitive configuration such as database credentials, authentication secrets, API keys, email credentials, cloud storage credentials, and third-party service credentials must never be hardcoded in the source code.

---

## 2. Configuration Files

The project uses environment configuration files to separate application configuration from source code.

### 2.1 `.env`

The `.env` file contains the actual environment-specific values used during local development.

Example:

    NODE_ENV=development
    PORT=3000
    API_PREFIX=api
    API_VERSION=v1

The `.env` file must never be committed to Git.

It may contain sensitive information such as:

- Database credentials
- JWT secrets
- API keys
- Email credentials
- Storage credentials

---

### 2.2 `.env.example`

The `.env.example` file contains the names of environment variables required by the application without exposing actual secrets.

Example:

    NODE_ENV=development
    PORT=3000
    API_PREFIX=api
    API_VERSION=v1

    # Database
    MONGODB_URI=

    # Authentication
    JWT_ACCESS_SECRET=
    JWT_REFRESH_SECRET=

    # Email
    EMAIL_HOST=
    EMAIL_PORT=
    EMAIL_USER=
    EMAIL_PASSWORD=

    # File Storage
    STORAGE_PROVIDER=
    STORAGE_BUCKET=
    STORAGE_REGION=
    STORAGE_ACCESS_KEY=
    STORAGE_SECRET_KEY=

The `.env.example` file must be committed to Git.

It acts as a reference for developers and deployment environments.

---

## 3. Initial Environment Setup

After cloning the repository, install project dependencies:

    bun install

Create the local environment file from the example:

    cp .env.example .env

Update the values in `.env` according to the development environment.

For Windows environments, the `.env` file can also be created manually by copying `.env.example` and renaming it to `.env`.

---

## 4. Configuration Loading

The application uses NestJS `ConfigModule` from the `@nestjs/config` package.

The configuration module is registered globally so that application modules can access configuration through `ConfigService`.

Example:

    import { Injectable } from '@nestjs/common';
    import { ConfigService } from '@nestjs/config';

    @Injectable()
    export class ExampleService {
      constructor(private readonly configService: ConfigService) {}

      getPort(): number {
        return this.configService.get<number>('PORT', 3000);
      }
    }

Application modules should avoid directly accessing `process.env` unless there is a specific architectural reason to do so.

Centralizing configuration access provides:

- Consistent configuration access
- Easier testing
- Better maintainability
- Environment independence
- Centralized validation
- Easier configuration changes

---

# 5. Environment Variables

Environment variables will be introduced as the corresponding features are implemented.

Only configuration required by the current application functionality should be mandatory during startup.

Future feature-specific configuration should not be made mandatory before the corresponding feature is implemented.

---

## 5.1 Application Configuration

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | Yes | Current application environment | `development` |
| `PORT` | Yes | HTTP server port | `3000` |
| `API_PREFIX` | Yes | Base API prefix | `api` |
| `API_VERSION` | Yes | API version | `v1` |

Example:

    NODE_ENV=development
    PORT=3000
    API_PREFIX=api
    API_VERSION=v1

The resulting API base path will be:

    /api/v1

---

## 5.2 Database Configuration

Database configuration will be introduced when MongoDB integration is implemented.

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Feature dependent | MongoDB connection string |

Example:

    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>

The actual MongoDB credentials must never be committed to the repository.

Once MongoDB is introduced:

- `MONGODB_URI` will become required
- The value will be validated during application startup
- Connection failures will be handled appropriately
- Database configuration will be documented in the database setup documentation

---

## 5.3 Authentication Configuration

Authentication configuration will be introduced when authentication is implemented.

| Variable | Required | Description |
|---|---|---|
| `JWT_ACCESS_SECRET` | Feature dependent | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Feature dependent | Secret used to sign refresh tokens |

Example:

    JWT_ACCESS_SECRET=<strong-secret>
    JWT_REFRESH_SECRET=<strong-secret>

These values must be:

- Strong
- Randomly generated
- Different from each other
- Stored securely
- Never committed to Git
- Never logged

Additional authentication configuration such as token expiration values will be added when authentication is implemented.

---

## 5.4 Email Configuration

Email configuration will be introduced when the email service is implemented.

| Variable | Required | Description |
|---|---|---|
| `EMAIL_HOST` | Feature dependent | Email provider SMTP host |
| `EMAIL_PORT` | Feature dependent | Email provider SMTP port |
| `EMAIL_USER` | Feature dependent | Email account username |
| `EMAIL_PASSWORD` | Feature dependent | Email account password |

Example:

    EMAIL_HOST=
    EMAIL_PORT=
    EMAIL_USER=
    EMAIL_PASSWORD=

The exact configuration will depend on the email provider selected for the application.

Email configuration will be finalized when the email service is implemented.

---

## 5.5 File Storage Configuration

File storage configuration will be introduced when file upload functionality is implemented.

| Variable | Required | Description |
|---|---|---|
| `STORAGE_PROVIDER` | Feature dependent | File storage provider |
| `STORAGE_BUCKET` | Feature dependent | Storage bucket or container |
| `STORAGE_REGION` | Feature dependent | Storage region |
| `STORAGE_ACCESS_KEY` | Feature dependent | Storage access credential |
| `STORAGE_SECRET_KEY` | Feature dependent | Storage secret credential |

Example:

    STORAGE_PROVIDER=
    STORAGE_BUCKET=
    STORAGE_REGION=
    STORAGE_ACCESS_KEY=
    STORAGE_SECRET_KEY=

The actual storage provider will be selected based on application requirements.

---

# 6. Environment Validation

Environment variables must be validated when the application starts.

The application should fail during startup if a required configuration value is:

- Missing
- Empty
- Invalid
- In an unsupported format

The expected startup flow is:

    Application starts
           |
           v
    Load environment variables
           |
           v
    Validate configuration
           |
           +----------------------+
           |                      |
        Invalid                  Valid
           |                      |
           v                      v
    Application fails        Start application
    with clear error

This prevents configuration-related problems from appearing later during API requests.

---

## 6.1 Validation Principles

Environment validation should:

- Validate required variables
- Validate data types
- Validate allowed values
- Validate formats where required
- Provide clear startup errors
- Prevent the application from starting with invalid critical configuration

---

## 6.2 Feature-Based Validation

Configuration should become mandatory when the corresponding feature is introduced.

For example:

    Project Foundation
        |
        +-- NODE_ENV       Required
        +-- PORT           Required
        +-- API_PREFIX     Required
        +-- API_VERSION    Required
        |
        v
    Database Feature
        |
        +-- MONGODB_URI    Required
        |
        v
    Authentication Feature
        |
        +-- JWT_ACCESS_SECRET
        +-- JWT_REFRESH_SECRET
        |
        v
    Email Feature
        |
        +-- EMAIL_HOST
        +-- EMAIL_PORT
        +-- EMAIL_USER
        +-- EMAIL_PASSWORD
        |
        v
    File Upload Feature
        |
        +-- STORAGE_PROVIDER
        +-- Storage-specific configuration

This prevents future configuration from breaking the application before the related feature exists.

---

# 7. Environment Separation

The application should support separate configuration for different environments.

    Development
        |
        +-- Development database
        +-- Development email
        +-- Development storage
        +-- Development API configuration

    Testing
        |
        +-- Test database
        +-- Test services
        +-- Test API configuration

    Staging
        |
        +-- Staging database
        +-- Staging email
        +-- Staging storage
        +-- Staging API configuration

    Production
        |
        +-- Production database
        +-- Production email
        +-- Production storage
        +-- Production API configuration

The application source code should remain the same across environments.

Only configuration values should change.

---

# 8. Security Rules

The following information must never be committed to Git:

- Database passwords
- Database connection strings containing credentials
- JWT secrets
- API keys
- Email passwords
- Cloud storage credentials
- Access tokens
- Refresh tokens
- Private keys
- Encryption keys
- Third-party service credentials

Never use real credentials in:

- Source code
- Documentation
- Test files
- Logs
- Screenshots
- Public repositories
- Committed Postman collections
- Committed Postman environments

Use placeholders in documentation and examples.

---

# 9. Git Configuration

The `.env` file must be ignored by Git.

Expected behavior:

    .env
      |
      +-- Not tracked
      +-- Not committed

    .env.example
      |
      +-- Tracked
      +-- Committed

Before committing changes, always verify:

    git status

The actual `.env` file should not appear as an untracked file.

If `.env` appears in `git status`, stop and fix `.gitignore` before committing.

---

# 10. Adding a New Environment Variable

Whenever a new environment variable is introduced, follow these steps.

## Step 1 — Add it to `.env.example`

Example:

    NEW_SERVICE_API_KEY=

## Step 2 — Add it to the local `.env`

Only with the actual local value:

    NEW_SERVICE_API_KEY=<actual-value>

## Step 3 — Add it to environment validation

The variable must be validated according to its requirements.

## Step 4 — Update this document

Add the variable to the appropriate configuration section.

## Step 5 — Update feature documentation

If the variable belongs to a specific feature, document it in that feature's documentation as well.

## Step 6 — Never commit the real value

Only `.env.example` should contain the variable name and placeholder.

---

# 11. Local Development

The standard local development process is:

## Install Dependencies

    bun install

## Create Environment File

    cp .env.example .env

## Configure Environment

Update `.env` with the required values.

## Start Development Server

    bun run start:dev

## Build Application

    bun run build

## Run Production Build

    bun run start:prod

---

# 12. GitHub Codespaces

The project is currently developed using GitHub Codespaces.

The Codespace provides the backend development environment remotely.

The application can be started using:

    bun run start:dev

The NestJS server runs inside the Codespace.

The application port can be forwarded through Codespaces so that external tools such as Postman can access the API.

The expected communication flow is:

    Postman
       |
       | HTTP/HTTPS
       v
    Codespace forwarded port
       |
       v
    NestJS application
       |
       v
    Application services

The Codespace URL must not be hardcoded into application source code.

It must not be committed to the repository.

---

# 13. Postman Environment

Postman should use environment variables instead of hardcoded environment-specific URLs.

Example:

    {{baseUrl}}/api/v1

Common Postman variables may include:

    baseUrl
    accessToken
    refreshToken

Example request:

    GET {{baseUrl}}/api/v1/users

Environment-specific values should be maintained inside Postman environments.

Sensitive Postman variables must not be committed to publicly accessible repositories.

---

# 14. Production Configuration

Production configuration must be provided through the deployment platform's environment-variable or secret-management system.

A production `.env` file must not be committed to the repository.

Production configuration may include:

    NODE_ENV
    PORT
    API_PREFIX
    API_VERSION
    MONGODB_URI
    JWT_ACCESS_SECRET
    JWT_REFRESH_SECRET
    EMAIL_HOST
    EMAIL_PORT
    EMAIL_USER
    EMAIL_PASSWORD
    STORAGE_PROVIDER
    STORAGE_BUCKET
    STORAGE_REGION
    STORAGE_ACCESS_KEY
    STORAGE_SECRET_KEY

The exact production configuration will be finalized as each feature is implemented.

---

# 15. Configuration Changes

Whenever configuration changes are made, verify the following:

    [ ] Variable added to .env.example
    [ ] Variable added to environment validation
    [ ] Variable documented in environment.md
    [ ] Actual secret stored only in .env or secret manager
    [ ] .env is ignored by Git
    [ ] No secrets appear in source code
    [ ] No secrets appear in logs
    [ ] No secrets appear in committed Postman files
    [ ] Application starts successfully
    [ ] Production build succeeds

---

# 16. Current Configuration

At the project foundation stage, the currently required application configuration is:

    NODE_ENV=development
    PORT=3000
    API_PREFIX=api
    API_VERSION=v1

Future configuration will be added as the corresponding features are implemented.

---

# 17. Current Implementation Status

### Completed

- Environment configuration package installed
- Global NestJS `ConfigModule` configured
- `.env` created for local development
- `.env.example` created as a configuration template
- `.env` excluded from Git
- Application configuration documented

### Pending

- Environment schema validation
- Database configuration
- MongoDB connection
- Authentication configuration
- JWT configuration
- Email configuration
- File storage configuration
- Production secret management

---

# 18. Related Documentation

- [Application Architecture](../project/architecture.md)
- [Development Workflow](../project/development-workflow.md)
- [Project README](../../README.md)