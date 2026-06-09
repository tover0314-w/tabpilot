# 风险清单

## 1. 分类质量风险

风险：AI 分组按域名而不是任务，用户感觉不如人工。

缓解：

- prompt 强调 task/project-based grouping。
- 用户规则优先。
- 低置信度放 Review/Misc。
- 用户纠错转规则。
- 针对开发者场景做内置规则。

## 2. 误关 tabs 风险

风险：误关重要 tabs 会直接破坏信任。

缓解：

- 只自动关闭 exact/tracking duplicates。
- active/pinned/audible/incognito 永不自动关闭。
- hash/query 不自动关闭。
- Restore 明显。
- Sidebar 解释关闭原因。

## 3. 隐私风险

风险：用户担心 URL 和页面内容被上传。

缓解：

- 默认不读取正文。
- 默认只发送最小 metadata。
- 自配 DeepSeek API key 或 local mode；任意 OpenAI-compatible host 需要后续权限确认。
- 明确隐私等级。
- 敏感网站二次确认。
- 不记录 URL/page text。

## 4. Chrome Web Store 审核风险

风险：权限过大、数据用途披露不足。

缓解：

- 最小权限。
- 不默认申请 `<all_urls>`。
- 清晰 single purpose。
- UI 和 store listing 说明数据用途。
- 完整隐私政策。

## 5. AI 成本风险

风险：用户频繁整理大量 tabs 导致成本高。

缓解：

- 本地规则先跑。
- AI 只处理未命中 tabs。
- 缓存 hostname/path 分类。
- Pro credits。
- 用户自配 API key。

## 6. Dashboard 过重风险

风险：P0 dashboard 做太大，拖慢发布。

缓解：

- P0 dashboard 只做当前 workspace + smart groups + apply。
- 历史 workspace、billing、multi-tab chat 放 P1。

## 7. 技术 API 限制风险

风险：sidePanel.open 用户手势限制、tabs move/group 时机问题。

缓解：

- 原型阶段先验证 API。
- 对 tabs move 错误做 retry。
- 保留 fallback UI。
