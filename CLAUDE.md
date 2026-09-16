# ActPar

React + Vite web client (`client/`), React Native/Expo mobile app (`mobile/`), Supabase Postgres/Auth/Storage/Edge Functions backend (`supabase/`), and a shared business-logic package (`shared/`) consumed by both apps.

## Shared code (`shared/`)

Data-fetching hooks, matching/streak rules, and content moderation live in `shared/` (npm workspace `@actpar/shared`) and are used unchanged by both `client/` and `mobile/` — UI stays separate per platform, only the "brains" are shared. Each app calls `setSupabaseClient()` once at its own `src/lib/supabase.js`, right after creating its own client (different storage adapter, different env var names per platform) — every shared hook pulls the client from there via `getSupabaseClient()`, so shared code never imports a platform-specific Supabase module directly.

Two hooks are deliberately *not* shared, despite being close cousins: `useGoals` (web does XP/analytics/milestone-broadcast-to-connections; mobile has pause/resume/archive/extend/edit lifecycle web doesn't) and the full `useNotifications` (web plays sounds via the Audio API; mobile's realtime subscription needs an explicit `setAuth()` call web doesn't hit the same way) — see the comment at the top of `shared/index.js` before "fixing" this duplication.

**Setup**: `npm install`, run from the repo root *or* from `client`/`mobile` directly (npm detects the workspace root automatically either way — verified: `cd client && npm install` is exactly what the root `npm run build` script does), resolves `@actpar/shared` and hoists it into the root `node_modules`. The one thing that does *not* work: `npm ci` run from inside `client/` or `mobile/` — their own `package-lock.json` predates the workspace and doesn't know about `@actpar/shared`; only the root `package-lock.json` is accurate. If you ever see `Cannot find module '@actpar/shared'`, that's almost always either a stray `npm ci` in a subdirectory, or `node_modules` having been wiped without a re-install.

## Color system

Three colors. Everything else is neutral. Tokens live in [client/src/assets/styles/variables.css](client/src/assets/styles/variables.css) — always reach for the `var()`, never a raw hex, when styling app chrome.

| Color | Tokens | Job |
|---|---|---|
| **Orange** | `--color-primary` #FF7A00, `--color-primary-end` #E06400, `--color-primary-light` #FFA64D | Action. Anything the user taps to make something happen: submit, save, add, follow, spark, streak fire, progress fill. If it's asking for a tap, it's orange. `--color-primary-light` is a lighter tint for highlights/glows/shimmer within an otherwise-orange gradient — not a second color, just a lighter stop of the same one. |
| **Espresso + cream** | `--color-text` #2B1D14, `--color-background` #FBF6EE, `--color-surface` #fff, `--color-muted` #7A6F63 | Foundation. Body text, page background, card surfaces, secondary/disabled text. This is "the app," not a decision the user is making. |
| **Ink-blue** | `--color-trust` #1E3A5F, `--color-trust-end` #16293F | Trust. Reserved for moments where the user hands something over: payment/upgrade CTAs, verified badges, saving a journal/reflection entry. If it's not asking someone to trust the app with money or a private entry, it isn't this color. |

**The rule:** if a component seems to need a fourth color, it doesn't — it needs a shade, tint, or alpha of one of the three above (or it's one of the exceptions below). Before adding a new hex value to any CSS file, name which of the three jobs it's doing. No job, no new color.

`--color-secondary` (#b45309) and `--color-accent` (#d97706) are legacy near-duplicates of orange from before this system existed (2 uses total, in TribeCommunityPage.css). Don't build new work on them — use `--color-primary`/`--color-primary-end` instead.

Separately, raw-hex amber literals (`#f59e0b`, `#d97706`, `#fbbf24`, `#f97316`, `#ffd23f`, and their light tints `#fef3c7`/`#fde68a`/`#fffbeb`) used to be scattered across ~30 files standing in for `--color-primary`/`--color-primary-end`/`--color-primary-light` directly, not through any token — genuine brand drift, not an exception. Swept to tokens 2026-09-09; don't reintroduce them.

### Exceptions (already decided — don't relitigate per-component)

- **Explore** (`/feed`, routed through `NAV_POOL.explore`, styled in [client/src/pages/Feed/FeedPage.css](client/src/pages/Feed/FeedPage.css)) is full-bleed dark reels-style media chrome, `#000` background. Deliberate departure from the light foundation, not a bug — this is a media viewer, not app chrome.
- **Fixed semantic/status colors** carry meaning independent of brand color and are not to be reassigned to orange or blue: pact post-type badges in [PactPage.css](client/src/pages/Pact/PactPage.css) (`.badge-update` blue, `.badge-win` green, `.badge-challenge` red, `.badge-event` orange) and the notification-type legend in [NotificationsPage.css](client/src/pages/Notifications/NotificationsPage.css).
- **Leaderboard podium rank colors** (gold/silver/bronze) in [CommunityPage.css](client/src/pages/Community/CommunityPage.css) (`.lb-top-1/2/3`) and [LeaderboardPage.css](client/src/pages/Leaderboard/LeaderboardPage.css) (`.lb-podium-bar-1/2/3`) are a universal 1st/2nd/3rd-place medal metaphor, independent of brand color — don't convert these to orange. Keep them consistent with each other if either changes.
- **About/landing page** (`/about`, [AboutPage.css](client/src/pages/About/AboutPage.css), `.lp-*` classes) is a separate pre-signup marketing page with its own dark `#080812` identity, same deliberate-departure logic as Explore. Its 4-color feature-icon grid (`.lp-fi-amber/purple/green/blue`, one accent per feature card for visual differentiation) is intentional landing-page design, not app chrome — don't convert `.lp-fi-purple` to orange. Structural elements of the page itself (the logo wordmark, the hero glow, the closing CTA box) aren't part of that exception and were swept back to the brand gradient 2026-09-16 after drifting to an orange/purple mix.

### Enforcement

The existing CSS still has plenty of unmigrated raw grays from before this system existed (`#111827`, `#e5e7eb`, etc.) — that's legacy debt, not this doc's job to fix in one pass. What this doc *does* prevent is new drift: before committing a CSS change, check only the colors you're adding, not the whole repo:

```bash
git diff --cached -- '*.css' | grep -E '^\+.*#[0-9a-fA-F]{3,6}'
```

Every new hex value that shows up should be one of: a literal that should become a `var()` of the three tokens above, or a genuine new semantic-status color (add it to the exceptions list above so the next person knows it's intentional, rather than leaving it undocumented). If it's neither, it's a fourth color sneaking in — go back to "which of the three jobs is this doing?"
