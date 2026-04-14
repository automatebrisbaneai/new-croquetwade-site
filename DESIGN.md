# DESIGN.md — croquetwade.com Ecosystem Redesign

## Creative Concept

**"The operating manual for a living system."** Not a portfolio page, not a feature list. A technical document that breathes — like the best product documentation you've ever read, if it was designed by someone who grew up reading broadsheet newspapers and building things in sheds. The page unfolds like a system diagram that someone pinned to a workshop wall: everything connects, nothing is decoration, and the craft is in the connections.

## Reference Sites + Extracted Values

### Primary: Current croquetwade.com (KEEP and extend)
- Inter font family, all weights
- Neutral scale: `#fafafa` through `#171717`
- 1px border accents, `multiply` blend on illustrations
- `cubic-bezier(0.16, 1, 0.3, 1)` entrance easing
- Generous whitespace, left-aligned text blocks

### Secondary: Linear.app (flow/connection patterns)
- Staggered dot-grid animations for pipelines (adapted to our step-based flows)
- Keyframe-driven sequential reveals at 50-60ms intervals
- Grid-based step indicators with animated connectors

### Tertiary: Stripe.com (progressive disclosure of complex product suites)
- Bento-grid approach for showing tool relationships
- Accordion-style section expansion
- Statistics used as structural rhythm-breakers

## Layout Pattern

**Pattern: Narrative Scroll with Embedded Diagrams.** Not a card grid (Pattern 3), not a pure vertical scroll (Pattern 8). This is Pattern 1 (Magazine Editorial) adapted for technical storytelling — the eye moves through a narrative arc, with flow diagrams and expandable panels breaking the rhythm. Each section has a different spatial structure because each section tells a different kind of story.

**Justification:** 50+ tools cannot live in a flat grid. The current 9-card layout already feels like a list. The redesign needs narrative pacing — headline impact, then progressive depth. Magazine editorial gives us the Z-pattern reading, pull-quote moments for stats, and the structural variety to make each section feel like a different chapter.

---

## Colour Palette (CSS Custom Properties)

```css
:root {
  /* ── Neutrals (kept from current site) ── */
  --n50:  #fafafa;
  --n100: #f5f5f5;
  --n200: #e5e5e5;
  --n300: #d4d4d4;
  --n400: #a3a3a3;
  --n500: #737373;
  --n600: #525252;
  --n700: #404040;
  --n900: #171717;
  --white: #ffffff;

  /* ── Brand accents ── */
  --maroon:       #73182C;   /* Queensland Maroon — used sparingly: flow paths, active states, key stats */
  --maroon-light: #8a2438;   /* Hover/focus state for maroon elements */
  --maroon-faint: #f9f2f4;   /* Background tint for maroon-accented sections */
  --green:        #82b25e;   /* Lawn green — flow diagram nodes, success states, growing-things metaphors */
  --green-light:  #96c474;   /* Hover state */
  --green-faint:  #f4f9f0;   /* Background tint for green-accented panels */

  /* ── Section backgrounds (alternating rhythm) ── */
  --bg-primary:   var(--white);
  --bg-secondary: var(--n50);
  --bg-accent:    var(--maroon-faint);  /* Used once: the Interconnection section */

  /* ── Text ── */
  --text-primary:   var(--n900);
  --text-secondary: var(--n600);
  --text-tertiary:  var(--n400);
  --text-on-dark:   var(--n50);
}
```

### Colour Usage Rules
- **Maroon** is the accent, not the dominant. Used for: flow-path SVG strokes, active pipeline step highlights, key stat numbers, the Interconnection section's loop paths, CTA hover states.
- **Green** marks growth and activity. Used for: node indicators on the Member Journey pipeline, success/completion states, the "loop complete" animation endpoint.
- **Neutrals** do 90% of the work. The page should read as warm grey and white with maroon and green punctuation.
- **Never** use maroon as a section background fill. The `--maroon-faint` tint is the maximum saturation for backgrounds.
- **Never** gradient text. Numbers in stats bars can be `--maroon` colour, but no gradients.

---

## Typography Scale

