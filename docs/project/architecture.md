# Application Architecture

## Overview

This project follows a production-oriented, feature-based architecture using NestJS.

The architecture is designed to keep business features isolated, reusable infrastructure centralized, and application configuration separated from business logic.

The application will also follow a consistent API structure so that all endpoints can be accessed through Postman and other API clients.

---

## Project Structure

The project follows a feature-based modular architecture.

```text
src/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   └── pipes/
│
├── config/
│   └── env.validation.ts
│
├── modules/
│   ├── health/
│   │   ├── health.controller.ts
│   │   ├── health.module.ts
│   │   └── health.service.ts
│   │
│   ├── auth/
│   ├── users/
│   ├── assets/
│   ├── files/
│   └── email/
│
├── app.module.ts
└── main.ts
```

---

## Architectural Responsibilities

### `common/`

Contains reusable application-level infrastructure that can be shared across multiple modules.

Examples:

- Guards
- Interceptors
- Pipes
- Exception filters
- Decorators
- Middleware

Business-specific logic should not be placed inside this directory.

---

### `config/`

Contains application configuration and environment validation.

Example:

```text
config/
└── env.validation.ts
```

Environment variables are validated during application startup using Joi.

Configuration is accessed through NestJS `ConfigService`.

---

### `modules/`

Contains the application's business and feature modules.

Each significant feature should have its own module.

Examples:

```text
modules/
├── auth/
├── users/
├── assets/
├── files/
└── email/
```

Feature-specific controllers, services, DTOs, and other implementation details should remain inside their respective modules.

This keeps features isolated and makes the application easier to maintain and scale.

---

## Module Structure

A typical business module should follow a structure similar to:

```text
users/
├── controllers/
├── services/
├── dto/
├── entities/
└── users.module.ts
```

The exact internal structure can be expanded as the feature becomes more complex.

The module should own its business logic and should not unnecessarily depend on unrelated modules.

---

# API Architecture

## Global API Prefix

All application APIs use the global prefix:

```text
/api
```

This is configured during application bootstrap using:

```ts
app.setGlobalPrefix(apiPrefix);
```

The value of `apiPrefix` comes from the application configuration.

---

## API Versioning

The application uses URI-based API versioning.

Configuration:

```ts
app.enableVersioning({
  type: VersioningType.URI,
  prefix: 'v',
});
```

The current API version is:

```text
v1
```

Therefore, the standard API URL structure is:

```text
/api/v1/<resource>
```

For example:

```text
GET /api/v1/users
POST /api/v1/users
GET /api/v1/users/:id
```

Controllers must explicitly specify their API version.

Example:

```ts
@Controller({
  path: 'users',
  version: '1',
})
```

---

## API Request Flow

The application follows this general request flow:

```text
Client / Postman
       ↓
Global API Prefix
       ↓
API Versioning
       ↓
Global ValidationPipe
       ↓
Controller
       ↓
Service
       ↓
ResponseInterceptor
       ↓
Standard Success Response
```

For failed requests:

```text
Client / Postman
       ↓
Application
       ↓
Exception
       ↓
HttpExceptionFilter
       ↓
Standard Error Response
```

---

# Global Validation

The application uses NestJS `ValidationPipe` globally.

Current configuration:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

## `whitelist`

Only properties defined in the DTO are allowed.

Unknown properties are not accepted.

---

## `forbidNonWhitelisted`

Requests containing properties that are not defined in the DTO are rejected with a `400 Bad Request` response.

This prevents clients from sending unexpected fields to the API.

---

## `transform`

Enables transformation of incoming request values according to DTO definitions.

This is useful when handling values received through HTTP requests, especially query parameters and route parameters.

---

## DTO Validation

API request validation should be implemented through DTOs.

Example:

```ts
export class CreateUserDto {
  @IsString()
  name: string;
}
```

Controllers should use DTOs instead of manually validating request bodies.

Example:

```ts
@Post()
createUser(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

---

# API Response Standards

The application uses a global response interceptor to maintain a consistent successful-response structure.

## Successful Response

All successful HTTP responses are wrapped in:

```json
{
  "success": true,
  "data": {}
}
```

The actual endpoint response is placed inside the `data` property.

Controllers should return the actual data and should not manually add the `success` or `data` properties.

---

## Health Endpoint Example

The Health module provides a lightweight endpoint for verifying that the application is running.

Location:

```text
src/modules/health/
```

Structure:

```text
health/
├── health.controller.ts
├── health.module.ts
└── health.service.ts
```

Endpoint:

```http
GET /api/v1/health
```

The service returns:

```json
{
  "status": "ok"
}
```

The global response interceptor transforms it into:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

# API Error Standards

Unhandled HTTP exceptions are handled by the global `HttpExceptionFilter`.

The standard error response is:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "path": "/api/v1/example",
  "timestamp": "2026-08-17T00:00:00.000Z"
}
```

The actual timestamp will be generated when the error occurs.

---

## Internal Server Errors

Unexpected application errors return a generic response:

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "path": "/api/v1/example",
  "timestamp": "2026-08-17T00:00:00.000Z"
}
```

Internal implementation details must not be exposed to API clients.

The following should not be returned to clients:

- Stack traces
- Database errors
- Internal implementation details
- Secrets
- Environment variables
- Sensitive information

---

# Global Exception Filter

The global exception filter is located at:

```text
src/common/filters/http-exception.filter.ts
```

It is registered during application bootstrap:

```ts
app.useGlobalFilters(new HttpExceptionFilter());
```

The filter provides a consistent error response regardless of which controller or service generated the exception.

---

# Global Response Interceptor

The global response interceptor is located at:

```text
src/common/interceptors/response.interceptor.ts
```

It is registered during application bootstrap:

```ts
app.useGlobalInterceptors(new ResponseInterceptor());
```

Its responsibility is to wrap successful responses using:

```json
{
  "success": true,
  "data": {}
}
```

Controllers should therefore return only the actual response data.

---

# Health Module

The Health module is a system-level module used to verify application availability.

Location:

```text
src/modules/health/
```

Structure:

```text
health/
├── health.controller.ts
├── health.module.ts
└── health.service.ts
```

Endpoint:

```http
GET /api/v1/health
```

Expected application data:

```json
{
  "status": "ok"
}
```

Final API response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

The Health module can later be extended to verify dependencies such as:

- Database connectivity
- External services
- File storage
- Other required infrastructure

The Health module should remain isolated from business modules.

---

# Configuration Architecture

Environment variables are loaded using NestJS `ConfigModule`.

The configuration module is globally available to the application.

Current configuration includes:

```ts
ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  validationSchema: envValidationSchema,
});
```

Configuration should be accessed through `ConfigService`.

Example:

```ts
const configService = app.get(ConfigService);

const port = configService.get<number>('PORT')!;
```

Direct access to `process.env` should be avoided in application logic when the value is already managed through `ConfigService`.

---

# Application Bootstrap

The application bootstrap file is:

```text
src/main.ts
```

Its responsibilities include:

- Creating the NestJS application
- Loading application configuration
- Configuring the global API prefix
- Configuring API versioning
- Registering global validation
- Registering the global exception filter
- Registering the global response interceptor
- Starting the HTTP server

The bootstrap layer should remain focused on application-wide configuration rather than business logic.

---

# Current API Foundation

The following foundation has been implemented:

```text
API Prefix
    /api
       ↓
API Versioning
    /api/v1
       ↓
Global ValidationPipe
       ↓
Controller
       ↓
Service
       ↓
ResponseInterceptor
       ↓
Standard Success Response
```

Error handling follows:

```text
Exception
    ↓
HttpExceptionFilter
    ↓
Standard Error Response
```

---

# Development Rules

The following rules apply throughout the project.

## Feature Branches

Every significant feature or architectural change should be developed in a separate branch.

Example:

```text
main
  ↓
feat/user-management
```

After implementation, testing, and documentation:

```text
feature branch
      ↓
     PR
      ↓
    main
