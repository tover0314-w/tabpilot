# Decisions To Confirm

这个文件是所有需要你拍板的内容清单。进入设计/开发前，请逐条确认。

## P0 强制确认项

| ID | 决策 | 当前建议 | 状态 |
|---|---|---|---|
| D-001 | 产品名 | TabMosaic AI（TabPilot 已有同类 Chrome 扩展和 tabpilot.ai 冲突） | CONFIRMED BY USER DELEGATION |
| D-002 | P0 主入口 | 点击插件 icon 即自动整理 | CONFIRMED BY DISCUSSION |
| D-003 | 顶部结果展示 | 使用 Chrome 原生 tab groups | CONFIRMED BY DISCUSSION |
| D-004 | Sidebar 角色 | 展示结果、引导对话、Undo、总结 | CONFIRMED BY DISCUSSION |
| D-005 | Dashboard 角色 | 付费核心工作台 | CONFIRMED BY DISCUSSION |
| D-006 | 默认整理范围 | 当前浏览器所有普通窗口，不处理 incognito | CONFIRMED |
| D-007 | 是否自动打开 sidebar | 是，点击后立即打开 active window 的 sidebar 并显示进度 | CONFIRMED |
| D-008 | 是否自动关闭 exact duplicate | 是，保留 active/pinned/audible/recent/protected tabs，并提供 Restore | DECIDED |
| D-009 | 是否自动关闭 tracking-param duplicate | 是，仅 canonical URL 高置信一致时自动关闭，否则进入 Review | DECIDED |
| D-010 | 是否自动关闭 hash duplicate | 否，进入 Review | DECIDED |
| D-011 | 是否默认读取页面正文 | 否，仅用户触发当前页总结/聊天时读取 | DECIDED |
| D-012 | 是否默认上传完整 URL 到云端 AI | 否，默认 title + hostname + path；full URL 需用户显式开启 | DECIDED |
| D-013 | MVP AI 模式 | DeepSeek API 简单测试，使用 OpenAI-compatible provider abstraction | CONFIRMED |
| D-014 | P0 dashboard 范围 | 当前所有窗口 workspace + smart groups board + duplicate center + basic settings | DECIDED |
| D-015 | Multi-tab chat | P1 / Pro | DECIDED |
| D-016 | Current tab chat | P0 | DECIDED |
| D-017 | Pro 付费点 | Dashboard Pro、workspace history、multi-tab chat、AI memory、hosted AI credits | DECIDED |
| D-018 | 免费版限制 | 基础一键整理免费；用户自配 DeepSeek key 不限；hosted AI 有免费额度；任意 OpenAI-compatible host 另走权限确认 | DECIDED |
| D-019 | 是否做账号系统 | P0 不做账号；Pro/hosted/cloud sync 阶段再做 | DECIDED |
| D-020 | 是否支持所有窗口整理 | P0 默认支持当前浏览器所有普通窗口 | CONFIRMED |
| D-021 | Dashboard Latest Result 信息层级 | 主卡片改为整理结果 + 优化收益 + 下一步动作；AI/windows/technical metrics 收进 Details；内存先用 Memory relief，不写精确 MB | CONFIRMED BY USER |

## 用户体验确认项

1. 首次点击是否显示隐私说明后再整理？
   - 决定：首次必须轻量说明，用户点 Start；之后点击即整理。
2. 自动整理是否需要进度态？
   - 决定：sidebar 打开并显示 Scanning / Grouping / Cleaning duplicates。
3. 自动分组错误时用户如何纠错？
   - 决定：sidebar chat + dashboard drag/drop，两者都可沉淀规则。
4. 分组命名是否用英文？
   - 决定：首发支持英文和中文；默认跟随浏览器语言，后续扩展多语言。
5. 分类颜色是否 AI 决定？
   - 决定：AI/规则建议，用户可在 dashboard 修改，规则记忆。
6. Dashboard Latest Result 是否从指标墙改成用户收益摘要？
   - 决定：改成简洁收益版，主打整理结果、重复项处理、内存压力降低和下一步动作；技术指标收进 Details。

## 商业化确认项

1. 是否首发付费墙？
   - 决定：不要。先让用户体验首次 one-click aha。
2. Free 是否限制一键整理次数？
   - 决定：基础一键整理免费；hosted AI 分类和多 tab summary 限制。
3. 用户自配 API key 是否免费？
   - 决定：免费支持用户自配 DeepSeek key，使用 OpenAI-compatible request format；任意 OpenAI-compatible host 需要后续 host-permission confirmation，Pro 提供 hosted AI 和 dashboard memory。
4. 是否做 lifetime deal？
   - 决定：不放入 P0；可作为早期增长实验。

## 技术确认项

1. Dashboard 是 extension page 还是 web app？
   - 决定：P0 extension page，P1 web app + cloud sync。
2. AI gateway 是否从 MVP 就做？
   - 决定：MVP 先做 OpenAI-compatible provider abstraction，DeepSeek API 起步；需要 hosted AI 时再上 gateway。
3. 是否使用 TypeScript + React + Tailwind？
   - 决定：使用 TypeScript + React + Tailwind。
4. 是否使用 IndexedDB 保存摘要？
   - 决定：P0 本地 IndexedDB 保存可恢复状态和用户主动生成的摘要。
5. 是否支持 Chrome built-in AI？
   - 决定：后续可用时优先支持，不作为 MVP 依赖。
