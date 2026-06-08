# 用户流程

## Flow 1：首次使用

```text
用户安装扩展
→ 点击插件 icon
→ 出现轻量隐私说明
→ 用户点击 Start
→ Sidebar 打开显示 Scanning tabs
→ 自动分类与去重
→ 顶部 tab bar 出现原生 groups
→ Sidebar 展示整理结果
→ 用户可 Undo / Review / Chat / Save workspace
```

## Flow 2：日常一键整理

```text
用户打开很多 tabs
→ 点击插件 icon
→ Sidebar 显示整理中
→ 自动整理当前浏览器所有普通窗口
→ 顶部 groups 更新
→ Sidebar 展示结果
→ 用户继续工作
```

## Flow 3：分类纠错

```text
整理完成
→ 用户看到分类不满意
→ 在 sidebar 输入“不要按网站分，按项目分”
→ Agent 生成新分组方案
→ 用户 Apply
→ 顶部 groups 更新
→ 系统询问是否记住偏好
```

## Flow 4：创建规则

```text
用户输入“以后 GitHub PR 都放 Code Review”
→ Agent 识别为规则创建意图
→ 展示规则 preview
→ 用户确认
→ 当前 tabs 应用规则
→ Dashboard Rules 可见
```

## Flow 5：当前页面总结

```text
用户在某个页面
→ Sidebar 点击 Summarize Current Tab
→ 首次请求读取当前页面正文
→ 用户确认
→ Agent 返回摘要、关键点、建议分组、建议操作
→ 用户可 move / save / ask follow-up
```

## Flow 6：Dashboard 调整分组

```text
用户打开 dashboard
→ 进入 Smart Groups
→ 拖拽 tabs 调整分组
→ 点击 Apply to browser
→ 顶部 tab groups 更新
→ 系统提示是否保存为规则/模板
```

## Flow 7：保存 workspace

```text
整理完成
→ Sidebar 点击 Save workspace
→ 输入 workspace 名称或使用 AI 建议名
→ 保存到 dashboard
→ Pro 用户可后续恢复/聊天/导出
```

## Flow 8：恢复关闭的 tabs

```text
用户担心误关
→ Sidebar 点击 Restore closed duplicates
→ 系统恢复刚刚关闭的 tabs
→ 尽量恢复位置和 group
→ Sidebar 显示 restore 成功
```

## Flow 9：Multi-tab Chat / P1

```text
用户打开 dashboard
→ 勾选多个 tabs 或选择 group
→ 输入“做一个竞品对比表”
→ 系统请求读取多个页面正文
→ 用户确认
→ Agent 生成对比表
→ 保存到 Tab Knowledge
```
