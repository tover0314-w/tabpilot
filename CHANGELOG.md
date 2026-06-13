# Changelog

## v0.170 — 2026-06-12

Changed:

- Added real public-page Sidebar QA coverage for current-page Page Agent conversations and selected page-region context.
- `tools/capture_real_page_chat_screenshot.js` now supports repeated `--question` turns, `--region-question`, `--region-only`, progress logs, and explicit `--ai` DeepSeek configuration from `.env.local` without printing the key.
- Current-page chat without a configured AI provider now returns a setup prompt before reading page body content.
- Current-page AI provider failure now renders an explicit AI-error answer instead of using local visible-text extraction as a fake AI response.
- Selected page-region UI no longer exposes internal commands such as `select region:` in the user message bubble.
- The page-region tool state now renders as a lighter assistant state (`Waiting for click` / `Region selected`) with minimal session-only context copy.

Verified:

- Real temporary Chrome profile + temporary extension copy + public `https://www.hao123.com/` + DeepSeek from local `.env.local`.
- Four-turn current-page Page Agent chat stayed in `current_tab` scope and rendered as normal assistant messages.
- Selected page-region flow opened the page-local picker, clicked a visible page block, rendered `Region selected`, and answered from that selected block context.

Safety:

- The real-page capture uses a temporary Chrome profile and temporary extension copy only.
- `--ai` is explicit; without `--ai`, the script verifies the no-model configuration prompt.
- The API key is read from `.env.local` for local QA only and is not printed.
- The script grants temporary host access only to the copied extension for the requested public URL.
- Generated screenshots remain in ignored `artifacts/` output and are not release/package inputs.

## v0.169 — 2026-06-12

Changed:

- Shortened the visible current-tab context label in the Sidebar composer.
- The composer now shows source-style labels such as `Current tab · Supabase` instead of full browser titles such as `Settings | Database | ai-music | Supabase`.
- Full titles remain available as hover tooltip context, but the visible UI no longer looks like multiple tabs are selected.
- Smoke guards now require the current-tab context display to prefer a compact site label.

Safety:

- This slice changes Sidebar display copy, local smoke guards, generated screenshots, and documentation only.
- It does not change page-read triggers, optional site-permission prompts, AI request behavior, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Current-tab page content is still user-triggered and not guaranteed on browser/internal/protected pages.

## v0.168 — 2026-06-12

Changed:

- Adjusted the Sidebar bottom composer from an inline context-prefix layout to a stacked layout.
- The active context now appears as a compact top row inside the same composer surface, while the user input and send button sit below it.
- This keeps current-tab / selected-tabs / group scope visible without making the tab label feel like part of the user's typed prompt.
- Smoke guards, Sidebar specs, Tab Chat specs, Test Plan, and the feature discussion guide now reflect the stacked composer direction.

Safety:

- This slice changes Sidebar visual styling, local smoke guards, generated screenshots, and documentation only.
- It does not change page-read triggers, optional site-permission prompts, DeepSeek call triggers, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Current-tab content remains user-triggered and may be unavailable on browser/extension/internal/protected pages.

## v0.167 — 2026-06-12

Changed:

- Added an optional `--keep-fixture-server` mode to the disposable manual QA launcher.
- When enabled, the local `tabmosaic-manual.test` fixture server stays alive until Ctrl+C, so selected-tabs fixture links and refreshed fixture tabs continue to work during page-context QA.
- The Manual QA Checklist now explains whether fixture links are live or whether testers should use the already opened fixture tabs.
- QA Runbook, Test Plan, Private Beta Handoff, and smoke guards now document the keep-alive mode.

Safety:

- This slice changes manual QA tooling and documentation only.
- It does not change extension permissions, page-read triggers, optional site-permission prompts, AI request behavior, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- The keep-alive server serves only local synthetic fixture pages for the disposable QA profile.

## v0.166 — 2026-06-12

Changed:

- Made the disposable Manual QA Checklist easier to use for selected-tabs page-context testing.
- Added a `Context Fixture Guide` with the three local `tabmosaic-manual.test` fixture pages, stable marker text, and a copyable selected-tabs prompt.
- The copied prompt asks the Sidebar Agent to answer from selected fixture pages and mention `ORBITALPLANNING`, `BUGLANTERN`, and `GLASSHARBOR` when page text is readable.
- Manual QA self-test and smoke tests now guard the fixture guide, copy prompt, fixture markers, and temporary fixture-server note.
- QA Runbook, Test Plan, and Private Beta Handoff now point testers to the guide instead of making them infer the selected-tabs context flow.

Safety:

- This slice changes manual QA tooling, local smoke guards, and documentation only.
- It does not change extension permissions, page-read triggers, optional site-permission prompts, AI request behavior, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- The fixture pages remain local synthetic content in a disposable Chrome profile.

## v0.165 — 2026-06-12

Changed:

- Tightened the Sidebar chat UX around the bottom composer and assistant cards.
- The active context chip now sits in the same composer row as the textarea, so `Selected tabs · 8 tabs` feels like an input prefix instead of a separate status strip.
- Assistant and user bubbles now use quieter glass gradients and lighter shadows, reducing the dashboard/control-panel feeling in the chat thread.
- Context-read tool states remain visible for trust, but are visually treated as small inline assistant state instead of a standalone panel.
- The Sidebar message stream no longer keeps the old nested `chatPanel` scroll/card behavior, so 10-turn conversations scroll to the latest messages instead of getting stuck near the first turns.
- Screenshot capture now fails if the side panel horizontally drifts or clips message cards/composer content.
- Sidebar Agent and UI design docs now explicitly guard this one-surface composer and AI-chat-like message style.

Safety:

- This slice changes Sidebar visual styling, local smoke guards, and documentation only.
- It does not change page-read triggers, optional site-permission prompts, DeepSeek call triggers, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Current-tab and selected/group visible-text reads remain user-triggered, capped where applicable, and session-only.

## v0.164 — 2026-06-12

Changed:

- Added stable local context fixture pages to the disposable manual QA profile.
- `tools/open_manual_qa_profile.js` now opens three `tabmosaic-manual.test` synthetic pages for selected-tabs page-context testing: Product Roadmap, Release Checklist, and Interface Review.
- The fixture pages include stable visible-text markers (`ORBITALPLANNING`, `BUGLANTERN`, `GLASSHARBOR`) so testers can verify that page content was actually read after approving Chrome site access.
- The Manual QA Checklist, QA Runbook, Test Plan, and Private Beta Handoff now point testers to the local fixture pages for selected-tabs permission approval/denial checks.

Safety:

- This slice changes manual QA tooling and documentation only.
- It does not add required host permissions, broaden extension access, read real browser tabs, read `.env.local`, call AI, store page text, add analytics, close tabs, or change browser grouping behavior.
- The fixture pages are local synthetic content opened in a disposable Chrome profile.

## v0.163 — 2026-06-12

Changed:

- Improved the selected-tabs/current-group zero-readable fallback copy.
- When Chrome site access is missing or denied, the assistant now says plainly that Chrome site access was not granted, confirms that no page body was read/sent/stored, answers from titles/hostnames only, and gives a retry path.
- Generic zero-readable batches now say the answer is metadata-only instead of sounding like a technical extraction failure.
- Smoke tests now guard the plain-language missing-permission answer and the preserved privacy boundary.

Safety:

- This slice changes assistant fallback wording only.
- It does not request broader permissions, change page-read triggers, call AI in new situations, store page text, add analytics, close tabs, or apply browser changes.
- Missing or denied site access still results in metadata-only answers unless the user approves the Chrome site-access prompt and asks again.

## v0.162 — 2026-06-12

Changed:

- Further softened Sidebar context-read tool states.
- `Read selected tabs` / `Read group pages` now render as a small inline assistant status pill instead of a standalone tool-looking card.
- Tool disclosure still shows read count, visible-text boundary, session-only storage, and skipped count, but uses subtle separators instead of multiple UI chips.
- Specs and test coverage now guard that multi-tab tool disclosure reads as lightweight assistant state.

Safety:

- This slice is Sidebar visual polish plus documentation/test updates only.
- It does not change permission behavior, page-read triggers, AI request triggers, data retention, analytics, tab closing, Undo/Restore, or browser grouping behavior.
- Multi-tab visible-text reads remain user-triggered, capped, optional-site-permission gated, and session-only.

## v0.161 — 2026-06-12

Changed:

- Merged the Sidebar active-context strip into the bottom chat composer.
- The composer now shows context as an inline chip, such as `Current tab` or `Selected tabs · 8 tabs`, so selected-tab/page context feels like part of the chat input instead of a separate status bar.
- Selected-tabs context copy no longer repeats `Selected tabs` twice.
- Multi-tab context answers now lead with assistant prose before compact read/skipped metadata.
- Tool-card styling was softened into lightweight assistant state inside the chat stream.
- The disposable manual QA checklist and real-profile QA template now include selected-tabs page-context permission approval/denial checks.

Safety:

