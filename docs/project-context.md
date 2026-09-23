# Project Context & Development Handoff

> This document is the source of truth for continuing this NestJS project in a new development environment or with a new ChatGPT/Codex session.
>
> Last updated: 2026-09-22

---

# 1. Project Overview

This is a production-oriented NestJS backend project.

The project is being developed with the following principles:

- Production-grade implementation rather than quick prototypes.
- Every significant feature should be developed on its own Git branch.
- Each meaningful completed step should have its own Git commit.
- APIs should be testable through Postman.
- Configuration should be environment-driven.
- Logging and observability should be production-conscious.
- Sensitive information must never be exposed in logs.
- Swagger should document APIs.
- The architecture should remain scalable as the application grows.

---

# 2. Development Environment

Current development environment:

- GitHub Codespaces
- Linux
- Bun
- NestJS
- Docker
- Docker Compose

The project is planned to move from Codespaces to a local development machine.

The repository itself should become the primary source of truth for project context.

---

# 3. Package Manager

Bun is being used.

Examples:

```bash
bun install
bun add <package>
bun run start:dev
```

`bun.lock` is tracked in Git.

---

# 4. Git Development Convention

Every significant feature should have its own branch.

Example:

```bash
git checkout main
git pull
git checkout -b feat/<feature-name>
```

Development should proceed incrementally.

Preferred workflow:

```text
Create branch
    ↓
Implement one meaningful change
    ↓
Test
    ↓
Commit
    ↓
Continue
```

Commit messages should be clear and conventional.

Examples:

```text
feat: add http request logging
feat: add rotating file logging
feat: add pii masking for logs
chore: add local elasticsearch compose setup
feat: add elasticsearch logging transport
chore: add kibana to local observability stack
feat: add client details to http logs
feat: add client details to exception logs
```

Do not squash unrelated work into one commit unless explicitly required.

---

# 5. Current Application Architecture

Current high-level request flow:

```text
Incoming HTTP Request
        │
        ▼
Trace Middleware
        │
        ├── Read X-Trace-Id / X-Request-Id
        ├── Generate UUID if missing
        ├── Set response headers
        └── AsyncLocalStorage
        │
        ▼
NestJS Routing
        │
        ▼
ValidationPipe
        │
        ▼
Controller
        │
        ▼
Service
        │
        ▼
ResponseInterceptor
        │
        ├── Standard success response
        └── HTTP request logging
        │
        ▼
Response
```

Error flow:

```text
Request
   ↓
Exception
   ↓
HttpExceptionFilter
   ├── Standard error response
   └── Error logging
```

Logging flow:

```text
Application
    │
    ▼
AppLoggerService
    │
    ├── Console
    ├── Rotating File
    └── Elasticsearch
             │
             ▼
           Kibana
```

---

# 6. Global API Configuration

The application uses a configurable global API prefix.

Current environment configuration:

```env
API_PREFIX=api
```

Therefore:

```text
/api/...
```

is the base API path.

URI versioning is enabled.

Current version:

```text
v1
```

Example:

```text
/api/v1/health
```

---

# 7. Validation

A global NestJS `ValidationPipe` is configured:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

Behavior:

- `whitelist: true`
  - removes properties not defined in DTOs.

- `forbidNonWhitelisted: true`
  - rejects requests containing unexpected properties.

- `transform: true`
  - enables DTO transformation and useful type conversion behavior.

All future DTO-based APIs should follow this validation standard.

---

# 8. Standard Response Format

Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

This is implemented through the global `ResponseInterceptor`.

Example:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

# 9. Error Response Format

Errors are handled by the global `HttpExceptionFilter`.

Current structure:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Cannot GET /api/v1/does-not-exist",
  "path": "/api/v1/does-not-exist",
  "timestamp": "2026-09-22T12:26:47.805Z"
}
```

The filter handles both:

- NestJS `HttpException`
- unexpected exceptions

Unexpected exceptions return:

```text
500 Internal Server Error
```

---

# 10. Swagger

Swagger is enabled.

Current path:

```text
/api/docs
```

Swagger should be updated whenever new APIs are introduced.

All new APIs should be testable through Swagger and Postman.

---

# 11. Health Module

A health module currently exists.

Endpoint:

```text
GET /api/v1/health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

Current service logs:

```text
Health check requested
```

