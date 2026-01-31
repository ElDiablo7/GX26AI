# GRX26AI Police/MOD Architecture — Build Notes

## 1. File tree (created/modified)

### Created

```
assets/js/core/
  core.registry.js    — SYSTEM_REGISTRY (agents, modules, visibility)
  core.audit.js       — Audit.log, Audit.getRecent
  core.selftest.js    — GRX26.runSelfTest
  core.orchestrator.js — CoreOrchestrator.handleUserRequest, getSystemStatus, listAgents, runSelfTest

assets/js/governance/
  sentinel.rules.js   — SentinelRules.run (policy rules)
  sentinel.overlay.js — SentinelOverlay.process (mandatory overlay)
  titan.invoke.js     — TitanInvoke.run (on demand only)
  permissions.js      — GRX26.canAccess (stub)

assets/js/forge/
  forge.model.js      — buildForgeNodesFromRegistry
  forge.map.js        — GRX26.ForgeMap.getNodes, renderInto

assets/js/ui/
  sidebar.js          — GRX26.Sidebar.getLabel, applyLabels
  panels.js           — GRX26.Panels.renderSystemStatus, renderAuditLog

assets/css/
  grx26.theme.css     — body.grx26-police muted palette
  grx26.layout.css    — grx26-panel, tables, forge map layout

modules/
  system-status.html  — System Status panel + Run Self-Test + Submit via Core
  audit-log.html      — Audit log (recent 20)
  forge_map.html      — Forge map (registry-driven)
  sentinel.html       — Sentinel status panel
  titan.html          — Titan status panel
```

### Modified

```
index.html
  — body class grx26-police
  — header "GRX26AI — Restricted Deployment"
  — sidebar: Core, Sentinel, Titan, Forge Map, System Status, Audit Log + rest with plain labels
  — link grx26.theme.css, grx26.layout.css
  — script order: core.registry → forge.model → core.audit → sentinel.rules → sentinel.overlay → titan.invoke → permissions → core.selftest → core.orchestrator → forge.map → sidebar → panels
```

---

## 2. Key wiring points

- **Registry**: `SYSTEM_REGISTRY` is the single source of truth. Agents: core, sentinel, titan, watchtower, compliance, audit. All have `visibleOnForge: true` (watchtower, compliance, audit are stubs).
- **Request flow**: User input → `CoreOrchestrator.handleUserRequest(input, context)` → `SentinelOverlay.process(...)` → if high-risk/uncertainty → `TitanInvoke.run(...)` → result back through Sentinel. Audit logs: request_received, sentinel_processed, titan_invoked (when applicable), response_sent.
- **Forge map**: Renders from `GRX26.buildForgeNodesFromRegistry(SYSTEM_REGISTRY)`. Groups: Governance (Core, Sentinel, Compliance, Audit, Watchtower), Analysis (Titan), Ops (other modules). Module `forge_map` loads `forge_map.html` and calls `GRX26.ForgeMap.renderInto(container)`.
- **Self-test**: `CoreOrchestrator.runSelfTest()` delegates to `GRX26.runSelfTest()`. Checks: registry_loads, sentinel_loaded, titan_invoke_present, forge_nodes_include_core_sentinel_titan, css_theme_loaded.
- **Theme**: `body.grx26-police` applies muted palette (charcoal/navy/grey), minimal animation, professional type.

---

## 3. TODOs / stubs

- **Watchtower, Compliance, Audit agents**: In registry with `status: 'standby'` and minimal permissions. Visible on Forge map; logic not implemented (stub).
- **permissions.js**: `canAccess(agentId, resource)` only; extend from registry when role-based checks are needed.
- **Backend integration**: Core orchestrator and Sentinel/Titan are front-end only. To send user requests through this pipeline to the Brain API, wire `handleUserRequest` into the existing Brain call path (e.g. in core.js or brainLevel5.js) so that every user message goes Core → Sentinel → (optional Titan) → then to API; not done in this build.

---

## 4. Acceptance tests (manual)

1. **Forge map nodes**: Open app → click "Forge Map" in sidebar → confirm nodes: Core, Sentinel, Titan, Compliance, Audit (and Ops group). **Can execute.**
2. **System Status + Run Self-Test**: Open "System Status" → click "Run Self-Test" → must return PASS and show each check (registry_loads, sentinel_loaded, titan_invoke_present, forge_nodes_include_core_sentinel_titan, css_theme_loaded). **Can execute.**
3. **Request "Run a self-system test and report ecosystem"**: In System Status, use "Submit via Core" (with default or that text) → must return structured status + traceId in the pre block. **Can execute.**
4. **Request "Analyse this incident with uncertainty"**: Same panel, enter "Analyse this incident with uncertainty" → Submit via Core → must trigger Titan (titanOutput in result, titanReason shown). **Can execute.**
5. **Audit log**: Open "Audit Log" → must show request_received, sentinel_processed, titan_invoked (when applicable), response_sent after running tests 3 and 4. **Can execute.**

---

End of build notes.
