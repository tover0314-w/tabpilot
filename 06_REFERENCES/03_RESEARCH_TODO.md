# Research TODO

## 用户研究

- [ ] 访谈 10 位每天 30+ tabs 的独立开发者。
- [ ] 访谈 5 位产品经理。
- [ ] 访谈 5 位研究/学生用户。
- [ ] 验证用户是否接受点击后自动分类。
- [ ] 验证用户是否接受自动关闭 exact duplicates。
- [ ] 验证用户愿意为 dashboard/multi-tab chat 付费。

## 竞品研究

- [ ] 重新核实开源项目 stars。
- [ ] 分析 OneTab、Session Buddy、Toby、Workona、Tab Manager Plus。
- [ ] 分析 AI tab organizer 类扩展用户评价。
- [ ] 分析 dashboard/workspace 类产品定价。
- [ ] 调研开源 AI browser / browser extension 的 README、license、star growth 和社区反馈机制。

## 技术研究

- [ ] 原型验证 default_popup toolbar menu → background `RUN_TOOLBAR_ACTION` → sidePanel.open 用户手势链路。
- [ ] 原型验证 tabs.group / tabGroups.update 大量 tabs 性能。
- [ ] 原型验证 restore closed tabs 的可靠性。
- [ ] 原型验证 activeTab + scripting 正文提取。
- [x] 调研 Chrome built-in AI extension support（official Chrome docs checked 2026-06-12；Prompt API / built-in AI can be used in Chrome Extensions, but treat it as future adapter research, not current MVP implementation）。

## 政策研究

- [x] Chrome Web Store 对 tabs permission 的审核注意事项（official docs checked 2026-06-12；`tabs` exposes sensitive tab properties and must be justified by the narrow tab-management purpose；broad host permissions can lengthen review；actual acceptance only after submission）。
- [x] Chrome Web Store 对 AI / page content extraction 的披露要求（official docs checked 2026-06-12；disclose web browsing activity and website content/resources；use in-product prominent disclosure/tool cards for page text；privacy policy URL and final dashboard data-use categories still require confirmation）。
- [ ] 用户自配模型/API key、任意 OpenAI-compatible host 和 local model endpoint 的存储、权限和披露最佳实践。
- [ ] 开源 license：MIT、Apache-2.0、AGPL-3.0 的取舍；dual license 仅在重新打开全量开源决策时评估。
- [ ] Pro 用户数据删除和导出要求。