The health endpoint is used for:

- basic application health testing
- logging testing
- Elasticsearch/Kibana testing
- trace ID testing

---

# 12. Logging Architecture

Logging uses Winston.

Installed packages include:

```text
winston
nest-winston
winston-daily-rotate-file
winston-elasticsearch
```

`nest-winston` is installed but currently not used directly.

The main application logger is:

```text
src/common/logging/app-logger.service.ts
```

The custom logger implements Nest's:

```ts
LoggerService
```

interface.

---

# 13. AppLoggerService

The logger supports:

```text
log
error
warn
debug
verbose
```

Log entries contain structured metadata.

Typical fields include:

```text
message
traceId
context
service
environment
timestamp
```

HTTP logs can additionally contain:

```text
method
url
statusCode
durationMs
ip
userAgent
```

Error logs can additionally contain:

```text
statusCode
method
url
ip
userAgent
error
stack
```

---

# 14. Structured JSON Logging

Winston uses:

```ts
winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
)
```

Logs are therefore structured JSON rather than plain text.

Example:

```json
{
  "context": "ResponseInterceptor",
  "durationMs": 9,
  "environment": "dev",
  "ip": "::1",
  "level": "info",
  "message": "HTTP request completed",
  "method": "GET",
  "service": "my-api",
  "statusCode": 200,
  "timestamp": "2026-09-22T12:53:31.255Z",
  "traceId": "979d88b278f5b4a1f1d7770102cec68e",
  "url": "/api/v1/health",
  "userAgent": "Mozilla/5.0 ..."
}
```

---

# 15. Trace ID Architecture

Trace IDs use Node.js `AsyncLocalStorage`.

File:

```text
src/common/logging/trace-context.ts
```

Current structure:

```ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  traceId: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function currentTraceId(): string | undefined {
  return requestContext.getStore()?.traceId;
}
```

---

# 16. Trace Middleware

File:

```text
src/common/logging/trace.middleware.ts
```

Current behavior:

1. Check incoming `X-Trace-Id`.
2. Check incoming `X-Request-Id`.
3. Reuse the incoming value if present.
4. Generate a UUID if no ID is supplied.
5. Set both response headers.
6. Store the trace ID in AsyncLocalStorage.

Current implementation:

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { requestContext } from './trace-context';

type TracedRequest = Request & {
  traceId?: string;
  requestId?: string;
};

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(
    req: TracedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    const incoming =
      req.header('X-Trace-Id') ||
      req.header('X-Request-Id');

    const traceId = incoming?.trim() || randomUUID();

    req.traceId = traceId;
    req.requestId = traceId;

    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Request-Id', traceId);

    requestContext.run({ traceId }, next);
  }
}
```

HTTP header names are case-insensitive.

For consistency, the code uses:

```text
X-Trace-Id
X-Request-Id
```

---

# 17. Trace ID Design Decision

The current architecture intentionally uses the same canonical value for:

```text
X-Trace-Id
X-Request-Id
```

This is a deliberate simplification.

Conceptually:

- Trace ID = correlation across a transaction/request flow.
- Request ID = identifier for an individual HTTP request/hop.

The current architecture accepts either incoming header and uses the resulting value for both.

A more sophisticated distributed tracing architecture can distinguish them later if required.

---

# 18. Outgoing HTTP Trace Propagation

No outgoing HTTP client is currently used in the project.

A search was performed for:

```bash
grep -R "HttpService\|axios\|fetch(" src --exclude-dir=node_modules
```

No outgoing HTTP client was found.

Therefore:

**Do not implement Axios/Fetch trace interceptors yet.**

When an actual outgoing HTTP client is introduced, trace propagation should be added at that point.

Expected future flow:

```text
API A
  │
  ├── X-Trace-Id
  ▼
API B
  │
  ├── same X-Trace-Id
  ▼
External Service
```

---

# 19. PII Masking

File:

```text
src/common/logging/pii-masker.ts
```

The logger masks sensitive fields before logs are sent to transports.

Current sensitive fields include:

```text
password
confirmPassword
token
accessToken
refreshToken
authorization
apiKey
secret
email
phone
mobile
```

Masked value:

```text
[REDACTED]
```

Masking is recursive and works through nested objects and arrays.

Current behavior:

```text
PII data
   ↓
AppLoggerService
   ↓
