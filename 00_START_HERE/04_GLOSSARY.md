# 术语表

## Tab

Chrome 浏览器中的一个标签页。

## Tab Group

Chrome 原生标签页分组。用户可以在顶部 tab bar 看到 group 名称、颜色、折叠状态。TabMosaic AI 应尽量使用原生 tab groups，而不是仅在 sidebar 里模拟分组。

## One-click Autopilot

用户点击插件图标后，无需先输入指令，系统自动分类、去重并把结果应用到顶部 tab bar。

## Sidebar Agent

浏览器侧边栏里的 AI 控制台。用于解释整理结果、提供 Undo/Restore、Review duplicates、聊天纠错、总结当前页面和与 tabs/group 对话。

## Dashboard

长期工作区看板。用于管理 Smart Groups、Workspaces、Rules & Memory、Tab Knowledge、Duplicate Center、Usage & Billing。

## Smart Group

由 AI/规则整理出的高质量分组。Smart Group 既对应浏览器顶部的原生 tab group，也可以在 dashboard 里长期管理。

## Workspace

一组 tabs + groups + 摘要 + 规则上下文 + chat history 的可保存工作区。

## Safe Duplicate

可以默认自动关闭的高置信度重复 tab。例如完整 URL 完全相同，或仅 tracking 参数不同，且不是 active/pinned/audible。

## Review Duplicate

不应自动关闭、需要用户确认的疑似重复 tab。例如 hash 不同、query 不同、标题相似。

## Current Tab Chat

与当前激活页面聊天，通常用于总结页面、提取关键点、建议分类。

## Multi-tab Chat

与多个 tabs、一个 group、当前窗口、当前浏览器所有普通窗口或 workspace 聊天，通常用于总结、对比、提炼 PRD、找可关闭 tabs。

## Rules & Memory

用户偏好系统。用户通过手动调整或聊天表达偏好后，系统将偏好保存为规则，后续分类优先使用。