- This slice changes Sidebar UX, manual QA tooling, and documentation only.
- It does not broaden permissions, request all-site access, read page text automatically, call AI in new situations, store multi-tab context, add analytics, close tabs, or apply browser changes.
- Selected-tabs/current-group visible-text reads remain user-triggered, capped, optional-site-permission gated, and session-only.

## v0.160 — 2026-06-12

Changed:

- Refreshed controlled local/private-beta runtime evidence against the current build.
- Ran temporary Chrome runtime smoke, 96-tab large runtime probe, UI screenshot capture, and store screenshot draft capture on synthetic data.
- QA evidence now records that the current build still passes the real native group, Dashboard, Sidebar, selected-tabs context, content-regroup Apply, large-tab, and screenshot paths without using the user's real Chrome profile.

Safety:

- This is verification/evidence only; no extension runtime behavior changed in this slice.
- The refreshed runtime checks used temporary Chrome profiles, synthetic tabs, synthetic page content, and ignored local artifacts.
- This run did not use the user's real Chrome profile, real browsing data, page contents, API keys, or completed real-profile QA notes.
- DeepSeek Agent-flow was not rerun in this slice to avoid unnecessary provider/API-key usage; prior DeepSeek Agent-flow evidence remains carried forward and should be rerun only when intentionally testing AI provider behavior.

## v0.159 — 2026-06-12

Changed:

- Polished selected-tabs context tool-card wording.
- The Sidebar now builds running context tool cards with a scope-aware helper, so selected-tabs questions show `Read selected tabs` immediately instead of briefly saying `Read group pages`.
- The same helper is used by selected-tabs Q&A and content-assisted regrouping, reducing copy drift between the two paths.
- Locale keys and smoke tests now guard the selected-tabs running tool-card title and tool name.

Safety:

- This slice is wording/UX consistency only.
- It does not change permissions, read additional pages, call AI in new situations, store extracted context, add analytics, close tabs, or apply browser changes.
- Multi-tab visible-text reading remains user-triggered, capped, tool-card disclosed, and session-only.

## v0.158 — 2026-06-12

Changed:

- Improved the selected-tabs/current-group missing site-access retry UX.
- Context answers now recommend approving Chrome site access when skipped tabs were unreadable because temporary site access was not granted.
- The compact tool card now includes the top skipped-reason labels, so users can see `site access not granted` directly in the tool-card message instead of only in the group summary.
- Smoke tests now guard both the concrete retry next step and the tool-card skipped-reason rendering.

Safety:

- This slice is explanation/UI polish for already user-triggered context reads.
- It does not request broader permissions, read additional pages, run background extraction, call AI in new situations, store extracted context, add analytics, close tabs, or apply browser changes.
- One-click organize remains metadata-only; multi-tab visible-text reading remains capped, tool-card disclosed, and session-only.

## v0.157 — 2026-06-12

Changed:

- Added a clearer multi-tab context skip reason for missing temporary site access.
- If selected-tabs/current-group visible-text extraction fails because Chrome did not grant site access, the background now labels it as `missing_permission` instead of merging it into generic restricted/unreadable pages.
- Sidebar skipped-reason chips now render `site access not granted`, so users can understand when they need to approve the Chrome site-access prompt.
- Smoke tests now guard the new skip reason, locale key, and Sidebar rendering path.

Safety:

- This slice changes explanation and classification of failed reads only.
- It does not request broader permissions, read more pages, auto-read in the background, call AI in new situations, store extracted context, add analytics, close tabs, or apply browser changes.
- One-click organize remains metadata-only; multi-tab visible-text reading remains user-triggered, capped, tool-card disclosed, and session-only.

## v0.156 — 2026-06-12

Changed:

- Hardened the Sidebar selected-tabs/current-group temporary site-permission session.
- Before requesting optional per-site access for multi-tab visible-text reads, the Sidebar now checks which origins already have access and requests only missing origins.
- After the answer or regroup preview finishes, the Sidebar releases only origins granted for that temporary context-read session, preserving any permissions that already existed before the request.
- Smoke tests now guard the existing-permission check, session-owned origin list, and cleanup path.

Safety:

- This slice does not add new permissions, broaden host access, read pages automatically, call AI in new situations, store extracted context, add analytics, close tabs, or apply browser grouping changes.
- One-click organize remains metadata-only. Multi-tab visible-text reading still requires a user question from the Sidebar, a tool card, capped reads, and session-only handling.

## v0.155 — 2026-06-12

Changed:

- Polished the Dashboard Smart Groups tab-row layout after screenshot review.
- Dashboard tab rows now keep the checkbox, favicon, title, and action columns aligned so tab titles sit naturally next to their favicons instead of drifting right.
- Added a generated Dashboard selected-tabs screenshot that captures the `Chat selected (N)` state when users select multiple tabs from the Smart Groups board.
- Smoke tests now guard both the denser Dashboard row layout and the selected-tabs screenshot state.

Safety:

- This slice is UI and screenshot-fixture polish only.
- It does not read page text from Dashboard, call AI, request new permissions, broaden host access, store extracted context, add analytics, close tabs, or apply browser grouping changes.
- Selected-tabs chat still opens through the Sidebar Agent flow; Dashboard selection remains minimized local metadata until the user asks from the sidebar.

## v0.154 — 2026-06-12

Changed:

- Added zero-readable fallback polish for current-group and selected-tabs Agent answers.
- When every requested context tab is skipped or unreadable, the local answer now explicitly says no page body was read, sent to AI, or stored, then answers from titles/hostnames only.
- The context tool card now marks zero-readable batches as `metadata_only`, and the summary next steps explain how to retry with normal readable work pages.
- Specs, backlog, test plan, smoke tests, and QA evidence now document and guard the zero-readable fallback behavior.

Safety:

- This slice does not read more pages, request new permissions, broaden host access, call AI when no pages are readable, upload page bodies, store extracted context, add analytics, close tabs, or apply browser changes.
- Sensitive, restricted, protected, empty, unavailable, over-cap, and unreadable tabs remain skipped in the multi-tab context flow.

## v0.153 — 2026-06-12

Changed:

- Added Dashboard selected-tabs multi-window UX polish.
- When the user selects a Dashboard tab from another Chrome window, the previous selected-tabs set is still reset to keep selected-tabs chat same-window scoped, but the Dashboard now explains the reset with a compact status chip.
- The notice reuses the minimal glass Dashboard status area and auto-clears, so it does not add a new panel or clutter the Smart Groups board.
- Specs, backlog, test plan, smoke tests, and QA evidence now document and guard the selected-tabs reset notice.

Safety:

- This slice does not enable cross-window selected-tabs chat, read page text from Dashboard, call AI, request host permissions, store page content, add analytics, close tabs, or apply browser changes.
- Dashboard selected-tabs context remains minimized local metadata only; visible-text extraction still happens later from Sidebar only after the user asks and the tool-card flow runs.

## v0.152 — 2026-06-12

Changed:

- Added multi-tab skipped reason breakdown first slice for current-group and selected-tabs Agent answers.
- Context extraction now labels skipped tabs with safe reason labels and aggregates reason counts for sensitive, restricted, protected, empty, unreadable, closed, and over-cap tabs.
- Sidebar group summary cards now render compact skipped reason chips, and multi-tab Page Agent payloads include safe skipped reason breakdown counts.
- Specs, prompt schema, test plan, backlog, README, smoke tests, and QA evidence now document and guard the skipped reason breakdown.

Safety:

- This slice does not read additional page text, request additional permissions, broaden host access, send full URLs, store extracted multi-tab text, add analytics, or apply browser changes.
- Skipped breakdown data contains only reason codes, safe labels, and counts; it excludes full URLs, raw page text, hidden DOM, cookies, form values, history, workspace memory, and secrets.
- Real-profile optional permission prompt QA remains pending.

## v0.151 — 2026-06-12

Changed:

- Added selected page-region cropped screenshot metadata first slice.
- After the user asks for page-region context and clicks a readable page block, the background can transiently capture the visible tab, crop it in memory to the selected region, discard the full visible-tab capture, and keep only cropped screenshot metadata.
- Page Agent payload, tool registry, Sidebar tool card, prompt schema, privacy controls, store disclosure drafts, test plan, backlog, README, and smoke tests now document and guard the selected-region screenshot boundary.

Safety:

- Screenshot image bytes/data URLs are not sent to the text-only Page Agent, stored, added to chat memory, copied into diagnostics/feedback templates, or saved to workspace memory.
- The flow remains user-triggered, element-picker-gated, sensitive-page-confirmed, session-only, and does not add manifest permissions, host permissions, analytics, cloud storage, or browser-changing actions.
- Vision-model image upload remains future work and requires separate provider capability work plus confirmation.

## v0.150 — 2026-06-12

Changed:

