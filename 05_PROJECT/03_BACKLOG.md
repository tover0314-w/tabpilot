# Backlog

## P0 Must-have

- [x] MV3 manifest。
- [x] action click 触发整理。
- [x] side panel 打开。
- [x] collect all normal window tabs。
- [x] tab snapshot model。
- [x] native tab group apply。
- [x] AI classification（optional BYOK key + OpenAI-compatible request-format, default DeepSeek）。
- [x] rules engine（built-in rules first slice）。
- [x] exact duplicate detection。
- [x] tracking params duplicate detection。
- [x] safe close duplicate tabs。
- [x] undo / restore。
- [x] sidebar result summary。
- [x] sidebar group overview。
- [x] duplicate review。
- [x] chat refine（local preview/apply first slice）。
- [x] sidebar composer direct commands（summary / organize / undo / restore / dashboard）。
- [x] sidebar quick actions route through chat thread。
- [x] sidebar ephemeral user/agent message thread。
- [x] sidebar current-page summary as chat message。
- [x] sidebar local current-page question answer。
- [x] sidebar latest-run read-only answers（overview / groups / duplicates / AI status）。
- [x] sidebar local capability/help answer。
- [x] sidebar local next-step guidance answer。
- [x] sidebar duplicate review / closed duplicate local answers。
- [x] sidebar active/protected/read-later local answers。
- [x] sidebar local tab search and focus existing tab。
- [x] sidebar save workspace command（local snapshot first slice）。
- [x] current tab summary（local extractive first slice）。
- [x] dashboard V0 smart groups（read-only local first slice）。
- [x] dashboard Duplicate Center tab details / focus existing tab。
- [x] dashboard apply to browser（group title/color first slice）。
- [x] dashboard expandable Smart Group tab rows。
- [x] dashboard drag/drop tab assignment（same-window existing groups first slice）。
- [x] dashboard Undo / Restore Closed actions。
- [x] save current workspace locally（Dashboard local snapshot first slice）。
- [x] delete individual saved workspace snapshot（Dashboard local snapshot first slice）。
- [x] privacy onboarding。
- [x] actionable safe error states（Sidepanel + Dashboard first slice）。
- [x] local data deletion（Dashboard first slice）。

## P1 Should-have

