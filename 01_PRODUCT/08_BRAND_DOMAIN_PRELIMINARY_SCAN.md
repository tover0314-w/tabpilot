# Brand / Domain Preliminary Scan

Status: PRELIMINARY SCAN - CONFIRM BEFORE PUBLIC BRAND/DOMAIN
Last updated: 2026-06-15

This scan supports the open-source launch decision. It does not finalize a public name, domain, trademark position, Chrome Web Store listing name, or legal clearance.

## 1. Scope

Checked:

```text
Search intent:
- "TabMosaic"
- "TabMosaic AI"
- site:chromewebstore.google.com "TabMosaic"
- adjacent AI tab manager names: TabWeave, TabAtlas, TabForge
- 2026-06-15 live web scan for TabPilot, TabWeave, TabAtlas, TabCraft, TabMind, TabOrbit, TabForge, TabWorkbench, BrowserLayer AI, WorkContext AI, BrowseMind, ContextFlow

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
TabPilot: Chrome Web Store listing and tabpilot.ai site exist for an AI-powered tab-management product.
Source: https://chromewebstore.google.com/detail/tabpilot-formerly-tab-gro/ghbdjeckopemkoomopmpgjifafpcjhga

TabWeave: Chrome Web Store listing exists, plus GitHub/project references for AI tab organization.
Source: https://chromewebstore.google.com/detail/tabweave/pmfoefbiapldlpljfpjienjahdfmefej

TabAtlas: Chrome Web Store listings exist for tab search, grouping, archiving, and semantic grouping.
Source: https://chromewebstore.google.com/detail/tabatlas/lmkkdaefcklkpghjdhhmnmjklhkflhdc

TabCraft: public website positions it as an advanced browser tab-management Chrome extension.
Source: https://tabcraft.me/en/

TabMind / tabMind: Chrome Web Store listing exists for AI smart tree-style tabs and native tab-group support.
Source: https://chromewebstore.google.com/detail/tabmind-ai-smart-tree-sty/gflnpbocipnophkejkonleggabjhaghn

TabOrbit: Chrome Web Store listing exists for tab sync.
Source: https://chromewebstore.google.com/detail/taborbit-make-your-browse/oigdipdneppbghoepbmhpclkoehliccp

TabForge: search results show existing smart tab manager references and Product Hunt references; not treated as cleared.
```

Assessment:

```text
Generic "Tab + metaphor" naming is heavily crowded. Several names previously considered reasonable are now confirmed as occupied or risky. A more distinctive coined name, or a name anchored around "browser work / AI browser layer" instead of "tab manager", is better for SEO, recall, GitHub search, and Chrome Web Store differentiation.
```

### AI browser layer wording scan

The phrase `AI browser layer` / `browser layer` is useful positioning language, but it is not unique enough to be a defensible public product name by itself.

Observed adjacent usage:

```text
StableBrowse uses "browser layer for AI agents" language.
Source: https://www.ycombinator.com/companies/stablebrowse

Browser Use uses "The way AI uses the web" / browser infrastructure language.
Source: https://browser-use.com/

Google Chrome AI pages now describe AI working with open tabs and browser context.
Source: https://www.google.com/chrome/ai-innovations/
```

Assessment:

```text
Keep "open-source AI browser layer for Chrome" as a subtitle/positioning phrase.
Do not treat BrowserLayer AI as cleared without deeper domain, trademark, GitHub, Chrome Web Store, and social-handle review.
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
| SEO differentiation | High | `tab` naming is crowded across TabPilot, TabWeave, TabAtlas, TabCraft, TabMind, TabOrbit, TabForge, and Tabit-style names. |
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
TabPilot
TabWeave
TabAtlas
TabCraft
TabMind
TabOrbit
TabForge
TabWorkbench
ContextFlow
BrowseMind
```

Better next exploration:

```text
- more distinctive coined names
- names that can own a product brand while using "AI browser layer for Chrome" as a subtitle
- names with easier spoken recall
- names with available GitHub org/repo, domain, Chrome Web Store listing, social handles, and trademark path
- names that avoid `Tab + common noun` unless the domain/store/search evidence is unusually clean
```

Potential next search direction:

```text
1. Coined short names with no direct "tab" prefix.
2. Work/browser-context names that still rank through subtitle copy: "open-source AI browser layer for Chrome".
3. Names that can support a product family later: extension, hosted AI, sync/memory, team workspace.
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