PII masker
   ↓
Winston transports
```

This is intentional.

Sensitive data should be prevented from reaching:

- Console
- Files
- Elasticsearch
- Kibana

---

# 20. Important PII Testing Note

A temporary PII test was previously performed.

The test demonstrated successful masking:

```json
{
  "email": "[REDACTED]",
  "password": "[REDACTED]",
  "phone": "[REDACTED]",
  "token": "[REDACTED]"
}
```

The temporary test code was removed afterward.

Older rotating log files still contain the original temporary test data because they were generated before the test code was removed.

Those historical log files should not be committed to Git.

The masking implementation itself is currently working.

---

# 21. Rotating File Logging

The application supports rotating file logs through:

```text
winston-daily-rotate-file
```

Current environment settings:

```env
LOG_FILE_PATH=./logs/my-api-%DATE%.log
LOG_FILE_ROTATE_FREQUENCY=YYYY-MM-DD
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_TIME=14d
```

Meaning:

- daily log rotation
- maximum file size around 20 MB
- retention around 14 days

The generated logs are JSON.

Example:

```json
{
  "context": "HealthService",
  "environment": "dev",
  "level": "info",
  "message": "Health check requested",
  "service": "my-api",
  "timestamp": "...",
  "traceId": "..."
}
```

---

# 22. Elasticsearch

Local Elasticsearch is being used for development and observability testing.

Version:

```text
8.19.21
```

Local endpoint:

```text
http://localhost:9200
```

Security is disabled for local development.

Current local Elasticsearch response confirms:

```text
version 8.19.21
cluster_name docker-cluster
```

---

# 23. Docker Compose

Current `docker-compose.yml`:

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.19.21
    container_name: elasticsearch
    restart: unless-stopped

    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false

    ports:
      - "127.0.0.1:9200:9200"

    mem_limit: 1g

    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.19.21
    container_name: kibana
    restart: unless-stopped

    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

    ports:
      - "127.0.0.1:5601:5601"

    mem_limit: 1g

    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

---

# 24. Elasticsearch Local Resource Configuration

The Codespace required Elasticsearch resource tuning.

`vm.max_map_count` was increased to:

```text
1048576
```

Elasticsearch is configured with:

```text
1 GB memory limit
```

The final working setup uses both the increased `vm.max_map_count` and the Docker memory limit.

Do not assume that a previous Elasticsearch exit code was caused by one specific issue; the exact cause was not conclusively established.

---

# 25. Kibana

Kibana is available locally at:

```text
http://localhost:5601
```

Local security is intentionally disabled.

Kibana showed warnings about security/configuration, which are expected for this local development setup.

Do not enable production security merely to remove the local development warning.

---

# 26. Kibana Data View

A Kibana Data View was created:

```text
Application Logs
```

Index pattern:

```text
app-logs-*
```

Timestamp field:

```text
@timestamp
```

Kibana Discover successfully displays application logs.

Trace IDs can be used to correlate events.

---

# 27. Elasticsearch Index

Current log index format:

```text
app-logs-YYYY.MM.DD
```

Example:

```text
app-logs-2026.09.22
```

Logs contain fields such as:

```text
message
severity
fields.traceId
fields.context
fields.service
fields.environment
```

---

# 28. Direct Elasticsearch Transport

Winston currently supports:

```env
LOG_TRANSPORTS=console,file,elk
```

The `elk` transport uses:

```text
winston-elasticsearch
```

and sends logs directly to Elasticsearch.

The configured Elasticsearch node is:

```env
ELASTICSEARCH_NODE_URL=http://localhost:9200
```

---

# 29. Logging Transport Configuration

Current environment example:

```env
NODE_ENV=development
ENVIRONMENT=dev
SERVICE_NAME=my-api

LOG_TRANSPORTS=console,file,elk
LOG_LEVEL=debug

LOG_FILE_PATH=./logs/my-api-%DATE%.log
LOG_FILE_ROTATE_FREQUENCY=YYYY-MM-DD
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_TIME=14d

ELASTICSEARCH_NODE_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_INDEX_PREFIX=app-logs

