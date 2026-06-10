# Changelog

## v0.90 — 2026-06-10

Changed:

- Disposable manual QA checklist now includes current safe error-state checks.
- QA runbook, extension README, and test-plan wording now match the current Smart Groups Dashboard instead of the older Latest Result flow.
- Smoke coverage now guards that the manual QA checklist includes the new error-state coverage.

Safety:

- This is QA tooling and documentation alignment only. It does not change extension runtime behavior, move tabs, close tabs, read page content, call AI, upload data, add analytics, or request new permissions.

## v0.89 — 2026-06-10

Changed:

- Side panel organize errors now include an explicit safe-state note that no tabs were moved or closed.
- Dashboard now renders stored organize errors as a compact glass error card instead of treating them like an empty workspace.
- Smoke coverage now guards English/Chinese error copy and verifies the error cards stay non-destructive.

Safety:

- This is a UI-only error-state polish. It does not move tabs, close tabs, read page content, call AI, upload data, add analytics, change duplicate policy, or request new permissions.

## v0.88 — 2026-06-10

Changed:

- Dashboard Duplicate Center rows now expand to show the duplicate tabs from the latest sanitized local snapshot.
- Duplicate tab rows include a safe `Open tab` action that focuses the existing browser tab for review.
- Runtime smoke now expands Dashboard Duplicate Center and verifies a duplicate tab can be focused without closing anything.

Safety:

- Duplicate Center details are read-only and non-destructive. They do not close tabs, read page content, call AI, upload data, add analytics, or request new permissions.

## v0.87 — 2026-06-10

Changed:

- Dashboard Smart Group cards now let users expand the `+ N tabs` row to reveal the remaining local tab rows.
- Expanded rows reuse the normal Dashboard tab title focus, Move, and drag/drop affordances.
- Smoke coverage now guards that hidden tab rows are expandable instead of becoming a dead `+ N tabs` label.

Safety:

- This is a local UI reveal only. It uses the latest sanitized run snapshot and does not read page content, call AI, upload data, move tabs automatically, close tabs, add analytics, or request new permissions.

## v0.86 — 2026-06-10

Changed:

- Added compact Dashboard Undo and Restore Closed actions to the Smart Groups toolbar.
- Dashboard action buttons enable only when the latest local run says an Undo snapshot or closed-tab restore snapshot is available.
- Runtime smoke now clicks Dashboard Restore Closed and Dashboard Undo from the real Dashboard page and verifies both actions through Chrome/local run state.

Safety:

- Dashboard Undo/Restore reuse the existing `UNDO_LAST` and `RESTORE_CLOSED_DUPLICATES` background actions. They do not close tabs directly, create groups, read page content, call AI, upload data, add analytics, or request new permissions.

## v0.85 — 2026-06-10

Changed:

- Added lightweight Dashboard drag/drop tab assignment between existing native groups in the same Chrome window.
- Draggable tab rows now use the same `APPLY_DASHBOARD_TAB_MOVE` background action as the folded Move control, so native Chrome tab groups are updated directly.
- Runtime smoke now opens the Dashboard page, dispatches a real drag/drop flow, and verifies the moved tab's native group through Chrome APIs.

Safety:

- Drag/drop is explicit user interaction and reuses the existing same-window backend guard plus Undo snapshot. It does not create new groups, move tabs across windows, close tabs, read page content, call AI, upload data, add analytics, or request new permissions.

## v0.84 — 2026-06-10

Changed:

- Added a local Sidebar Agent next-step answer for prompts such as `what should I do next`, `what next`, and `下一步`.
- The answer prioritizes duplicate review when review groups exist, then Restore Closed guidance, then practical use of the new groups.
- Runtime smoke now verifies the next-step answer renders in the real Sidebar composer.

Safety:

- Next-step answers read only the latest local organize state. They do not read page content, call AI, upload data, request permissions, move tabs, close tabs, or change privacy/default duplicate behavior.

## v0.83 — 2026-06-10

Changed:

- Added a local Sidebar Agent capability/help answer for prompts such as `what can you do`, `help`, and `你能做什么`.
- The help answer explains the currently wired MVP actions: organize tabs, explain results, review duplicates, restore closed duplicates, find/open tabs, current-page summary/Q&A, and safe Chat Refine previews.
- Runtime smoke now verifies the capability answer renders in the real Sidebar composer.

Safety:

- Help answers are static local copy. They do not read page content, call AI, upload data, request permissions, move tabs, close tabs, or change privacy defaults.

## v0.82 — 2026-06-10

Changed:

- Sidebar quick action chips now route through the same chat command path as typed commands.
- Clicking Organize, Ask page, Undo, Restore, or Dashboard in the side panel adds a user message and Agent reply to the local chat thread.
- Runtime smoke now verifies the Ask page quick action enters the message thread instead of bypassing chat.

Safety:

- This is a UI routing change only. It reuses existing actions, confirmations, and local-only message state. No new permissions, cloud storage, AI calls, analytics, page-body storage, or tab-closing behavior changed.

## v0.81 — 2026-06-10

Changed:

- Sidebar composer responses now render into an ephemeral multi-message chat thread instead of replacing the previous answer.
- User messages render as right-aligned chat bubbles and Agent replies render as left-aligned message cards.
- Older Apply/Cancel buttons are disabled when a newer draft appears or a draft is cancelled, so stale action buttons cannot apply the wrong draft.
- Runtime smoke verifies the Sidebar preserves both user and Agent messages after a page question.

Safety:

- The chat thread is local and in-memory for the current side panel session. It does not add cloud chat history, analytics, page-body storage, new permissions, AI calls, or tab-closing behavior.

## v0.80 — 2026-06-10

Changed:

- Added a local current-page question flow for prompts such as `ask page: what does this page say about tabs`.
- The Sidebar Agent extracts the question, keeps the existing current-page privacy check, and renders the question plus a local answer in the chat summary card.
- The background summary path now accepts an optional question and answers from visible page text using local sentence matching.
- Smoke coverage now verifies local page Q&A with synthetic page text, and runtime smoke verifies page questions render in the real Sidebar composer.

Safety:

- This is local extractive page Q&A only. It reuses the user-triggered current-tab summary permission path and sensitive-page confirmation. It does not add AI calls, cloud upload, multi-tab page reading, new permissions, analytics, or tab-closing behavior.

## v0.79 — 2026-06-10

Changed:

- Current-page summary results now render as a Sidebar Agent chat message instead of the old separate summary panel.
- The legacy summary panel stays hidden so the side panel remains a single-message-flow interface.
- Runtime smoke now verifies `summarize this page` returns a chat summary response and keeps the legacy summary panel hidden.

Safety:

- Reuses the existing current-tab summary permission flow and sensitive-page confirmation. No page body is read without a user action, no AI call or cloud upload was added, and no extension permissions or tab-closing behavior changed.

