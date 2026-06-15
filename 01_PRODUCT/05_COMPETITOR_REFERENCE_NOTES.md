# 竞品与开源参考笔记

本文件不是完整竞品报告，而是产品方向上的参考。开源项目 stars 会变化，若用于外部材料需要重新核实。

## 参考类别

### 1. 成熟 tab manager

代表：Tab Manager v2、Session Buddy、OneTab、Toby、Workona。

价值：

- 搜索和批量操作成熟。
- Session/workspace 管理成熟。
- 但很多需要用户手动整理。

TabMosaic AI 的差异：

- 点击即自动整理。
- 使用原生 tab groups 展示结果。
- Sidebar Agent + Dashboard + tab chat。

### 2. AI tab organizer 实验项目

代表：ai-tab-organizer、smart-tab-organiser、tabber、TabRack 等。

价值：

- 证明 AI 分类 + 去重方向有人探索。
- 可参考 prompt、规则、去重和 provider 抽象。

不足：

- 多数较早期。
- 体验不够完整。
- Dashboard、长期记忆、multi-tab chat、付费工作台少见。

### 3. Chrome 原生能力

Chrome 自身已经有 tab groups、Memory Saver、AI 相关能力。TabMosaic AI 不应与原生 tab group 对抗，而应成为原生能力的自动化层。

### 4. All-in-one AI browser assistants

代表：Monica、Sider、Merlin 等。

Monica 值得重点学习的点：

- 任何网页都能唤起 AI 助手，降低“我该去哪问”的摩擦。
- Read / Search / Write / Memo / Quick Action 把浏览器里的阅读、搜索、写作、保存连成工作流。
- Deep Research 和 Search Agent 说明用户愿意把“搜索 + 对比 + 总结”交给 Agent。
- Smart Fill 说明网页表格、结构化区块和批量信息处理是办公场景高价值入口。
- Memo / Knowledge Base 说明一次性的页面问答需要沉淀成可复用资产。

TabMosaic AI 的差异：

- Monica 是 all-in-one AI toolbox；TabMosaic 应该更窄，围绕 browser work、tabs、groups、page context、todos、collections 和 safe browser actions。
- Monica 可以学习，但不能照搬媒体生成、Bot 平台、复杂工具箱和无边界 Browser Operator。
- TabMosaic 的核心护城河仍是 open-source + BYOK + native Chrome tab groups + local-first privacy。

### 5. AI browsers and work browsers

代表：ChatGPT Atlas、Perplexity Comet、Dia、Arc Max、SigmaOS、Opera AI、Brave Leo、Chrome AI Mode、Firefox AI tab groups、VertiTab。

最值得学习的点：

- Atlas / Chrome / Edge：AI 可以围绕 tabs、files、images、history/memory 形成侧边对话和 agent mode，但历史/记忆必须强确认。
- Dia：AI browser 不只是问答，而是 Reports、Live Work、Meeting prep、Profiles、Splits、Organized Tabs 这些工作流。
- SigmaOS：`tabs as tasks` 是非常贴近 TabMosaic 的方向，Done / Keep / Later 比单纯关闭 tabs 更像办公工作流。
- Opera：Tab Commands 证明“对浏览器下命令”有价值；其 prompt-only server processing 给 TabMosaic 的 privacy-first tab command 设计提供参考。
- Brave：chat-with-any-tab、BYOM、temporary chats、no-login privacy copy 都和 TabMosaic 的开源/BYOK 方向一致。
- Firefox：本地 AI tab group suggestions 证明 on-device/local tab intelligence 是可信方向。
- VertiTab：auto-join groups、universal search、tab lock、snapshots、discard/suspend、context menus 等传统 tab power features 可以择优吸收。

TabMosaic AI 的取舍：

- 近期要加的是 browser work 能力：Universal Work Search、Tabs as Tasks、Compare Selected Tabs、Continue Workspace、Safe Tab Commands。
- 近期不要加的是 browser history agent、bookmark manager、email/calendar/social automation、shopping agent、full Browser Operator 和默认 search overlay。

## 产品避坑

1. 不要只做 sidebar 里的“假分组”。
2. 不要把所有 tabs 都直接丢给 AI，成本高且不稳定。
3. 不要默认读取页面正文。
4. 不要默认关闭 hash/query 不同的 tabs。
5. 不要做成复杂书签工具。
6. 不要过早做团队协作。
7. 不要把 Monica 式全功能工具箱照搬进 sidebar，导致用户不知道主路径。
8. 不要默认做 search result overlay、email/social automation 或 unrestricted browser operator。

## 最值得学习的点

- 成熟 tab manager：搜索、批量操作、快捷键。
- AI 实验项目：最小 prompt、去重逻辑。
- Workona/Toby：workspace/collection 叙事。
- OneTab：一键产生强烈“变干净”感觉。
- Chrome 原生：tab group 的可见结果和低学习成本。
- Monica：Context Picker、Read Anything、Agent Search、Writing Agent、Memo/Collections、Smart Fill Lite，但必须产品收敛。
- Atlas / Dia / SigmaOS / Opera / Brave / Firefox / VertiTab：tabs-as-tasks、journey resume、local work search、safe tab commands、protected tabs、source provenance、local/on-device intelligence。