PII_MASKING_ENABLED=true
```

The application supports changing transports without code changes.

Examples:

```env
LOG_TRANSPORTS=console
```

```env
LOG_TRANSPORTS=console,file
```

```env
LOG_TRANSPORTS=console,file,elk
```

---

# 30. Environment Validation

Environment variables are validated through Joi.

Important validated values include:

```text
NODE_ENV
ENVIRONMENT
SERVICE_NAME
LOG_TRANSPORTS
LOG_LEVEL
LOG_FILE_PATH
LOG_FILE_ROTATE_FREQUENCY
LOG_FILE_MAX_SIZE
LOG_FILE_MAX_TIME
ELASTICSEARCH_NODE_URL
ELASTICSEARCH_USERNAME
ELASTICSEARCH_PASSWORD
ELASTICSEARCH_INDEX_PREFIX
PII_MASKING_ENABLED
```

Defaults exist for appropriate optional values.

Elasticsearch username/password may be empty for local development.

Credentials must never be committed to source control.

---

# 31. Logger Module

Current logger module:

```ts
import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';

@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
```

It is global so the custom logger can be injected throughout the application.

---

# 32. Response Interceptor

Current interceptor responsibilities:

1. Measure request duration.
2. Log successful HTTP requests.
3. Return standardized success response.

Current HTTP success log fields:

```text
message
context
method
url
statusCode
durationMs
ip
userAgent
traceId
service
environment
timestamp
```

Current success message:

```text
HTTP request completed
```

---

# 33. HTTP Exception Filter

Current filter responsibilities:

1. Convert exceptions to standardized error responses.
2. Determine HTTP status.
3. Extract exception message.
4. Log exception information.

Current error log fields:

```text
statusCode
method
url
ip
userAgent
error
traceId
stack
context
service
environment
timestamp
```

Current error message:

```text
HTTP exception
```

---

# 34. Error Logging Behavior

A successful request generates:

```text
HealthService
+
ResponseInterceptor
```

For example:

```text
Health check requested
HTTP request completed
```

An exception does not generate the successful `ResponseInterceptor` completion log.

Instead:

```text
HttpExceptionFilter
```

handles and logs the exception.

This behavior is intentional.

---

# 35. Elasticsearch Failure Test

Elasticsearch was intentionally stopped:

```bash
docker compose stop elasticsearch
```

The application still successfully returned:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

Therefore:

**The application's HTTP availability does not depend directly on Elasticsearch being available.**

Elasticsearch was subsequently restarted successfully:

```bash
docker compose start elasticsearch
```

---

# 36. Elasticsearch Recovery Test

Three health requests were made while Elasticsearch was unavailable.

After Elasticsearch was restarted, the corresponding three health logs appeared in Elasticsearch.

Observed trace IDs included:

```text
108e3370-f25b-4633-bdc8-c8632d4cfcf8
eb458d3a-3fd3-4eb7-aa90-4b0282e6788e
d9c632fd-c601-4f91-ab88-fc2a6a879813
```

This demonstrates that in the tested short outage scenario, the current `winston-elasticsearch` transport successfully retained/retried log events and delivered them after Elasticsearch became available.

Do not interpret this as unlimited durability.

Potential risks remain around:

- long Elasticsearch outages
- very large log accumulation
- application process restart during an outage
- application crash
- transport buffering limits

---

# 37. Production Logging Architecture Decision

The current direct:

```text
Winston → Elasticsearch
```

setup is useful for local development and learning.

For production, the preferred reliability architecture is:

```text
Application
    ↓
Console / File
    ↓
Filebeat / Collector
    ↓
Logstash
    ↓
Elasticsearch
    ↓