## v0.78 — 2026-06-10

Changed:

- Added Sidebar Agent read-only answers for duplicate review queues and closed duplicate tabs available to restore.
- Runtime smoke now opens a synthetic same-page hash duplicate pair, asks `what did you close` and `what needs review` through the real Sidebar composer, and verifies both answers.
- Fixed runtime test tab creation to URL-encode CDP `/json/new` targets so hash/query duplicate scenarios are represented correctly.

Safety:

- Answers use only latest local run metadata and the existing local Restore Closed snapshot. They avoid rendering full restore URLs and do not read page bodies, call AI, move tabs, close tabs, save workspaces, upload data, request new permissions, or change duplicate-close policy.

## v0.77 — 2026-06-10

Changed:

- Added Sidebar Agent read-only answers for active-tab state, protected-tab state, and possible read-later candidates from the latest local snapshot.
- Runtime smoke now submits `what tab am I on`, `protected tabs`, and `read later` through the real Sidebar composer.
- Smoke coverage now guards the new local-only answer path and English/Chinese copy.

Safety:

- These answers use only sanitized local run metadata. They do not read page bodies, call AI, move tabs, close tabs, save workspaces, upload data, request new permissions, or change duplicate-close policy.

## v0.76 — 2026-06-10

Changed:

- Added Sidebar Agent tab search from the latest local snapshot for commands such as `find github`, `open chrome docs`, or `找 GitHub`.
- Search results render as message-card tab rows with an `Open tab` action that focuses an existing browser tab.
- Runtime smoke now submits `find github` through the real Sidebar composer and verifies the Open action focuses a matching GitHub tab.

Safety:

- Tab search uses only the latest sanitized local run snapshot and the existing focus-tab action; it does not read page bodies, call AI, create tabs, close tabs, move tabs, request new permissions, upload data, or change privacy defaults.

## v0.75 — 2026-06-10

Changed:

- Added read-only Sidebar Agent answers for latest organize overview, current groups, duplicate handling, and AI classification status.
- Runtime smoke now submits `show groups` and `did AI classify this?` through the real Sidebar composer after an organize run.

Safety:

- Answers are generated from the latest local run state only; no page body reading, AI call, tab movement, tab closing, new permissions, analytics, or cloud storage changed.

## v0.74 — 2026-06-10

Changed:

- Added a direct command router to the Sidebar composer so typed commands can trigger current-page summary, organize again, Undo, Restore Closed, and Open Dashboard.
- Added English/Chinese agent response copy for those direct commands.
- Updated smoke coverage so direct composer commands run before the older chat-refine preview path.
- Extended Chrome runtime smoke to submit commands through the real Sidebar composer and verify Dashboard open, current-page summary response, Restore Closed, Undo, and Organize Again.

Safety:

- Uses existing sidebar actions and current-tab summary privacy checks; no new permissions, no multi-tab page reading, no cloud page-body upload, no analytics, and no automatic non-duplicate tab closing changed.

## v0.73 — 2026-06-09

Changed:

- Reworked the side panel into a ChatGPT-style Tab Agent surface with a conversation thread, compact action chips, and a bottom composer.
- Kept organize output as an agent message instead of a dashboard-like result panel.
- Moved side-panel quick actions into a lightweight agent message card and hid technical lists from the default chat surface.
- Removed Dashboard homepage clutter: Latest Result, timestamp, Current Workspace card, and result metrics area are no longer shown.
- Reworked Dashboard into a lighter glass Smart Groups page with compact navigation, simplified Settings, folded Duplicate Center, and lower-noise Smart Group cards.
- Wired Dashboard tab rows to sanitized local `favIconUrl` data so real tab favicons render when Chrome provides them, with letter fallback only when unavailable.
- Folded Dashboard group edit controls and per-tab move controls behind small contextual entries instead of showing every control by default.
- Added smoke coverage to prevent the side panel from regressing into a result panel and Dashboard from regressing into Latest Result/current-workspace clutter.
- Updated beta readiness evidence checks so they accept the current smoke-test count instead of requiring a stale fixed number.

Safety:

- UI hierarchy and local display metadata change only; no extension permissions, AI payload fields, storage defaults, analytics upload, cloud storage, or automatic tab-closing policy changed.
- Existing Undo/Restore, title/color Apply, same-window tab move, tab focus, AI status, privacy confirmation, diagnostics, and local reset behavior remain wired.

## v0.72 — 2026-06-09

Changed:

- Added `05_PROJECT/11_SELF_TEST_GUIDE.md`, a beginner-friendly self-test guide for disposable QA profile testing, optional DeepSeek testing, and real Chrome profile testing.
- Linked the guide from README and INDEX.
- Extended beta readiness check to require the self-test guide and its controlled-beta/public-launch boundary.

Safety:

- Documentation/readiness update only; no extension runtime behavior, permissions, AI payloads, storage defaults, cloud upload, analytics, or tab-closing policy changed.
- The guide keeps the safest path first: disposable QA profile before any real Chrome profile testing.

## v0.71 — 2026-06-09

Changed:

- Added beta readiness check to GitHub Actions after release package verification.
- Added CI syntax checks for `tools/beta_readiness_check.js`, `tools/open_manual_qa_profile.js`, and `tools/capture_ui_screenshots.js`.
- Updated README, index, test plan, QA evidence, and private beta handoff to document CI readiness coverage.

Safety:

- CI/documentation update only; no extension runtime behavior, permissions, AI payloads, storage defaults, cloud upload, analytics, or tab-closing policy changed.
- CI readiness reads generated package metadata and local docs only; it does not call DeepSeek or open Chrome.

## v0.70 — 2026-06-09

Changed:

- Added `tools/beta_readiness_check.js` to turn the current launch-readiness judgment into a local, repeatable check.
- Preflight now runs the beta readiness check after package verification.
- Updated beta release notes, QA evidence, handoff, README, index, and test plan with the current controlled-beta/public-launch boundary.

Safety:

- Readiness tooling and documentation update only; no extension runtime behavior, permissions, AI payloads, storage defaults, cloud upload, analytics, or tab-closing policy changed.
- The readiness check reads local docs and package metadata only; it does not call the network or touch browser profiles.

## v0.69 — 2026-06-09

Changed:

- Extended Chrome runtime smoke coverage to verify safe duplicate auto-close and Restore Closed with synthetic duplicate tabs.
- Runtime smoke now confirms Restore Closed clears restore availability, increases the open tab count, and reopens the synthetic duplicate URL.
- Updated runtime evidence in README, extension README, Test Plan, Private Beta Handoff, and QA Evidence.

Safety:

- Test/documentation update only; no extension runtime behavior, permissions, AI payloads, storage defaults, cloud upload, analytics, or tab-closing policy changed.
- The added runtime check uses a temporary Chrome profile and synthetic URLs only.

