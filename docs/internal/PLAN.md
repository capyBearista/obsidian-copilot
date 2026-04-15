# Obsidian Copilot Free Fork Plan

## Purpose

This document defines the implementation and maintenance strategy for this fork:

- Keep behavior as close as possible to upstream `logancyang/obsidian-copilot`
- Remove paid/freemium barriers from the fork
- Preserve a low-conflict upstream sync path
- Keep maintenance lightweight for a primarily solo-maintainer workflow

This file is internal-only and intentionally untracked by Git.

## Product Direction (Locked Decisions)

- Priority order:
  1. Upstream parity where practical
  2. Remove paywalls and paid-feature gating
  3. Keep merge/update overhead low
- Upstream sync cadence: regular merges (approximately every 1-2 weeks)
- Maintenance model: lightweight
- Legal posture: balanced (clear fork attribution and separation)
- Plugin identity: new plugin id/name (`obsidian-copilot-free`)
- Distribution: GitHub Releases + BRAT
- Paid-backend-only UX: disable with clear messaging/tooltips
- Copilot Plus cloud models/provider: remove entirely from this fork
- Remove the Copilot Plus marketing/license banner from the Basic settings tab
- Make Autonomous Agent and Document Processor available without Plus licensing
- Keep Memory system disabled for now (explicit temporary decision)
- Scope guardrails:
  - avoid product redesign
  - avoid large refactors unrelated to de-paywalling
  - avoid provider behavior changes unless required by paywall removal
  - allow targeted cleanup when it reduces long-term merge conflicts

## Success Criteria

### 3-month outcomes

- Upstream updates can be integrated quickly with low conflict rates
- Paywall removals remain stable across releases
- No major regressions in free/BYOK workflows
- Issue volume remains manageable for a solo maintainer

### Technical acceptance criteria

- No runtime dependence on Copilot Plus cloud model/provider
- No license-key requirement for core plugin operation
- No upgrade/paywall CTA blocks in critical user flows
- Basic tab no longer contains Copilot Plus marketing/license-entry CTA section
- Users can remove built-in chat/embedding models and removals persist after reload
- Autonomous Agent and Document Processor are usable without paid entitlement checks
- Memory system is intentionally disabled (until a non-paywalled implementation is finalized)
- Settings from older installs migrate safely without crashes
- Build, lint, and tests pass after each major patch boundary

## User-Confirmed Scope (Plain-Language Mapping)

This section translates your direct product requirements into concrete implementation targets.

### REMOVE

#### Copilot Plus Banner

- Where: Basic settings tab top section
- Remove: marketing banner, license key entry, and Join Now CTA
- Files to target first:
  - `src/settings/v2/components/BasicSettings.tsx`
  - `src/settings/v2/components/PlusSettings.tsx` (if shared blocks are mounted from here)
  - `src/plusUtils.ts` (`navigateToPlusPage` usages)

#### Hardcoded Models (Non-removable built-ins)

- Where: Model tab -> Chat Models and Embedding Models
- Problem: removed models are re-added on reload (including Plus and other providers)
- Root cause area:
  - `src/settings/model.ts` (`mergeAllActiveModelsWithCoreModels`, `mergeActiveModels`)
  - built-in/core model flags in `src/constants.ts`
- Decision:
  - stop forced re-seeding of non-essential built-ins
  - preserve runtime safety via fallback selection logic, not persistent forced model re-add

### UN-PAYWALL

#### Plus Tab Features (overall)

- Convert from paywalled framing to normal feature controls
- Remove "Plus Required" messaging and license-coupled UX from feature access

#### Autonomous Agent

- Treat as high-value target and unblock for all users
- Remove entitlement checks and Plus-only gates in chain/tool execution paths

#### Document Processor

- Un-paywall and keep available
- If upstream paid backend path is unavailable, route to existing self-host/local processing where possible
- Evaluate Docling integration as fallback if needed for parity

#### Memory System

- Temporarily disable in fork (feature-flag off/hide controls)
- Revisit after core de-paywall and model/provider cleanup stabilizes

