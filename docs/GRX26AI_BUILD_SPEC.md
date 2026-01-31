# GRX26AI Police/MOD Architecture — Build Spec (Cursor)

Build-system instruction fulfillment: architecture, file layout, Core↔Sentinel governance, Titan invocation, Forge map visibility, official police UI, gut-check, acceptance tests.

---

## 1. File tree (created / modified)

```
/index.html
  — body.grx26-police, header "GRX26AI — Restricted Deployment"
  — sidebar: Core, Sentinel, Titan, Venus, Forge Map, System Status, Audit Log + modules
  — loads grx26.theme.css, grx26.layout.css; all GRX26 JS in order below

/assets/css/
  grx26.theme.css     — muted palette, body.grx26-police, minimal glow, professional
  grx26.layout.css    — grx26-panel, tables, forge map, status grid, security-team logos

/assets/js/
  app.js              — entry; router; module buttons
  router.js           — hash-based load; modules/<id>.html

  core/
    core.registry.js  — SYSTEM_REGISTRY (agents, modules, visibility, permissions)
    core.orchestrator.js — handleUserRequest, getSystemStatus, listAgents, runSelfTest
    core.selftest.js  — GRX26.runSelfTest (registry, sentinel, titan, forge nodes, theme)
    core.audit.js     — Audit.log, Audit.getRecent (in-memory + localStorage)

  governance/
    sentinel.rules.js — SentinelRules.run (illegal/autonomy/certainty rules)
    sentinel.overlay.js — SentinelOverlay.process (classify, rules, optional Titan, responseFrame + riskFlags/constraints/uncertaintyLabel/recommendedNextSteps)
    titan.invoke.js   — TitanInvoke.run (on demand; assumptions, weakPoints, recommendedQuestions; no commands)
    permissions.js   — canAccess stub

  forge/
    forge.model.js    — buildForgeNodesFromRegistry (Governance / Analysis / Ops)
    forge.map.js      — GRX26.ForgeMap.getNodes, renderInto (name, status, invokePolicy, lastActivity)

  ui/
    sidebar.js        — GRX26.Sidebar labels (optional)
    panels.js         — GRX26.Panels.renderSystemStatus, renderAuditLog (optional)

/modules/
  core.html           — Control Centre UI
  sentinel.html       — Sentinel oversight UI
  titan.html          — Titan analysis UI
  venus.html          — Venus security/experience UI
  guardian.html       — Guardian safety UI
  forge_map.html      — Forge map container; calls GRX26.ForgeMap.renderInto
  system-status.html  — getSystemStatus(), Run Self-Test button, Request via Core, Audit.getRecent(20)
  audit-log.html      — Audit log (recent 20) standalone panel
```

---

## 2. Key wiring points

| From | To | Purpose |
|------|----|---------|
| index.html | core.registry.js (first) | SYSTEM_REGISTRY before anything that uses it |
| core.orchestrator | SentinelOverlay.process | All user requests go through Sentinel |
| core.orchestrator | TitanInvoke.run | Only when sentinelResult.invokeTitan === true |
| core.orchestrator | Audit.log | request_received, response_sent; titan_invoked when Titan runs |
| sentinel.overlay | SentinelRules.run | Policy check |
| sentinel.overlay | Audit.log | sentinel_processed |
| forge.model | SYSTEM_REGISTRY | buildForgeNodesFromRegistry(registry) |
| forge.map | forge.model | getNodes() uses buildForgeNodesFromRegistry |
| forge_map.html | GRX26.ForgeMap.renderInto | Renders map when module loads |
| system-status.html | CoreOrchestrator.getSystemStatus, runSelfTest, handleUserRequest | Operator view |
| system-status.html | Audit.getRecent(20) | Audit (recent 20) on same panel |
| core.selftest | SYSTEM_REGISTRY, SentinelOverlay, TitanInvoke, GRX26.buildForgeNodesFromRegistry, grx26.theme.css | Self-test checks |