```css
:root {
  --font: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* ── Display ── */
  --text-hero:     clamp(2.5rem, 5.5vw, 4rem);        /* 40-64px — hero headline only */
  --text-section:  clamp(1.75rem, 3vw, 2.5rem);        /* 28-40px — section headlines */
  --text-sub:      clamp(1.25rem, 2vw, 1.5rem);        /* 20-24px — section subheads, pull stats */

  /* ── Body ── */
  --text-lg:       1.125rem;                            /* 18px — hero subtext, lead paragraphs */
  --text-base:     1rem;                                /* 16px — body copy */
  --text-sm:       0.9375rem;                           /* 15px — card descriptions, detail text */
  --text-xs:       0.875rem;                            /* 14px — metadata, labels, nav links */
  --text-xxs:      0.8125rem;                           /* 13px — eyebrows, pipeline step labels */

  /* ── Weights ── */
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semi:    600;
  --weight-bold:    700;    /* NEW — used for stat numbers and flow node labels */

  /* ── Line Heights ── */
  --lh-tight:    1.2;     /* Headlines */
  --lh-snug:     1.4;     /* Subheads */
  --lh-normal:   1.6;     /* Body copy */
  --lh-relaxed:  1.72;    /* Long-form descriptions */

  /* ── Letter Spacing ── */
  --ls-tight:    -0.02em; /* Large headlines */
  --ls-normal:   0em;     /* Body */
  --ls-wide:     0.08em;  /* Eyebrow labels, all-caps metadata */
}
```

### Typography Rules
- **Headlines** (`--text-hero`, `--text-section`): weight 600, `--lh-tight`, `--ls-tight`. Left-aligned. Never centred.
- **Eyebrow labels** above sections: weight 500, `--text-xxs`, `--ls-wide`, uppercase, `--text-secondary` colour.
- **Body copy**: weight 400, `--text-base`, `--lh-normal`. Max line width: `65ch`.
- **Stat numbers**: weight 700, `--text-sub` or larger, `--maroon` colour. The number is the hierarchy anchor; the label beneath it is `--text-xxs`, weight 400.
- **Pipeline step labels**: weight 500, `--text-xxs`, `--n700` colour. Under each node.

---

## Spacing System (4pt base)

```css
:root {
  --space-xs:   0.25rem;   /* 4px */
  --space-sm:   0.5rem;    /* 8px */
  --space-md:   1rem;      /* 16px */
  --space-lg:   1.5rem;    /* 24px */
  --space-xl:   2rem;      /* 32px */
  --space-2xl:  3rem;      /* 48px */
  --space-3xl:  4rem;      /* 64px */
  --space-4xl:  6rem;      /* 96px */
  --space-5xl:  8rem;      /* 128px */

  /* ── Section padding (VARIED — not uniform) ── */
  --section-pad-hero:    clamp(3rem, 6vw, 5rem) 0 clamp(2rem, 4vw, 3rem);
  --section-pad-default: clamp(4rem, 8vw, 7rem) 0;
  --section-pad-tight:   clamp(3rem, 5vw, 4rem) 0;
  --section-pad-loose:   clamp(5rem, 10vw, 9rem) 0;

  /* ── Container ── */
  --max-w:      1280px;
  --container-pad: clamp(1.25rem, 4vw, 2rem);
}
```

### Spacing Rhythm
Section padding is deliberately uneven to create pacing:

| Section | Padding | Rationale |
|---------|---------|-----------|
| Hero | `--section-pad-hero` | Tight top (nav is close), breathing room below |
| Member Journey | `--section-pad-loose` | Needs room — the flow diagram is tall |
| Content Engine | `--section-pad-default` | Standard chapter rhythm |
| Club Support | `--section-pad-default` | Standard |
| Player Intelligence | `--section-pad-tight` | Denser, data-heavy content |
| Bamford Simulator | `--section-pad-tight` | Compact showcase |
| Interconnection | `--section-pad-loose` | THE section — give it room to breathe |
| Strategic Framework | `--section-pad-default` | Standard |
| Contact/Footer | `--section-pad-tight` | Closing — don't drag it out |

---

## Borders and Dividers

```css
:root {
  --border:        1px solid var(--n200);
  --border-accent: 1px solid var(--n300);    /* Stronger separation */
  --radius-sm:     6px;                      /* Buttons, small elements */
  --radius-md:     8px;                      /* Expandable panels */
  --radius-lg:     12px;                     /* Stats bar, flow containers */
  --radius-xl:     16px;                     /* Major containers */
}
```

- Sections separated by `--border` top/bottom — the 1px line is a signature of the current site.
- No border-radius on section containers. Radius only on: buttons, expandable panels, the flow diagram container, and stat chips.
- The flow diagram container gets `--radius-xl` with `--border-accent`.

---

## Animation System

```css
:root {
  /* ── Easing ── */
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);     /* Primary — entrances, reveals */
  --ease-out-soft: cubic-bezier(0.25, 1, 0.5, 1);     /* Subtler — hover states */
  --ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);    /* Toggles — expand/collapse */

  /* ── Durations ── */
  --dur-instant:   100ms;     /* Hover colour changes */
  --dur-fast:      200ms;     /* Hover transforms, small state changes */
  --dur-normal:    400ms;     /* Panel expand/collapse */
  --dur-slow:      600ms;     /* Section entrance reveals */
  --dur-flow:      800ms;     /* Flow path drawing animation */
  --dur-loop:      1200ms;    /* Interconnection loop cycle */

  /* ── Stagger ── */
  --stagger-fast:  40ms;      /* Pipeline steps */
  --stagger-normal: 80ms;     /* Card/item reveals */
  --stagger-slow:  120ms;     /* Section elements */
}
```

