# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: penalties-ui.spec.js >> Penalties UI — Delete Flow (Read-only checks) >> TC-PEN-UI-022: Delete — cancelled, penalty remains in grid
- Location: tests/e2e/specs/penalties-ui.spec.js:637:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/penalty", waiting until "load"

```

```
Tearing down "context" exceeded the test timeout of 60000ms.
```