**Load order (index.html):**  
core.registry → forge.model → core.audit → sentinel.rules → sentinel.overlay → titan.invoke → permissions → core.selftest → core.orchestrator → forge.map → (sidebar, panels if used).

---

## 3. TODOs / stubs

- **permissions.js** — `canAccess(agentId, action)` is a stub; returns true. Replace with real RBAC when backend is defined.
- **Watchtower, Compliance** — Registry agents with `status: 'standby'`; visible on Forge map; no implementation yet.
- **TitanInvoke.run** — Returns fixed advisory structure; can be wired to a real analysis service later.
- **Venus** — Agent + module + UI present; external Venus pack path: `C:\Users\anyth\Desktop\WORKING APP\VENUS` (not wired into this repo).

---

## 4. Place-by-place gut-check

### 4.1 Architecture

- Core can see registry and list all agents — **YES** (`listAgents()`, `getSystemStatus()`).
- Sentinel always wraps responses — **YES** (`handleUserRequest` → `SentinelOverlay.process` → result).
- Titan only runs when invoked — **YES** (`TitanInvoke.run` only when `sentinelResult.invokeTitan`).
- Forge map shows Core / Sentinel / Titan / Compliance / Audit (and Venus, Watchtower) — **YES** (registry-driven).
- Self-test detects missing links — **YES** (registry, sentinel, titan, forge nodes, theme).

### 4.2 UI

- Sidebar looks official (no neon/glow) — **YES** (grx26.theme.css, muted module buttons).
- Text readable, minimal animations — **YES** (grx26.theme.css reduces animation).
- Panels structured, audit-friendly — **YES** (grx26-panel, tables, headings).

### 4.3 Behaviour

- Outputs are advisory, not commanding — **YES** (Sentinel rules + responseFrame advisory_only; Titan advisory only).
- Uncertainty explicitly labeled — **YES** (Sentinel: uncertaintyLabel, riskFlags, recommendedNextSteps).
- Logs generated with trace ids — **YES** (Audit.log(..., traceId); request_received, sentinel_processed, titan_invoked, response_sent).

---

## 5. Acceptance tests (run manually)

1. **Forge map nodes**  
   Open app → Forge Map → confirm nodes: **Core, Sentinel, Titan, Compliance, Audit** (and Venus, Watchtower if visible).  
   **Can execute:** YES.

2. **System Status self-test**  
   Open System Status → click **Run Self-Test** → must return **PASS** and show each check (registry_loads, sentinel_loaded, titan_invoke_present, forge_nodes_include_core_sentinel_titan, css_theme_loaded).  
   **Can execute:** YES.

3. **Request: ecosystem report**  
   Submit: *"Run a self-system test and report ecosystem."*  
   Must return structured status + traceId (and use getSystemStatus path).  
   **Can execute:** YES.

4. **Request: Titan invocation**  
   Submit: *"Analyse this incident with uncertainty."*  
   Must trigger Titan (sentinel sets invokeTitan, titanReason); response includes Titan advisory (assumptions, recommendedQuestions).  
   **Can execute:** YES.

5. **Audit log events**  
   After 3 and 4, open System Status (Audit section) or Audit Log panel.  
   Must show: **request_received**, **sentinel_processed**, **titan_invoked** (when applicable), **response_sent**.  
   **Can execute:** YES.

---

## 6. Hard rules (verified)

1. **Core is the authoritative orchestrator** — runSelfTest(), getSystemStatus(), listAgents() implemented and callable.
2. **Sentinel cannot be bypassed** — All actionable responses route User → Core → Sentinel → (optional Titan) → Sentinel → Core → User.
3. **Titan is not always-on** — Invoked only via Sentinel with reason + traceId.
4. **Security/oversight agents on Forge map** — All agents with visibleOnForge appear (Governance / Analysis / Ops).
5. **UI neutral/official** — grx26-police theme; minimal animation; muted palette; clear headings.

No marketing copy; no consumer features. Governance, clarity, operational presentation.
