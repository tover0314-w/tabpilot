# 功能规格：自动安全去重

## 1. 目标

帮助用户清理重复打开的 tabs，减少顶部 tab bar 混乱，同时避免误关重要页面。

## 2. 产品原则

1. 自动关闭只针对高置信度安全重复。
2. 关闭前必须保存可恢复信息。
3. active/pinned/audible 永不自动关闭。
4. 低置信度疑似重复进入 Review。
5. Sidebar 必须解释关闭原因。

## 3. 重复类型

| 类型 | 定义 | 默认行为 |
|---|---|---|
| Exact URL | 完整 URL 一致 | 自动关闭重复项 |
| Tracking params | 仅 tracking 参数不同 | 自动关闭重复项 |
| Hash different | 仅 hash 不同 | Review，不自动关闭 |
| Query different | query 参数不同 | Review，不自动关闭 |
| Normalized title similar | 同站点、清洗后标题一致、URL 不同 | Review，不自动关闭 |
| Semantic similar | 标题/正文语义高度相似 | P1，仅提示，未来需要更多上下文 |
| Same domain | 同域不同页面 | 不视为重复 |

## 4. Tracking 参数

默认剥离以下参数：

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
fbclid
gclid
msclkid
ref
ref_src
spm
igshid
mc_cid
mc_eid
```

## 5. 保留 tab 的打分规则

优先保留：

```text
1. active tab
2. pinned tab
3. audible tab
4. 最近访问过的 tab
5. 已经在用户创建 group 中的 tab
6. 未 discarded 的 tab
7. index 更靠前的 tab
```

## 6. 自动关闭保护清单

以下 tabs 永不自动关闭：

- active
- pinned
- audible
- incognito
- chrome://
- extension://
- file://
- 无 url 或无法恢复的 tabs
- 用户手动 protected 的 tabs

## 7. Sidebar 展示

```text
已关闭 9 个安全重复标签页：
- 5 个完整重复
- 4 个仅 tracking 参数不同

保留 4 个疑似重复：
- 2 个 GitHub issue hash 不同
- 2 个文章标题相似

我没有关闭 active、pinned 或正在播放声音的 tabs。
```

### 7.1 Duplicate Review 当前实现

CONFIRMED BY IMPLEMENTATION:

```text
- hash/query/same-page review candidates are listed in Sidebar → Duplicate Candidates.
- normalized-title review candidates are listed as `title-review` when same-host pages have the same cleaned title but different URLs.
- each review group shows candidate tab title, hostname/path, window id, and protection state.
- user can choose Keep All for a review group.
- user can close a specific review candidate only after a browser confirmation prompt.
- manually closed review tabs are stored in the same Restore Closed snapshot.
- protected review tabs cannot be closed from the review UI.
```

Important:

```text
Review candidates are never auto-closed. Manual Close is a user-confirmed action, not part of automatic organize.
```

## 8. Restore

关闭 tabs 之前保存：

```ts
{
  tabId: number,
  title: string,
  url: string,
  windowId: number,
  index: number,
  groupName?: string,
  groupColor?: string,
  pinned: boolean,
  active: boolean,
  closedAt: number,
  duplicateReason: string
}
```

恢复时：

1. 重新打开 URL。
2. 尽量恢复 index。
3. 尽量恢复 group。
4. 若原 group 不存在，放入 `Restored` group。

## 9. Canonical URL 伪代码

```ts
function canonicalUrl(rawUrl: string, options: CanonicalOptions): string {
  const url = new URL(rawUrl);

  if (!['http:', 'https:'].includes(url.protocol)) return rawUrl;

  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (options.stripTrackingParams) {
    for (const key of [...url.searchParams.keys()]) {
      if (isTrackingParam(key)) url.searchParams.delete(key);
    }
  }

  if (options.ignoreHash) url.hash = '';
  if (options.ignoreSearch) url.search = '';

  return url.toString();
}
```

## 10. Domain-specific Rules / P1

```text
GitHub issue/PR: hash 可能是评论锚点，不自动关闭。
Google Docs: 文档 ID 相同可视为同一文档。
YouTube: video id 相同可视为同一视频，但 timestamp 不自动关闭。
Search pages: query 不同绝不关闭。
Shopping pages: query 不同可能代表筛选/价格，不自动关闭。
```

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
- Google Workspace docs with the same document ID enter Duplicate Review as `domain-review`.
- YouTube watch / youtu.be URLs with the same video ID enter Duplicate Review as `domain-review`.
- Different YouTube video IDs are not grouped just because the path is `/watch`.
- Search pages with different queries are not grouped by stripping query parameters.
- Domain-specific duplicates are review-only and are never auto-closed by the safe close plan.
- Internal domain duplicate hashes are stripped from the stored current run snapshot.
- YouTube duplicate review labels do not expose the raw video ID/query value.
```

CONFIRMED BY IMPLEMENTATION / POLISH SLICE:

```text
- Google Drive file/folder URLs with the same resource ID enter Duplicate Review as `domain-review`.
- Google Drive `open?id=` and `uc?id=` file URLs with the same resource ID enter Duplicate Review as `domain-review`.
- Dropbox share/file/folder URLs with the same resource ID enter Duplicate Review as `domain-review`.
- GitHub pull request / issue / discussion / Actions run / commit URLs with the same owner/repo/object ID enter Duplicate Review as `domain-review`.
- Linear issue URLs with the same workspace issue key enter Duplicate Review as `domain-review`.
- Jira Cloud issue URLs with the same issue key enter Duplicate Review as `domain-review`.
- Figma file/design/proto URLs with the same file key enter Duplicate Review as `domain-review`.
- Canva design URLs with the same design ID enter Duplicate Review as `domain-review`.
- Miro board URLs with the same board ID enter Duplicate Review as `domain-review`.
- Coda doc URLs with the same doc ID enter Duplicate Review as `domain-review`.
- Notion / Notion Site page URLs with the same page ID enter Duplicate Review as `domain-review`.
- These SaaS object matches are review-only and are never auto-closed by the safe close plan.
- Duplicate Review labels stay generic, such as `github.com/pull`, `linear.app/issue`, `figma.com/file`, `miro.com/board`, or `coda.io/doc`, and do not expose raw object IDs.
```

CONFIRMED BY IMPLEMENTATION / NORMALIZED TITLE SLICE:

```text
- Same-host pages whose cleaned titles match and whose exact URLs differ enter Duplicate Review as `title-review`.
- Title-review candidates are review-only and are never auto-closed by the safe close plan.
- Title-review labels stay generic, such as `docs.example.com/similar-title`, and do not expose the page title text.
- Search pages and YouTube video/result pages are excluded from normalized-title review to avoid noisy false positives.
- Internal title duplicate hashes are stripped from the stored current run snapshot.
- This is not full semantic/page-body similarity; semantic duplicate review remains future work.
```

## 11. 验收标准

```gherkin
Given 当前浏览器所有普通窗口存在 exact duplicate tabs
When 用户点击插件
Then 系统自动关闭重复项
And 保留 active/pinned/audible/recent tab
And sidebar 展示关闭原因
And 用户可以 Restore closed tabs
And hash/query 不同 tabs 只进入 Review
And Google Docs same-document and YouTube same-video candidates enter Review only
And same-host normalized-title matches enter Review only
And search-query and different-video pages are not treated as duplicates
And 用户可以在 Review 中 Keep All 或手动确认关闭单个候选 tab
And Review 中 active/pinned/audible/internal tabs 的 Close 按钮不可用
```