## High-Level Architecture Strategy

Use a narrow patch-layer model on top of regular upstream merges.

### Branch model

- `upstream-mirror` (or equivalent): tracks upstream cleanly
- `master` (fork default): integrated fork branch
- Optional short-lived patch topic branches per boundary (recommended)

### Patch boundary principle

Concentrate divergence into a small set of files/modules:

- identity/link abstraction
- model/provider registry changes
- entitlement/paywall checks
- paid-only UI surfaces
- docs/release metadata

This keeps merge conflict hotspots predictable and easier to resolve.

## Deterministic Execution Protocol (Authoritative)

This document is intended to be executable, not aspirational.
If any section conflicts with this protocol, this protocol wins.

### Global Rules

1. Execute phases in strict order: `P0 -> P1 -> P2 -> P3 -> P4 -> P5 -> P6`.
2. Never start `Pn+1` until all exit gates in `Pn` pass.
3. Keep one focused branch per phase (`phase/pN-<slug>` recommended).
4. Do not expand scope outside listed tasks for the active phase.
5. After each phase, run the quality gate commands and fix failures before moving on.
6. Update this plan's execution log at the end of every completed phase.

### Locked Defaults (No Ambiguity)

- Keep internal `ChainType.COPILOT_PLUS_CHAIN` naming for v1 compatibility (do not rename now).
- Keep `copilot/...` vault folder defaults for v1 compatibility (do not migrate now).
- If a paid-backend-dependent capability has no local/BYOK replacement, disable it with clear UX.
- Memory system remains disabled in v1.
- Copilot Plus cloud provider/models are removed completely (not hidden, not disabled placeholders).

### Quality Gate (Required After Every Phase)

- `npm run format`
- `npm run lint`
- `npm run test`

### Manual Smoke Gate (Required After P2, P4, P5)

- Open plugin settings and verify relevant tabs render without errors.
- Send at least one chat message in normal mode and verify response completes.
- Verify no upgrade/paywall modal appears in covered flows.

### Execution Log Template

Use this format when recording progress in this file:

```text
Phase: Pn
Date:
Branch:
Status: PASS | FAIL
Summary:
Quality Gate: PASS | FAIL
Manual Smoke Gate (if required): PASS | FAIL
Notes:
```

## Deterministic Phase Checklist (Strict Order)

### P0 - Baseline and Safety Net

#### Tasks (in order)

- [ ] `P0-T01` Confirm remotes and branch health (`origin`, `upstream`, clean working tree expectation documented).
- [ ] `P0-T02` Run baseline quality gate and capture failures (if any).
- [ ] `P0-T03` Create baseline note at `docs/internal/reports/P0-baseline.md` with command output summary.

#### Exit Gate

- [ ] Baseline report exists and is human-readable.
- [ ] Known pre-existing failures are separated from fork-change failures.

### P1 - Identity and Update Channel Separation

#### Tasks (in order)

- [ ] `P1-T01` Update plugin identity metadata (`manifest.json`, `package.json`, `package-lock.json`).
- [ ] `P1-T02` Replace hardcoded plugin-id runtime references:
  - `src/settings/SettingsPage.tsx`
  - `src/components/chat-components/ChatControls.tsx`
  - `src/settings/v2/SettingsMainV2.tsx`
  - `src/components/chat-components/NewVersionBanner.tsx`
- [ ] `P1-T03` Update release/version URLs to fork repo in:
  - `src/utils.ts`
  - `src/components/chat-components/NewVersionBanner.tsx`
  - `src/settings/v2/components/LocalServicesSection.tsx`
- [ ] `P1-T04` Replace user-facing upstream support links in docs that must point to fork-owned channels.

#### Exit Gate

- [ ] No active code path references `obsidian://show-plugin?id=copilot`.
- [ ] No active code path uses `getPlugin("copilot")` or `openTabById("copilot")`.
- [ ] Update checks target fork release source.

