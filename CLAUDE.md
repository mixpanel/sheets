# CLAUDE.md

Working guide for this repo. Read before changing storage, auth, triggers, or anything that ships.

## What this is

A **Google Sheets editor add-on** (Google Apps Script, managed with `clasp`) that syncs data
**Mixpanel ↔ Sheets**: pull reports/cohorts/dashboards into a sheet, or push sheet rows into
Mixpanel as events/users/groups. Published to the Google Workspace Marketplace.

- Runtime: Apps Script V8 (`appsscript.json`). Not Node. Plain JS in a single global namespace.
- The `if (typeof module !== "undefined") { module.exports = ... }` blocks at the bottom of files
  exist **only** for Node (local tests) and IDE type-hints. GAS ignores them. There are no real imports.
- Entry points + flow: `Code.js` (menu `onOpen`, the `*View` dialogs, `test*`/`createSync*`/`sync*`
  functions, and the time-trigger handlers `syncMpToSheets` / `syncSheetsToMp`).

## Critical rules (don't regress these)

- **Never commit secrets.** `env.js`, `.clasprc.json`, `creds.json`, `.env` are gitignored. `.clasprc.json`
  is a password. `env.js` holds live test creds. (Note: `env.js` *is* pushed by clasp — it's in the
  push set, just not in git. See `.claspignore`.)