## v0.68 — 2026-06-09

Changed:

- Added local QA notes to the disposable Manual QA Checklist.
- Copied Markdown QA reports now include the tester's local notes, while reset clears both checklist state and notes.
- Extended smoke coverage and QA docs so the notes field stays part of the private-beta manual QA workflow.

Safety:

- QA tooling and documentation update only; no extension runtime behavior, permissions, AI payloads, storage defaults, cloud upload, analytics, or automatic tab-closing policy changed.
- Notes are stored only in the disposable QA profile localStorage and are never uploaded by the tool.

## v0.67 — 2026-06-09

Changed:

- Updated the disposable Manual QA Checklist to match the current MVP Dashboard behavior: Latest Result benefit summary, Review duplicates, Undo, Smart Group filters, tab focus, same-window tab move, and title/color apply.
- Replaced stale `Dashboard metrics` QA wording with `Dashboard Latest Result Details` where AI status is now surfaced.
- Added smoke coverage that prevents the disposable checklist from losing current MVP workflow checks.
- Updated README, extension README, QA Runbook, Private Beta Handoff, Test Plan, and QA Evidence.

Safety:

- QA tooling and documentation update only; no extension runtime behavior, permissions, AI payloads, storage defaults, cloud upload, analytics, or automatic tab-closing policy changed.
- The disposable QA profile still uses synthetic tabs and does not read the user's real Chrome profile, real tabs, or `.env.local`.

## v0.66 — 2026-06-09

Changed:

- Refreshed private-beta evidence after running DeepSeek provider checks against the current `.env.local` configuration.
- Recorded the successful synthetic DeepSeek classification fixture result and the disposable manual QA profile self-test.
- Updated Private Beta Handoff to distinguish verified disposable-profile QA tooling from the still-required real-profile manual QA pass.

Safety:

- Evidence/documentation update only; no extension runtime behavior, permissions, AI payload shape, automatic tab-closing policy, storage behavior, or cloud upload changed.
- The DeepSeek classification check used synthetic tabs only and did not read the user's real Chrome profile or real browser tabs.

## v0.65 — 2026-06-09

Changed:

- Confirmed and implemented the Dashboard `Latest result` simplification from a metrics wall into a user-benefit summary.
- The Dashboard now leads with browser cleaned up, tabs organized into work groups, impact rows, Review duplicates, Undo, and a collapsed Details section for technical metrics.
- Added confirmed English/Chinese copy for organize impact, duplicate cleanup, review-needed items, and conservative memory-relief wording.
- Updated Dashboard spec, UX wireframe, copywriting, Decisions To Confirm, extension README, tests, and QA Evidence.

Safety:

- UI hierarchy change only; no extension permissions, AI payloads, analytics upload, cloud storage, automatic tab-closing policy, or data collection changed.
- Exact memory-saved numbers remain explicitly blocked until verified memory measurement or tab sleep/discard behavior exists.

## v0.64 — 2026-06-09

Changed:

- Made Dashboard Smart Groups tab titles actionable: clicking a tab title focuses the existing browser tab and its window.
- Added background `FOCUS_DASHBOARD_TAB` handling and runtime coverage that verifies the requested tab becomes active in a temporary Chrome profile.
- Added smoke coverage for Dashboard tab focus UI, localization, and non-destructive guardrails.
- Updated extension README, Dashboard spec, Test Plan, Private Beta Handoff, and QA Evidence.

Safety:

- Focus/open existing tab only; no tab closing, tab movement, grouping changes, page text reading, AI calls, storage writes, analytics upload, cloud storage, or new permissions were added.

## v0.63 — 2026-06-09

Changed:

- Wired Dashboard Smart Groups filter chips so `All`, `AI groups`, and `Rule groups` actually filter the board.
- Added an empty state for filters with no matching groups and `aria-pressed` state for the chip buttons.
- Added smoke coverage that prevents the filter chips from becoming visual-only again.
- Updated extension README, Dashboard spec, Test Plan, Private Beta Handoff, and QA Evidence.

Safety:

- UI filtering only; no browser tab changes, background actions, permissions, AI payloads, analytics upload, cloud storage, or tab-closing behavior changed.

## v0.62 — 2026-06-09

Changed:

- Added a compact Dashboard Smart Groups row control to move a tab into another existing group in the same window.
- Added background `APPLY_DASHBOARD_TAB_MOVE` handling that applies the move to real Chrome native tab groups and keeps Undo available.
- Added smoke coverage for the Dashboard tab move UI/guardrails and runtime coverage that verifies a real native tab group move in a temporary Chrome profile.
- Updated extension README, Dashboard spec, Test Plan, Private Beta Handoff, and QA Evidence.

Safety:

- Same-window existing-group move only; no drag/drop, new group creation, cross-window moves, tab closing, page text reading, cloud storage, analytics upload, or new permissions were added.
- Backend validates the live tab and target group before applying the move.

## v0.61 — 2026-06-09

Changed:

- Added timeout guardrails for DeepSeek/OpenAI-compatible `/models` and `chat/completions` requests.
- AI classification timeout or provider failure now falls back to local rules instead of leaving one-click organize waiting on the provider.
- Added smoke coverage that classification fetches carry an abort signal and that timeout fallback returns a safe local-rules result.
- Updated extension README, AI Provider Strategy, One-Click Autopilot, Test Plan, Private Beta Handoff, and QA Evidence.

Safety:

- Reliability-only change; no extension permissions, AI provider hosts, AI payload fields, analytics upload, cloud storage, automatic tab-closing policy, or product scope changed.
- Timeout fallback keeps the existing minimized tab metadata boundary and existing `fallback:*` AI status reporting.

## v0.60 — 2026-06-09

Changed:

- Simplified Dashboard default UI so users see only wired MVP actions: organize, refresh, group title/color Apply, rules, AI settings, and privacy defaults.
- Removed visible P1/prototype placeholder buttons from the Dashboard default view.
- Simplified Dashboard Settings: AI Classification and Privacy Defaults are visible first; permissions, diagnostics, feedback template, and local data reset are folded under advanced sections.
- Added smoke coverage that prevents unwired P1 placeholders from reappearing in the default Dashboard UI.
- Updated extension README, Dashboard spec, Test Plan, Private Beta Handoff, and QA Evidence with the wired/not-wired design prototype boundary.

Safety:

- UI simplification only; existing wired diagnostics, permission explanations, local data reset, AI key actions, and Dashboard Apply remain available.
- No extension permissions, AI provider hosts, AI payload fields, analytics upload, cloud storage, automatic tab-closing policy, or product scope changed.

## v0.59 — 2026-06-09

Changed:

- Reworked Dashboard from a basic settings-style page into the HTML prototype workbench layout: top bar, left project rail, current workspace card, action block, filter chips, and two-column Smart Group cards.
- Smart Group cards now render expanded local tab rows from the stored run snapshot and local group `tabIds`.
- Dashboard keeps existing wired behaviors: organize CTA, title/color Apply back to native tab groups, Rules & Memory enable/disable/delete, AI settings, diagnostics, and local data controls.
- Added a mobile Dashboard screenshot target and smoke coverage that guards the workbench prototype structure.
- Updated extension README, Dashboard spec, Test Plan, Private Beta Handoff, and QA Evidence.

Safety:

- Group `tabIds` are stored locally only for Dashboard UI mapping; no full URLs, restore URLs, page text, API keys, or cloud upload were added.
- No extension permissions, AI provider hosts, AI request payload fields, analytics upload, cloud storage, automatic tab-closing policy, or product scope changed.

## v0.58 — 2026-06-09

Changed:

- Expanded the disposable Manual QA Checklist with AI Verification items.
- Added a synthetic `billing-dashboard` QA tab for sensitive-summary confirmation testing without real sensitive sites.
- The manual QA launcher self-test now verifies that AI and sensitive-summary checklist content is present.
- Updated README, extension README, Test Plan, QA Runbook, Private Beta Handoff, and QA Evidence.

Safety:

- Synthetic QA URL only; no real browser profile, real tabs, `.env.local`, page content, or AI provider call is used by the launcher.
- No extension permissions, AI payload fields, provider hosts, analytics upload, cloud storage, or product scope changed.

## v0.57 — 2026-06-09

Changed:

- Sidebar Browser Result now shows AI status and AI suggested group count.
- Dashboard metrics and Settings Snapshot now show AI status and AI suggested group count.
- Added English/Chinese copy and mock screenshot data for the AI status metrics.
- Added smoke coverage that AI classification status is visible in both sidebar and dashboard.
- Updated extension README, AI Provider Strategy, Test Plan, Private Beta Handoff, and QA Evidence.

Safety:

- Display-only change based on existing local run summary fields.
- No new AI calls, permissions, provider hosts, AI payload fields, analytics upload, cloud storage, or product scope changed.

## v0.56 — 2026-06-09

Changed:

- Added a current-tab summary privacy check before visible text extraction.
- Sensitive pages now require an extra user confirmation before page body text is read.
- The background script re-checks the active tab and requires the confirmed tab ID before extraction.
- Added English/Chinese copy and smoke coverage for the sensitive-summary confirmation flow.
- Stabilized Chrome runtime smoke by waiting for extension APIs before sending runtime messages.
- Updated extension README, Privacy Controls, Security/Privacy Implementation, Test Plan, QA Runbook, Launch Checklist, Private Beta Handoff, and QA Evidence.

Safety:

- Cancelling the sensitive-page confirmation reads no page body.
- Current-tab summaries remain local and do not call the AI provider.
- No extension permissions, AI provider host, AI request payload, automatic tab-closing policy, analytics upload, cloud storage, or product scope changed.

## v0.55 — 2026-06-09

Changed:

- Hardened `currentRun` snapshot sanitization so raw URLs, full URLs, restore URLs, URL hashes, and page text are stripped before sidebar/dashboard UI state is stored.
- Added smoke coverage for current-run storage minimization and Undo snapshot minimization.
- Clarified that Restore Closed snapshots are the local-only exception because they need minimum restorable metadata.
- Updated Security/Privacy Implementation, Analytics Events, Test Plan, Launch Checklist, and QA Evidence.

Safety:

- Restore Closed behavior remains available and local-only.
- No extension permissions, AI provider host, AI request format, automatic tab-closing policy, analytics upload, cloud storage, or product scope changed.

## v0.54 — 2026-06-09

Changed:

- Manual QA Checklist now saves checkbox state in the disposable QA profile.
- Added Copy QA Result and Reset Checks controls to the local checklist page.
- `open_manual_qa_profile.js --self-test` now verifies the checklist, sidepanel, dashboard, and report controls.
- Updated README, extension README, Test Plan, QA Runbook, Beta Release Notes, and Private Beta Handoff.

Safety:

- Checklist state and generated QA report stay local to the disposable profile unless the tester explicitly copies it.
- No extension behavior, permissions, AI payload, analytics, storage backend, cloud upload, package contents, or product scope changed.

## v0.53 — 2026-06-09

Changed:

- Added `tools/open_manual_qa_profile.js` for disposable manual QA in a temporary Chrome for Testing / Chromium profile.
- Added `--dry-run` and `--self-test` modes for the disposable manual QA launcher.
- The launcher now opens a local Manual QA Checklist tab alongside synthetic QA tabs, sidepanel, and dashboard.
- Updated `tools/qa_seed_tabs.js` so seed URL sets can be reused by QA tooling.
- Added the manual QA launcher to preflight syntax checks.
- Updated README, INDEX, extension README, Test Plan, QA Runbook, Launch Checklist, Beta Release Notes, and Private Beta Handoff.

Safety:

- The manual QA launcher uses synthetic QA URLs and an ignored `artifacts/manual-qa-profiles/` profile.
- It does not read the user's real Chrome profile, real browser tabs, `.env.local`, or page content.
- No extension behavior, permissions, AI payload, analytics, storage, cloud upload, package contents, or product scope changed.

## v0.52 — 2026-06-09

Changed:

- Added `05_PROJECT/10_PRIVATE_BETA_HANDOFF.md` as the private beta handoff source of truth.
- Refreshed beta release notes with current runtime, screenshot, package, and DeepSeek fixture evidence.
- Updated README, INDEX, and Launch Checklist with the handoff entry point.

Safety:

- Documentation-only change.
- No extension behavior, permissions, AI payload, analytics, storage, cloud upload, package contents, or product scope changed.

## v0.51 — 2026-06-09

Changed:

- Chrome runtime smoke now auto-detects Playwright / Chrome for Testing / Chromium before falling back to system Google Chrome.
- Local runtime QA passed with a temporary Chrome for Testing profile and synthetic tabs.
- Updated README, extension README, Test Plan, Launch Checklist, and QA Evidence.

Safety:

- Runtime smoke uses a temporary browser profile and a copied unpacked extension directory.
- It does not read the user's real Chrome profile, real browser tabs, `.env.local`, or page content.
- No extension behavior, permissions, AI payload, analytics, storage, cloud upload, or product scope changed.

## v0.50 — 2026-06-09

Changed:

- Added `tools/capture_ui_screenshots.js` to generate sidebar and dashboard UI screenshots with mock extension data.
- Added optional `node tools/preflight.js --screenshots` support.
- Ignored generated `artifacts/` output so screenshots do not enter commits.
- Stabilized package generation by skipping unchanged icon writes and using zip extra-attribute exclusion.
- Updated README, INDEX, extension README, Test Plan, QA Runbook, and QA Evidence with the screenshot workflow.

