# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-ui.spec.js >> Profile Settings UI — Unauthenticated >> TC-PROF-UI-027: Profile redirect to login
- Location: tests/e2e/specs/profile-ui.spec.js:266:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/profile", waiting until "load"

```

```
Tearing down "context" exceeded the test timeout of 60000ms.
```