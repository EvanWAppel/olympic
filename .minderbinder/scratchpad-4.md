Added a world-events overlay: a curated WORLD_EVENTS list (src/lib/world-events.ts) with eventMarkersFor() that snaps events to each chart's x-axis categories (exact date for daily, ISO week-start for weekly), plus an eventReferenceLines helper rendering dashed labeled vertical ReferenceLines. Wired into the Daily steps, Weekly miles, and Pace/Incline trend charts. Exported isoWeekStart for reuse and added world-events tests. Typecheck and the affected/new test files pass; remaining test failures are pre-existing DATABASE_URL env issues unrelated to this change. New events can be added by editing the WORLD_EVENTS array.

Sandbox tests failed:
[1m[30m[46m RUN [49m[39m[22m [36mv4.1.7 [39m[90m/work[39m

[90mstdout[2m | src/app/api/workouts/__tests__/route.test.ts
[22m[39m◇ injected env (0) from .env.local // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [31m❯[39m src/app/api/workouts/__tests__/route.test.ts [2m([22m[2m3 tests[22m[2m | [22m[33m3 skipped[39m[2m)[22m[33m 521[2mms[22m[39m
     [2m[90m↓[39m[22m persists the full row and returns it
     [2m[90m↓[39m[22m accepts a row without notes
     [2m[90m↓[39m[22m returns 400 on invalid body
[90mstdout[2m | src/app/api/health/import/__tests__/route.test.ts
[22m[39m◇ injected env (0) from .env.local // tip: ◈ secrets for agents [www.dotenvx.com]

 [31m❯[39m src/app/api/health/import/__tests__/route.test.ts [2m([22m[2m5 tests[22m[2m | [22m[33m5 skipped[39m[2m)[22m[33m 406[2mms[22m[39m
     [2m[90m↓[39m[22m accepts a zipped export and returns counts
     [2m[90m↓[39m[22m returns 400 when no file is uploaded
     [2m[90m↓[39m[22m returns 400 when the zip has no export.xml
     [2m[90m↓[39m[22m accepts a JSON { blobUrl } body and imports the fetched zip
     [2m[90m↓[39m[22m returns 400 for a JSON body missing blobUrl
[90mstdout[2m | src/app/api/settings/__tests__/route.test.ts
[22m[39m◇ injected env (0) from .env.local // tip: ⌘ custom filepath { path: '/custom/path/.env' }

 [31m❯[39m src/app/api/settings/__tests__/route.test.ts [2m([22m[2m3 tests[22m[2m | [22m[33m3 skipped[39m[2m)[22m[33m 431[2mms[22m[39m
     [2m[90m↓[39m[22m GET returns the settings row
     [2m[90m↓[39m[22m PATCH updates editable fields and ignores unknown keys
     [2m[90m↓[39m[22m PATCH returns 400 on invalid types
[90mstdout[2m | src/app/api/health/ingest/__tests__/route.test.ts
[22m[39m◇ injected env (0) from .env.local // tip: ⌁ auth for agents [www.vestauth.com]

 [31m❯[39m src/app/api/health/ingest/__tests__/route.test.ts [2m([22m[2m6 tests[22m[2m | [22m[33m6 skipped[39m[2m)[22m[33m 432[2mms[22m[39m
     [2m[90m↓[39m[22m returns 401 without an Authorization header
     [2m[90m↓[39m[22m returns 401 with the wrong secret
     [2m[90m↓[39m[22m upserts daily metrics and workouts on valid auth
     [2m[90m↓[39m[22m accepts the Health Auto Export shape wrapped under a `data` key
     [2m[90m↓[39m[22m is idempotent on workouts (same id is not duplicated)
     [2m[90m↓[39m[22m overwrites daily metrics on conflict
[90mstdout[2m | src/app/api/workouts/[id]/__tests__/route.test.ts
[22m[39m◇ injected env (0) from .env.local // tip: ⌘ enable debugging { debug: true }

 [31m❯[39m src/app/api/workouts/[id]/__tests__/route.test.ts [2m([22m[2m4 tests[22m[2m | [22m[33m4 skipped[39m[2m)[22m[33m 447[2mms[22m[39m
     [2m[90m↓[39m[22m PATCH updates editable fields
     [2m[90m↓[39m[22m PATCH 404 on missing
     [2m[90m↓[39m[22m DELETE removes the workout
     [2m[90m↓[39m[22m DELETE 40