- [x] Agentic Classification V2 first slice（metadata-derived project/task/workflow/intent features; weak domain-only AI groups rejected）。
- [x] Sidebar Agent tool registry first slice（read-only/planning/action contract passed into metadata Agent prompt）。
- [x] Sidebar Agent concrete tool routing first slice（group/selected-tabs deep questions call validated local context tools）。
- [x] Current group / selected-tabs content read flow first slice（user-triggered, tool card, cap 6, session-only, skipped-tab disclosure）。
- [x] Multi-tab Agent tool-card UI first slice（compact assistant-message card, no debug panel）。
- [ ] Agentic Classification V2 refinement（split/merge suggestions surfaced in UI first slice done；real-profile classification QA pending）。
- [x] Group / selected-tabs follow-up context reuse（session-only multi-turn context, no persistence）。
- [x] Content-assisted regrouping preview（confirmed：user-triggered, tool card, capped visible text, Apply / Cancel）。
- [x] saved workspace restore first slice（hidden/private-beta；regroups currently open saved tab IDs only；Undo available；does not reopen closed pages）。
- [ ] saved workspace history / full restore。
- [x] group summary first slice（session-only current-group/selected-tabs summary card with themes, top hosts, read/skipped counts, and safe next steps）。
- [x] multi-tab chat first slice（Dashboard selected tab rows → Sidebar selected-tabs context；tool-card visible-text Q&A already wired；session-only）。
- [x] multi-tab skipped reason breakdown first slice（sensitive/restricted/protected/empty/unreadable/closed/over-cap reasons render as compact chips and safe counts；no extra page reads）。
- [x] page region context first slice（Sidebar command → user-click element picker → selected region visible text/structure/cropped screenshot metadata → Page Agent；session-only；screenshot image bytes not uploaded/stored）。
- [x] Dashboard selected-tabs multi-window selection UX first slice（cross-window selection remains separated; selecting a tab from another window resets the selected set and shows a compact status chip）。
- [x] multi-tab zero-readable fallback polish（when all selected/group tabs are skipped or unreadable, answer from metadata only, state that no page body was read/sent/stored, and show concrete retry guidance）。
- [x] context-tab temporary origin permission cleanup hardening（checks existing site access, requests only missing origins, and releases only session-owned newly granted origins）。
- [x] multi-tab missing-permission explanation（site-access failures render as `site access not granted` instead of generic restricted/unreadable）。
- [x] multi-tab missing-permission retry guidance（tool card and summary next steps tell users to approve Chrome site access, then ask again）。
- [x] selected-tabs tool-card wording polish（running selected-tabs reads say `Read selected tabs` instead of `Read group pages`）。
- [ ] multi-tab chat polish / real-profile QA（native optional site permission prompt acceptance, sensitive page edge cases, real-profile selected-tabs behavior）。
- [x] current-page site-skill first slice（GitHub PR pages pass a generic code-review hint to Page Agent；no owner/repo/PR number/full URL；no new permission）。
- [x] current-page site-skill registry first slice（GitHub issues/CI, cloud consoles, Linear/Jira issues, design files, collaborative docs pass generic reading hints；no object paths/IDs/full URLs；no new permission）。
- [ ] workspace chat。
- [ ] cloud sync。
- [ ] hosted AI gateway。
- [x] BYOK provider config for user-provided OpenAI-compatible HTTPS hosts beyond DeepSeek（explicit provider-origin permission before save/test）。
- [x] basic local model endpoint config（OpenAI-compatible `http://localhost` endpoint；guided Ollama / LM Studio setup later）。
- [x] local LLM provider first slice（Ollama / LM Studio setup help in Dashboard Settings；localhost connection test already wired）。
- [x] provider model suggestions first slice（Test AI Connection fills model datalist from provider `/models`; no tab/page data; no synthetic suggestions）。
- [x] provider connection diagnostics first slice（Dashboard shows compact `/models` vs synthetic ping, suggestion count, endpoint type, and Authorization status；no extra probe）。
- [x] Gemini provider preset first slice（official OpenAI-compatible Base URL；BYOK key；explicit provider-origin permission；no built-in key）。
- [ ] usage metering。
- [ ] billing。
- [x] advanced domain-specific dedupe first slice（Google Workspace same document + YouTube same video enter Review only；search/different videos excluded）。
- [x] advanced SaaS canonical dedupe polish first slice（Google Drive, GitHub PR/Issue/Discussion, Linear, Jira Cloud, Figma, Notion enter Review only；generic labels；no auto-close）。
- [x] advanced SaaS canonical dedupe follow-up（GitHub Actions/Commit, Drive open links, Dropbox, Miro, Canva, Coda enter Review only；generic labels；no auto-close）。
- [x] advanced title-similarity dedupe first slice（same-host normalized title matches enter Review only；generic labels；no auto-close）。
- [ ] advanced dedupe polish（semantic/page-body similarity review, real-profile QA）。
- [x] local LLM provider troubleshooting first slice（Test AI Connection renders next-step hints for local server/model loading, model-name mismatch, synthetic fallback, API key, permission, HTTPS/localhost boundary）。
- [ ] local LLM polish（model install automation / rich model browser metadata）。
- [x] page region table-structure polish first slice（bounded table headers/rows in selected region payload；same redaction path；no screenshot）。
- [x] page region cropped screenshot metadata first slice（user-selected region only；transient visible-tab capture cropped in memory；full capture discarded；text-only Page Agent receives metadata, not image bytes）。
- [ ] page region context polish（vision-model cropped image upload, complex SaaS page real-profile QA, richer visual understanding）。
- [ ] auto-add new tabs to groups。
- [ ] Agent search provider config UX（D-039：Tavily-style BYOK provider settings, test, clear, permission copy；Dashboard 不放 search UI）。
- [ ] Agent search real-key QA（explicit search only；send user query only；no tab/page/full URL payload）。
- [ ] Search result save-to-collection（local metadata/snippet only；no raw result page storage）。
- [ ] Search result to todo（create Work Queue item from selected search results）。
- [ ] Todo Agent MVP polish（done/archive/focus source/open Sidebar context；local-only）。
- [ ] Link understanding first slice（pasted URL detection；no silent fetch；confirmation before using link content）。
- [ ] Search provider diagnostics（redacted status, provider origin, result count, no key/log leakage）。

## P2 Could-have

- [ ] team workspace。
- [ ] shared templates。
- [ ] browser history agent。
- [ ] deep research mode。
- [ ] cross-browser support。
- [ ] mobile companion。

## Research Tasks

- [x] 验证 Chrome Store 审核对 tabs + sidePanel + scripting 权限的接受度（official policy review completed 2026-06-12；`tabs` is sensitive, `sidePanel` and `scripting` are justified by user-facing sidebar/page-read flows, broad host permissions can lengthen review；actual acceptance only after submission）。
- [x] 测试 toolbar popup `RUN_TOOLBAR_ACTION` + sidePanel.open 用户手势限制（smoke guard：popup 只发 confirmed actions，background allowlist/openSidePanelForWindow 处理）。
- [x] 测试 synthetic 96 tabs 下真实 Chrome `tabs.group` performance first slice（temporary profile；real-profile manual QA 仍未完成）。
- [x] 调研 Chrome built-in AI extensions 支持情况（official Chrome docs checked 2026-06-12；future `chrome_builtin_ai` adapter candidate only；not a P0 BYOK replacement and not a Base URL preset）。
- [ ] 调研竞品定价。
- [ ] 访谈 10 个重度 tabs 用户。