Kibana
```

Reason:

The application should not be tightly coupled to Elasticsearch availability.

A collector-based architecture provides a better buffering/retry boundary.

Do not implement this production collector architecture prematurely unless the project actually requires it.

---

# 38. Framework Logger Decision

We tested:

```ts
app.useLogger(app.get(AppLoggerService));
```

This caused Nest framework startup logs to use the Winston logger.

Examples:

```text
RoutesResolver
RouterExplorer
NestApplication
```

The decision was made to **revert this**.

Reason:

We do not need every NestJS startup/framework message stored in the structured application logging pipeline.

Application logging should focus on useful operational/application events.

Nest's normal startup logging can remain separate.

Therefore:

**Do not add `app.useLogger(app.get(AppLoggerService))` back unless there is a future explicit requirement.**

---

# 39. Logging Scope Decision

We do not currently want to log:

- request body
- complete request headers
- cookies
- authorization tokens
- arbitrary query data

Reason:

These may contain sensitive information.

PII masking exists as a defense layer, but sensitive information should ideally not enter the logging pipeline unnecessarily.

---

# 40. Client Details Added to HTTP Logs

Successful HTTP logs now include:

```ts
ip: request.ip,
userAgent: request.get('user-agent'),
```

Error HTTP logs include the same.

Example local IP:

```text
::1
```

This is the IPv6 loopback address and is equivalent to:

```text
127.0.0.1
```

for local testing.

---

# 41. Features Intentionally Deferred

## Slow Request Detection

A possible future feature:

```env
SLOW_REQUEST_THRESHOLD_MS=1000
```

and logging:

```text
Slow HTTP request
```

as a warning.

This feature is currently **on hold**.

Do not implement it unless explicitly requested.

---

## Outgoing HTTP Trace Propagation

No outgoing HTTP client currently exists.

Do not implement Axios/Fetch interceptors until an actual outgoing HTTP integration is introduced.

---

## Log Collector / Filebeat / Logstash

The production collector architecture is understood but not currently implemented.

Do not add it unnecessarily for local development.

---

# 42. Current Project Testing

Important tests already performed:

## Health endpoint

```bash
curl http://localhost:3000/api/v1/health
```

Expected:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## 404 error

```bash
curl -i http://localhost:3000/api/v1/does-not-exist
```

Expected standardized error response.

## Elasticsearch

```bash
curl http://localhost:9200
```

Elasticsearch responds successfully.

## Kibana

```text
http://localhost:5601
```

Kibana successfully displays logs.

## Elasticsearch query

Example:

```bash
curl "http://localhost:9200/app-logs-*/_search?q=message:%22Health%20check%20requested%22&sort=@timestamp:desc&size=20&pretty"
```

---

# 43. Current Repository Structure

Relevant current structure:

```text
src/
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   │
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   │
│   └── logging/
│       ├── app-logger.service.ts
│       ├── logger.module.ts
│       ├── pii-masker.ts
│       ├── trace-context.ts
│       └── trace.middleware.ts
│
├── health/
│   ├── health.controller.ts
│   ├── health.module.ts
│   └── health.service.ts
│
├── app.module.ts
└── main.ts
```

The exact module directory naming can evolve as the project grows.

---

# 44. Architecture Documentation

An `architecture.md` file already exists.

It documents:

- project structure
- API prefix
- API versioning
- validation
- response standards
- error standards
- health endpoint
- configuration
- exception filter
- response interceptor
- Swagger
- development rules

Keep architecture documentation updated when architectural decisions change.

---

# 45. Current Development Principles

When implementing future features:

### 1. Production-grade first

Do not create temporary/prototype architecture if the feature is clearly going to be part of the real application.

### 2. Small increments

Implement one meaningful capability at a time.

### 3. Test before commit

Every meaningful change should be tested.

### 4. Commit after verification

Do not accumulate many unrelated changes.

### 5. Avoid speculative abstractions

Do not build infrastructure for technologies that the application does not currently use.

Example:

Do not implement outgoing HTTP tracing before an outgoing HTTP client exists.

### 6. Avoid unnecessary endpoints

Do not create temporary endpoints solely for testing if existing endpoints can be used.

### 7. Every API must be testable

Postman should be able to test every API endpoint.

### 8. Swagger must remain updated

New endpoints should be documented.

---

# 46. Current Git Branch Context

Logging work has been developed on:

```text
feat/logging-observability
```

The branch was based on the latest `main`.

The logging branch contains multiple completed commits, including:

```text
feat: add http request logging
feat: add rotating file logging
feat: add pii masking for logs
chore: add local elasticsearch compose setup
feat: add elasticsearch logging transport
chore: add kibana to local observability stack
feat: add client details to http logs
feat: add client details to exception logs
```

Exact commit hashes are intentionally not documented here; Git history is the source of truth.

---

# 47. Current Planned Next Major Feature

The next major feature planned after logging is:

# Authentication Foundation

Expected architecture:

```text
Request
   ↓
Trace Middleware
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Controller
   ↓