- Recorded Chrome Web Store permission and data-disclosure policy review notes from official Chrome documentation.
- Store submission draft now explains the current posture for `tabs`, `sidePanel`, `scripting`, `activeTab`, optional host access, BYOK provider origins, web browsing activity, and website content disclosure.
- Chrome Web Store data disclosure draft now maps browsing metadata, user-triggered visible text, BYOK API key storage, and in-product prominent disclosures to conservative dashboard categories.
- Launch checklist, public launch decision packet, backlog, and research todo now record the completed policy review and keep actual store acceptance marked as unverified until submission.

Safety:

- This is a docs/research update only.
- No extension runtime code, manifest permission, host access, tab action, page read, AI request path, storage path, analytics, screenshot capture, or public launch claim was added.
- Public Chrome Web Store launch remains blocked by confirmation gates, real-profile QA, privacy policy URL, support email, final brand/domain, final disclosures, final screenshots/demo, and beta feedback.

## v0.149 — 2026-06-12

Changed:

- Recorded the Chrome built-in AI extension-support research result from official Chrome documentation.
- AI provider strategy now treats Chrome built-in AI as a future `chrome_builtin_ai` adapter candidate, not a P0 BYOK/OpenAI-compatible replacement.
- BYOK provider setup guide now explains why Chrome built-in AI is not a Base URL preset and what an eventual adapter must handle: availability checks, first-use model download, user activation, device/browser constraints, language limits, and BYOK fallback.
- Backlog and research todo now mark the Chrome built-in AI extension-support research task complete.

Safety:

- This is a docs/research update only.
- No provider preset, permission, host access, tab action, page read, AI request path, storage path, analytics, or public launch claim was added.
- Current P0 remains DeepSeek/OpenAI-compatible BYOK plus local rules fallback.

## v0.148 — 2026-06-12

Changed:

- Added a toolbar popup action-flow guard.
- Smoke tests now verify the compact toolbar popup exposes only Smart Organize, Vertical Tabs, Current Page Chat, and Dashboard in the confirmed order.
- Smoke tests verify the popup delegates all real work to background via `RUN_TOOLBAR_ACTION`, passes active tab/window hints, and does not open the side panel or manipulate tab groups directly.
- Smoke tests verify the background keeps a toolbar action allowlist, rejects unsupported actions, opens Dashboard separately, opens the side panel through the background service worker for side-panel actions, and keeps Vertical Tabs from starting organize.
- Chrome Extension API notes, backlog, and QA evidence now record the toolbar popup user-gesture guard.

Safety:

- This slice changes no UI behavior, permissions, tab actions, page reads, AI calls, storage, analytics, or duplicate-close behavior.
- It is a regression guard for the already-confirmed compact toolbar menu architecture.

## v0.147 — 2026-06-12

Changed:

- Added advanced SaaS canonical dedupe follow-up.
- Duplicate Review now recognizes additional same-object candidates for GitHub Actions runs, GitHub commits, Google Drive `open` / `uc` file links, Dropbox shares/files/folders, Miro boards, Canva designs, and Coda docs.
- Existing Google Workspace, Drive file/folder, YouTube, GitHub PR/issue/discussion, Linear, Jira, Figma, Notion, and normalized-title review behavior remains unchanged.
- Deduplication spec, test plan, README, backlog, smoke tests, and QA evidence now record the additional SaaS canonical review coverage.

Safety:

- New SaaS canonical duplicate matches are `domain-review` only and are never auto-closed by the safe close plan.
- Duplicate Review labels stay generic and do not expose raw GitHub run/commit IDs, Drive IDs, Dropbox IDs, Miro board IDs, Canva design IDs, or Coda doc IDs.
- This slice does not read page text, call AI, request new permissions, upload data, add analytics, or implement semantic/page-body duplicate detection.

## v0.146 — 2026-06-12

Changed:

- Added provider troubleshooting first slice for BYOK and local model testing.
- `Test AI Connection` diagnostics can now return compact troubleshooting codes for missing local models, model-name mismatch, synthetic-chat fallback, missing API key, provider-origin permission, HTTPS/localhost boundary, and generic provider settings checks.
- Dashboard renders those codes as short `Next:` guidance after the existing compact connection status.
- Backlog, AI provider strategy, BYOK setup guide, test plan, README, and QA evidence now record the troubleshooting slice.

Safety:

- Troubleshooting reuses the existing Test AI Connection result and failure path; it adds no extra provider probe.
- Troubleshooting codes do not include API keys, model-list contents beyond existing suggestions, tab data, page text, full URLs, chat history, rules, workspace snapshots, or real user content.
- Local model install automation and rich model metadata browsing remain future work.

## v0.145 — 2026-06-12

Changed:

- Expanded current-page site-skill hints into a common work-page registry first slice.
- Page Agent can now receive generic reading-strategy hints for GitHub issues, GitHub CI runs, cloud project consoles, Linear/Jira project issues, Figma/Canva design files, and collaborative documents in addition to GitHub PRs.
- The site-skill registry improves current-page chat depth without adding new Sidebar UI, new permissions, or background page reads.
- Backlog, Tab Chat spec, Agentic Context spec, prompt schema docs, test plan, README, and QA evidence now record the registry slice.

Safety:

- Site-skill hints stay generic and do not include object paths, owner/repo names, issue keys, PR/run numbers, design file IDs, document IDs, full URLs, query strings, hashes, hidden DOM, or additional page content.
- Local smoke verifies common work-page site-skill payloads exclude path-specific identifiers and tokens.
- Current-page chat still reads visible text only after the user asks and the existing sensitive-page flow passes.

## v0.144 — 2026-06-12

Changed:

- Added GitHub PR page-skill first slice for current-page Page Agent chat.
- GitHub pull request pages now pass a generic `github_pull_request_review` site-skill hint into the Page Agent payload so the model treats the visible page as a code-review surface.
- The Page Agent system prompt now allows safe site-skill hints as reading guidance, while still grounding answers only in visible page text.
- Backlog, Tab Chat spec, Agentic Context spec, prompt schema docs, test plan, README, and QA evidence now record the GitHub PR site-skill slice.

Safety:

- The site-skill hint is generic and does not include GitHub owner, repo name, PR number, full URL, query string, hash, hidden DOM, or additional page content.
- The slice adds no new permissions, no background page read, no browser action, no cloud storage, no analytics, and no automatic PR/repo extraction.
- Current-page chat still reads visible text only after the user asks and the existing sensitive-page flow passes.

## v0.143 — 2026-06-12

Changed:

- Added Gemini provider preset for BYOK/OpenAI-compatible settings.
- Dashboard provider presets now include Gemini with the official OpenAI-compatible Base URL `https://generativelanguage.googleapis.com/v1beta/openai` and example model `gemini-3.5-flash`.
- Provider registry, Dashboard select, BYOK provider setup guide, AI provider strategy, backlog, README, smoke tests, and QA evidence now record Gemini.

Safety:

- The preset only fills Base URL and model; it does not save settings, enable AI, request permission, test the provider, or send data by itself.
- Gemini still requires the user's own API key.
- Non-default provider use still requires explicit Chrome origin permission for `https://generativelanguage.googleapis.com/*`.
- No new required host permission, built-in API key, analytics, tab action, page read, or provider call was added.

## v0.142 — 2026-06-12

Changed:

- Added provider connection diagnostics first slice for BYOK/OpenAI-compatible settings.
- `Test AI Connection` now returns provider label, `/models` vs synthetic ping, model suggestion count, local vs remote endpoint, permission origin, Authorization status, and no-tab/no-page/no-full-URL flags.
- Dashboard renders the diagnostics as a compact single-line status after the existing connection result.
- BYOK provider setup guide, AI provider strategy, backlog, test plan, README, and QA evidence now record connection diagnostics.

Safety:

- Diagnostics reuse the existing model-list or synthetic ping request; no extra provider probe is added.
- Diagnostics do not include API keys, tab data, page text, full URLs, chat history, rules, workspace snapshots, or real user content.
- Synthetic chat fallback still does not invent model suggestions.
- No new permissions, analytics, storage, tab actions, page reads, or provider presets were added.

## v0.141 — 2026-06-12

Changed:

- Added normalized-title duplicate review first slice.
- Duplicate Review now recognizes same-host pages whose cleaned titles match but whose exact URLs differ.
- Backlog, deduplication spec, test plan, README, and QA evidence now record `title-review`.

Safety:

- Title-review duplicate matches are review-only and are never auto-closed by the safe close plan.
- Title-review labels stay generic, such as `docs.example.com/similar-title`, and do not expose the page title text.
- Search pages and YouTube video/result pages are excluded from normalized-title review to reduce noisy false positives.
- Internal title duplicate hashes are stripped from the stored current run snapshot.
- This slice does not read page text, call AI, request new permissions, upload data, add analytics, or implement full semantic duplicate detection.

## v0.140 — 2026-06-12

Changed:

- Added provider model suggestions first slice for BYOK/OpenAI-compatible settings.
- Dashboard model input now uses a native datalist.
- `Test AI Connection` returns up to 30 model IDs from the provider `/models` response, and Dashboard uses those IDs as editable suggestions.
- BYOK provider setup guide, AI provider strategy, backlog, test plan, README, and QA evidence now record model-list suggestions.

