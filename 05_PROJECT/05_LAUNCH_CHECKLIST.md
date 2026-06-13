# 发布清单

## Product

- [ ] P0 范围确认。
- [ ] 产品名确认。
- [ ] 免费/Pro 权限确认。
- [ ] 开源 license 确认。
- [ ] public repo 范围确认。
- [ ] 默认去重行为确认。
- [ ] dashboard P0 范围确认。
- [x] Public launch decision packet prepared（`05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md`；CONFIRM BEFORE PUBLIC LAUNCH）。
- [x] Public repo cleanup checklist prepared（`05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md`；D-L02 still CONFIRM）。
- [x] Brand/domain preliminary scan prepared（`01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md`；D-001-A still CONFIRM）。

## UX

- [x] 英文/中文 extension UI first slice。
- [x] 首次 onboarding 文案（privacy gate first slice）。
- [x] Sidebar 整理中状态。
- [x] Sidebar 完成状态。
- [x] Duplicate review（safe review first slice）。
- [x] Undo/Restore。
- [x] Dashboard V0（extension page first slice）。
- [x] Dashboard local Save workspace（本地快照 first slice；currently-open-tab restore first slice；history/full restore/cloud sync 未做）。
- [x] Privacy settings（permissions/local data/diagnostics first slice）。
- [ ] P0 QA runbook 已跑通。

## Engineering

- [x] MV3 manifest。
- [x] Extension icons。
- [x] Extension zip package。
- [x] compact toolbar popup menu。
- [x] sidePanel open。
- [x] tabs collection。
- [x] tab groups apply。
- [x] dedupe。
- [x] AI provider（DeepSeek default + OpenAI-compatible request-format）。
- [x] BYOK provider config beyond DeepSeek（custom HTTPS provider origin permission before save/test）。
- [x] local model endpoint config（basic `http://localhost` OpenAI-compatible endpoint support; setup wizard later）。
- [x] content extraction（current tab, user-triggered first slice）。
- [x] storage（local first slice）。
- [x] tests（smoke first slice）。
- [x] smoke tests。
- [x] automated runtime smoke（temporary Chrome for Testing profile + synthetic tabs）。
- [x] disposable manual QA profile launcher。
- [x] real-profile QA result template（blank redaction-safe template；completed real-profile QA not yet run）。
- [x] QA seed tabs。

## Privacy / Compliance

- [x] 独立隐私政策草稿（`05_PROJECT/13_PRIVACY_POLICY_DRAFT.md`；DO NOT PUBLISH YET）。
- [x] Chrome Web Store 数据披露草稿（`05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`；DO NOT SUBMIT YET）。
- [x] Chrome Web Store 权限 / 数据披露政策调研记录（official docs checked；actual acceptance still requires submission）。
- [ ] 最终隐私政策 URL / 文案确认。
- [ ] Chrome Store single purpose 文案（draft prepared; CONFIRM before submission）。
- [ ] Final Chrome Store data-use categories / Limited Use disclosure（draft prepared; CONFIRM before submission）。
- [x] 数据删除入口（local only first slice）。
- [x] 权限解释（Dashboard first slice）。
- [x] 不默认读取正文（current tab summary user-triggered；敏感页二次确认 first slice）。
- [x] 不在 currentRun、logs、诊断、反馈模板、AI payload 或遥测中记录完整 URL/page text；Restore Closed 恢复快照仅本地保存必要恢复信息。

## Beta

- [x] v0.1.0 私测 release notes。
- [x] private beta handoff。
- [ ] 20-50 位 beta 用户。
- [x] 本地脱敏诊断快照。
- [x] 本地反馈模板（copy-only first slice）。
- [x] GitHub 私测 issue forms（bug / feedback，带隐私提交红线）。
- [x] 错误日志（local redacted first slice，无上传）。
- [x] 分类质量标注（反馈模板 first slice，人工填写）。
- [x] 误关恢复监控（local count-only safety audit first slice，无上传）。

## Marketing

- [x] Open-source README first screen。
- [x] BYOK provider setup guide。
- [x] Privacy architecture explainer。
- [x] CONTRIBUTING.md / issue templates for public repo。
- [x] Landing page copy/wireframe draft（`05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md`；DO NOT PUBLISH YET）。
- [ ] Landing page published。
- [x] Demo video before/after script/storyboard draft（未录制，未批准）。
- [ ] Demo video final recording approved。
- [x] Product Hunt 素材 draft（DO NOT POST YET）。
- [x] Hacker News launch post draft（DO NOT POST YET）。
- [x] X/Twitter thread draft（DO NOT POST YET）。
- [x] Chrome Web Store screenshot draft generator（local mock-data 1280x800 assets；DO NOT SUBMIT YET）。
- [ ] Final Chrome Web Store screenshots approved by user。

## Metrics

- [ ] organize_started。
- [ ] organize_completed。
- [ ] undo_clicked。
- [ ] duplicates_closed。
- [ ] dashboard_opened。
- [ ] workspace_saved。
- [ ] summary_requested。
- [ ] paywall_seen。
