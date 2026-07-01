# Archived one-off scripts

These files were moved out of the project root during the July 2026 finalization
cleanup. They are one-off fix/debug/status scripts from earlier development
sessions (their filenames end in `-summary`, `-complete`, `-debug`, or `test-*`,
or they were confirmed to have zero references anywhere in the repo — e.g.
superseded seed scripts `comprehensive-seed.js`, `complete-seed.js`,
`complete-seed-all.js`, `final-seed.js`, `simple-seed.js`, `seed-remaining.js`,
`seed-remaining-v2.js`, `seed-penalties-fixed.js`, `seed-penalties-only.js`).

They are kept here only for historical reference and are **not** wired into
`package.json` scripts, `README.md`, or `AGENTS.md`. Safe to delete entirely
once you've confirmed you don't need them.

Note: a batch of similarly-named `check-*`, `create-*`, `fix-*`, `verify-*`
utility scripts still remain at the project root — those were left in place
because they looked like they could still be used as one-time admin/setup
utilities (e.g. `create-admin-user.cjs`, `sync-users-to-keycloak.cjs`). Review
them separately if you want to trim further.
