# Quick Start - Testing & Development Tools

## 🚀 Quick Commands

### Run Tests
```bash
cd apps/api
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # UI interface
npm run test:coverage # With coverage
```

### Check Code Quality
```bash
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors
npm run typecheck     # Type check
```

### Debug
- Press `F5` in VS Code
- Select "Debug API Server" or "Debug Current Test File"
- Set breakpoints and debug!

## 📝 Example Test

```typescript
// src/services/example.service.test.ts
import { describe, it, expect } from 'vitest';
import { ExampleService } from './example.service';

describe('ExampleService', () => {
  it('should do something', () => {
    const service = new ExampleService();
    expect(service.method()).toBe(true);
  });
});
```

## 🎯 What's Set Up?

✅ **Vitest** - Test runner  
✅ **Supertest** - API testing  
✅ **Winston** - Logging  
✅ **ESLint** - Code quality  
✅ **VS Code Debugger** - Breakpoints  
✅ **Husky** - Pre-commit hooks  
✅ **TypeScript** - Type checking  

## 📚 Full Documentation

- **Detailed Guide**: `TESTING.md`
- **Setup Overview**: `../../TESTING_SETUP.md`

---

**You're all set! Start writing tests and debugging! 🎉**







