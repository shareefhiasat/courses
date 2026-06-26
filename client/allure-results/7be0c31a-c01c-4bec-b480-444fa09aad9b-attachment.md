# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: marks-ui.spec.js >> Marks UI — Mark Entry Edge Cases >> TC-MRK-UI-093: Enter negative mark — should be rejected or show error
- Location: tests/e2e/specs/marks-ui.spec.js:1075:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://localhost:5174/marks-entry", waiting until "load"

```

```
Tearing down "context" exceeded the test timeout of 60000ms.
```