Safety:

- Presets still only fill Base URL and the default model; they do not save, test, enable AI, request permissions, or send data by themselves.
- Model suggestions are populated only after the user clicks Test AI Connection.
- The connection test still sends no tab data, page text, full URLs, chat history, rules, workspace snapshots, or real user content.
- Synthetic chat fallback does not invent model suggestions.
- Suggestions are not persisted and do not enable AI automatically.

## v0.139 — 2026-06-12

Changed:

- Added advanced SaaS canonical dedupe polish.
- Duplicate Review now recognizes same-object candidates for Google Drive files/folders, GitHub PRs/issues/discussions, Linear issues, Jira Cloud issues, Figma files/designs/prototypes, and Notion pages.
- Existing Google Workspace same-document and YouTube same-video handling remains unchanged.
- Backlog, deduplication spec, test plan, README, and QA evidence now record the SaaS canonical dedupe polish slice.

Safety:

- New SaaS canonical duplicate matches are `domain-review` only and are never auto-closed by the safe close plan.
- Duplicate Review labels stay generic and do not expose raw GitHub/Jira/Linear issue IDs, Figma file IDs, Drive file IDs, Notion page IDs, or YouTube video IDs.
- Different objects, such as a GitHub issue vs PR or different search queries, are not grouped by stripped query/path fallback.
- Internal domain duplicate hashes remain stripped from the stored current run snapshot.

## v0.138 — 2026-06-12

Changed:

- Added selected page-region table structure polish.
- Region extraction now includes bounded table rows in addition to table headers, list items, safe link labels, headings, visible text, and ARIA label/role.
- Page Agent selected-region payload now carries sanitized `tableRows` so pricing/settings/comparison tables can be answered with more structure.
- Backlog, Tab Chat spec, Agentic Context spec, test plan, README, and QA evidence now record the table-structure first slice.

Safety:

- Table rows are bounded to 8 rows / 6 cells per row before prompt use.
- Table cell text goes through the same redaction path as page text, so full URLs, query tokens, API-key-like strings, and connection strings are redacted best-effort.
- No screenshot capture, storage, broader DOM read, new permission, or cloud memory was added.

## v0.137 — 2026-06-12

Changed:

- Added selected page-region context first slice for Sidebar Page Agent chat.
- Sidebar commands such as `select region`, `ask region: ...`, and Chinese selected-region commands now trigger a page-local element picker.
- The active page shows a temporary highlight and click-to-select hint; Esc or timeout cancels the read.
- The Page Agent payload now marks `source: selected_region` and includes only the selected block's visible text, headings, safe link labels, list/table structure labels, and ARIA label/role.
- Sidebar renders the selected-region read as a compact session-only Agent tool card.
- Backlog, Tab Chat spec, Agentic Context spec, sprint plan, test plan, README, and QA evidence now record the selected-region first slice.
- Public repo boundary D-L02 is now documented as confirmed by the user's full-open-source direction; public repo audit still blocks on license, raw archive approval, and real-profile QA.

Safety:

- The first slice does not capture or upload screenshots.
- It does not read raw full HTML, hidden inputs, password/form values, cookies, storage, scripts/styles, unrelated sibling DOM, full URLs, query strings, hashes, or cloud memory.
- Sensitive pages still require the existing current-page confirmation before any region text is read.
- Region context is session-only and is not stored by TabMosaic.

## v0.136 — 2026-06-12

Changed:

- Added advanced domain-specific dedupe first slice.
- Google Workspace same-document candidates now enter Duplicate Review as review-only groups.
- YouTube same-video candidates now enter Duplicate Review as review-only groups across `youtube.com/watch` and `youtu.be` URLs.
- Different YouTube videos and different search queries are no longer grouped just because their query-stripped path matches.
- Backlog, deduplication spec, sprint plan, test plan, and README now record the advanced dedupe first slice.

Safety:

- Domain-specific duplicate candidates are never auto-closed by the safe close plan.
- Manual review close still requires user confirmation and keeps Restore Closed available.
- Internal domain duplicate hashes are stripped from the stored current run snapshot.
- YouTube review labels do not expose raw video IDs or query values.

## v0.135 — 2026-06-12

Changed:

- Added local LLM setup guidance first slice for Ollama and LM Studio.
- Dashboard Settings now shows a compact setup card when the user chooses the Ollama or LM Studio preset.
- The guide explains how to start the local OpenAI-compatible server and then use Test AI Connection.
- Backlog, BYOK provider setup guide, AI provider strategy, sprint plan, test plan, and README now record the local LLM provider first slice.

Safety:

- The setup guide does not save settings, enable AI, call a provider, install models, request permissions, read tabs, read page text, upload data, or widen host permissions.
- Localhost endpoints still use the existing explicit origin permission and connection-test boundary.
- Model install automation, model picker, richer local diagnostics, and Chrome built-in AI remain future work.

## v0.134 — 2026-06-12

Changed:

- Added Dashboard selected-tabs chat entry first slice.
- Dashboard Smart Group tab rows now have a compact selection checkbox, and `Chat selected` appears only after 2+ same-window tabs are selected.
- Clicking `Chat selected` opens Sidebar with `selected_tabs` context so the user can ask about those pages in the normal chat UI.
- The metadata Agent now preserves `selected_tabs` as an active context scope instead of downgrading it to browser-wide context.
- Backlog, Dashboard spec, Tab Chat spec, Agentic Context spec, sprint plan, and test plan now record the selected-tabs entry as implemented.

Safety:

- Dashboard selection is metadata-only and local; it does not read page text, call AI, upload data, move tabs, or close tabs.
- Multi-tab visible-text reading still happens only after the user asks in Sidebar and the tool-card / optional site permission flow allows it.
- Cross-window selected-tabs chat is not mixed in this first slice; selecting a tab from another window resets the current selection.

## v0.133 — 2026-06-12

Changed:

- Added Agentic Classification V2 merge-refinement first slice.
- AI-provided `mergeSuggestions` are sanitized and preserved as metadata-only classification insights.
- Local metadata now proposes conservative merge suggestions when small created groups share the same project/workflow signal.
- Sidebar `Suggested refinements` now renders both split and merge suggestions inside the organize assistant message card.
- Backlog, auto-classification spec, Agentic Context spec, sprint plan, and test plan now record split/merge suggestions as implemented and real-profile QA as pending.

Safety:

- Merge suggestions are metadata-only and do not read page bodies.
- Suggestions are not applied automatically and do not move, close, rename, or create tabs/groups.
- No new permissions, no full URLs, no cloud storage, and no page text are added.

## v0.132 — 2026-06-12

Changed:

- Added Agentic Classification V2 split-refinement first slice.
- AI-provided `splitSuggestions` are sanitized and preserved as metadata-only classification insights.
- Local metadata also generates conservative split suggestions when a created group contains multiple clear projects/workflows.
- Sidebar organize completion messages now show folded `Suggested refinements` inside the assistant message card.
- Backlog, auto-classification spec, Agentic Context spec, sprint plan, and test plan now record split suggestions as implemented and merge/real-profile QA as pending.

Safety:

- Refinement suggestions are metadata-only and do not read page bodies.
- Suggestions are not applied automatically and do not move, close, rename, or create tabs/groups.
- No new permissions, no full URLs, no cloud storage, and no page text are added.

## v0.131 — 2026-06-12

Changed:

- Added a group summary first slice for current-group / selected-tabs Agent answers.
- Context answers now preserve a compact `groupSummary` object with scope label, visible-text/metadata source, read/skipped counts, top hosts, inferred themes, and safe next steps.
- Sidebar renders the group summary inside the normal assistant message card instead of adding a separate panel.
- Multi-tab Page Agent payload schema now asks for group-summary-compatible output while keeping local fallback summary available.
- Backlog, Sidebar Agent, Tab Chat, Agentic Context, sprint, and test-plan docs now mark group summary first slice as implemented.

Safety:

- Group summaries are session-only and are not stored as Tab Knowledge, workspace memory, diagnostics, feedback content, or cloud data.
- The summary card does not add new permissions, does not read pages in the background, does not send full URLs, and does not apply browser actions.

## v0.130 — 2026-06-12

Changed:

- Added a hidden/private-beta saved workspace restore first slice in Dashboard.
- `RESTORE_SAVED_WORKSPACE` now regroups currently open saved tabs by local tab ID through the background service worker.
- Saved workspace rows now expose Restore and Delete actions behind the hidden Saved Workspaces path.
- Workspace restore stores an Undo snapshot before regrouping and publishes a normal run update with restored/skipped counts.
- Workspace, Dashboard, data model, sprint, backlog, launch checklist, and test-plan docs now reflect the current restore-first-slice status.

Safety:

- Restore uses only saved local tab IDs plus current live tab state; it does not store or use full URLs.
- Restore skips missing, closed, pinned, internal, or incognito tabs.
- Restore does not reopen pages, close tabs, read page text, upload data, or make Saved Workspaces visible in the default Dashboard UI.
- Full workspace history, reopening closed pages from workspace snapshots, cloud sync, export, and workspace chat remain future work.