```

New branches should be created from the latest `main`.

---

## Commits

Each significant logical step should have its own commit.

Commit messages should follow a consistent conventional format.

Examples:

```text
feat: add user management
fix: handle invalid user input
chore: update environment validation
docs: update architecture documentation
refactor: simplify authentication service
test: add user service tests
```

---

# API Testing

Every API endpoint should be accessible and testable through Postman.

For each significant endpoint, testing should cover:

- Successful request
- Invalid request
- Missing required fields
- Invalid data types
- Unauthorized access where applicable
- Forbidden access where applicable
- Not found scenarios where applicable
- Server error scenarios where applicable

API behavior should be verified before the feature is considered complete.

---

# Production Development Principles

The project should be developed with production-level practices from the beginning.

Important principles include:

- Strong request validation
- Consistent API responses
- Centralized exception handling
- Environment-based configuration
- Feature-based modules
- Separation of controllers and business logic
- Secure handling of files
- Secure email integration
- Authentication and authorization
- Proper logging
- Automated testing
- API documentation
- Database validation and error handling
- No sensitive information in API responses
- No secrets committed to Git

---

# Future Modules

The following modules are expected to be added as the application grows:

```text
modules/
├── health/
├── auth/
├── users/
├── files/
├── email/
└── ...
```

Additional modules should be introduced based on actual application requirements rather than creating empty modules prematurely.

---

# Architecture Evolution

This document should be updated whenever a significant architectural decision is introduced.

The purpose of this document is to provide a historical reference for:

- Why a particular architecture was chosen
- Where functionality belongs
- How requests flow through the application
- How APIs should behave
- How future developers should extend the application

All significant architectural changes should be documented and committed together with the related implementation.

# API Documentation

## Swagger / OpenAPI

The application uses NestJS Swagger to provide OpenAPI documentation for the API.

Swagger is configured during application bootstrap in:

```text
src/main.ts
```

The Swagger package is:

```text
@nestjs/swagger
```

---

## Swagger Configuration

The current Swagger configuration includes:

- Application title
- API description
- API version
- Bearer authentication support
- Automatically generated API documentation

Configuration:

```ts
const swaggerConfig = new DocumentBuilder()
  .setTitle('Application API')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const swaggerDocument = SwaggerModule.createDocument(
  app,
  swaggerConfig,
);

SwaggerModule.setup(
  'api/docs',
  app,
  swaggerDocument,
);
```

---

## Swagger URL

Swagger UI is available at:

```text
/api/docs
```

For a local application:

```text
http://localhost:3000/api/docs
```

The actual URL depends on the environment and port configuration.

---

## API Discovery

Swagger automatically discovers controllers and routes registered within the NestJS application.

For example, the Health module is automatically displayed:

```text
GET /api/v1/health
```

No unnecessary Swagger decorators are required when automatic route discovery provides the required documentation.

Swagger decorators such as:

```ts
@ApiTags()
@ApiOperation()
@ApiResponse()
```

should be introduced when additional API documentation or metadata is actually required.

---

## Swagger Testing

Swagger UI can be used to test API endpoints directly.

For example:

```text
GET /api/v1/health
```

Using the **Try it out** and **Execute** options should return:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

This verifies the complete request flow:

```text
Swagger UI
    ↓
HTTP Request
    ↓
/api/v1/health
    ↓
Health Controller
    ↓
Health Service
    ↓
Response Interceptor
    ↓
Standard API Response
```

---

## Authentication

Bearer authentication support has been configured in Swagger:

```ts
.addBearerAuth()
```

This prepares Swagger for authenticated endpoints that will be introduced later.

Authentication requirements should be added to individual endpoints when authentication is implemented.

---

## API Documentation Principles

Swagger documentation should be maintained as the API evolves.

For significant endpoints, documentation should eventually describe:

- Endpoint purpose
- HTTP method
- Request parameters
- Request body
- DTO structure
- Authentication requirements
- Successful responses
- Validation errors
- Authorization errors
- Not-found scenarios

Documentation should provide useful information to developers consuming the API without exposing internal implementation details or sensitive information.