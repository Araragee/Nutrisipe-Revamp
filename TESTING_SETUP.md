# Testing Setup Guide

## Overview

This document provides instructions for setting up and running tests in the Nutrisipe application.

## Recommended Testing Stack

### Frontend Testing
- **Vitest**: Fast unit test framework (Vite-native)
- **@vue/test-utils**: Official Vue.js testing utilities
- **happy-dom** or **jsdom**: DOM implementation for testing

### Installation

```bash
npm install -D vitest @vue/test-utils happy-dom @vitest/ui
```

### Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'backend/',
          'dist/',
          '**/*.spec.ts',
          '**/*.test.ts',
        ],
      },
    },
  })
)
```

### Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Example Tests

### 1. Composable Test

`src/composables/__tests__/useCache.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useCache } from '../useCache'

describe('useCache', () => {
  beforeEach(() => {
    const { clearCache } = useCache()
    clearCache()
  })

  it('should cache and retrieve data', () => {
    const { cache } = useCache()
    cache.set('test-key', { value: 'test-data' })

    const cached = cache.get('test-key')
    expect(cached).toEqual({ value: 'test-data' })
  })

  it('should return null for expired cache', async () => {
    const { cache } = useCache()
    cache.set('test-key', 'data', 100) // 100ms TTL

    await new Promise(resolve => setTimeout(resolve, 150))

    const cached = cache.get('test-key')
    expect(cached).toBeNull()
  })

  it('should invalidate cache by pattern', () => {
    const { cache } = useCache()
    cache.set('feed_page_1', 'data1')
    cache.set('feed_page_2', 'data2')
    cache.set('other_key', 'data3')

    cache.invalidatePattern(/^feed_page_/)

    expect(cache.get('feed_page_1')).toBeNull()
    expect(cache.get('feed_page_2')).toBeNull()
    expect(cache.get('other_key')).toBe('data3')
  })
})
```

### 2. Utility Function Test

`src/utils/__tests__/debounce.spec.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { debounce, throttle } from '../debounce'

describe('debounce', () => {
  it('should delay function execution', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    expect(fn).not.toHaveBeenCalled()

    await new Promise(resolve => setTimeout(resolve, 150))

    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('throttle', () => {
  it('should limit function calls', async () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    throttled()
    throttled()

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
```

### 3. Component Test

`src/components/ui/__tests__/EmptyState.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  it('renders title correctly', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No results found',
      },
    })

    expect(wrapper.text()).toContain('No results found')
  })

  it('emits action event when button clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Test',
        actionLabel: 'Click me',
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('action')).toBeTruthy()
  })

  it('does not render button when actionLabel is not provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Test',
      },
    })

    expect(wrapper.find('button').exists()).toBe(false)
  })
})
```

### 4. Store Test

`src/stores/__tests__/ui.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '../ui'

describe('UI Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows toast with correct message and type', () => {
    const store = useUiStore()

    store.showToast('Success message', 'success')

    expect(store.toastMessage).toBe('Success message')
    expect(store.toastType).toBe('success')
    expect(store.showToastFlag).toBe(true)
  })

  it('hides toast', () => {
    const store = useUiStore()

    store.showToast('Test', 'info')
    store.hideToast()

    expect(store.showToastFlag).toBe(false)
    expect(store.toastMessage).toBe('')
  })
})
```

## Integration Testing

### Backend API Tests

For backend testing, use Jest or Vitest:

```bash
cd backend
npm install -D vitest supertest @types/supertest
```

Example API test:

```typescript
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/index'

describe('Authentication API', () => {
  it('POST /api/auth/register - should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('token')
  })
})
```

## End-to-End Testing

### Recommended: Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

Example E2E test:

```typescript
import { test, expect } from '@playwright/test'

test('user can login and view feed', async ({ page }) => {
  await page.goto('http://localhost:5173/login')

  await page.fill('input[name="username"]', 'testuser')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('http://localhost:5173/')
  await expect(page.locator('.pin-grid')).toBeVisible()
})
```

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test:coverage

# UI mode
npm run test:ui

# E2E tests
npx playwright test

# E2E tests with UI
npx playwright test --ui
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: npx playwright test
```

## Test Coverage Goals

- **Unit Tests**: Aim for 80% coverage
- **Integration Tests**: Cover all critical API endpoints
- **E2E Tests**: Cover main user flows (auth, post creation, social interactions)

## Best Practices

1. **Test Naming**: Use descriptive names that explain what's being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Use `vi.mock()` for API calls
4. **Clean Up**: Reset state between tests
5. **Test User Behavior**: Focus on how users interact with the app
6. **Avoid Implementation Details**: Test outcomes, not internals
7. **Keep Tests Fast**: Unit tests should run in milliseconds

## Notes

- Tests are not yet implemented in this project
- This document serves as a guide for future test implementation
- Follow the examples above to create comprehensive test coverage