- **Config is per-user AND per-spreadsheet.** `utilities/storage.js` uses
  `PropertiesService.getUserProperties()` (SECOPS-1366: editors of a shared sheet must not read the
  owner's service-account secret) with every key prefixed by the spreadsheet id (`getSheetPrefix()`,
  issue #45). Do **not** switch back to `getDocumentProperties()` (leaks creds to editors) and do **not**
  read/write an unprefixed/global namespace. `getSheetPrefix()` throws in prod if it can't resolve the
  active spreadsheet — keep it that way (a silent global fallback caused cross-sheet data loss).
- **Triggers: use `ScriptApp.getUserTriggers(SpreadsheetApp.getActiveSpreadsheet())`** (per-user AND
  per-document). **Never `getProjectTriggers()`** — it returns the user's triggers across *all* their
  documents, so cleaning one sheet's triggers will delete another sheet's sync (#45).
- **No AI attribution** on commits, PRs, or PR comments. They're authored by the human (AK / maintainer).
  No `Co-Authored-By` trailers, no "generated with" lines.
- **There is no CI.** Tests only run when a human runs them (see Testing). Don't assume a pipeline.

## Auth & config model (the part that bites)

- The "service account credentials" a user pastes are a **Mixpanel service account**
  (`service_acct:service_secret`), used as HTTP Basic auth to the Mixpanel API. This is **not** a Google
  service account and there is no Google/OAuth handshake for data access.
- `utilities/validate.js` `validateCreds()`:
  - `mixpanel-to-sheet`: `GET https://mixpanel.com/api/app/me`, checks the project is present and has
    the `view_base_reports` permission.
  - `sheet-to-mixpanel`: `POST https://api.mixpanel.com/import` with an empty event.
- **Known wart:** the `mixpanel-to-sheet` catch-all rethrows everything as
  `"401 Unauthorized: invalid service account credentials"`. That message is misleading — it also fires
  for "no access to that project", "missing `view_base_reports`", a response-shape mismatch, or a region
  mismatch. To diagnose, curl `/api/app/me` with the creds and inspect `results.projects[<id>].permissions`.
- **Region:** `validateCreds` hardcodes US `mixpanel.com`. EU/IN-residency projects will always fail
  validation here (latent bug; not yet fixed).
- Data fetch/export lives in `components/dataExport.js`; import in `components/dataImport.js`. Report
  CSV export goes through `/api/query/insights` (multi-metric bookmarks only; flows not supported).

## Commands (`package.json`)

| Command | What |
|---|---|
| `npm run test-local` | Node, hermetic. Runs the LOCAL test block only. Fast, no creds, no clasp. |
| `npm run push` | `clasp push --force` — upload local files to the Apps Script project (HEAD/sandbox). |
| `npm run test-server` | `clasp run runTests` — runs the SERVER test block in GAS (see Testing). |
| `npm run login` | `clasp login --creds creds.json` — re-auth clasp (token expires → `invalid_grant`). |
| `npm run type-check` | `tsc` over `Code.js`. Note: it doesn't load `types/Types.d.ts`, so ~70 "Cannot find
  name <Typedef>" errors are pre-existing noise, not a gate. Watch for *new* error categories only. |
| `npm run debug` | `clasp run repl`. |
| `npm run web-view` | opens the test sheet, executions, and Cloud Logging in Chrome. |

Node 24, clasp 2.4.2.

## Testing (NO CI — read this)

Two suites, gated inside `tests/all.test.js` by `UnitTestingApp`'s
`get isInGas() { return typeof ScriptApp !== "undefined" }`:

**Local (`npm run test-local`, Node):**
- Runs only the block under `test.runInGas(false)`.
- `tests/all.test.js` bootstraps an in-memory `PropertiesService` mock so storage tests are hermetic.
- **Do NOT define `ScriptApp` or `SpreadsheetApp` as globals in Node** — that flips `isInGas` and breaks
  the local/server gating. `storage.js` falls back to a fixed `"test_sheet_id_"` prefix when
  `SpreadsheetApp` is absent, and `clearTriggers`/`getTriggers` no-op off-GAS. Put GAS-only tests
  (anything needing real triggers) in the server block.

**Server (`npm run test-server` = `clasp run runTests`):**
- Runs the block under `test.runInGas(true)`, in GAS, against the **bound test sheet** (so there's an
  active spreadsheet — required, since `getSheetPrefix()`/`getUserTriggers` need one). Bare standalone
  execution would throw.
- **You MUST `clasp push` first** — `clasp run` executes the code already on the script, not your local
  edits. Workflow: edit → `npm run push` → `npm run test-server`.
- Needs valid clasp auth. If you see `Error retrieving access token: Error: invalid_grant`, run
  `npm run login` (interactive browser; a human must do it).
- **Output goes to Cloud Logging, not stdout.** `clasp run` only returns the function's return value.
  Pull pass/fail from Stackdriver (see Debugging).
- The server suite hits real Mixpanel with the creds in `env.js`. Expect ~41 assertions.

**Merge bar:** always run the **full server suite** (push, then `clasp run runTests`) and confirm it's
green before merging — local-only is not enough. `test-local` is the fast inner loop.

**Test fixtures (`env.js`, gitignored):** holds `GOOD_/BAD_*` cred fixtures, report/cohort ids, and
expected metadata. If the test service account is rotated, update `SERVICE_ACCOUNT`, `SERVICE_SECRET`,
and `SERVICE_AUTH_STR` (= base64 of `acct:secret`). Report-metadata tests compare against fixtures like
`REPORT_CREATOR` and can drift if the source report changes. Get current `env.js` from a maintainer.

## Deploy (manual — there is no auto-deploy)

`clasp push` only uploads to the server-side sandbox (HEAD) so tests can run; it does **not** ship to
customers. To release:

1. `npm run push` (code on HEAD).
2. Bump `APP_VERSION` in `Code.js`.
3. In the **Apps Script editor**: create a new version / deployment (increment the version #).
4. In the **GCP / Marketplace UI**: increment the deployment version there too.

Published customers run the deployed version, not HEAD — so pushing/merging does not affect them until
steps 3–4. This is all manual and maintainer-driven.

## Git flow

- Feature branch → PR → **squash-merge** to `main`. PRs get reviewed.
- Human authors all commits/PRs/comments (no AI attribution).

## Debugging production

- Apps Script exceptions log to Cloud Logging (`appsscript.json` `exceptionLogging: STACKDRIVER`).
- Project: **`mixpanel-gtm-training`**, `resource.type="app_script_function"`. Example:
  `gcloud logging read 'resource.type="app_script_function"' --project=mixpanel-gtm-training --freshness=1d`
  (filter on `resource.labels.function_name`, e.g. `syncMpToSheets`).
- `"Authorization is required to perform that action."` in a trigger run (bare, NOTICE, no stack) =
  the installable trigger's authorization lapsed for that user; they must re-open the add-on. It is a
  Google-auth issue, not a Mixpanel-creds issue.
- Usage telemetry is also sent to a Mixpanel project from `utilities/tracker.js` (sync start/end/error
  events with `project_id`), useful for correlating customer reports.

## GAS gotchas

- One global namespace; no real modules. Types are global typedefs in `types/Types.d.ts`.
- Installable time-triggers run **as their creator**, max **once per hour** for add-ons. `@OnlyCurrentDoc`.
- All HTTP is `UrlFetchApp.fetch` (needs `script.external_request` scope; it's in `appsscript.json`).
- `PropertiesService` quotas: 500KB total per store, 9KB per value. Prefixed multi-sheet config adds up.
- OAuth scopes are in `appsscript.json`. Changing them forces every user to re-authorize (and breaks
  existing triggers until they do) — avoid unless necessary.