### P2 - Remove Copilot Plus Cloud Models and Fix Model Persistence

#### Tasks (in order)

- [ ] `P2-T01` Remove Plus chat/embedding provider and model definitions from `src/constants.ts`.
- [ ] `P2-T02` Remove Plus provider wiring from:
  - `src/LLMProviders/chatModelManager.ts`
  - `src/LLMProviders/embeddingManager.ts`
- [ ] `P2-T03` Remove required-model dependence on `copilot-plus-flash` in `src/utils/modelUtils.ts`.
- [ ] `P2-T04` Implement migration fallback in `src/settings/model.ts` for legacy Plus model keys.
- [ ] `P2-T05` Replace forced built-in model reseeding behavior:
  - if user removed a built-in model, do not re-add it on reload
  - preserve startup safety by selecting a valid fallback model key when needed
- [ ] `P2-T06` Add/update tests for migration and model-persistence behavior.

#### Exit Gate

- [ ] Copilot Plus cloud provider/models are not present in runtime selection or instantiation paths.
- [ ] Legacy settings containing Plus model keys migrate safely.
- [ ] Removing built-in chat/embedding models persists across restart/reload.

### P3 - Remove Entitlement and Runtime Paywall Gates

#### Tasks (in order)

- [ ] `P3-T01` Remove license/entitlement gating in `src/plusUtils.ts` for non-billing-critical paths.
- [ ] `P3-T02` Remove Plus-only gate behavior in chain runners:
  - `src/LLMProviders/chainRunner/CopilotPlusChainRunner.ts`
  - `src/LLMProviders/chainRunner/AutonomousAgentChainRunner.ts`
  - `src/LLMProviders/chainRunner/utils/toolExecution.ts`
- [ ] `P3-T03` Remove command-level paywall checks in `src/commands/index.ts`.
- [ ] `P3-T04` Remove/neutralize hardcoded upgrade messaging in runtime restriction text.

#### Exit Gate

- [ ] Core execution paths no longer require Plus license state.
- [ ] Any remaining failures are capability/config-based, not subscription-based.

### P4 - Remove Paywall Marketing UI and Un-paywall Target Features

#### Tasks (in order)

- [ ] `P4-T01` Remove Basic-tab Copilot Plus banner/license/Join Now block in `src/settings/v2/components/BasicSettings.tsx`.
- [ ] `P4-T02` Rework `src/settings/v2/components/PlusSettings.tsx`:
  - remove Plus marketing framing and "Plus Required" labeling
  - keep Autonomous Agent controls available
  - keep Document Processor controls available
  - hide/disable Memory controls with explicit temporary-disabled messaging
- [ ] `P4-T03` Remove Plus modal surfaces:
  - `src/components/modals/CopilotPlusWelcomeModal.tsx`
  - `src/components/modals/CopilotPlusExpiredModal.tsx`
- [ ] `P4-T04` Remove mode-selector upsell behavior in `src/components/chat-components/ChatControls.tsx`.
- [ ] `P4-T05` Clean remaining plus-labeled copy in:
  - `src/components/chat-components/SuggestedPrompts.tsx`
  - `src/components/modals/YoutubeTranscriptModal.tsx`
  - `src/components/chat-components/ChatSettingsPopover.tsx`

#### Exit Gate

- [ ] Basic tab contains no Copilot Plus CTA/license-entry UI.
- [ ] Autonomous Agent works without license checks.
- [ ] Document Processor is accessible without license checks.
- [ ] Memory is intentionally disabled and clearly labeled as such.

### P5 - Backend-Dependent Capability Handling

#### Tasks (in order)

- [ ] `P5-T01` Build capability matrix for paid-backend-dependent paths in `docs/internal/reports/P5-capability-matrix.md`.
- [ ] `P5-T02` For each path, apply one deterministic action: `replace`, `disable-with-message`, or `remove`.
- [ ] `P5-T03` Patch backend-dependent files accordingly:
  - `src/tools/SearchTools.ts`
  - `src/tools/YoutubeTools.ts`
  - `src/mentions/Mention.ts`
  - `src/tools/FileParserManager.ts`
  - `src/components/modals/YoutubeTranscriptModal.tsx`
  - `src/LLMProviders/projectManager.ts`
  - `src/search/hybridRetriever.ts`
  - `src/LLMProviders/brevilabsClient.ts`
