# Testing Guide

This guide explains how to use the testing tools set up for the API.

## Table of Contents

1. [Running Tests](#running-tests)
2. [Writing Tests](#writing-tests)
3. [Test Utilities](#test-utilities)
4. [Debugging Tests](#debugging-tests)
5. [Code Coverage](#code-coverage)
6. [CI/CD Integration](#cicd-integration)

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with code coverage
npm run test:coverage

# Debug tests
npm run test:debug
```

### Running Specific Tests

```bash
# Run a specific test file
vitest run src/services/auth.service.test.ts

# Run tests matching a pattern
vitest run auth

# Run tests in a specific directory
vitest run src/services
```

## Writing Tests

### Test File Structure

Tests should be placed next to the files they test with `.test.ts` or `.spec.ts` extension:

```
src/
  services/
    auth.service.ts
    auth.service.test.ts
  controllers/
    auth.controller.ts
    auth.controller.test.ts
```

### Example: Service Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { testUtils } from '../tests/setup';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await authService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
    });
  });
});
```

### Example: Controller Test (API Endpoint)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { testUtils } from '../tests/setup';
import { authService } from '../services/auth.service';

describe('AuthController', () => {
  beforeEach(async () => {
    await testUtils.createTestUser({
      email: 'test@example.com',
      password: await authService.hashPassword('TestPassword123!'),
    });
  });

  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
        portalType: 'tech',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

## Test Utilities

The test setup provides several utilities to make writing tests easier:

### `testUtils.createTestUser(overrides?)`

Creates a test user in the database:

```typescript
const user = await testUtils.createTestUser({
  email: 'test@example.com',
  portalType: 'tech',
  role: 'tech_admin',
});
```

### `testUtils.getAuthTokens(user)`

Generates authentication tokens for a user:

```typescript
const user = await testUtils.createTestUser();
const { accessToken, refreshToken } = await testUtils.getAuthTokens(user);
```

### `testUtils.wait(ms)`

Waits for a specified time (useful for async operations):

```typescript
await testUtils.wait(1000); // Wait 1 second
```

## Debugging Tests

### VS Code Debugger

1. Set a breakpoint in your test file
2. Press `F5` or go to Run and Debug
3. Select "Debug Current Test File" or "Debug API Tests"
4. Tests will pause at breakpoints

### Command Line Debugging

```bash
# Debug tests with Node inspector
npm run test:debug

# Then open Chrome and go to chrome://inspect
```

### Console Logging

Use `console.log` in tests - it will show in the test output:

```typescript
it('should do something', () => {
  console.log('Debug info');
  // Your test code
});
```

## Code Coverage

### View Coverage Report

```bash
npm run test:coverage
```

This will:
1. Run all tests
2. Generate coverage reports
3. Open HTML report in `coverage/index.html`

### Coverage Thresholds

You can set coverage thresholds in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

## Test Database

Tests use a separate test database. Configure it with:

```env
MONGODB_TEST_URI=mongodb://localhost:27017/test_euroasiann
```

If not set, it will use `MONGODB_URI` and replace the database name with `test_euroasiann`.

**Important:** The test database is automatically cleaned before each test.

## Pre-commit Hooks

Tests run automatically before commits (via Husky). To skip:

```bash
git commit --no-verify
```

## Best Practices

1. **One assertion per test**: Each test should verify one thing
2. **Descriptive names**: Test names should clearly describe what they test
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Clean up**: Tests automatically clean the database, but clean up any external resources
5. **Isolation**: Tests should not depend on each other
6. **Mock external services**: Mock Redis, external APIs, etc.

## Common Patterns

### Testing Error Cases

```typescript
it('should throw error for invalid input', async () => {
  await expect(
    authService.login('invalid', 'password', 'tech')
  ).rejects.toThrow('Invalid credentials');
});
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Using Mocks

```typescript
import { vi } from 'vitest';

vi.mock('../services/redis.service', () => ({
  redisService: {
    isBlacklisted: vi.fn().mockResolvedValue(false),
  },
}));
```

## Troubleshooting

### Tests failing with database connection errors

- Ensure MongoDB is running
- Check `MONGODB_TEST_URI` environment variable
- Verify test database permissions

### Tests timing out

- Increase `testTimeout` in `vitest.config.ts`
- Check for hanging promises
- Ensure database cleanup is working

### Tests passing individually but failing together

- Tests might be sharing state
- Check for global variables or singletons
- Ensure database is properly cleaned between tests