## v0.129 — 2026-06-12

Changed:

- Added a provider preset contribution checklist to `04_TECH/10_BYOK_PROVIDER_SETUP.md`.
- Added a `Provider Preset Contributions` section to `CONTRIBUTING.md`.
- `tools/provider_registry_check.js` now verifies the BYOK guide keeps the provider contribution safety guidance.
- `tools/beta_readiness_check.js` now requires `CONTRIBUTING.md` and checks that provider contribution rules stay present.
- Open-source BYOK strategy now records the shared provider registry, provider registry checker, and provider contribution guidance as implemented launch assets.

Safety:

- Provider contributions remain limited to OpenAI-compatible `chat/completions` presets unless a separate feature spec is created.
- The contribution guide explicitly forbids provider API keys, required host permissions, broad browser permissions, and real browsing data in provider validation.
- This change does not alter extension behavior, provider permissions, AI payloads, page-content reading, tab-closing policy, telemetry, package contents, license status, or publication status.

## v0.128 — 2026-06-12

Changed:

- Added `tools/provider_registry_check.js` as a focused BYOK provider registry verifier for open-source contributors.
- The new check validates provider preset shape, default DeepSeek settings, manifest required host permissions, optional provider host permissions, Dashboard preset options, BYOK guide table coverage, HTTPS/localhost URL boundaries, and known provider host labels.
- Unified preflight and GitHub Actions now run the provider registry check.
- GitHub Actions syntax checks now include `extension/provider_registry.js`, `extension/popup.js`, `tools/build_store_screenshots.js`, and `tools/write_private_beta_ai_config.js` to match local preflight coverage.
- README, INDEX, beta readiness checks, and QA evidence now document the provider registry check.

Safety:

- This makes future provider additions easier to review without widening required host permissions.
- No provider preset is enabled automatically, and no provider check sends real browsing data or secrets.
- This change does not alter extension behavior, provider permissions, AI payloads, page-content reading, tab-closing policy, telemetry, package contents, license status, or publication status.

## v0.127 — 2026-06-12

Changed:

- Hardened `tools/public_repo_audit.js` so public-repo auditing now scans tracked plus unignored candidate files for common secret patterns, not only dangerous filenames.
- Candidate secret scanning covers OpenAI-compatible `sk-...` style API keys and bearer token literals.
- Synthetic test keys such as `sk-secret` in local tests remain allowed so smoke tests can keep privacy redaction fixtures.
- README, public repo cleanup checklist, beta readiness checks, and QA evidence now describe the candidate-secret public repo audit boundary.

Safety:

- This improves public-source hygiene before publishing and keeps `READY_PUBLIC_REPO_PUSH=no` until launch blockers are resolved.
- `.env.local` and `extension/private-beta-ai-settings.json` remain ignored and are still not scanned or published.
- This change does not alter extension behavior, provider permissions, AI payloads, page-content reading, tab-closing policy, telemetry, package contents, license status, or publication status.

## v0.126 — 2026-06-12

Changed:

- Added `extension/provider_registry.js` as the shared BYOK provider registry for provider presets, known host labels, default DeepSeek host, and default AI settings.
- Background and Dashboard now import the same provider registry so OpenAI-compatible provider support does not drift between runtime calls and Settings UI.
- Extension smoke tests now load the shared registry before testing background logic and verify every registry preset appears in the Dashboard provider select.
- Package generation and release verification now include `provider_registry.js`, `popup.html`, and `popup.js`.
- Unified preflight now syntax-checks `extension/provider_registry.js` and `extension/popup.js`.

Safety:

- No new provider permission was made required; the required host permission remains `https://api.deepseek.com/*`.
- Provider presets still do not save, test, enable AI, request permission, or send data by themselves.
- The release package verifier now catches missing provider registry and toolbar popup files before a zip can be treated as valid.
- This change does not alter default metadata-only classification, page-content reading defaults, tab-closing policy, telemetry, license status, or publication status.

## v0.125 — 2026-06-12

Changed:

- Expanded Dashboard BYOK provider presets from the original DeepSeek/OpenAI-compatible set to include xAI, Perplexity, Cerebras, Fireworks AI, DeepInfra, SiliconFlow, Kimi / Moonshot, MiniMax, and DashScope / Qwen, while keeping LM Studio and Ollama local endpoint presets.
- Known provider hosts now get provider-specific local labels instead of all appearing as generic `openai-compatible`.
- AI connection testing now tries the provider model-list endpoint first and falls back to a fixed synthetic chat ping when a provider does not expose a standard model-list endpoint.
- Updated BYOK provider setup, AI provider strategy, README, extension README, release notes, test plan, QA evidence, and smoke tests for the expanded provider surface.

Safety:

- Provider presets still only fill Base URL and model. They do not save, test, enable AI, request permission, or send data by themselves.
- Custom provider origins remain optional/user-triggered; required host permission stays DeepSeek-only.
- The synthetic chat ping sends only a fixed `Reply with OK.` prompt and no tab data, page text, full URLs, chat history, rules, workspace snapshots, or real user content.
- This change does not alter default one-click metadata-only classification, page-content reading defaults, tab-closing policy, telemetry, license status, or publication status.

## v0.124 — 2026-06-12

Changed:

- Added `01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md` to document the preliminary public-name, SEO, domain, and Chrome Web Store near-conflict scan.
- The scan flags that a Chrome Web Store extension named `Tab Mosaic` already exists, so `TabMosaic AI` remains a working name rather than a finalized public brand.
- Added D-001-A for public brand/domain finalization.
- Updated the public launch decision packet, README, INDEX, launch checklist, open-source strategy, and beta readiness checks to point to the scan.

Safety:

- No product rename, domain purchase, trademark decision, Chrome Web Store listing name, or launch decision was silently finalized.
- Domain availability and trademark risk remain confirmation-gated.
- This change does not alter extension behavior, permissions, AI payloads, telemetry, page-content reading, tab-closing policy, license status, or publication status.

## v0.123 — 2026-06-12

Changed:

- Added `05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md` for the final public-repo hygiene pass before publishing or pushing a public launch branch.
- Added `tools/public_repo_audit.js` to audit tracked and unignored files before public repo work.
- The checklist covers keep/exclude file boundaries, generated artifacts, ignored local outputs, raw archive decision gates, secret scans, real-profile QA notes, README audit, draft legal/store docs, and final public push checks.
- `.gitignore` now ignores `output/` so local generated screenshots/playwright output are not accidentally committed.
- README, INDEX, launch checklist, and open-source strategy now point to the public repo cleanup checklist and audit command.
- Unified preflight and GitHub Actions now run the public repo audit.
- Extended beta readiness checks to require the cleanup checklist, public repo audit script, and verify that `output/` remains ignored.

Safety:

- The cleanup checklist is draft-only and keeps D-L02 public repo boundary as `CONFIRM`.
- Raw imported archives are not deleted or untracked automatically; they remain a user decision gate.
- This change does not alter extension behavior, permissions, AI payloads, telemetry, page-content reading, tab-closing policy, license status, or publication status.

## v0.122 — 2026-06-12

Changed:

- Added `05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md` to consolidate the remaining public-launch confirmation gates into one approval packet.
- The packet covers open-source license, public repo boundary, product name/domain, developer identity/support email, privacy policy URL, Chrome Web Store wording/disclosures, BYOK public-build scope, Free/Pro boundary, analytics policy, real-profile QA, screenshots/demo approval, beta ramp, and launch timing.
- README, INDEX, launch checklist, and open-source strategy now point to the decision packet.
- Extended beta readiness checks to require the decision packet and verify that it remains confirmation-gated.

Safety:

- No final license, domain, pricing, analytics policy, store disclosure, or public launch decision was silently approved.
- No `LICENSE` file was added.
- This change does not alter extension behavior, permissions, AI payloads, telemetry, page-content reading, tab-closing policy, or publication status.

## v0.121 — 2026-06-12

Changed:

- Added `05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md` with draft landing page copy/wireframe, before/after demo video storyboard, Product Hunt materials, Hacker News launch post, X/Twitter thread, SEO metadata, and a pre-publish review checklist.
- Updated the launch checklist to distinguish draft marketing materials from final published/approved assets.
- README and INDEX now point to the public launch materials draft.
- Extended beta readiness checks to verify the launch materials draft remains marked draft-only and includes the expected launch surfaces.

Safety:

- The new launch materials are explicitly `DO NOT PUBLISH YET`.
- They keep public Chrome Web Store launch marked not ready and avoid claiming hosted AI, cloud sync, accounts, billing, unrestricted automation, or automatic background page reading.
- This change does not alter extension behavior, permissions, AI payloads, telemetry, page-content reading, tab-closing policy, or open-source license status.

## v0.120 — 2026-06-12

Changed:

- Reworked the README first screen for the open-source public repo narrative: product promise, Smart Organize flow, current readiness state, privacy defaults, quick local testing, and core docs.
- Added `04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md` to explain minimized metadata classification, user-triggered page reads, selected-tabs/group context reads, BYOK provider boundaries, local storage, diagnostics, and Apply-gated actions.
- Marked `Open-source README first screen` and `Privacy architecture explainer` complete in the launch checklist.
- Updated INDEX and README document maps to include the privacy architecture explainer.
- Extended beta readiness checks to assert the README first screen and privacy explainer remain present.

Safety:

- No extension runtime behavior changed.
- No `LICENSE` file was added because the open-source license remains a confirmation gate.
- The privacy explainer documents existing constraints; it does not broaden permissions, add analytics, change page-content reading defaults, alter AI provider payload boundaries, or change tab-closing behavior.

## v0.119 — 2026-06-12

Changed:

- Added `CONTRIBUTING.md` for the public open-source workflow, including privacy redlines, PR expectations, local checks, and confirmation-gated decision boundaries.
- Added public GitHub issue forms for provider requests, grouping-quality feedback, and UI bugs.
- Extended `tools/issue_form_smoke_test.js` to validate five issue forms across private beta and public repo feedback paths.
- README, INDEX, and launch checklist now point to the public contribution and issue-template scaffolding.

Safety:

- Public feedback forms require submitters to review before submitting and avoid API keys, bearer tokens, cookies, full URLs, tab titles, page text, emails, screenshots with private content, and private rule patterns.
- No `LICENSE` file was added because the open-source license remains a confirmation gate.
- This change does not alter extension permissions, AI provider behavior, page-content reading, tab-closing behavior, or data upload defaults.

## v0.118 — 2026-06-12

Changed:

- Dashboard AI Settings now includes provider presets for DeepSeek, OpenAI, OpenRouter, Groq, Together AI, Mistral AI, LM Studio, and Ollama.
- Presets only fill Base URL and model; they do not save, test, enable AI, or request permissions until the user clicks Save or Test.
- Local OpenAI-compatible endpoints such as Ollama and LM Studio can now be used without an API key when the local server does not require auth.
- Added `04_TECH/10_BYOK_PROVIDER_SETUP.md` with setup guidance, provider Base URLs, local endpoint notes, permission boundaries, and official reference links.

Safety:

- Remote providers still require HTTPS, explicit provider-origin permission, and a user-provided API key.
- Local endpoints send no Authorization header when the API key field is blank.
- BYOK provider presets do not loosen tab/page data minimization.

## v0.117 — 2026-06-12

Changed:

- Sidebar Agent now supports content-assisted regrouping for current-group / selected-tabs contexts.
- A user request such as regrouping selected tabs by actual page content now renders a tool card, reads capped visible text, and returns an Apply / Cancel regroup preview before native Chrome groups change.
- The regroup preview renders as an assistant message card with proposed groups, reasons, matched tabs, and safe Apply / Cancel actions.
- Background apply handling now supports validated `regroup_tabs` drafts and preserves Undo after Apply.
- Extension smoke tests now cover `REGROUP_CONTEXT_TABS`, content-regroup payload privacy, redaction, invented tab-ID rejection, and Apply-gated preview behavior.
- Chrome runtime smoke now opens synthetic HTTP pages, verifies visible text extraction through the selected-tabs context flow, renders a content regroup preview, clicks Apply, and verifies real native Chrome groups are created without closing tabs.

Safety:

- One-click organize remains metadata-only and does not read page bodies.
- Content-assisted regrouping is user-triggered, capped, session-only, and sends no full URLs, query strings, hashes, browser history, saved workspace contents, or TabMosaic cloud memory.
- AI proposed tab IDs are validated against real readable tabs; invented or duplicate IDs are dropped.
- No tabs are closed by the regroup preview or Apply path.
- The automated synthetic HTTP runtime probe uses a temporary fixture host grant because CDP cannot accept Chrome's browser-native optional site permission prompt from the extension page target.
- Manual/runtime QA for accepting the native optional site permission prompt remains pending.

## v0.116 — 2026-06-12

Changed:

- Dashboard AI Settings now supports BYOK OpenAI-compatible Base URL, model, and API key instead of being DeepSeek-only.
- DeepSeek remains the default provider; custom HTTPS provider hosts and `http://localhost` local model endpoints require explicit provider-origin permission before save/test.
- Background AI requests validate provider Base URLs, reject remote HTTP providers, reject username/password/query/hash in Base URLs, and check provider-origin permission before `/models` or `chat/completions` calls.
- AI result/provider labels are now generic enough for custom providers while preserving the existing DeepSeek default path.
- Smoke tests now cover custom provider permission requests, localhost endpoint normalization, remote HTTP rejection, and `/models` privacy boundaries.
- PRD, decisions, provider strategy, privacy/security docs, Chrome API docs, launch checklist, release notes, privacy policy draft, and Chrome Web Store data disclosure draft now reflect full open-source + BYOK provider support.

Safety:

- Required host permissions remain narrow: `https://api.deepseek.com/*` only.
- Custom provider origins remain user-triggered optional permissions.
- BYOK does not loosen data minimization: classification still excludes full URLs and page text; page text is sent only after user-triggered page/context questions.
- Open-source license remains a confirmation gate; no `LICENSE` file has been added.

## v0.115 — 2026-06-12

Changed:

- Product positioning now confirms TabMosaic as an open-source AI browser layer for Chrome.
- Added `01_PRODUCT/07_OPEN_SOURCE_BYOK_STRATEGY.md` for open-source growth, BYOK model configuration, open-core monetization, and license decision gates.
- PRD, product strategy, decisions, AI provider strategy, privacy controls, roadmap, risks, and launch checklist now treat BYOK as a core product direction.
- DeepSeek remains the private-beta default provider, but user-configured model/API key support is now confirmed as the strategic direction.

Safety:

- Open source is confirmed, but license remains a confirmation gate.
- Arbitrary OpenAI-compatible hosts and local model endpoints were confirmation-gated at this point; v0.116 implements the explicit provider-origin permission flow.
- BYOK does not loosen data minimization: full URLs, page text, cookies, form values, hidden DOM, and browser history remain excluded by default.

## v0.114 — 2026-06-12

Changed:

- Chrome toolbar click now opens a compact TabMosaic action menu instead of directly relying on `action.onClicked`.
- The toolbar menu includes Smart Organize, Vertical Tabs, Current Page Chat, and Dashboard.
- Smart Organize delegates to the background organize pipeline, opens the side panel, preserves first-run privacy gating, and keeps one-click organize metadata-only.
- The side panel now supports a lightweight Vertical Tabs mode with native group sections, favicons, search, tab focus, and quick return to Chat.
- Extension smoke and package checks now validate the compact `default_popup` entry instead of rejecting it.

Safety:

- The popup does not read page text, classify tabs, or apply browser changes directly.
- Vertical Tabs uses tab metadata and native group state only; page content remains user-triggered through the Agent.
- Dashboard remains a separate explicit entry and is not opened automatically by Smart Organize.

## v0.113 — 2026-06-11

Changed:

- Sidebar now routes current-group and selected-tabs deep questions through a concrete `SUMMARIZE_CONTEXT_TABS` Agent flow instead of the metadata-only fallback.
- Multi-tab visible-text reads now render a compact assistant-style tool card before extraction, preserve the active scope, cap private-beta reads at 6 tabs, and report read/skipped counts.
- Background context extraction now skips over-cap, protected, restricted, sensitive, empty, unavailable, and unreadable tabs instead of pretending every tab was read.
- DeepSeek multi-tab Page Agent now answers from capped visible text, titles, hostnames, headings, skipped reasons, and the tool card only.
- Group/selected-tabs Page Agent chats now keep session-only follow-up context for the same active scope, capped at 10 local Q/A turns.
- Multi-tab Agent payloads redact full URLs, query tokens, API-key-like strings, and connection strings best-effort, and validation drops invented tab summaries.
- Extension smoke tests now cover context-tab tool-card extraction and DeepSeek multi-tab visible-context payload privacy.
- Chrome runtime smoke now explicitly verifies the selected-tabs context tool-card path and a natural selected-tabs follow-up in a real temporary Chrome extension profile.
- UI screenshot capture now includes `sidepanel-context-tabs.png` to show selected-tabs Agent output, tool-card disclosure, and compact assistant message styling.
- Manifest now declares optional `http://*/*` / `https://*/*` site access for user-triggered group/selected-tabs page questions; the Sidebar requests specific origins only after the user asks and releases granted origins after the answer.

Safety:

- One-click organize remains metadata-only.
- Multi-tab page text is read only after a user-initiated current-group or selected-tabs question.
- Full URLs are not sent, extracted multi-tab text is not persisted, follow-up context is session-only, cloud summary storage is not added, all-site access is not granted by default, and browser-changing regroup plans still require Apply.

## v0.112 — 2026-06-11

Changed:

