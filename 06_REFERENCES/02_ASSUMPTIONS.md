# Assumptions / 当前假设

这些假设记录当前产品判断；已确认项以 `00_START_HERE/03_DECISIONS_TO_CONFIRM.md` 为准。

## 产品假设

1. 用户愿意点击插件后自动分类，而不是先 review。
2. 顶部 tab bar 的真实变化是最强 aha moment。
3. Sidebar 应自动打开，帮助解释和引导下一步。
4. Dashboard 是付费核心，而不是普通设置页。
5. 办公和知识工作者是首发主用户，独立开发者是早期传播子人群。
6. 开源 + BYOK 会比闭源插件更容易建立信任、SEO 和开发者传播。

## UX 假设

1. 用户能接受首次使用时的轻量隐私说明。
2. 用户希望默认整理当前浏览器所有普通窗口，而不是只整理 active window。
3. 用户希望 exact/tracking duplicates 自动关闭。
4. 用户希望 hash/query duplicates 保留并 Review。
5. 用户愿意通过 chat 纠正分类。

## 技术假设

1. MV3 + compact default_popup + background message + sidePanel.open 可以支持主流程。
2. 极简 toolbar menu 比直接 action click 更适合同时承载 Smart Organize、Vertical Tabs、Current Page Chat 和 Dashboard。
3. `tabs` + `tabGroups` 足以实现 P0 原生分组。
4. `activeTab` + `scripting` 足以实现当前页面总结。
5. P0 dashboard 可以作为 extension page。

## 商业假设

1. 用户愿意为 dashboard + workspace + multi-tab chat 付费。
2. Free 用户需要先体验 one-click aha。
3. 用户自配模型/API key 可降低早期 AI 成本。
4. Hosted AI 是 Pro 体验的关键，但不是默认模型控制叙事。
5. 全量开源本地扩展仍可以支持后续 paid hosted/sync/team/support 收入。
6. Lifetime deal 可作为早期 indie 增长策略。

## 风险最大的假设

- 分类效果是否真的接近人工。
- 用户是否信任自动关闭重复 tabs。
- Dashboard 是否足够成为付费理由。
- Chrome Store 审核是否顺利。
- 开源 license 和 hosted service 边界是否会影响采用或商业化。