Service
```

Expected future auth structure:

```text
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
├── guards/
├── strategies/
└── interfaces/
```

Expected initial capabilities:

1. User model/entity
2. User module
3. Password hashing
4. Login
5. Access token
6. JWT authentication guard
7. Current-user decorator
8. Refresh token mechanism
9. Token rotation/revocation
10. Role-based authorization
11. Authentication logging
12. Swagger security configuration
13. Postman testing

---

# 48. Authentication Security Principles

When implementing authentication:

Never log:

```text
password
access token
refresh token
authorization header
OTP
secret keys
```

Password storage must use a secure password hashing algorithm.

Plaintext passwords must never be stored.

JWT implementation should be designed around:

```text
short-lived access token
+
refresh token
```

rather than unnecessarily long-lived access tokens.

---

# 49. Database Decision Still Required

Before implementing the User/Auth model, decide which database the application will use.

The current project context does not establish a final database choice.

Possible architecture should not be assumed until explicitly decided.

Once database is selected, define:

- database connection
- module/repository pattern
- user model/entity
- migrations/schema strategy
- indexes
- unique constraints
- transaction strategy

---

# 50. Postman Convention

Every API endpoint should be accessible and testable from Postman.

As authentication is introduced, Postman should eventually contain:

```text
Health
Auth
Users
Protected APIs
```

with appropriate:

```text
Authorization: Bearer <access-token>
```

where required.

---

# 51. Local Machine Migration

The project is being moved from GitHub Codespaces to a local development machine.

The repository should be cloned normally.

Expected process:

```bash
git clone <repository>
cd <repository>
bun install
```

Then verify:

```bash
bun run start:dev
```

Docker services can be started with:

```bash
docker compose up -d
```

Local services:

```text
NestJS        → http://localhost:3000
Swagger       → http://localhost:3000/api/docs
Elasticsearch → http://localhost:9200
Kibana        → http://localhost:5601
```

The actual application port should always be confirmed from the current `.env`.

---

# 52. Environment File Rules

Never commit real secrets.

Use:

```text
.env
```

for local/private configuration.

Commit:

```text
.env.example
```

with safe placeholder values.

Never put:

- production Elasticsearch passwords
- database passwords
- JWT secrets
- API keys
- cloud credentials

into Git.

---

# 53. How a Future AI Coding Session Should Continue

When continuing this project with ChatGPT/Codex:

1. Read this file first.
2. Read `architecture.md`.
3. Inspect the current repository state.
4. Check Git branch/status.
5. Do not assume the documented code is still identical to the repository.
6. Prefer the actual codebase as the current implementation source of truth.
7. Treat this document as architectural/project history and decisions.
8. Avoid reimplementing already completed functionality.
9. Continue from the current Git state.
10. Ask for clarification only when an architectural decision is genuinely missing.

Useful initial commands:

```bash
git status
git branch --show-current
git log --oneline -15
```

Then inspect:

```text
src/
architecture.md
docs/project-context.md
.env.example
docker-compose.yml
package.json
```

---

# 54. Important Current Decisions Summary

| Area | Current Decision |
|---|---|
| Package manager | Bun |
| API prefix | `/api` |
| API versioning | URI versioning |
| Current API version | `v1` |
| Validation | Global ValidationPipe |
| Success response | `{ success: true, data }` |
| Error response | Standardized HttpExceptionFilter |
| Swagger | Enabled |
| Logging | Winston |
| Trace context | AsyncLocalStorage |
| Trace header | `X-Trace-Id` |
| Request header | `X-Request-Id` |
| Current ID strategy | Same canonical ID |
| PII masking | Enabled |
| File logging | Daily rotation |
| File retention | 14 days |
| Elasticsearch | Local Docker |
| Elasticsearch version | 8.19.21 |
| Kibana | Local Docker |
| Direct ELK transport | Supported |
| Production collector | Deferred |
| Nest global custom logger | Intentionally NOT enabled |
| Request body logging | Not enabled |
| Header logging | Not enabled |
| Outgoing HTTP tracing | Deferred |
| Slow request detection | Deferred |
| Next major feature | Authentication |
| Database | Not yet finalized |

---

# 55. Golden Rule

When extending this project:

> Build only what the application currently needs, but build what it needs to production-grade standards.

Do not optimize for the number of features.

Optimize for:

```text
Correctness
+
Security
+
Maintainability
+
Observability
+
Testability
+
Scalability
```

while keeping the architecture understandable.