### Animation Inventory

| Element | Animation | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| Section headlines | `translateY(24px) + opacity 0->1` | `--dur-slow` | `--ease-out` | Intersection observer (threshold 0.15) |
| Section body elements | `translateY(20px) + opacity 0->1` | `--dur-slow` | `--ease-out` | Staggered after headline, `--stagger-slow` |
| Pipeline steps (S1) | Node scales from 0.8->1 + opacity | `--dur-slow` | `--ease-out` | Sequential from left, `--stagger-fast` per step |
| Pipeline connector lines (S1) | SVG stroke-dashoffset draw-on | `--dur-flow` | `--ease-out` | After preceding node reveals |
| Expandable detail panels | `grid-template-rows: 0fr->1fr` | `--dur-normal` | `--ease-in-out` | Click toggle |
| Loop paths (S6) | SVG stroke-dashoffset continuous loop | `4000ms` | `linear` | Intersection observer, runs indefinitely while visible |
| Loop node pulses (S6) | `scale(1)->scale(1.08)->scale(1)` + subtle glow | `2000ms` | `--ease-in-out` | Synced to path position |
| Stats counter | Number count-up from 0 | `1000ms` | `--ease-out` | Intersection observer |
| Wade characters | `translateY(16px) + opacity` | `--dur-slow` | `--ease-out` | With parent section |
| Hover on expandable items | Background `--n50->--n100`, gap shift | `--dur-instant` | `--ease-out-soft` | Hover |

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  /* Flow paths show completed state immediately */
  .flow-path { stroke-dashoffset: 0 !important; }
  /* Loops show static state */
  .loop-path { animation: none !important; }
}
```

---

## Image Treatment

All Wade character illustrations:
```css
.wade-character {
  mix-blend-mode: multiply;
  width: auto;
  object-fit: contain;
  filter: none;  /* No filters — the illustrations are already styled */
}
```

### Character Assignments

| Section | Image | Max Height | Position |
|---------|-------|------------|----------|
| Hero | `wade-waving-hero.gif` | 500px | Right column of hero grid |
| Member Journey | `wade-map.png` | 280px | Left of section intro text |
| Content Engine | `wade-newspaper.png` | 240px | Right of section intro text |
| Club Support | `wade-building.png` | 260px | Left of section intro text |
| Player Intelligence | `wade-thinking.png` | 240px | Right of section intro text |
| Bamford Simulator | `wade-mallet.png` | 260px | Right of section intro text |
| Interconnection | `wade-talking.png` | 300px | Centred above the loops |
| Contact | `wade-beckoning.png` | 400px | Right column |

Characters alternate left/right per section to create visual rhythm. They never float over content — always in their own grid cell.

---

## Page Structure — Section by Section

### Navigation (sticky)

**Height:** 64px. **Background:** `var(--white)` with `backdrop-filter: blur(8px)` at 95% opacity on scroll. **Bottom border:** `var(--border)`.

**Left:** Brand text "CroquetWade" — `--text-xs`, weight 600, `--n900`.
**Right:** Section anchors as text links — `--text-xs`, weight 500, `--n600`, hover `--n900`. Links: Systems | Framework | Get in Touch. (Three items — no hamburger needed.)

On mobile (<640px): brand left, single "Menu" text link right that reveals a full-width dropdown panel (not a hamburger icon — a word).

---

### Section: Hero

**Background:** `var(--white)`.
**Padding:** `--section-pad-hero`.

**Layout:** Two-column grid: `1.1fr 0.9fr`, gap `--space-3xl`.

**Left column:**
1. Eyebrow: "Digital Ecosystem for Queensland Croquet" — uppercase, `--text-xxs`, `--ls-wide`, `--text-secondary`, margin-bottom `--space-lg`.
2. Headline: "50+ tools. One connected ecosystem." — `--text-hero`, weight 600, `--lh-tight`, `--ls-tight`, `--text-primary`. Margin-bottom `--space-lg`.
3. Subtext: "I built the digital infrastructure for Queensland croquet. Not nine systems — one living ecosystem where every piece feeds the next. A Facebook ad becomes a club member. A voice recording becomes a news article. A gala day becomes an email campaign." — `--text-lg`, weight 400, `--lh-normal`, `--text-secondary`. Max-width `55ch`. Margin-bottom `--space-2xl`.
4. Stats bar (below subtext, not separate section).
5. CTA button: "See how it connects" — anchors to Interconnection section. `--text-xs`, weight 500, padding `0.75rem 1.75rem`, background `--n900`, colour `--white`, border-radius `--radius-sm`. Hover: background `--maroon`.

**Stats bar:** 4-column grid within left column. Each stat: number on top (weight 700, `--text-sub`, `--maroon`), label below (`--text-xxs`, weight 400, `--text-tertiary`). Stats separated by `1px solid var(--n200)` vertical dividers. Border-radius `--radius-lg` on outer container with `var(--border)`.

| Stat | Label |
|------|-------|
| 42 | clubs supported |
| 1,777 | members connected |
| 50+ | tools shipped |
| 1 | connected ecosystem |

**Right column:** `wade-waving-hero.gif`, max-height 500px, `mix-blend-mode: multiply`, vertically centred.

**Mobile (<640px):** Single column. Headline, subtext, stats bar (2x2 grid), CTA, then character image below. Character max-height 300px.

---

### Section 1: The Member Journey

**Background:** `var(--bg-secondary)` with `var(--border)` top and bottom.
**Padding:** `--section-pad-loose`.

**Section intro (above the flow):**
Two-column layout: Wade character (wade-map, left, 280px) + text block (right).

- Eyebrow: "THE SPINE" — `--text-xxs`, `--ls-wide`, `--text-secondary`.
- Headline: "Stranger to ranked player. Automatically." — `--text-section`, weight 600.
- Subtext: "One pipeline. Nine steps. From clicking a Facebook ad to appearing in world rankings — with SMS reminders, automated emails, and handicap tracking along the way. No manual data entry. No dropped leads." — `--text-base`, `--lh-normal`, `--text-secondary`. Max-width `50ch`.

**The Flow Diagram:**

A horizontal pipeline with 9 connected steps. This is THE hero visual of the section.

**Structure:** Horizontal scrolling container on mobile, full-width on desktop. Each step is a node connected by an SVG path line.

```
[Facebook Ad] -> [Come & Try Signup] -> [SMS Reminders] -> [Club Allocation] -> [Email Nurture] -> [MyCroquet Membership] -> [Handicap Tracking] -> [World Rankings] -> [Honour Boards]
```

**Node design:**
- Circle indicator: 32px diameter, `var(--green)` fill with `var(--white)` inner dot (8px). Active/revealed nodes pulse briefly on entrance.
- Label below: `--text-xxs`, weight 500, `--n700`. Max two lines, centred under node.
- Connector line: 2px SVG path, `var(--n300)` stroke. Animates on scroll with `stroke-dashoffset` draw-on effect. When drawn, colour transitions to `var(--maroon)`.
- Step detail (below label): `--text-xxs`, weight 400, `--text-tertiary`. One line of context.

**Step details:**

| Step | Label | Detail |
|------|-------|--------|
| 1 | Facebook Ad | Targeted by area |
| 2 | Come & Try Signup | comeandtrycroquet.com |
| 3 | SMS Reminders | ClickSend automated |
| 4 | Club Allocation | 324 sessions across QLD |
| 5 | Email Nurture | 9 Golden Path emails over 28 days |
| 6 | MyCroquet Membership | OTP login, no passwords |
| 7 | Handicap Tracking | Trend charts, hysteresis engine |
| 8 | World Rankings | 174 players, 20,140 games |
| 9 | Honour Boards | Public player profiles |

**Desktop layout:** The 9 nodes sit on a single horizontal line. The container is full-width (`--max-w`). Nodes are evenly spaced. The SVG connector is a single continuous path with slight vertical wave (not perfectly straight — a subtle sine curve, 8px amplitude, to feel organic rather than mechanical).

**Tablet (640-1024px):** Two rows — steps 1-5 top, steps 6-9 bottom. A curved connector drops from step 5 on row 1 down to step 6 on row 2, continuing rightward.

**Mobile (<640px):** Vertical. Nodes stack in a single column, left-aligned. Connector runs vertically. Each node is a horizontal row: indicator left, label + detail right. This becomes a simple timeline layout.

**Proof callout** (below the flow):
A bordered panel (`var(--border)`, `--radius-md`, padding `--space-xl`), background `var(--white)`:
- "Proven: East Brisbane Pilot" — `--text-sm`, weight 600.
- "14 signups from $91.43 spend. Blueprint for statewide rollout." — `--text-sm`, weight 400, `--text-secondary`.

---

### Section 2: The Content Engine

**Background:** `var(--white)`.
**Padding:** `--section-pad-default`.

**Section intro:**
Text left, wade-newspaper right (240px).

- Eyebrow: "CONTENT" — `--text-xxs`, `--ls-wide`, `--text-secondary`.
- Headline: "From voice recording to statewide newsletter. Automatically." — `--text-section`, weight 600.
- Subtext: "Dictate a match report on your phone. It knows your name and 200 croquet terms. It flows through editorial, hits the news site, gets picked up by the newsletter, and drives readers back into the ecosystem. Every article has a call to action." — `--text-base`, `--text-secondary`.

**Content layout — The Loop Diagram:**

A circular/oval flow showing the content cycle. Not a list of tools — a cycle.

```
Share Tool (voice/photo) -> Newsroom (editorial) -> News Site (78+ articles) -> Newsletter (1,735 members) -> CTA drives action -> More content created -> [loops back to Share Tool]
```

**Implementation:** SVG oval path with nodes positioned around it. The path animates continuously (slow, 3600ms per full loop, `linear` easing). Nodes are positioned at clock positions around the oval. Each node has:
- Icon area: 48px circle, `var(--n100)` background, subtle `var(--border)`.
- Label: `--text-xxs`, weight 500, below the icon.
- On hover: the node expands to show a detail tooltip panel (positioned outside the loop) with the tool description and a stat.

**Expandable detail panel** (below the loop diagram):
Each tool gets a row in an expandable list. Click to expand.

| Tool | Headline | Expanded Detail |
|------|----------|-----------------|
| Share Tool | "Dictate. Upload. Done." | share.croquetqld.org — voice-to-text knows 200+ croquet terms and 157 QLD player names. Photos, video, match reports. No retyping. |
| Newsroom | "Anyone can submit. AI helps." | Quill editor, AI title/excerpt suggestions, approval workflow. Quality gate before publication. |
| News Site | "78+ articles. AI-optimised." | news.croquetqld.org — structured data, 7 hub pages, built for AI search visibility. |
| Newsletters | "Geographically targeted." | 1,735 members geocoded. Every article drives readers back to the ecosystem. Auto-scanned from news. |
| CroquetTV | "Every croquet video. One place." | tv.croquetwade.com — PeerTube + Cloudflare R2. All QLD croquet video collected. |
| Gala Day Pipeline | "Submit a gala day. Get an email campaign." | Club submits -> article published -> email campaign sent (339 emails, 0 failures for EBCC pilot) -> PDF flyer generated. |

**Expandable row design:**
- Closed: tool name left (`--text-sm`, weight 500), headline right (`--text-sm`, weight 400, `--text-secondary`), plus icon far right. Full-width row, padding `--space-md --space-lg`. Border-bottom `var(--border)`. Hover: background `var(--n50)`.
- Open: `grid-template-rows: 0fr -> 1fr` animation (`--dur-normal`, `--ease-in-out`). Detail text appears below (`--text-sm`, `--lh-relaxed`, `--text-secondary`). Plus rotates to X. Background `var(--n50)`.
- Only one panel open at a time (accordion behaviour).

**Mobile:** The loop diagram simplifies to a vertical flow (same as Member Journey mobile treatment). The expandable list works unchanged.

---

### Section 3: Club Support Toolkit

**Background:** `var(--bg-secondary)` with `var(--border)` top and bottom.
**Padding:** `--section-pad-default`.

**Section intro:**
Wade-building left (260px), text right.

- Eyebrow: "FOR CLUBS" — `--text-xxs`, `--ls-wide`, `--text-secondary`.
- Headline: "Everything a committee needs. In one place." — `--text-section`, weight 600.
- Subtext: "Most club committees are volunteers with day jobs. They don't need more systems to learn. They need one place that handles websites, documents, newsletters, governance, grants, and meeting notes — without asking them to become IT managers." — `--text-base`, `--text-secondary`.

**Content layout — Bento grid (2-column, asymmetric):**

Not equal cards. A bento layout where the primary tool (Bespoke Website) gets a large cell, and supporting tools get smaller cells. This is NOT a uniform card grid.

**Grid structure:**
```
+---------------------+--------------+
|  Bespoke Websites   |  Committee   |
|  (large — 2 rows)   |    Wiki      |
|                     +--------------+
|                     |  Document    |
|                     |  Storage     |
+--------------+------+--------------+
|  Club        |  ClubHub Forum      |
|  Newsletters |                     |
+--------------+---------------------+
|  Officeholder|  Grants Portal      |
|  Database    |                     |
+--------------+---------------------+
|  Meeting     |  Receipt/Asset      |
|  Transcription  Capture            |
+--------------+---------------------+
```

**Cell design:**
- No card styling (no shadow, no heavy border-radius). Each cell is defined by `var(--border)` grid lines — the grid itself is the visual structure.
- Padding: `--space-xl`.
- Title: `--text-sm`, weight 600, `--text-primary`. Margin-bottom `--space-sm`.
- Description: `--text-sm`, weight 400, `--text-secondary`, `--lh-normal`.
- Stat or link (optional): `--text-xxs`, weight 500, `--maroon`.

**Cell content:**

| Cell | Title | Description | Stat |
|------|-------|-------------|------|
| Bespoke Websites (large) | "Custom per club. Not cookie-cutter." | websites.croquetwade.com — discovery wizard, 9 templates. Each site reflects the club's character, not a corporate template. Headland-Buderim demo complete. | 9 templates |
| Committee Wiki | "22 pages of governance." | wiki.croquetwade.com — legal duties, insurance, role requirements. Including "Member Threatening Legal Action" guide. | 22 pages |
| Document Storage | "Constitutions. Policies. Minutes." | Centralised in MyCroquet. No more USB sticks and email chains. | |
| Club Newsletters | "Their own email newsletter." | Each club can send branded newsletters to their members via Plunk. | |
| ClubHub Forum | "Committee talks to committee." | clubhub.croquetqld.org — cross-club communication. What's working, what's not, shared across the state. | |
| Officeholder Database | "Who runs what. Statewide." | 135 records across 41 clubs. Current contacts for every committee position. | 135 records |
| Grants Portal | "Find money. Write the application." | grants.croquetwade.com — 9 grants indexed, AI writes applications. Politician contacts (local, state, federal) per club area. Letter-writing help. | 9 grants |
| Meeting Transcription | "Record audio. Get notes." | Whisper + AI cleanup. Committee meetings captured without a minute-taker. | |
| Receipt/Asset Capture | "Photo a receipt. Done." | Through share tool, identity known via MyCroquet. Logged automatically. No paperwork. | |

**Mobile (<640px):** Bento collapses to a single-column stack. The "large" cell loses its visual emphasis but stays first in order. Each cell gets border-bottom only.

---

### Section 4: Player Intelligence

**Background:** `var(--white)`.
**Padding:** `--section-pad-tight`.

**Section intro:**
Text left, wade-thinking right (240px).

- Eyebrow: "PLAYER DATA" — `--text-xxs`, `--ls-wide`, `--text-secondary`.
- Headline: "Data that helps players improve." — `--text-section`, weight 600.
- Subtext: "Not dashboards for the sake of dashboards. Tools that help a player see their progress, compare their position, study the game, and get better." — `--text-base`, `--text-secondary`.

**Content layout — Two-column feature grid:**

Three rows, each row has two items side by side. Not cards — text blocks separated by grid lines.

| Left | Right |
|------|-------|
| **Handicap System** — Submit, track, trend charts. Hysteresis catches big movements. Historical data preserved. | **World Rankings** — Full WCF integration. 174 players, 395 events, 20,140 games. Grade-over-time charts. |
| **Handicap Distribution Study** — Statistical analysis of 717 records. Published research with 6 charts. | **Member Map** — 1,735 members geocoded. Interactive Leaflet map with clusters. |
| **GC Tactics Library** — Mental tools, positioning frameworks from Oxford Croquet. 144 articles + 242 images. | **Photography Policy** — CAQ Filming and Photography Policy. Full + condensed versions. |

**Item design:**
- Title: `--text-sm`, weight 600, margin-bottom `--space-xs`.
- Description: `--text-sm`, weight 400, `--text-secondary`, `--lh-normal`.
- Key stat (if applicable): `--text-xxs`, weight 700, `--maroon`, block, margin-top `--space-sm`.
- Items separated by `var(--border)` — both columns and rows. Grid gap is 0; the border IS the gap.
- Padding per cell: `--space-xl`.

**Mobile:** Single column. Each item gets border-bottom.

---

### Section 5: The Bamford Simulator

**Background:** `var(--bg-secondary)` with `var(--border)` top and bottom.
**Padding:** `--section-pad-tight`.

**Layout:** Two-column: text left (60%), character right (40%).

- Eyebrow: "PLAY + TRAIN" — `--text-xxs`, `--ls-wide`, `--text-secondary`.
- Headline: "From 'have a go' to 'train like a professional.'" — `--text-section`, weight 600.
- Wade-mallet right (260px).

**Two sub-blocks** (stacked vertically within the left column, separated by `--space-xl`):

**Bamford 2.0:**
- Sub-headline: "Bamford 2.0" — `--text-sub`, weight 600.
- "Playable croquet game. Physics engine. Deployed and live." — `--text-base`, `--text-secondary`.

**Bamford 3.0:**
- Sub-headline: "Bamford 3.0" — `--text-sub`, weight 600, `--maroon`.
- "Self-improving AI. CMA-ES evolutionary training, 16 personas, MIT base physics papers. Models grass-cut direction. Cowing analysis for smart game management. A tool for elite interstate competition prep." — `--text-base`, `--text-secondary`.

**Mobile:** Single column, character above text.

---

### Section 6: The Interconnection (MOST IMPORTANT)

**Background:** `var(--maroon-faint)` — the only section with a coloured background. This marks it as different.
**Padding:** `--section-pad-loose`.
**Border:** `var(--border)` top and bottom, plus a `4px solid var(--maroon)` left accent on the `--max-w` container.

**Section intro (centred — the ONE exception to left-alignment):**
Wade-talking centred above text (300px).

- Eyebrow: "THE POINT" — `--text-xxs`, `--ls-wide`, `--maroon`, weight 600.
- Headline: "Nothing is standalone. Everything feeds the next." — `--text-section`, weight 600, max-width `20ch`, centred.
- Subtext: "This is the difference between 50 tools and one ecosystem. Every tool creates output that becomes input for another. Three real loops running right now across Queensland croquet." — `--text-base`, `--text-secondary`, centred, max-width `55ch`.

**The Three Loops:**

Three loop diagrams, stacked vertically with `--space-3xl` between them. Each loop is a distinct visual.

**Loop implementation:**

Each loop is an SVG with nodes positioned in an oval/rounded-rectangle path. The path has an animated dash that travels continuously around the loop, showing the flow direction. Nodes sit on the path at step positions.

**SVG specs:**
- Path stroke: 2px, `var(--maroon)` at 40% opacity.
- Animated dash: 20px dash segment, `var(--maroon)` at full opacity, travels around the path. Speed: one full loop in 4 seconds, `linear` easing, `infinite` iteration.
- Nodes: 28px circles, `var(--white)` fill, `var(--border)` stroke. Label below each node: `--text-xxs`, weight 500.
- Active node (where the dash currently passes): subtle scale pulse `1->1.08->1` over 400ms, shadow glow `0 0 0 3px var(--maroon)` at 20% opacity.
- Desktop: each loop approximately 600px wide, centred in the container.
- The path should feel hand-drawn — not a perfect geometric oval. Use bezier curves with slight irregularity.

**Loop 1 — "Stranger to Player"**

Label above the loop: "Stranger to Player" — `--text-sub`, weight 600.

Nodes (clockwise):
1. Facebook Ad
2. Come & Try Signup
3. SMS Reminder
4. Attends Session
5. Joins as Member
6. Gets Handicap
7. World Rankings
8. Newsletter Story
9. Drives More Signups (connects back to 1)

**Loop 2 — "Club Committee"**

Label: "Club Committee" — `--text-sub`, weight 600.

Nodes (clockwise):
1. Uses Wiki
2. Stores Documents
3. Builds Website
4. Submits Gala Day
5. Published on News
6. Newsletter
7. Drives Attendance
8. More Members
9. Stronger Club (connects back to 1)

**Loop 3 — "On-Field Content"**

Label: "On-Field Content" — `--text-sub`, weight 600.

Nodes (clockwise):
1. Dictates Match Report
2. Voice Knows Name
3. Flows Through Editorial
4. Published on News
5. Newsletter Picks Up
6. CTA Drives Action
7. Someone Signs Up
8. Cycle Continues (connects back to 1)

**Mobile (<640px):** Loops become vertical timelines (like Member Journey mobile). Each loop is a vertical list with a left-side connector line (2px, `--maroon` at 40%). The animated dash becomes a CSS animation on the line (a travelling gradient highlight). Last step has an arrow pointing back to first step with "loops back" label.

**Closing statement (below the three loops):**
A pull-quote style block, full-width, centred:
"Every tool I've built creates output that becomes input for another tool. That's not a feature list. That's an operating system." — `--text-sub`, weight 500, `--text-primary`, italic, max-width `40ch`, centred.

---

### Section: Strategic Framework

**Background:** `var(--white)`.
**Padding:** `--section-pad-default`.

**Layout:** Keep the current site's three-column layout (Ideals | divider | Aims).

- Eyebrow: "STRATEGY" — `--text-xxs`, `--ls-wide`, `--text-secondary`.
- Headline: "Built on strategy. Not on trend." — `--text-section`, weight 600.

**Three columns:** `1fr auto 1fr`, gap `--space-3xl`.

**Left — The 4 Ideals:**
Title: "The 4 Ideals" — `--text-sm`, weight 600.
Numbered list, each item: number (`--text-sub`, weight 700, `--maroon`) + text (`--text-sm`, weight 400).

1. Enjoy Croquet
2. Keep It Simple
3. Hit Croquet's Aims
4. Co-operate for Croquet

**Centre:** Vertical divider line, 1px, `var(--n200)`.

**Right — The 6 Aims:**
Title: "The 6 Aims" — `--text-sm`, weight 600.
Numbered list, same style:

1. Strengthen Admin and Internal Operations
2. Promote Croquet Externally
3. Grow and Engage Members
4. Support Clubs
5. Develop Skilled Play
6. Encourage Innovative Ideas

**Mobile:** Two columns stack. No divider. Aims section gets border-top `var(--border)` and padding-top `--space-xl`.

---

### Section: Contact

**Background:** `var(--white)`.
**Padding:** `--section-pad-tight`.

**Layout:** Two-column: `1fr 1fr`, gap `--space-3xl`.

**Left:**
- Eyebrow: "GET IN TOUCH" — `--text-xxs`, `--ls-wide`, `--text-secondary`.
- Headline: "Built for croquet. Ready to talk." — `--text-section`, weight 600.
- Body: "I've built this for Queensland croquet and I'm not stopping. If your club needs digital support, your association wants to modernise, or you just want to see how it all works — let's talk." — `--text-base`, `--text-secondary`, `--lh-relaxed`.
- CTA button: "Get in touch" — same style as hero button. Links to `mailto:me@croquetwade.com`.
- Byline: "Wade Hart — CroquetWade" — `--text-xs`, `--text-tertiary`, margin-top `--space-md`.

**Right:**
Wade-beckoning, max-height 400px, `mix-blend-mode: multiply`, vertically centred.

**Mobile:** Single column. Text first, character below.

---

### Footer

**Background:** `var(--white)`.
**Border-top:** `var(--border)`.
**Padding:** `--space-xl 0`.

**Layout:** Flex, space-between.
**Left:** "2026 CroquetWade" — `--text-xs`, `--text-tertiary`.
**Right:** "Brisbane, Queensland" — `--text-xs`, `--text-tertiary`.

No footer links. No social icons. Clean close.

---

## Progressive Disclosure Pattern

Every section except Hero, Framework, and Contact uses the same disclosure pattern:

1. **Visible on load:** Section intro (eyebrow + headline + subtext + Wade character) + primary visual (flow diagram, loop diagram, or bento grid).
2. **Expandable:** Detail panels beneath the primary visual. Each tool/feature is a clickable row that expands to show full description.
3. **Rule:** The page must tell the full story at scroll-through speed (5 seconds per section). The expandable detail is for people who want to go deeper.

### Expand/Collapse Component Spec

```css
.detail-toggle {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-normal) var(--ease-in-out);
}
.detail-toggle[aria-expanded="true"] {
  grid-template-rows: 1fr;
}
.detail-toggle__content {
  overflow: hidden;
}
```

Toggle button: full-width row. Tool name left, one-line summary right, plus/minus icon far right (16px, stroke `var(--n400)`). The icon rotates 45 degrees on expand to form an X.

---

## Responsive Breakpoints

| Breakpoint | Name | Key Changes |
|------------|------|-------------|
| >1024px | Desktop | Full layout as specified |
| 640-1024px | Tablet | Two-column grids become single-column. Pipeline wraps to 2 rows. Bento becomes 2-column simplified. |
| <640px | Mobile | Everything single-column. Flow diagrams become vertical timelines. Loops become vertical with left-side connector. Nav collapses to "Menu" text link. |

### Mobile-Specific Rules
- No horizontal scrolling (pipeline stays within its container; use vertical timeline at mobile width).
- Touch targets: minimum 44px height for expandable rows and interactive elements.
- Character images max-height 200px on mobile (down from 240-300px desktop).
- Stats bar: 2x2 grid, not 4x1.

---

## What This Design Does NOT Have

- Centred hero text over a dimmed photo
- Card grids with identical rounded-corner cards
- SaaS blue/purple palette
- Parallax effects
- Scroll-jacking
- Gradient text on headings or stats
- Hero video
- Hamburger icon (uses "Menu" text instead)
- Stock photography
- Background gradients
- Section backgrounds with opacity overlays
- Decorative SVG blobs or abstract shapes
- Generic "Welcome to CroquetWade" hero heading
- Default `ease 0.3s` transitions
- Identical section padding throughout

---

## Technical Constraints

- **Single HTML file.** All CSS in `<style>` block. Google Fonts loaded via `<link>`.
- **No frameworks.** No Tailwind, Bootstrap, React. Vanilla HTML + CSS + JS.
- **JS for:** Intersection observer animations, expandable panels, SVG path animation control, stats counter, nav scroll behaviour. No JS for visual effects CSS can handle.
- **Performance:** No images > 200KB. Lazy-load Wade characters below the fold. SVG diagrams are inline (not external files).
- **Accessibility:** All expandable panels use `aria-expanded`, `aria-controls`. Flow diagrams have `role="img"` with `aria-label` descriptions. Reduced motion respected. Skip-to-content link. Semantic headings (h1 once, h2 per section).
- **Font loading:** `<link rel="preconnect" href="https://fonts.googleapis.com">` + Inter 400, 500, 600, 700 weights. `font-display: swap`.