- [ ] `P5-T04` If document parsing parity is still missing after local/self-host routes, evaluate Docling fallback and document decision.

#### Exit Gate

- [ ] No hidden runtime dependency remains on unavailable paid backend without graceful handling.
- [ ] Every affected feature has an explicit and documented behavior in fork.

### P6 - Documentation and Public Positioning

#### Tasks (in order)

- [ ] `P6-T01` Update public docs to match fork behavior:
  - `README.md`
  - `docs/getting-started.md`
  - `docs/chat-interface.md`
  - `docs/context-and-mentions.md`
  - `docs/agent-mode-and-tools.md`
  - `docs/models-and-parameters.md`
  - `docs/troubleshooting-and-faq.md`
  - `docs/copilot-plus-and-self-host.md`
- [ ] `P6-T02` Ensure support/issue/release links point to fork-owned channels.
- [ ] `P6-T03` Add clear fork attribution and scope statement (what is removed, what is free, what is disabled).

#### Exit Gate

- [ ] Public docs accurately describe shipped behavior.
- [ ] No public doc implies upstream paywall behavior that no longer exists in fork.

## Risk Register

### High risk

- `src/constants.ts`: centralized enums/config means wide ripple effects
- `src/LLMProviders/chatModelManager.ts`: provider instantiation and credentials
- `src/LLMProviders/embeddingManager.ts`: embedding provider behavior and migration impact
- `src/plusUtils.ts`: many cross-file dependencies

### Medium risk

- chain runner gating changes and tool execution checks
- settings migration edge cases
- project-mode context processing paths using old backend assumptions

### Low risk

- URI/link replacements
- branding text updates
- isolated UI copy fixes

## Compatibility Policy

### Keep for compatibility (initially)

- `copilot` storage folder conventions in vault paths
- command IDs containing `copilot` (hotkey/config stability)
- index/cache naming conventions

### Rename now

- plugin id/name and distribution metadata
- external release/docs/support links

### Rename later (optional)

- internal string identifiers only if needed and low-risk

## Upstream Sync Runbook

### Regular cycle (recommended every 1-2 weeks)

1. Fetch upstream and merge into fork integration branch
2. Resolve conflicts with patch-boundary-first strategy
3. Re-apply/verify fork boundary changes:
   - identity/links
   - provider/model removals
   - entitlement/paywall removals
   - docs and release metadata
4. Run quality checks:
   - `npm run format`
   - `npm run lint`
   - `npm run test`
5. Smoke-test critical flows:
   - mode switching
   - model selection and chat send
   - vault QA and project flows
   - context file handling
6. Cut release and publish BRAT-compatible assets

## Operational Checklist Per Release

- [ ] Upstream merged and conflicts resolved
- [ ] No Copilot Plus cloud model/provider in runtime or UI
- [ ] No paywall/upgrade gates in primary flows
- [ ] Basic tab has no Copilot Plus banner/license/Join Now block
- [ ] Built-in model removals persist after reload (no forced re-add)
- [ ] Autonomous Agent and Document Processor are available without license checks
- [ ] Memory system remains intentionally disabled (until reintroduced)
- [ ] Plugin id and update links point to fork
- [ ] Docs updated for behavior changes
- [ ] Build/lint/tests pass
- [ ] Release artifacts published

## Deterministic Verification Matrix

These checks are mandatory and map directly to the user-requested outcomes.

### V1 - Basic Tab Paywall Banner Removal

- [ ] Open settings -> Basic tab.
- [ ] Confirm there is no Copilot Plus marketing banner.
- [ ] Confirm there is no Plus license entry box.
- [ ] Confirm there is no "Join Now" CTA.