Safety:

- Screenshot capture does not read real browser tabs or `.env.local`.
- The tool is optional and does not change extension permissions, product behavior, AI payloads, analytics, storage, cloud upload, or release packaging.

## v0.49 — 2026-06-09

Changed:

- Added Dashboard `Clear AI Key` for removing only the locally saved AI API key.
- The action disables AI classification, keeps local rules and recent results, asks for confirmation, and does not move or close tabs.
- Added English/Chinese copy and smoke coverage for the scoped AI key clearing flow.
- Updated privacy controls, test plan, QA runbook, and extension README.
- Refreshed QA evidence with 17 smoke tests, DeepSeek `/models`, synthetic classification fixture, preflight, release verifier, and current package checksum.

Safety:

- No permission, AI payload, analytics, storage backend, cloud storage, or automatic upload behavior changed.
- The new control is local-only and does not call the AI provider.

## v0.48 — 2026-06-09

Changed:

- Refreshed `05_PROJECT/08_QA_EVIDENCE.md` with current private-beta verification evidence.
- QA evidence now records 16 smoke tests, unified preflight, DeepSeek `/models`, release package verifier, package checksum, and current remaining evidence gaps.

Safety:

- Documentation-only evidence update.
- No product behavior, permissions, AI payload, analytics, storage behavior, or automatic upload path changed.
- QA evidence does not include API keys, real browsing data, full URLs from the user's browser, page text, or screenshots.

## v0.47 — 2026-06-09

Changed:

- Dashboard AI Settings now explains that the private beta supports only `api.deepseek.com`.
- Added English/Chinese copy and smoke coverage for the AI base URL host-limit hint.
- Updated Test Plan with the Dashboard AI host-limit copy check.

Safety:

- UI copy and test change only.
- No product behavior, permissions, AI payload, analytics, storage behavior, or automatic upload path changed.

## v0.46 — 2026-06-09

Changed:

- AI classifier client now sanitizes tab input before building the provider request body.
- Added smoke coverage for AI classification request minimization.
- The test verifies classifier payloads include only allowed tab metadata and exclude full URL, restore URL, query tokens, and page text.
- Updated Test Plan with classifier payload minimization coverage.

Safety:

- Privacy hardening only.
- The classifier payload is narrowed to title, hostname, path, window ID, and tab state.
- No permissions, analytics, storage behavior, or automatic upload path changed.

## v0.45 — 2026-06-09

Added:

- Added smoke coverage tying the AI host guardrail to the manifest host permission.
- The test now checks that background validation, Dashboard validation, Dashboard permission copy, and manifest host permissions all stay aligned on `https://api.deepseek.com/*`.
- Updated Test Plan with the AI host guardrail coverage.

Safety:

- Test/documentation change only.
- No product behavior, permissions, AI payload, analytics, storage behavior, or automatic upload path changed.

## v0.44 — 2026-06-09

Changed:

- Release package verifier now parses zip entries and rejects `.env*`, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata.
- Updated README, extension README, and Test Plan with the stricter package safety checks.

Safety:

- Release validation change only.
- No product behavior, permissions, AI payload, analytics, storage behavior, or automatic upload path changed.

## v0.43 — 2026-06-09

Changed:

- Private-beta AI base URL validation now permits only `https://api.deepseek.com` hosts, matching the current manifest host permission.
- DeepSeek requests still use the OpenAI-compatible request format, but arbitrary OpenAI-compatible hosts are deferred until a host-permission confirmation.
- Added smoke coverage to verify unsupported AI hosts fail before fetch.
- Updated AI provider strategy, privacy/paywall specs, Test Plan, beta release notes, Chrome Store draft, Backlog, launch docs, and extension README.

Safety:

- No broad host permission was added.
- Unsupported AI hosts do not trigger network requests.
- AI classification still sends only title, hostname, path, window ID, and tab state when explicitly enabled.

## v0.42 — 2026-06-09

Changed:

- Dashboard Rules & Memory now asks for confirmation before deleting a local rule.
- Added English/Chinese confirmation copy and smoke coverage for confirmed local rule deletion.
- Updated Dashboard and Rules specs, Test Plan, QA Runbook, and extension README.

Safety:

- Local rule deletion remains local-only and user-triggered.
- Delete confirmation states that the action does not move or close tabs.
- No product scope, permissions, AI payload, analytics, storage backend, or automatic upload behavior changed.

## v0.41 — 2026-06-09

Added:

- Added `tools/verify_release_package.js` to validate release zip, checksum, package manifest, required zip entries, and package safety flags using the current manifest version.
- Preflight now delegates release package checks to the shared verifier.
- CI now uses the shared release package verifier and uploads version-patterned release artifacts instead of hardcoded `0.1.0` paths.
- Updated README, extension README, INDEX, and Test Plan with the release package verifier.

Safety:

- Build and release validation change only.
- No product behavior, extension permissions, AI payload, privacy defaults, analytics, storage behavior, or automatic upload path changed.

## v0.40 — 2026-06-09

Added:

- Added `tools/issue_form_smoke_test.js` to validate private beta GitHub issue forms.
- Preflight and CI now check issue form structure, privacy redlines, required safety acknowledgements, and text rendering for pasted diagnostics or feedback.
- Updated README, INDEX, and Test Plan with the issue form smoke test.

Safety:

- Validation-only workflow change.
- No product behavior, permissions, AI payload, analytics, storage behavior, or automatic upload path changed.

## v0.39 — 2026-06-09

Added:

- Added privacy-safe GitHub issue forms for private beta bug reports and product feedback.
- Bug and feedback forms warn testers not to submit API keys, bearer tokens, cookies, full URLs, tab titles, page text, emails, private screenshots, or private rule patterns.
- Updated beta release notes, QA runbook, launch checklist, README, and INDEX with the issue form feedback path.

Safety:

- Documentation and repository workflow change only.
- Issue forms require manual review before submitting copied diagnostics or feedback text.
- No product behavior, permissions, AI payload, analytics, storage behavior, or automatic upload path changed.

## v0.38 — 2026-06-09

Added:

- Extension packaging now writes a SHA256 checksum file next to the beta zip.
- Extension packaging now writes a package manifest with version, package name, checksum, commit, generated time, included files, and safety flags.
- Preflight verifies package metadata exists and matches the generated checksum.
- CI uploads the zip, checksum, and package manifest as artifacts.

Safety:

- Package metadata is generated into ignored `dist/`.
- Package manifest explicitly records that env files are excluded.
- No product behavior, permissions, AI payload, analytics, or storage behavior changed.

## v0.37 — 2026-06-09

Added:

