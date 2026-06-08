# 功能规格：Workspaces

## 1. 目标

让用户保存、恢复和管理一组 tabs + groups + summaries + chat history。

## 2. Workspace 定义

Workspace 是一个浏览器工作上下文：

```text
tabs
groups
group order
group collapsed state
summaries
rules used
chat history
created/updated time
```

## 3. 用户场景

- 保存当前 AI research 工作区。
- 明天恢复昨天写 PRD 的 tabs。
- 把某个竞品研究 workspace 导出成 markdown。
- 和历史 workspace 聊天。
- 从 workspace 生成 dashboard template。

## 4. P0 / P1 范围

### P0

- Save current workspace locally。
- Dashboard 查看当前 workspace。
- Apply current dashboard changes to browser。

### P1 / Pro

- Workspace history。
- Restore workspace。
- Cloud sync。
- Workspace chat。
- Export markdown/JSON/CSV。
- Template generation。

## 5. 数据结构

```ts
export type Workspace = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  source: 'auto_organize' | 'manual_save' | 'dashboard';
  groups: SavedGroup[];
  tabs: SavedTab[];
  summaries: TabSummary[];
  rulesUsed: string[];
  chatThreadIds: string[];
};
```

## 6. UI

Workspace card：

```text
AI Tab Manager Research
8 groups · 73 tabs · Updated 2 hours ago
Summary: Research workspace for AI browser tab management products.

[Open] [Restore] [Chat] [Export] [Archive]
```

## 7. Restore 行为

用户点击 Restore：

```text
当前窗口打开
→ 按 saved groups 创建原生 tab groups
→ 重新打开 saved tabs
→ 尽量恢复顺序和 group color
→ Sidebar 展示恢复结果
```

## 8. 冲突处理

若当前窗口已有大量 tabs：

```text
你要恢复到当前窗口，还是新窗口？
[Current Window] [New Window]
```

P0 可以只支持新窗口恢复。

## 9. 验收标准

```gherkin
Given 用户已整理一个窗口
When 用户点击 Save Workspace
Then 系统保存当前 tabs、groups、顺序和摘要
And dashboard Workspaces 页面出现该 workspace
And Pro 用户可以恢复或聊天
```