### V2 - Hardcoded Model Persistence Fix

- [ ] In Model tab, remove at least one built-in chat model (non-selected) and save.
- [ ] In Model tab, remove at least one built-in embedding model (non-selected) and save.
- [ ] Restart Obsidian (or reload plugin) and re-open settings.
- [ ] Confirm removed models are still removed (not auto-reseeded).
- [ ] Confirm selected chat model key is valid.
- [ ] Confirm selected embedding model key is valid.

### V3 - Copilot Plus Cloud Provider/Model Removal

- [ ] Confirm no Copilot Plus provider appears in model/provider selectors.
- [ ] Confirm no `copilot-plus-*` model appears in chat or embedding model lists.
- [ ] Confirm startup does not fail when existing settings contain old Plus model keys.

### V4 - Autonomous Agent Un-paywalled

- [ ] Open the feature controls where Autonomous Agent is configured.
- [ ] Confirm it is not blocked by license or upgrade messaging.
- [ ] Enable and run a basic agentic task path.
- [ ] Confirm execution succeeds or fails for technical reasons only (not paywall reasons).

### V5 - Document Processor Un-paywalled

- [ ] Open Document Processor controls.
- [ ] Confirm controls are not blocked by Plus license checks.
- [ ] Parse at least one supported file (PDF minimum).
- [ ] Confirm output behavior matches configured expectations.

### V6 - Memory System Temporarily Disabled

- [ ] Confirm Memory controls are hidden or disabled.
- [ ] Confirm UI explicitly states memory is temporarily disabled in this fork.
- [ ] Confirm no runtime errors are produced by disabled memory code paths.

### V7 - No Upgrade CTA Leakage

- [ ] Traverse settings tabs and major chat UI controls.
- [ ] Confirm no pricing/upgrade redirect is triggered.
- [ ] Confirm no Plus expired/welcome modal appears in normal use.

## Rollback Rules (Deterministic)

If any phase fails exit gate:

1. Stop progression immediately.
2. Revert only the failing phase branch changes.
3. Re-implement phase with smaller commits grouped by task ID.
4. Re-run full phase gate.
5. Continue only after PASS.

## Execution Log

Phase: P0
Date:
Branch:
Status: NOT STARTED
Summary:
Quality Gate:
Manual Smoke Gate (if required):
Notes:

Phase: P1
Date:
Branch:
Status: NOT STARTED
Summary:
Quality Gate:
Manual Smoke Gate (if required):
Notes:

Phase: P2
Date:
Branch:
Status: NOT STARTED
Summary:
Quality Gate:
Manual Smoke Gate (if required):
Notes:

Phase: P3
Date:
Branch:
Status: NOT STARTED
Summary:
Quality Gate:
Manual Smoke Gate (if required):
Notes:

Phase: P4
Date:
Branch:
Status: NOT STARTED
Summary:
Quality Gate:
Manual Smoke Gate (if required):
Notes:

Phase: P5
Date:
Branch:
Status: NOT STARTED
Summary:
Quality Gate:
Manual Smoke Gate (if required):
Notes:

Phase: P6
Date:
Branch:
Status: NOT STARTED
Summary:
Quality Gate:
Manual Smoke Gate (if required):
Notes:

## Open Questions to Resolve During Execution

- Should `ChainType.COPILOT_PLUS_CHAIN` be renamed or retained internally for compatibility?
- Which backend-dependent features should be fully removed vs disabled placeholders?
- Whether to keep any Brevilabs-dependent non-paywall functionality if technically useful
- Whether to keep all `copilot` vault folder defaults permanently or migrate later

## Practical First Implementation Slice

To minimize risk and unblock progress quickly, implement in this order:

1. Identity and update link separation
2. Remove Plus cloud providers/models + settings migration fallback
3. Remove runtime entitlement gates
4. Remove paywall UI/modals
5. Patch backend-dependent unavailable features
6. Update docs and release workflow references

This ordering front-loads structural blockers and reduces downstream churn.