- Added `05_PROJECT/09_BETA_RELEASE_NOTES.md` for the v0.1.0 private beta.
- Release notes include install steps, included capabilities, privacy defaults, verified evidence, known limits, launch confirmation gates, and feedback path.
- Updated README, INDEX, and launch checklist with the beta release notes entry.

Safety:

- Documentation-only change.
- Release notes are marked private beta only, not public Chrome Web Store submission.
- No product behavior, permissions, AI payload, analytics, or storage behavior changed.

## v0.36 — 2026-06-09

Added:

- Added `tools/preflight.js` as a unified local verification entry point.
- Preflight runs secret scan, JavaScript syntax checks, extension smoke test, package generation, and zip env-file exclusion check.
- Optional `--deepseek`, `--deepseek-fixture`, and `--runtime` flags run provider or Chrome runtime checks explicitly.

Safety:

- Default preflight does not call DeepSeek, read real browser tabs, or launch Chrome.
- DeepSeek fixture mode uses synthetic tabs only.
- No product behavior, permissions, AI payload defaults, analytics, or storage behavior changed.

## v0.35 — 2026-06-09

Added:

- Added `tools/secret_scan.js` to scan git tracked files for unexpected `.env` files and real-looking API keys.
- Wired the secret scanner into GitHub Actions CI.
- Documented local secret scanning in README, INDEX, and Test Plan.

Safety:

- The scanner ignores local untracked `.env.local` but fails if it is ever tracked.
- The scanner allows known fake test keys while blocking realistic `sk-...` secrets.
- No product behavior, permissions, AI payload, analytics, or storage behavior changed.

## v0.34 — 2026-06-09

Added:

- Added GitHub Actions CI at `.github/workflows/ci.yml`.
- CI runs JavaScript syntax checks, extension smoke tests, package generation, and zip env-file exclusion checks.
- CI uploads the generated extension zip as an artifact.

Safety:

- CI does not run DeepSeek provider smoke because it requires a local secret.
- CI verifies no unexpected `.env` files are tracked.
- No product behavior, permissions, analytics, AI payload, or privacy defaults changed.

## v0.33 — 2026-06-09

Added:

- Added `05_PROJECT/08_QA_EVIDENCE.md` to record private-beta verification evidence without secrets or real browsing data.
- Recorded local DeepSeek `/models` verification and synthetic classification fixture results.
- Recorded extension smoke test and package env-exclusion results.

Safety:

- QA evidence does not include API keys, real browser tab data, full URLs from the user's browser, or screenshots.
- `.env.local` remains ignored and excluded from the extension zip.

## v0.32 — 2026-06-09

Added:

- Added `.env.example` for DeepSeek/OpenAI-compatible local configuration.
- Added `tools/deepseek_smoke_test.js` to validate `.env.local` provider settings.
- The provider smoke test defaults to `/models` only and does not send tab data.
- Optional `--classify-fixture` mode sends synthetic tabs only and validates the provider does not invent tab IDs.

Safety:

- `.env.local` is ignored by git and excluded from the extension zip.
- The smoke script never prints the API key.
- The default provider test does not read browser tabs, page text, full URLs, or local extension state.

## v0.31 — 2026-06-09

Added:

- Added Dashboard `Test AI Connection` for the optional DeepSeek/OpenAI-compatible provider.
- The test calls the configured `/models` endpoint to verify base URL, API key, and model availability.
- Smoke tests verify the connection test sends no tab data, full URLs, page text, or request body.
- Added local `.gitignore` coverage for `.env` / `.env.*`.

Safety:

- The connection test is user-triggered.
- It does not read tabs, page bodies, browsing history, or local summaries.
- It does not change groups, close tabs, upload diagnostics, or add permissions.

## v0.30 — 2026-06-09

Added:

- Added `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md` with non-final Chrome Web Store submission, permission justification, remote-code, data-use, Limited Use, privacy-policy, and listing-copy drafts.
- Marked store/privacy materials as `CONFIRM` and `DO NOT SUBMIT YET`.
- Updated sources with official Chrome Web Store policy, privacy, Limited Use, disclosure, and privacy-dashboard references.

Safety:

- Documentation-only change.
- No final Chrome Web Store disclosure was approved.
- No extension permission, data-sharing behavior, telemetry, AI provider behavior, billing, account, or cloud-storage behavior changed.

## v0.29 — 2026-06-09

Added:

- Added a local-only duplicate close safety audit for beta validation.
- The audit records only counts and whitelisted event types for safe duplicate close, manual review close, and Restore Closed outcomes.
- Dashboard diagnostics now include aggregate duplicate safety counts such as auto-closed tabs, manual review closes, restore requests, restored tabs, and failed restores.
- Smoke tests verify the audit does not include URLs, hostnames, tab titles, or arbitrary duplicate labels.

Safety:

- The audit stays in `chrome.storage.local`, is cleared by `Clear Local Data`, and appears only in user-copied diagnostics after redaction.
- No telemetry backend, automatic upload, browsing analytics, new permission, URL, tab title, hostname, page text, rule pattern, group name, or API key was added.

## v0.28 — 2026-06-09

Added:

- Added a local-only redacted error log ring buffer for extension failures.
- Dashboard diagnostics now include recent redacted error summaries and an error count.
- Clear Local Data now removes the local error log.
- Smoke tests verify local error entries and exported diagnostics redact URLs, hostnames, emails, bearer tokens, API keys, tab titles, page text, rule patterns, and group names.

Safety:

- Error logs are stored only in `chrome.storage.local`.
- No telemetry backend, automatic upload, browsing analytics, new permission, URL, tab title, page text, hostname, rule pattern, group name, or API key was added.

## v0.27 — 2026-06-09

Changed:

- Expanded the copied beta feedback template with explicit classification quality labeling.
- The template now asks testers to record total tabs, clearly right groups, acceptable-but-needs-adjustment groups, Review/Misc tabs, clearly wrong groups, dangerous close mistakes, Undo/Restore behavior, and rules TabMosaic should remember.
- Added smoke coverage for the English and Chinese 70/20/10/0 quality target copy.

Safety:

- Feedback remains user-triggered, clipboard-only, and local.
- No telemetry, automatic upload, browsing analytics, new permission, or product-scope behavior was added.

## v0.26 — 2026-06-09

Changed:

- Added manual QA steps for Dashboard beta diagnostics and feedback template copy flow.
- The runbook now explicitly fails QA if copied diagnostics or feedback include URLs, tab titles, hostnames, page text, rule patterns, group names, or API keys.
- Added result log fields for beta diagnostics and feedback template validation.

Safety:

- Documentation-only change.
- No extension permission, cloud upload, analytics, auto-close, or product scope behavior changed.

## v0.25 — 2026-06-09

Added:

- Added Dashboard `Copy Feedback Template` for beta testers.
- The copied Markdown template includes manual feedback prompts plus the redacted diagnostic snapshot.
- Feedback template supports English and Chinese UI language.
- Smoke tests verify the feedback template does not include URLs, tab titles, hostnames, rule patterns, group names, page text, or API keys.