- Agentic Classification V2 first slice now derives local metadata features for AI classification: artifact type, workflow, project candidate, domain category, intent, sensitive hint, and domain-only risk.
- DeepSeek classification prompt now asks for project/workflow/artifact/intent grouping instead of domain-first grouping.
- AI classification validation now rejects weak domain-only group names such as `github.com`, `YouTube`, `Other`, `Websites`, or `Tabs` so bad AI group names fall back to safer local rules.
- Sidebar metadata Agent prompt now includes a compact tool registry covering read-only tools, planning tools, action tools, rejected tools, multi-tab visible-text cap, session-only boundary, and Apply-required browser changes.
- Extension smoke tests now cover Agentic Classification V2 metadata features, weak domain group rejection, and the Sidebar Agent tool registry contract.

Safety:

- This remains metadata-only for one-click organize. It does not read page bodies, broaden permissions, send full URLs, persist multi-tab summaries, change tab-closing behavior, or apply AI actions automatically.

## v0.111 — 2026-06-11

Changed:

- Current-page chat loading states now replace each other instead of leaving multiple internal status messages in the conversation.
- Chrome internal / restricted page answers now use simpler product copy instead of technical extension error wording.
- Current-page extraction failures are caught and returned as a normal assistant message.
- Current-page unreadable replies now distinguish browser/extension pages, missing temporary site permission, protected pages, and empty visible text instead of collapsing them into one generic sentence.
- Natural content questions such as `当前页面有什么内容` and `what content does this page have` now route to current-page chat instead of the metadata-only Agent fallback.
- DeepSeek metadata Agent open answers now render as plain assistant message bubbles without automatic tab rows, `Open tab`, `Groups`, or `Open Dashboard` action chips.
- Sidebar visuals now move closer to a Notion AI-style sidebar: lighter header, calmer glass message bubbles, current-tab context beside the composer, textarea input, and icon send button.
- UI screenshot capture now uses a realistic current-page Q&A scene for `sidepanel-chat.png` instead of only showing a tab-move draft.
- Current-page chat now supports short local multi-turn follow-up for the same tab; natural follow-ups continue page Q&A while explicit tab-management questions still use the tab Agent.
- Current-page chat now uses DeepSeek Page Agent when a local key is available, sending only current-tab visible text plus up to 10 local page-chat Q/A turns after the user asks and any sensitive-page confirmation is completed.
- Page Agent redacts full URLs, query tokens, API-key-like strings, bearer/JWT tokens, and database connection strings best-effort before upload, then falls back to local visible-text matching if DeepSeek fails.
- Current-page Page Agent history now keeps up to 10 local Q/A turns for follow-up resolution.
- Natural follow-ups such as `is point-in-time recovery enabled?`, `could this page help...`, and `summarize the action plan...` now stay in current-page chat after the first page answer.
- Sidebar chat spacing is tighter: the composer is anchored at the bottom of the side panel, so unused short-chat space no longer appears below the input.
- Sidebar message cards now use restrained glass micro-gradients so AI/user bubbles feel more natural without adding marketing-style color noise.
- Sidebar long-chat scrolling now uses the outer Agent thread as the single scroll container, with a soft top fade when scrolled, so 10-turn chats show the latest messages without clipped cards.
- UI screenshot capture now includes a 10-turn sidepanel chat state for visual review.

Safety:

- This does not broaden permissions, change background page-reading defaults, send page text without a user current-page request, send full URLs, store page body text, change tab-closing behavior, or make AI actions apply automatically. The longer page-chat history remains local/in-memory and is sent only as part of user-triggered current-page requests.

## v0.110 — 2026-06-10

Changed:

- Sidebar current-page questions now recognize more natural prompts such as `what is this page for?` and `这个页面是干嘛的？`.
- Current-page answers render directly as chat messages without repeating `Current page` / `Question` labels already implied by the composer context.
- DeepSeek metadata Agent replies render as simpler assistant cards: answer text, optional relevant tab rows, and compact safe action chips only.
- Sidebar tab rows no longer show internal window IDs in visible chat output.

Safety:

- This does not broaden permissions, change tab-closing behavior, upload page text by default, send full URLs, add analytics, or make AI actions apply without user Apply.
- Metadata Agent prompts now explicitly tell the model not to restate the visible active context or expose internal tab/window/group IDs; visible Agent text is also sanitized for those IDs before rendering.

## v0.109 — 2026-06-10

Changed:

- Sidebar and Dashboard visible extension pages now force English copy for the MVP, even when the browser UI language is Chinese.
- Chinese input can still be parsed for tolerant Chat Refine commands, but previews, risks, diagnostics feedback templates, and AI Agent drafts stay in English.
- Dashboard spec now explains each default visible element by the user pain it solves, and frames non-default items as incomplete user jobs rather than vague hidden features.
- UI screenshot capture no longer creates a Chinese side panel screenshot, keeping product review artifacts English-only.

Safety:

- Chinese locale resources remain in the package as future localization material, but they are not used for visible MVP Sidebar/Dashboard copy.
- This does not broaden permissions, change tab-closing behavior, upload page text, send full URLs, or make AI actions apply without user Apply.

## v0.108 — 2026-06-10

Changed:

- Sidebar top-right button now opens Dashboard; the old refresh icon is removed from the primary header.
- Sidebar no longer shows the `Tab Agent` title in the header.
- Latest organize completion renders as one assistant text reply with the impact numbers in prose, followed by lightweight quick-action chips.
- Sidebar chat scroll styling is cleaner, with transparent scrollbar track and more bottom space so messages are not cut off behind the composer.
- Dashboard default commercial UI hides Saved Workspaces, Auto Organize, Settings, and Save Workspace until those workflows are more complete.
- UI screenshots and store screenshot drafts no longer use the Settings page as a primary product screenshot.
- Added `tools/write_private_beta_ai_config.js` to copy `.env.local` DeepSeek settings into an ignored local unpacked-extension config file for private testing without manually entering Settings.

Safety:

- The private-beta AI config file is git-ignored and release verification rejects it if it appears in a packaged zip.
- This does not broaden host permissions, upload page text, send full URLs, add analytics, change tab-closing policy, or make AI actions apply before user Apply.

## v0.107 — 2026-06-10

Changed:

- Disposable Manual QA Checklist now includes optional DeepSeek Agent open-answer and `move_tabs` draft checks.
- The real-profile QA template now records whether DeepSeek Agent open answers and move drafts were tested.
- Manual QA runbook and self-test guide now explain how to verify the Agent move-draft flow without reading page bodies or full URLs.
- Dashboard manual QA wording now matches the simplified Smart Groups default page.

Safety:

- This is QA/documentation coverage only.
- It does not change AI behavior, tab-closing policy, permissions, data upload boundaries, analytics, or page-content reading.

## v0.106 — 2026-06-10

Changed:

- Sidebar organize results now show the memory-relief proxy directly in the assistant message metrics.
- Sidebar chat actions render as lighter message chips instead of heavier form-like buttons.
- Sidebar composer now clears after local Chat Refine previews are sent.
- Dashboard Smart Group cards and Settings panels received a lighter glass polish with softer row dividers.
- UI screenshot capture now uses a realistic side panel viewport and includes a separate live chat-state screenshot.

Safety:

- This is a UI and local display behavior update only.
- It does not change tab-closing policy, AI provider behavior, permissions, data upload boundaries, analytics, or page-content reading.

## v0.105 — 2026-06-10

Changed:

- DeepSeek metadata Agent can now return a validated `move_tabs` action draft for explicit regroup/move requests.
- AI move drafts render as normal assistant chat cards with matched tab rows and Apply / Cancel.
- Open-ended sidebar questions now fall back to a normal assistant chat reply when DeepSeek is not enabled or no organize context exists, instead of surfacing the local action-parser error.
- The real `--agent-flow` runtime check now verifies a DeepSeek-generated move draft can be applied into a real native Chrome tab group without closing tabs.

Safety:

- AI move drafts only use existing tab IDs from the sanitized current run state.
- Invented tab IDs, pinned tabs, unsupported draft types, and close/delete actions are ignored before rendering.
- Browser changes still require a user click on Apply; page text and full URLs are not sent.

## v0.104 — 2026-06-10

Changed:

- DeepSeek metadata Agent answers now include compact safe action chips when useful.
- Safe action chips are restricted to an allowlist: Ask page, Open Dashboard, Organize Again, Restore Closed, Review duplicates, and Show groups.
- The real `--agent-flow` runtime check now verifies the Sidebar Agent returns a normal assistant message card with relevant tab rows, safe action chips, and next-step suggestions, then clicks one chip and verifies the same chat thread continues.

Safety:

- AI suggestions still do not apply browser actions automatically.
- Unknown or destructive AI action types are ignored before rendering.
- Action chips route through the same user-clicked Sidebar chat command path as typed commands.

## v0.103 — 2026-06-10

Changed:

- Added a DeepSeek-powered Sidebar metadata Agent fallback for open-ended tab-management questions.
- The Agent path runs only after direct commands, local read-only answers, tab search, and safe local Chat Refine drafts do not match.
- AI Agent answers render as ordinary assistant message cards with optional relevant tab rows and safe next-step suggestions.
- Dashboard AI settings copy now reflects that DeepSeek can support both AI classification and metadata-only Agent answers.

Safety:

- The metadata Agent sends only minimized current run metadata: tab title, hostname, path, window id, tab state, group state, and duplicate-review counts.
- It does not send page body, full URL, restore URL, favicon URL, cookies, form data, hidden DOM, browser history, saved workspace contents, chat history, summaries, or cloud memory.
- AI output is validated before rendering: invented tab IDs are ignored and no browser actions are applied automatically.
- Current-page body upload to cloud AI remains `DO NOT BUILD YET WITHOUT CONFIRMATION`.

## v0.102 — 2026-06-10

Changed:

- DeepSeek provider smoke now uses bounded network calls for `/models` and synthetic `chat/completions` fixture checks.
- DeepSeek provider smoke now enforces the private-beta `https://api.deepseek.com` host boundary and normalizes pasted local API keys without printing them.
- Beta readiness no longer requires a fixed synthetic AI fixture group count; it requires the fixture to complete and assign all synthetic tabs without invented tab IDs.

Safety:

- The provider smoke still uses `.env.local` only for local testing, does not print API keys, sends only synthetic tab metadata, does not read real browser tabs, does not read page text, and does not broaden extension host permissions.

## v0.101 — 2026-06-10

Changed:

- Sidebar latest organize results now render as ordinary assistant chat message cards, with impact metrics and actions inside the same bubble instead of separate top status/result/action cards.
- Sidebar Agent now answers optimization / memory-relief questions from the latest local organize result as a visible assistant message card.
- The answer reports groups created, tabs organized, safe duplicate tabs closed, duplicate groups still needing review, and an honest memory-relief proxy based on duplicate tabs freed rather than invented MB.
- The card includes safe next-step buttons for groups, restore/review when relevant, and Dashboard.
- Sidebar Agent docs now list optimization and memory-relief questions as supported read-only status questions.

Safety:

- This is local read-only agent behavior. It does not read page bodies, call AI, upload data, move tabs, close tabs, change permissions, add analytics, or claim exact browser memory usage.

## v0.100 — 2026-06-10

Changed:

- Added `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md` as a standalone Chrome Web Store data disclosure checklist.
- Mapped current private-beta data handling to draft Web Store categories, including web browsing activity, website content, user activity, user-provided content, authentication information, optional DeepSeek sharing, and Limited Use posture.
- Updated store submission, launch checklist, README, index, release notes, handoff, readiness, and smoke coverage so the disclosure draft stays visible and cannot quietly become a final submission artifact.

Safety:

- This is documentation and readiness enforcement only. It does not submit Chrome Web Store disclosures, publish legal text, change permissions, call AI, upload data, read page content, move tabs, close tabs, add analytics, or finalize store checkboxes without user confirmation.

## v0.99 — 2026-06-10

Changed:

- Added `05_PROJECT/13_PRIVACY_POLICY_DRAFT.md` as a standalone privacy policy draft for review.
- Updated the Chrome Web Store submission draft to point at the standalone privacy policy draft and include current saved-workspace, Clear AI Key, and no-cloud/no-analytics boundaries.
- Beta readiness and smoke coverage now verify the standalone privacy policy draft exists, remains `DO NOT PUBLISH YET`, keeps required placeholders, and includes Limited Use / permissions / deletion disclosures.

Safety:

- This is documentation and readiness enforcement only. It does not publish a privacy policy, submit to Chrome Web Store, change permissions, call AI, upload data, read page content, move tabs, close tabs, add analytics, or finalize legal wording without user confirmation.

## v0.98 — 2026-06-10

Changed:

- Added `tools/build_store_screenshots.js` to generate five local 1280x800 Chrome Web Store screenshot drafts from mock UI screenshots.
- `node tools/preflight.js --screenshots` now captures UI screenshots and then builds the store screenshot draft pack.
- Store submission draft now records the official image/listing guidance checked on 2026-06-10 and keeps generated screenshots marked `DO NOT SUBMIT YET`.
- Smoke/readiness/docs now distinguish reproducible local store screenshot drafts from final user-approved store listing assets.

Safety:

- Screenshot drafts use mock extension data only and write to ignored local `artifacts/`. They do not read a real Chrome profile, real tabs, `.env.local`, page text, API keys, or private screenshots. They do not submit to Chrome Web Store.

## v0.97 — 2026-06-10

Changed:

- Added a Dashboard `Delete` action for individual saved workspace snapshots.
- Saved workspace deletion goes through the background `DELETE_SAVED_WORKSPACE` action and removes only the selected item from `tabmosaic.savedWorkspaces`.
- Dashboard deletion requires browser confirmation and clearly states that it does not restore, close, or move tabs.
- Smoke/runtime coverage now verifies local workspace save/delete behavior and confirms deletion does not call tab, tab group, or window APIs.

Safety:

- This is local-only snapshot management. It does not restore workspaces, sync to cloud, call AI, upload data, read page bodies, close tabs, move tabs, add analytics, or request new permissions.

## v0.96 — 2026-06-10

Changed:

- Added a Dashboard `Save` action that stores the current organized workspace as a local-only snapshot in `chrome.storage.local`.
- Added a Sidebar Tab Agent `save workspace` / `保存工作区` command that uses the same local-only snapshot path.
- Added a folded Saved Workspaces section so saved snapshots do not clutter the default Smart Groups board.
- Local workspace snapshots store minimized metadata and exclude full URLs, restore URLs, URL hashes, favicon URLs, page text, cloud data, summaries, and chat history.
- Smoke/runtime coverage now verifies local workspace save behavior, diagnostics count saved workspaces without exposing names/content, and Clear Local Data removes saved snapshots.

Safety:

- This is local-only storage. It does not restore workspaces yet, sync to cloud, call AI, upload data, read page bodies, close tabs, move tabs, add analytics, or request new permissions.

## v0.95 — 2026-06-10

Changed:

- Disposable manual QA checklist now includes a `Copy Real-Profile Template` action that copies the blank redaction-safe real-profile QA result template.
- `open_manual_qa_profile.js --dry-run` prints the real-profile QA template path, and `--self-test` verifies the template copy control plus key privacy/public-launch markers.
- README, QA runbook, self-test guide, extension README, and test plan now describe the template copy path.

Safety:

- This is QA tooling and documentation only. It does not read a real Chrome profile, read real tabs, call AI, upload data, move tabs, close tabs, add analytics, or request new permissions.

## v0.94 — 2026-06-10

Changed:

- Added `05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md` as a redaction-safe template for future real Chrome profile QA results.
- QA runbook and self-test guide now point real-profile testers to the template and warn against committing sensitive browsing data.
- Beta readiness now verifies that the real-profile QA template exists and contains the required privacy redlines.

Safety:

- This is documentation and readiness enforcement only. It does not read a real Chrome profile, store real browsing data, call AI, upload data, move tabs, close tabs, or request new permissions.

## v0.93 — 2026-06-10

Changed:

- Beta readiness now requires the large-tab runtime evidence, including the `--large-runtime` preflight command and the 96 synthetic-tab Chrome runtime probe result.
- Private beta handoff now points to the full verification command: `node tools/preflight.js --runtime --large-runtime --screenshots`.
- Test-plan coverage now calls out that beta readiness guards ordinary runtime and large-tab runtime evidence.

Safety:

- This is readiness-gate and documentation enforcement only. It does not change extension runtime behavior, read real browser data, call AI, upload data, move tabs, close tabs, or request new permissions.

## v0.92 — 2026-06-10

Changed:

- Added an optional Chrome runtime large-tab probe: `node tools/chrome_runtime_smoke_test.js --large-tabs`.
- Added `node tools/preflight.js --large-runtime` to run that probe through the unified preflight entry point.
- The probe opens a temporary Chrome profile with 96 synthetic URLs by default and verifies real native tab grouping, safe duplicate close, review duplicates, bounded runtime, and sanitized run snapshots.
- Chrome runtime cleanup now waits for the browser process to exit and retries temporary directory removal, which keeps large-tab runs from failing after a successful organize.

Safety:

- The large-tab probe uses synthetic URLs in a disposable Chrome profile. It does not read the user's real Chrome profile, real tabs, `.env.local`, page content, or API keys. It does not call AI or upload data.

## v0.91 — 2026-06-10

Changed:

- Added a synthetic 180-tab smoke guard for local planning, duplicate detection, safe-close planning, and sanitized run snapshots.
- The guard checks that large local planning stays bounded, avoids protected-tab closes, keeps hash/query variants in review, and strips URL/body-sensitive fields from stored UI state.
- QA evidence and test-plan docs now distinguish this local planning guard from future real Chrome `tabs.group` performance research.

Safety:

- This is test coverage only. It uses synthetic tabs, does not read real browser data, does not open Chrome, does not call AI, does not upload data, does not move or close tabs, and does not request new permissions.

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
