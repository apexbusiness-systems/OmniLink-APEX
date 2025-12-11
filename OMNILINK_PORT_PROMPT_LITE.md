# OMNILINK_PORT_PROMPT_LITE.md

🎯 OMNiLiNK PORT SETUP — LITE PROMPT

ROLE  
You are the integration engineer for this app. Your job is to add a **modular, optional OMNiLiNK port** so this app can connect to the APEX OMNiLiNK bus in the future, **without** breaking anything today.

This prompt is reusable across apps.

## CONFIG (FILL BEFORE USE)

- APP_NAME: {{APP_NAME}}
- STACK: {{e.g. React + TS + Node}}
- APP_TYPE: {{e.g. web app / backend service}}

## HARD RULES

- OMNiLiNK must be **optional**. App works normally if OMNiLiNK is disabled or unreachable.
- No secrets in code. All keys/URLs go through env/config.
- Scope is limited to:
  - `src/integrations/omnlink/**` (or equivalent)
  - OMNiLiNK-related config/env
  - Healthcheck endpoint/command
  - OMNiLiNK docs & tests
- Do **NOT** touch unrelated UI, backgrounds, layouts, or business logic.

---

## STEP 1 — CREATE THE PORT MODULE

1. Add a folder, e.g. `src/integrations/omnlink/` containing:
   - `config.ts` — reads env (e.g. `OMNILINK_ENABLED`, `OMNILINK_BASE_URL`, `OMNILINK_TENANT_ID`).
   - `types.ts` — shared OMNiLiNK types.
   - `OmniLinkClient.ts` or `OmniLinkAdapter.ts` — core API.
   - `index.ts` — exports a small surface.

2. The adapter must expose at least:
   - `isEnabled(): boolean`
   - `sendEvent(event: OmniLinkEvent): Promise<void>` (or equivalent)
   - Optional: `syncOnce()`, `pullUpdates()`, etc.

3. Behavior when disabled (no env or `OMNILINK_ENABLED=false`):
   - `isEnabled()` returns false.
   - Other methods are safe no-ops or log a clear warning.
   - No errors that break app startup.

---

## STEP 2 — CONFIG & ENV

1. Introduce env vars (names may vary by app):
   - `OMNILINK_ENABLED` (bool)
   - `OMNILINK_BASE_URL`
   - `OMNILINK_TENANT_ID`
   - Any app‑specific keys (document them).

2. Add a small validation in `config.ts`:
   - If `OMNILINK_ENABLED=true` but required fields missing → log a clear misconfiguration message.

---

## STEP 3 — HEALTHCHECK

1. Add **either**:
   - HTTP endpoint: `/health/omnlink`, **or**
   - CLI: `npm run omnlink:health` (or stack equivalent).

2. Behavior:
   - If disabled → report `status: "disabled"` and overall OK.
   - If enabled & configured → attempt a minimal ping or dry-run and report `status: "ok"`.
   - If enabled & misconfigured → report `status: "error"` with a helpful message.

---

## STEP 4 — CLIENT ENABLEMENT DOC

1. Create `docs/OMNILINK_ENABLEMENT_GUIDE.md` with 4 simple steps:

   1. Get OMNiLiNK credentials from APEX / OMNiLiNK.
   2. Set env vars (`OMNILINK_ENABLED`, `OMNILINK_BASE_URL`, etc.).
   3. Redeploy / restart the app.
   4. Run `/health/omnlink` or `omnlink:health` and check for `status: "ok"`.

2. Write this in **plain, non‑technical language** so an admin can follow it.

---

## STEP 5 — TESTS

1. Add tests (unit/integration) to cover:
   - Disabled: app runs, healthcheck reports `disabled`, adapter no‑ops.
   - Enabled with valid dummy config: healthcheck `ok`, adapter methods callable.
   - Misconfigured: healthcheck shows clear error but app still boots.

---

## FINAL REPORT (WHAT YOU MUST PRINT)

When done, print:

1. **Files added/modified** with 1‑line purpose each.  
2. **How to enable OMNiLiNK** in ≤5 bullets for a non‑technical admin.  
3. **Verification commands/URLs** (healthcheck + tests).  
4. A short checklist (✅/⬜):
   - Port module implemented & optional  
   - Env/config wired  
   - Healthcheck in place  
   - Enablement guide written  
   - Tests added/updated  
