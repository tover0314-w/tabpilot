# Brand / Domain Preliminary Scan

Status: PRELIMINARY SCAN - CONFIRM BEFORE PUBLIC BRAND/DOMAIN
Last updated: 2026-06-12

This scan supports the open-source launch decision. It does not finalize a public name, domain, trademark position, Chrome Web Store listing name, or legal clearance.

## 1. Scope

Checked:

```text
Search intent:
- "TabMosaic"
- "TabMosaic AI"
- site:chromewebstore.google.com "TabMosaic"
- adjacent AI tab manager names: TabWeave, TabAtlas, TabForge

Domain / DNS probes:
- tabmosaic.ai
- tabmosaic.com
- tabmosaic.dev
- tabmosaic.app
- tabmosaic.io
- tabmosaic.xyz
- tabmosaic.co
- tabmosaicai.com
- tabmosaicai.app
- tabmosaicai.dev
- tabmosaicai.io
```

Important limitation:

```text
Domain availability and trademark risk must be checked at purchase / filing time.
DNS and whois probes are preliminary only and are not a registrar availability result.
This is not legal advice.
```

## 2. Main Findings

### Existing near-name conflict

There is already a Chrome Web Store extension named `Tab Mosaic`:

```text
Source: https://chromewebstore.google.com/detail/tab-mosaic/mdcoeckpicdepmhphfmclbicjnpkbnga
Observed listing name: Tab Mosaic
Observed category surface: Chrome extension / tab and layout workflow
Observed update date on listing: Nov 2, 2025
```

Assessment:

```text
This is a serious near-name conflict for a Chrome extension product.
It is not the same product promise as TabMosaic AI, but it lives close enough to the same browser-tab category that public store confusion and SEO dilution are likely.
```

### Exact phrase signal

Initial search did not show a clearly dominant existing product using the exact phrase `TabMosaic AI`.

Assessment:

```text
Exact phrase cleanliness is not enough because "Tab Mosaic" already exists in the Chrome Web Store and search engines split the name into generic words.
```

### Adjacent name crowding

Several `Tab + noun` names are already crowded in the AI/tab manager space:

```text
TabWeave: GitHub project named TabWeave, described as an AI-powered Chrome tab organizer.
Source: https://github.com/AnkanAdhikary/TabWeave_AI-Powered-Chrome-Extension

TabAtlas: Chrome Web Store extension with smart grouping, semantic grouping, side panel, and native groups.
Source: https://chromewebstore.google.com/detail/tabatlas/hnpdgbfcceoplkicnpgeaiokedopkknj

TabForge: search results show existing smart tab manager references; not treated as cleared.
```

Assessment:

```text
Generic "Tab + metaphor" naming is crowded. A more distinctive coined name may be better for SEO, recall, GitHub search, and Chrome Web Store differentiation.
```

### Domain probe

DNS / whois probes observed no clear active DNS records for several `tabmosaic` domains, and some whois checks returned no-match / domain-not-found style results.

Assessment:

```text
Do not rely on this as availability. Final domain availability must be checked in a registrar flow at the moment of purchase.
```

## 3. Risk Assessment

| Area | Risk | Notes |
|---|---|---|
| Chrome Web Store confusion | High | `Tab Mosaic` already exists as an extension listing. |
| SEO differentiation | Medium-high | `tab` and `mosaic` are generic terms and may compete with existing extension, art, layout, and window-management results. |
| GitHub discoverability | Medium | Open-source helps, but generic terms make search recall weaker. |
| Trademark/legal | Unknown | Requires separate trademark and legal review before final public launch. |
| Domain purchase | Unknown | Requires registrar-time check. |

## 4. Recommendation

Recommended default for now:

```text
Keep TabMosaic AI as the internal working name for beta docs and implementation.
Do not finalize TabMosaic AI publicly until the user reviews the near-name conflict.
Do not buy a domain, publish a Chrome Web Store listing, or launch public marketing with this name until D-001-A is confirmed.
```

Decision paths:

| Option | Meaning | Tradeoff |
|---|---|---|
| A. Keep as working name only | Continue development under TabMosaic AI while searching for a stronger public name | Safest for launch clarity; requires later rename work |
| B. Use TabMosaic AI publicly | Accept `Tab Mosaic` near-conflict and rely on AI Browser Layer positioning | Faster; higher SEO/store confusion risk |
| C. Rename before launch | Brainstorm and scan more distinctive names before buying domain or submitting store listing | More upfront work; best long-term brand/SEO path |

Recommendation:

```text
Choose Option A now.
Strongly consider Option C before public repo launch, Chrome Web Store submission, Product Hunt, Hacker News, or domain purchase.
```

## 5. Naming Direction Notes

Avoid treating the following as clear candidates without a new real-time scan:

```text
TabMosaic
TabWeave
TabAtlas
TabForge
```

Better next exploration:

```text
- more distinctive coined names
- names that can own "AI browser layer" rather than only "tab manager"
- names with easier spoken recall
- names with available GitHub org/repo, domain, Chrome Web Store listing, and social handles
```

## 6. Decision Gate

Decision Gate: D-001-A Public brand/domain finalization

Status:

```text
CONFIRM
```

Current recommendation:

```text
Do not finalize TabMosaic AI publicly.
Keep it as the working name until the user chooses whether to keep, rename, or shortlist new names after the near-name conflict review.
```

User confirmation needed:

```text
approve working-name-only
or
approve TabMosaic AI public launch despite risk
or
request rename shortlist
```