Safety:

- Feedback template is user-triggered and copied locally.
- No form backend, analytics event, automatic upload, or new permission was added.

## v0.24 — 2026-06-09

Added:

- Added Dashboard `Beta Diagnostics` action to copy a redacted local QA snapshot for bug reports.
- Added `extension/diagnostics.js` with a tested sanitizer for diagnostic snapshots.
- Diagnostic snapshots include version, locale, manifest permissions, run counts, duplicate counts, rule count, AI enabled/provider/model, and privacy flags.
- Smoke tests now verify diagnostics exclude URLs, tab titles, hostnames, rule patterns, group names, page text, and API keys.

Safety:

- Diagnostics are user-triggered and copied locally to the clipboard.
- No analytics, network upload, new permission, URL, tab title, page text, or API key is added.

## v0.23 — 2026-06-08

Added:

- Added localized Dashboard Settings permission explanations.
- The UI now explains why `tabs`, `tabGroups`, `sidePanel`, `storage`, `scripting`, `activeTab`, and the DeepSeek host permission are present.
- Added explicit in-app note that TabMosaic does not request all URLs, history, bookmarks, cookies, webRequest, browsingData, or incognito access.

Safety:

- No permissions were added or broadened.
- The explanation mirrors the existing manifest and current privacy defaults.

## v0.22 — 2026-06-08

Added:

- Added Chinese Chat Refine command parsing for current-tab move, domain rule creation, and group rename examples.
- Added Chinese Chat Refine preview answer/action/risk copy when the user types Chinese.
- Added Chinese group color inference for common group names such as 阅读、文档笔记、设计、研究、会议、开发。
- Updated smoke coverage for Chinese Chat Refine examples.

Safety:

- Chinese Chat Refine stays local.
- It previews before Apply, does not read page body content, does not call AI, and does not close tabs.

## v0.21 — 2026-06-08

Added:

- Added first-pass English/Chinese Chrome extension localization using native `_locales`.
- Added `extension/i18n.js` for static HTML and runtime UI messages.
- Localized manifest name, description, and action title through `__MSG_*__`.
- Updated side panel and dashboard UI copy to use locale messages.
- Packaging now includes `_locales` and `i18n.js`.
- Smoke tests now verify locale parity and UI i18n references.

Verification:

- `node tools/extension_smoke_test.js`
- `node --check extension/i18n.js && node --check extension/sidepanel.js && node --check extension/dashboard.js`

## v0.20 — 2026-06-08

Added:

- Added Dashboard `Clear Local Data` in Settings.
- Added background `CLEAR_LOCAL_DATA` action to remove local run state, Undo/Restore snapshots, first-run privacy acceptance, AI settings/API key, user rules, and chat draft.
- Added smoke coverage for local data deletion.

Safety:

- Clear Local Data asks for browser confirmation.
- It does not close tabs, move tabs, delete browser history, delete cookies, or touch cloud account data.
- After clearing, first-run privacy onboarding appears again before the next organize.

Verification:

- `node tools/extension_smoke_test.js`
- `node --check extension/background.js && node --check extension/dashboard.js && node --check extension/sidepanel.js`

## v0.19 — 2026-06-08

Added:

- Added generated Chrome extension icon assets under `extension/icons/`.
- Added manifest `icons` and action `default_icon`.
- Added no-dependency asset generator at `tools/generate_extension_assets.js`.
- Added extension packaging script at `tools/package_extension.js`.
- Generated beta zip at `dist/tabmosaic-ai-extension-v0.1.0.zip`.
- Smoke test now verifies manifest icon references and icon files.

Verification:

- `node tools/generate_extension_assets.js`
- `node tools/package_extension.js`
- `node tools/extension_smoke_test.js`

## v0.18 — 2026-06-08

Changed:

- Chrome runtime smoke test now fast-skips branded Google Chrome when CLI unpacked extension loading is blocked.
- Added `CHROME_PATH` guidance for running runtime QA with Chrome for Testing or Chromium.
- Kept `ALLOW_GOOGLE_CHROME_CLI_EXTENSION=1` override for forced probing.

## v0.17 — 2026-06-08

Added:

- Added P0 manual QA runbook at `05_PROJECT/06_QA_RUNBOOK.md`.
- Added QA seed tabs helper at `tools/qa_seed_tabs.js`.
- Seed tabs helper prints test URLs by default and opens Chrome only with `--open`.
- Updated README, INDEX, Test Plan, and Launch Checklist with manual QA entry points.

Verification:

- `node tools/qa_seed_tabs.js`
- `node tools/extension_smoke_test.js`

## v0.16 — 2026-06-08

Added:

- Added no-dependency extension smoke test script at `tools/extension_smoke_test.js`.
- Smoke tests cover manifest permissions, one-click action constraints, Chat Refine parser, user-rule priority, duplicate safety policy, and AI output validation.
- Added optional Chrome runtime smoke test at `tools/chrome_runtime_smoke_test.js`.
- Runtime smoke test attempts to launch a temporary Chrome profile, load the unpacked extension, organize real test tabs, apply Chat Refine, and apply Dashboard group updates.

Verification:

- `node tools/extension_smoke_test.js`
- `node tools/chrome_runtime_smoke_test.js` may print `SKIP` on Google Chrome builds that do not allow CLI unpacked extension loading.

## v0.15 — 2026-06-08

Added:

- Added Dashboard apply-back-to-browser first slice.
- Smart Group cards now support editing group title and color.
- Each group card has an explicit `Apply` button.
- Dashboard group apply updates the real Chrome native tab group.
- Dashboard group apply saves an Undo snapshot before updating.

Safety:

- This slice only changes group title/color.
- It does not move tabs.
- It does not close tabs.
- It does not read page body content.

## v0.14 — 2026-06-08

Added:

- Added local sidebar Chat Refine preview/apply flow.
- Supports first local commands:
  - `GitHub PR to Code Review`
  - `docs.google.com to Docs & Notes`
  - `current tab to Reading`
  - `rename Misc to Reading`
- Chat Refine creates local user rules in `chrome.storage.local`.
- User rules now apply before AI and built-in classification on future organize runs.
- Added Dashboard `Rules & Memory` section with Enable, Disable, and Delete actions.
- Added local rule hit counts and last-used updates.

Safety:

- Chat Refine does not call AI in this slice.
- Chat Refine does not read page body content.
- Chat Refine never closes tabs.
- Browser changes require an explicit `Apply` click after preview.

## v0.13 — 2026-06-08

Added:

- Added manual duplicate review actions in the side panel.
- Review-only duplicate groups now show their candidate tabs with title, hostname/path, window id, and protection state.
- Added `Keep All` for marking a review group as intentionally kept.
- Added per-tab `Close` for review candidates, with a browser confirmation prompt before closing.
- Manually closed review tabs are added to the local Restore Closed snapshot.
- Dashboard Duplicate Center now shows review status such as `kept` or `pending`.

Safety:

- Review candidates are still never auto-closed.
- Active, pinned, audible, internal, incognito, and non-restorable tabs cannot be closed from review.
- If Chrome fails to close a reviewed tab, the temporary restore record is removed.

## v0.12 — 2026-06-08

Added:

- Added optional DeepSeek/OpenAI-compatible AI tab classification.
- Added local AI settings form in Dashboard Settings.
- Stores API key locally in `chrome.storage.local`.
- Uses `https://api.deepseek.com` and `deepseek-v4-flash` by default.
- AI classification sends title, hostname, path, window id, and tab state only.
- Organize falls back to local built-in rules if AI is not configured or fails.

Permissions:

- Added narrow host permission for `https://api.deepseek.com/*`.
- Still does not request `<all_urls>`, history, bookmarks, cookies, webRequest, or browsingData.

## v0.11 — 2026-06-08

Added:

- Added `dashboard.html` and `dashboard.js` as a local extension dashboard.
- Added `Open Dashboard` action in the side panel.
- Dashboard reads the latest local organize result from `chrome.storage.local`.
- Dashboard shows current workspace metrics, Smart Groups, Duplicate Center, and settings snapshot.

Notes:

- Dashboard is read-only in this slice.
- Drag/drop group editing and apply-back-to-browser remain future work.

## v0.10 — 2026-06-08

Added:

- Added `Summarize Current Tab` action in the side panel.
- Added `activeTab` + `scripting.executeScript` extraction for visible readable page content.
- Added local extractive summary, key points, suggested group, and suggested action.

Privacy:

- Page body is read only after the user clicks `Summarize Current Tab`.
- No AI call is made and no page content is uploaded in this slice.
- Summary action is disabled during first-run privacy onboarding.

## v0.9 — 2026-06-08

Added:

- Added first-run privacy onboarding gate.
- First toolbar click now opens the side panel and shows privacy basics before any organize, grouping, or closing occurs.
- Added `Start Organizing` action that stores local acceptance and then runs organize.

Safety:

- Before acceptance, no tabs are moved, grouped, or closed.

## v0.8 — 2026-06-08

Added:

- Added automatic safe duplicate closing for exact and tracking-parameter duplicates.
- Added local closed-tab restore snapshots with full URL stored only for restore.
- Added `Restore Closed` side panel action.
- Restore reopens closed duplicate tabs and groups them into their original group when possible, or `Restored Duplicates` otherwise.

Safety:

- Active, pinned, audible, incognito, internal, and non-restorable tabs are never closed.
- Hash/query-different candidates remain review-only.

## v0.7 — 2026-06-08

Added:

- Added duplicate candidate detection without closing tabs.
- Detects exact duplicates, tracking-parameter duplicates, and same-page candidates that should stay in Review.
- Added duplicate candidate summary and list to the side panel.

Safety:

- This slice still does not call `chrome.tabs.remove`; no tabs are closed.

## v0.6 — 2026-06-08

Added:

- Implemented first native Chrome tab group application in `extension/background.js`.
- Added built-in classification rules for GitHub, Chrome docs, docs/notes, communication, meetings, design, product/tasks, finance, dev tools, analytics, learning, research, articles, and misc.
- Added group plan validation and per-group apply fallback so one Chrome grouping failure does not stop the whole run.
- Added basic Undo that restores previous group state for still-open tabs.
- Updated side panel to show created native groups and expose an Undo button.

Notes:

- This slice moves tabs into native groups but still never closes tabs.
- AI classification and duplicate closing remain future slices.

## v0.5 — 2026-06-08

Added:

- Added first runnable Chrome Extension slice under `extension/`.
- Added MV3 `manifest.json`, background service worker, side panel HTML/CSS/JS, and local loading instructions.
- Implemented action click → side panel open → all normal windows tab scan.
- Side panel now shows window count, tab count, exact duplicate group count, top hosts, and protected-tab counts.

Notes:

- No tabs are moved or closed in this slice.
- Current machine has Node but no `npm`, so this first slice is a no-build MV3 implementation. React/TypeScript/Tailwind project setup should follow once package tooling is available.

## v0.4 — 2026-06-08

Added:

- Imported UI design delivery from `TabPilot-AI-UI.zip`.
- Added `03_UX/06_UI_DESIGN_SYSTEM.md` as the Monochrome Forge design system and component specification.
- Added `03_UX/UI_PROTOTYPES/` with 7 interactive HTML prototype pages and prototype README.
- Archived the original zip under `06_REFERENCES/ARCHIVES/`.

Changed:

- Normalized imported UI copy from TabPilot to TabMosaic.
- Replaced imported BYOK UI labels with API KEY labels to match the DeepSeek/OpenAI-compatible provider strategy.

## v0.3 — 2026-06-08

Changed:

- Product working name changed from TabPilot AI to TabMosaic AI due to same-category TabPilot conflict and `tabpilot.ai` usage.
- First target audience changed to office / knowledge workers, with indie developers retained as an early adopter subsegment.
- P0 language scope changed to English + Chinese first, multilingual later.
- P0 organize scope changed from current window to all normal windows in the current browser.
- Sidebar auto-open on action click confirmed.
- MVP AI provider strategy changed to DeepSeek API first with OpenAI-compatible provider abstraction.
- Remaining P0 defaults decided: privacy-minimal metadata by default, no default page body reading, safe duplicate auto-close with restore, no P0 account system.

## v0.2 — 2026-06-08

Added:

- Root-level `AGENTS.md` for future AI coding/product/design agents.
- Lowercase `agents.md` compatibility pointer.
- README and INDEX references for agent workflow.
- `00_START_HERE/01_READ_ME_FIRST.md` now points future collaborators to `AGENTS.md` before making product or implementation changes.

Purpose:

- Preserve the harness philosophy: document-first, confirmation-gated, traceable, privacy-aware, and reversible-by-default.
- Make sure future agents do not silently decide high-impact product, privacy, billing, or automation behavior.

## v0.1 — 2026-06-08

Initial product harness generated.

Included:

- PRD
- Product strategy
- Aha moment
- Feature specs
- Sidebar Agent
- Dashboard
- Tab chat
- Current page summary
- Rules and memory
- Workspaces
- Paywall and billing
- Privacy controls
- UX flows and wireframes
- Technical architecture
- Chrome extension API notes
- AI prompts and schemas
- Storage and sync
- Security and privacy implementation
- Analytics events
- Test plan
- Roadmap, sprint plan, backlog, risks, launch checklist
- Sources, assumptions, and research TODOs
