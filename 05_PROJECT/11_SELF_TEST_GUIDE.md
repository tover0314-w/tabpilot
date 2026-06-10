# 小白自测指南

Status: READY FOR CONTROLLED LOCAL/PRIVATE BETA
Public launch status: NOT READY FOR PUBLIC CHROME WEB STORE LAUNCH

这份指南给第一次自己测试 TabMosaic AI 的人使用。目标是先在安全的一次性浏览器里验证，再决定是否进入真实 Chrome profile。

## 0. 先记住这三件事

```text
1. 先测一次性 QA profile，不要一上来测真实日常 Chrome。
2. 真实 profile 测试会真的整理当前普通窗口里的 tabs。
3. 现在可以自己测和小范围内测，但不要公开上架。
```

## 1. 打开项目目录

打开终端，运行：

```bash
cd /Users/bytedance/个人项目/aitab
```

确认当前版本的 beta readiness：

```bash
node tools/beta_readiness_check.js
```

预期看到：

```text
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
```

如果这里失败，先不要测试，把失败输出保存下来。

## 2. 最安全的测试方式

先打开一次性测试浏览器：

```bash
node tools/open_manual_qa_profile.js
```

这个命令会打开一个临时 Chrome profile，并自动打开：

```text
- Manual QA Checklist
- 合成测试 tabs
- Sidebar 页面
- Dashboard 页面
```

安全边界：

```text
- 不读取你的真实 Chrome profile
- 不读取你的真实 tabs
- 不读取 .env.local
- 不上传测试结果
- Checklist 状态和 Local QA Notes 只存在这个一次性 profile 里
```

## 3. 按 Checklist 测

在打开的 `Manual QA Checklist` 页面里，一个个勾选。

重点检查：

```text
1. 点击 TabMosaic AI 插件图标。
2. 如果看到隐私提示，点击 Start Organizing。
3. Chrome 顶部 tab bar 出现真实 native tab groups。
4. Sidebar 显示整理结果。
5. Dashboard 默认打开 Smart Groups，不再显示 Latest Result/Current Workspace clutter。
6. exact/tracking duplicate 可以 Restore Closed。
7. hash/query duplicate 留在 Review，不被自动关闭。
8. Undo 可以撤销分组变更。
9. Chat Refine 先 preview，再 Apply。
10. Dashboard group title/color Apply 能更新真实 native groups。
11. Dashboard tab title 可以聚焦回原 tab。
12. Dashboard same-window tab move 可以把 tab 移进同窗口已有 group。
13. 如果出现整理错误，Sidebar/Dashboard 明确说明没有移动或关闭标签页。
14. Copy Diagnostic Snapshot 不包含 URL、tab title、页面正文、API key。
```

## 4. 可选 AI 测试

在一次性测试浏览器里打开 Dashboard：

```text
Dashboard -> Settings -> AI Classification
```

填写：

```text
Base URL: https://api.deepseek.com
Model: deepseek-v4-flash
API key: 你的 DeepSeek key
```

点击：

```text
Test AI Connection
```

预期：

```text
- 连接测试成功或给出明确错误
- 连接测试不发送 tab 数据
- 非 DeepSeek base URL 会被拒绝
```

然后重新整理一次，检查 Sidebar / Dashboard 是否显示 AI status 和 AI groups。

## 5. 记录问题

在 Manual QA Checklist 里的 `Local QA Notes` 写：

```text
问题：
我做了什么：
我期待：
实际发生：
是否能复现：
截图/录屏：
```

最后点击：

```text
Copy QA Result
```

不要把这些内容放进公开 issue：

```text
- API key
- bearer token
- cookie
- full URL
- 私密 tab title
- 页面正文
- 邮箱
- 私密截图
- 私有 rule pattern
```

## 6. 临时 profile 通过后，再测真实 Chrome

只有当一次性 QA profile 没有明显问题，再测试真实 Chrome。

打开：

```text
chrome://extensions
```

操作：

```text
1. 打开 Developer mode。
2. 点击 Load unpacked。
3. 选择 /Users/bytedance/个人项目/aitab/extension。
4. 固定 TabMosaic AI 到工具栏。
5. 先打开一组不重要的测试 tabs。
6. 点击插件图标。
7. 检查顶部 tab bar 是否出现 native tab groups。
8. 检查 Sidebar、Undo、Restore Closed、Dashboard。
```

真实 profile 测试建议：

```text
- 先测非关键窗口。
- 不要第一次就拿最重要的工作窗口测。
- 如果看到不确定的关闭行为，立刻点 Restore Closed。
- 如果分组不满意，先点 Undo。
```

真实 profile 测完以后，可以参考：

```text
05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md
```

但不要把真实 full URL、真实 tab title、页面正文、API key、私密截图、邮箱或私有 rule pattern 写进 git。完成版 QA 记录最好先放在本地私密位置，确认脱敏后再分享。

## 7. 通过标准

可以进入小范围内测的标准：

```text
- 一次性 QA profile 跑通。
- 非关键真实 profile 跑通。
- 没有 active/pinned/audible tab 被自动关闭。
- hash/query duplicate 没有被自动关闭。
- Restore Closed 有效。
- Undo 有效。
- Dashboard apply/move/focus 有效。
- Diagnostic/feedback 输出没有敏感数据。
```

不允许公开上线的原因：

```text
- 真实日常 Chrome profile 还没完整跑通。
- 隐私政策 URL 未最终确认。
- support email 未最终确认。
- final brand/domain 未最终确认。
- Chrome Web Store disclosure 未最终确认。
- 商店截图和 demo video 未完成。
- 还没有 5-10 个可信用户反馈。
```

## 8. 当前结论

```text
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
```

人话版：

```text
可以自己测，可以找很少量可信用户内测。
不要公开发布，不要提交 Chrome Web Store。
```
