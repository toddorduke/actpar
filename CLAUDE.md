# ActPar

React + Vite client (`client/`), Supabase Postgres/Auth/Storage/Edge Functions backend (`supabase/`).

## Color system

Three colors. Everything else is neutral. Tokens live in [client/src/assets/styles/variables.css](client/src/assets/styles/variables.css) — always reach for the `var()`, never a raw hex, when styling app chrome.

| Color | Tokens | Job |
|---|---|---|
| **Orange** | `--color-primary` #FF7A00, `--color-primary-end` #E06400 | Action. Anything the user taps to make something happen: submit, save, add, follow, spark, streak fire, progress fill. If it's asking for a tap, it's orange. |
| **Espresso + cream** | `--color-text` #2B1D14, `--color-background` #FBF6EE, `--color-surface` #fff, `--color-muted` #7A6F63 | Foundation. Body text, page background, card surfaces, secondary/disabled text. This is "the app," not a decision the user is making. |
| **Ink-blue** | `--color-trust` #1E3A5F, `--color-trust-end` #16293F | Trust. Reserved for moments where the user hands something over: payment/upgrade CTAs, verified badges, saving a journal/reflection entry. If it's not asking someone to trust the app with money or a private entry, it isn't this color. |

**The rule:** if a component seems to need a fourth color, it doesn't — it needs a shade, tint, or alpha of one of the three above (or it's one of the exceptions below). Before adding a new hex value to any CSS file, name which of the three jobs it's doing. No job, no new color.

`--color-secondary` (#b45309) and `--color-accent` (#d97706) are legacy near-duplicates of orange from before this system existed (2 uses total, in TribeCommunityPage.css). Don't build new work on them — use `--color-primary`/`--color-primary-end` instead.

### Exceptions (already decided — don't relitigate per-component)

- **Explore** (`/feed`, routed through `NAV_POOL.explore`, styled in [client/src/pages/Feed/FeedPage.css](client/src/pages/Feed/FeedPage.css)) is full-bleed dark reels-style media chrome, `#000` background. Deliberate departure from the light foundation, not a bug — this is a media viewer, not app chrome.
- **Fixed semantic/status colors** carry meaning independent of brand color and are not to be reassigned to orange or blue: pact post-type badges in [PactPage.css](client/src/pages/Pact/PactPage.css) (`.badge-update` blue, `.badge-win` green, `.badge-challenge` red, `.badge-event` orange) and the notification-type legend in [NotificationsPage.css](client/src/pages/Notifications/NotificationsPage.css).

### Enforcement

The existing CSS still has plenty of unmigrated raw grays from before this system existed (`#111827`, `#e5e7eb`, etc.) — that's legacy debt, not this doc's job to fix in one pass. What this doc *does* prevent is new drift: before committing a CSS change, check only the colors you're adding, not the whole repo:

```bash
git diff --cached -- '*.css' | grep -E '^\+.*#[0-9a-fA-F]{3,6}'
```

Every new hex value that shows up should be one of: a literal that should become a `var()` of the three tokens above, or a genuine new semantic-status color (add it to the exceptions list above so the next person knows it's intentional, rather than leaving it undocumented). If it's neither, it's a fourth color sneaking in — go back to "which of the three jobs is this doing?"
