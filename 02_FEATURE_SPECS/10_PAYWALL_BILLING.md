# 功能规格：付费与商业化

## 1. 付费策略原则

不要在用户体验 aha moment 前拦截。先让用户免费体验一次“点击后顶部 tab bar 变整洁”的价值，再在长期能力处转化。

## 2. 免费版价值

免费版应足够让用户感受到产品价值：

- 一键整理当前浏览器所有普通窗口。
- 基础安全去重。
- Sidebar result。
- Undo/Restore。
- Current tab summary 限量。
- Dashboard V0 当前 workspace。
- 用户自配 DeepSeek API key 支持；任意 OpenAI-compatible host 需要后续 host-permission confirmation。

## 3. Pro 价值

Pro 应该围绕长期工作区和更强 AI：

- Hosted AI。
- Unlimited / higher-limit organize。
- Multi-tab chat。
- Group summary。
- Workspace history。
- AI memory。
- Advanced rules。
- Cloud sync。
- Export。
- More summaries / credits。

## 4. 付费点放置

| 位置 | 触发 | 文案方向 |
|---|---|---|
| Sidebar after organize | 用户整理成功后 | 保存这个工作区需要 Pro |
| Group card | 用户点 Summarize Group | Group summary 是 Pro 功能 |
| Dashboard Workspaces | 用户保存多个 workspace | 升级以保存无限 workspace |
| Multi-tab chat | 用户选择多个 tabs 聊天 | 升级以和多个 tabs 聊天 |
| AI credits exhausted | 用量不足 | 升级或使用自己的 API key |

## 5. 建议套餐

### Free

```text
基础一键整理
基础去重
每天/每周有限 AI hosted organize
自配 API key 无限使用
当前 tab summary 少量
Dashboard V0
最多 3 个 saved workspace
最多 10 条 rules
```

### Pro Monthly

```text
更多 hosted AI credits
unlimited saved workspaces
multi-tab chat
group summary
workspace chat
AI memory
advanced rules
export
sync / P1
```

### Lifetime / Early Adopter

适合 indie 启动阶段，但需要控制 AI 成本：

```text
Lifetime product access
Hosted AI 有 monthly fair-use limit
User-provided API key unlimited
```

## 6. 用量模型

AI credits 按动作消耗：

```text
One-click AI classification: low credits
Current tab summary: medium credits
Group summary: high credits
Multi-tab chat: high credits
Workspace chat: high credits
```

## 7. Billing Dashboard

显示：

- 当前计划。
- AI credits 使用量。
- 本月 organized tabs 数。
- summaries 数。
- multi-tab chats 数。
- saved workspaces 数。
- 升级按钮。
- 管理订阅。

## 8. 已决定的 P0 商业化边界

- 基础一键整理免费，不在首次 aha 前设置付费墙。
- 用户自配 DeepSeek key 不限制使用量。
- Hosted AI 有免费额度，超出后升级或改用自配 key。
- Current tab summary 免费少量额度，具体数字在定价页前再定。
- Multi-tab chat 默认 Pro only。
- Lifetime deal 不进入 P0，可作为早期增长实验。
- 团队版不进入 P0。

Pro 定价区间仍需在商业化页面前单独确认。
