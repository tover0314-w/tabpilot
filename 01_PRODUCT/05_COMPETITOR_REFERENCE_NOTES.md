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

## 产品避坑

1. 不要只做 sidebar 里的“假分组”。
2. 不要把所有 tabs 都直接丢给 AI，成本高且不稳定。
3. 不要默认读取页面正文。
4. 不要默认关闭 hash/query 不同的 tabs。
5. 不要做成复杂书签工具。
6. 不要过早做团队协作。

## 最值得学习的点

- 成熟 tab manager：搜索、批量操作、快捷键。
- AI 实验项目：最小 prompt、去重逻辑。
- Workona/Toby：workspace/collection 叙事。
- OneTab：一键产生强烈“变干净”感觉。
- Chrome 原生：tab group 的可见结果和低学习成本。
