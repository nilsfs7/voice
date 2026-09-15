# Voice — Freestyle Football Governance

Living product requirements for AI agents working on this repo. Treat this file as the source of truth. When the user adds or changes a requirement in chat, update this document before implementing.

**Language:** The product owner may give input in German. Keep this file in English. Translate and normalize requirements into the structures below.

---

## Agent instructions

1. Prefer this file over assumptions. If something is missing or ambiguous, ask — do not invent product behavior.
2. Keep requirements **ID’d, scoped, and testable**. Use the section templates below.
3. When adding a requirement: assign the next free ID in that section, set status (`proposed` | `accepted` | `deferred` | `rejected`), and note date + short rationale if non-obvious.
4. Do not implement features that are only `proposed` unless the user asks to build them.
5. Keep out-of-scope and open questions current so agents do not rebuild rejected ideas.
6. Prefer small, reviewable changes that map to accepted requirements.
7. Voice does **not** own user accounts. Authenticate against the FSMeet backend (OAuth). Persist Voice-owned data in MySQL using **snake_case** table and column names.
8. Follow **§7 Design system** for all UI. Prefer civic / product-trust aesthetics over crypto, gaming, or flashy dashboard tropes.
9. When adding a **new public page** (SEO-visible), add its path to `src/lib/seo/public-paths.ts` so `/sitemap.xml` stays complete (TECH-11).
10. Schema changes go in `db/schema.sql` and/or `db/migrations/*.sql`; they apply automatically on server start (TECH-14).

---

## 1. Product vision

| Field                  | Value                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| **Product**            | Voice                                                                                                |
| **Domain**             | Freestyle football community governance                                                              |
| **Ecosystem**          | Official governance system for the freestyle football community; part of **FSMeet**                  |
| **One-liner**          | Community decisions (polls) for FSMeet users — create, discuss, vote, and link from the wider scene. |
| **Problem**            | _TBD_                                                                                                |
| **Success looks like** | _TBD_                                                                                                |

---

## 2. Ecosystem & environments

Voice is one of three related systems.

| System               | Role                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| **Voice** (this app) | Governance UI + Voice data (polls, votes, comments, rankings)             |
| **FSMeet backend**   | Source of truth for users and freestyle football event / competition data |
| **FSMeet frontend**  | UI for freestyle football events                                          |

### 2.1 URLs

| System                   | Prod                            | Dev                                 | Local                     |
| ------------------------ | ------------------------------- | ----------------------------------- | ------------------------- |
| Voice                    | https://voice.fsmeet.com/       | https://dev.voice.fsmeet.dffb.org/  | http://localhost:3004     |
| FSMeet backend (Swagger) | https://api.fsmeet.dffb.org/api | https://api.dev.fsmeet.dffb.org/api | http://localhost:3000/api |
| FSMeet frontend          | https://fsmeet.com/ (Vercel)    | https://dev.fsmeet.dffb.org/        | http://localhost:3002     |

### 2.2 Important FSMeet backend endpoints

| Concern      | Docs / endpoint                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| OAuth        | https://api.fsmeet.dffb.org/api/#/OAuth                                                                     |
| List users   | https://api.fsmeet.dffb.org/api/#/User/UserController_getAll                                                |
| Get one user | https://api.fsmeet.dffb.org/api/#/User/UserController_getOne — with auth token, private fields are included |

---

## 3. Technical requirements

| ID      | Requirement                                                                                  | Priority | Status   | Notes                                                                                                                                                                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TECH-01 | Application framework: **Next.js**                                                           | must     | accepted |                                                                                                                                                                                                                                                                                                                                     |
| TECH-02 | Local development runs in a **Docker** container                                             | must     | accepted |                                                                                                                                                                                                                                                                                                                                     |
| TECH-03 | Docker image is built in **GitHub Actions** and pushed to **Docker Hub**                     | must     | accepted | Workflow: `.github/workflows/ci.yml`                                                                                                                                                                                                                                                                                                |
| TECH-04 | Local Voice app listens on **port 3004**                                                     | must     | accepted | http://localhost:3004                                                                                                                                                                                                                                                                                                               |
| TECH-05 | Authentication via FSMeet backend **OAuth**                                                  | must     | accepted | See §2.2                                                                                                                                                                                                                                                                                                                            |
| TECH-06 | Voice-owned persistence in **MySQL**                                                         | must     | accepted |                                                                                                                                                                                                                                                                                                                                     |
| TECH-07 | MySQL **table and column names use snake_case**                                              | must     | accepted | e.g. `poll_options`, `created_at`                                                                                                                                                                                                                                                                                                   |
| TECH-08 | CI builds on push to `main` / `dev`, PRs to `main`, and `workflow_dispatch`                  | must     | accepted | See §3.1                                                                                                                                                                                                                                                                                                                            |
| TECH-09 | Docker Hub image: `nilsfs7/fsmeet-voice` (`:dev` on non-main; `:latest` + `:prod` on `main`) | must     | accepted | Secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`                                                                                                                                                                                                                                                                                       |
| TECH-10 | Configurable **default** for the poll editor’s **minimum age** field; **default 12**         | must     | accepted | Env `VOICE_MIN_AGE`; used only as the form default (FR-PO-005). **Not** a global gate — age limits apply per poll when set                                                                                                                                                                                                          |
| TECH-11 | SEO **sitemap** at `/sitemap.xml`, generated dynamically so it stays current                 | must     | accepted | Next.js `app/sitemap.ts`. Includes public static pages (registry: `src/lib/seo/public-paths.ts` — add a path when creating a new public page) and all **published**, non-deleted polls (prefer alias URL). Auth-only routes excluded (`/my-votes`, `/polls/new`, edit). Regenerates on request so new polls appear without redeploy |
| TECH-12 | Local Docker Compose includes an **Adminer** container to inspect the Voice MySQL database   | must     | accepted | Containers: `voice-db` (MySQL), `voice-adminer`; UI at http://localhost:9080; server `mysql`, user/password/db `voice` (dev only — not for production)                                                                                                                                                                              |
| TECH-13 | Poll text fields are **trimmed** before persistence                                          | must     | accepted | Question, description, option label/description, country/continental codes; empty optional strings stored as `NULL`                                                                                                                                                                                                                 |
| TECH-14 | Database **schema/migrations run automatically** when the app server starts              | must     | accepted | Via Next.js `src/instrumentation.ts` + `scripts/migrate.mjs` (`db/schema.sql` then `db/migrations/*.sql`). Requires `DATABASE_URL`. Idempotent; skipped if `DATABASE_URL` unset (e.g. image build). Manual: `npm run db:migrate` |

### 3.1 CI / Docker Hub (`.github/workflows/ci.yml`)

| Branch / trigger | Image tags                             | Bake-time URLs (build-args)                                                                                                                             |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default / `dev`  | `nilsfs7/fsmeet-voice:dev`             | `AUTH_URL`=https://dev.voice.fsmeet.dffb.org · `BACKEND_URL_FSMEET`=https://api.dev.fsmeet.dffb.org · `FRONTEND_URL_FSMEET`=https://dev.fsmeet.dffb.org |
| `main`           | `nilsfs7/fsmeet-voice:latest`, `:prod` | `AUTH_URL`=https://voice.fsmeet.com · `BACKEND_URL_FSMEET`=https://api.fsmeet.dffb.org · `FRONTEND_URL_FSMEET`=https://fsmeet.com                       |

Build-args: `AUTH_URL`, `BACKEND_URL_FSMEET`, `FRONTEND_URL_FSMEET`, `BUILD_TIME`. Dockerfile: `./Dockerfile`. Secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`.

---

## 4. Users & eligibility (FSMeet user types)

Identity and profile live in FSMeet. Each FSMeet user has a `user_type` (conceptually) from:

`association` · `brand` · `dj` · `event_organizer` · `fan` · `freestyler` · `mc` · `media` · `administrative`

| ID   | Role                        | Description                                                                                                                                                                | Status   |
| ---- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| U-01 | FSMeet user (authenticated) | Any logged-in FSMeet user interacting with Voice                                                                                                                           | accepted |
| U-02 | Poll creator                | Subset of user types allowed to create polls, **and** profile trust gate (FR-PO-009b)                                                                                      | accepted |
| U-03 | Voter                       | Subset of user types allowed to vote on polls, **and** profile presence gate (FR-VO-012)                                                                                   | accepted |
| U-04 | Commenter                   | Any FSMeet user type may comment (when authenticated)                                                                                                                      | accepted |
| U-05 | Scorer                      | Users who may up/down-vote polls and comments (not `association`, not `fan`)                                                                                               | accepted |
| U-06 | Anonymous visitor           | Can **view** all public content (polls, results per visibility rules, comments, FAQ, imprint, privacy) but cannot vote, comment, score, or create; must log in to interact | accepted |
| U-07 | Voice admin                 | Fixed FSMeet username `fsmeet` — may soft-delete **any** poll and **any** comment (FR-AD-001)                                                                              | accepted |

### 4.1 Capability matrix by user type

| User type         | Create poll | Vote | Comment | Up/down score |
| ----------------- | ----------- | ---- | ------- | ------------- |
| `association`     | yes         | no   | yes     | no            |
| `brand`           | no          | no   | yes     | yes           |
| `dj`              | yes         | yes  | yes     | yes           |
| `event_organizer` | yes         | yes  | yes     | yes           |
| `fan`             | no          | no   | yes     | no            |
| `freestyler`      | yes         | yes  | yes     | yes           |
| `mc`              | yes         | yes  | yes     | yes           |
| `media`           | yes         | yes  | yes     | yes           |
| `administrative`  | no          | no   | yes     | yes           |

Capability columns above are **user-type** eligibility only. Creating a poll and voting also require FSMeet **profile gates** (§4.2): create → FR-PO-009b; vote → FR-VO-012.

### 4.2 Profile gates (FSMeet user fields)

Identity fields live on the FSMeet user object (getOne / getAll — §2.2). Treat a string field as **present** when it is a non-empty string after trim. Map product language to API fields as follows:

| Product concept | FSMeet field | “Satisfied” when |
| --------------- | ------------ | ---------------- |
| WFFA ID | `wffaId` | present |
| Verified | `verificationState` | equals `verified` (product: “verifiedState true”) |
| Instagram | `instagramHandle` | present |
| TikTok | `tikTokHandle` | present |
| YouTube | `youTubeHandle` | present |

| Gate | Applies to | Rule | Status |
| ---- | ---------- | ---- | ------ |
| Create-poll trust | Poll create/manage (FR-PO-009b) | User type may create (§4.1) **and** (`wffaId` present **or** `verificationState` = `verified`) | accepted |
| Vote presence | Casting/changing a ballot (FR-VO-012) | User type may vote (§4.1) **and** at least one of: `wffaId`, `verificationState` = `verified`, `instagramHandle`, `tikTokHandle`, `youTubeHandle` | accepted |

If the gate fails because required profile fields are missing, block the action and show a hint to update the FSMeet profile (same pattern as FR-VO-005b), with a button to https://fsmeet.com/account.

---

## 5. Domain model (conceptual)

| Concept                                 | Meaning                                                                                                                                                                                                                                       | Owned by       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **User**                                | FSMeet account + user type + demographics used for targeting (country, continent, age, gender, …) + profile trust/presence fields used for create/vote gates (`wffaId`, `verificationState`, social handles — §4.2) | FSMeet backend |
| **Poll** (community decision / Umfrage) | The **question is the title**; optional description elaborates. Also: options, schedule, audience filters, public URL (stable `public_id` and optional unique **alias** for nicer links), choice mode, publish state, live result shares flag | Voice          |
| **Poll option**                         | One selectable answer on a poll (excludes system abstention); may include an optional description                                                                                                                                             | Voice          |
| **Abstention** (`Enthaltung`)           | System ballot option: counts as participation without choosing an answer; mutually exclusive with all other options; **included in chart denominators**                                                                                       | Voice          |
| **Ballot / participation**              | A user’s selection(s) on a poll (one participation per user; changeable until expiry)                                                                                                                                                         | Voice          |
| **Creator ballot roster**               | Creator-only view of **who** voted and **for which** option(s) / abstention — transparency for the poll owner                                                                                                                                 | Voice          |
| **My votes**                            | Authenticated user’s overview of polls they participated in and their answers                                                                                                                                                                 | Voice          |
| **Poll score vote**                     | Up/down vote on a poll for importance ranking (not by the poll creator; score starts at 1 via creator self-upvote)                                                                                                                            | Voice          |
| **Result charts**                       | Breakdown of ballot ratios by **gender** and **age** (fixed age buckets; abstentions counted)                                                                                                                                                 | Voice          |
| **Comment**                             | Discussion under a poll — root comment or reply to a root; soft-deletable (row kept, body cleared, shown as deleted)                                                                                                                          | Voice          |
| **Comment score vote**                  | Up/down vote on a comment for relevance (not by the comment author; score starts at 1 via author self-upvote)                                                                                                                                 | Voice          |

**Poll publish lifecycle:** draft (editable) → published (not editable; deletable) → expired (by `end_at`).

---

## 6. Functional requirements

Status legend: `proposed` · `accepted` · `deferred` · `rejected`

### 6.1 Authentication

| ID        | Requirement                                                                                                                        | Priority | Status   | Notes                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | -------------------------------------------- |
| FR-AU-001 | Users authenticate against the FSMeet backend via OAuth to vote (and for other privileged actions)                                 | must     | accepted | https://api.fsmeet.dffb.org/api/#/OAuth      |
| FR-AU-002 | Anonymous visitors can **view** public content but must **log in** to interact (vote, comment, up/down score, create/manage polls) | must     | accepted | U-06; drafts remain creator-only (FR-PO-022) |

### 6.2 Polls (community decisions)

| ID         | Requirement                                                                                                                                                                                                                                       | Priority | Status   | Notes                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-PO-001  | Eligible FSMeet users can create and manage community decision polls                                                                                                                                                                              | must     | accepted | Creators: §4.1 **and** FR-PO-009b                                                                                                                                                                                                                                                                                   |
| FR-PO-002  | A poll has multiple answer options                                                                                                                                                                                                                | must     | accepted | Plus system abstention (FR-VO-006)                                                                                                                                                                                                                                                                                  |
| FR-PO-003  | A poll has a unique public URL suitable for linking from external websites                                                                                                                                                                        | must     | accepted | Via `public_id`; optional alias FR-PO-028                                                                                                                                                                                                                                                                           |
| FR-PO-004  | A poll may be restricted by nationality (`country_code`, e.g. `DE`) or region (`continental_code`, e.g. `EU`)                                                                                                                                     | must     | accepted | Targeting filters                                                                                                                                                                                                                                                                                                   |
| FR-PO-005  | A poll may be restricted by minimum and/or maximum age                                                                                                                                                                                            | must     | accepted | When **set on the poll**, those bounds apply to **voting, commenting, and up/down scoring** on that poll (FR-VO-011, FR-CO-009, FR-PO-012b, FR-CO-003b), except the **poll creator may always comment** (FR-CO-010). Editor **min age** input defaults to `VOICE_MIN_AGE` (TECH-10); empty/cleared = no min-age restriction |
| FR-PO-006  | A poll may be restricted by gender (`male` / `female`)                                                                                                                                                                                            | must     | accepted |                                                                                                                                                                                                                                                                                                                     |
| FR-PO-007  | A poll **must** have a start date/time (`start_at`); UI default is **now**                                                                                                                                                                        | must     | accepted | Creator always sets it; default = current time                                                                                                                                                                                                                                                                      |
| FR-PO-008  | A poll always has an expiry (end) date/time                                                                                                                                                                                                       | must     | accepted | Required end                                                                                                                                                                                                                                                                                                        |
| FR-PO-009  | Only user types allowed to create polls may create them                                                                                                                                                                                           | must     | accepted | §4.1; also requires profile trust gate FR-PO-009b                                                                                                                                                                                                                                                                   |
| FR-PO-009b | To **create** (or manage) a poll, the user must additionally have a **WFFA ID** (`wffaId` present) **or** be **verified** (`verificationState` = `verified`) on their FSMeet profile                                                              | must     | accepted | §4.2; evaluated from FSMeet getOne; missing → hint + link to https://fsmeet.com/account (FR-VO-005b pattern). Does not replace §4.1 user-type rules                                                                                               |
| FR-PO-010  | Polls can be sorted by creation date, end date, importance score, and **highest participation (total votes)**                                                                                                                                    | must     | accepted | List UI: Newest / Ending soon / Most important / Most votes; votes = ballot count incl. abstentions (FR-PO-020)                                                                                                                                                                                                     |
| FR-PO-011  | Polls can be filtered by the creator (FSMeet user)                                                                                                                                                                                                | must     | accepted |                                                                                                                                                                                                                                                                                                                     |
| FR-PO-011b | Poll **list** can be filtered by creator **user type**: `association` or `all` (all creator types)                                                                                                                                                | must     | accepted | Default `all`; uses FSMeet user type of the poll creator                                                                                                                                                                                                                                                            |
| FR-PO-012  | Polls can be upvoted and downvoted to rank by importance                                                                                                                                                                                          | must     | accepted | Scorers: §4.1 (not `association`, not `fan`); not on own polls — FR-PO-031; age only if poll sets it — FR-PO-012b                                                                                                                                                                                                   |
| FR-PO-012b | Up/down-scoring a poll is subject to the poll’s **age filters only when those filters are set** on the poll (FR-PO-005)                                                                                                                           | must     | accepted | No global platform age gate; missing age → hint when a set filter requires age (FR-VO-005b pattern)                                                                                                                                                                                                                 |
| FR-PO-013  | At creation, a poll is defined as **single choice** or **multiple choice**                                                                                                                                                                        | must     | accepted | Immutable after publish (FR-PO-014)                                                                                                                                                                                                                                                                                 |
| FR-PO-014  | Unpublished (draft) polls can be edited; after publish they are **not** editable                                                                                                                                                                  | must     | accepted |                                                                                                                                                                                                                                                                                                                     |
| FR-PO-015  | Only the **poll creator** may delete the poll                                                                                                                                                                                                     | must     | accepted | Soft-delete (FR-PO-021); drafts and published; **Voice admin** may also delete any poll — FR-AD-001                                                                                                                                                                                                                  |
| FR-PO-016  | Each poll provides charts of voting ratios by **gender** and by **age**                                                                                                                                                                           | must     | accepted | Visible with live shares (FR-PO-023/025); abstentions counted (FR-PO-026); age buckets FR-PO-027; collapsed UI FR-PO-033                                                                                                                                                                                            |
| FR-PO-017  | The poll **question is the title**; an optional **description** may elaborate on the question                                                                                                                                                     | must     | accepted | No separate title field beyond the question                                                                                                                                                                                                                                                                         |
| FR-PO-018  | Each answer option may have a **description** to explain it further                                                                                                                                                                               | must     | accepted | Optional per option                                                                                                                                                                                                                                                                                                 |
| FR-PO-019  | A poll displays the creator’s **profile picture**, **first name**, and **last name**                                                                                                                                                              | must     | accepted | From FSMeet user data                                                                                                                                                                                                                                                                                               |
| FR-PO-020  | A poll displays **total votes** — the current count of ballots cast — so participation activity is visible                                                                                                                                        | must     | accepted | Counts participations (incl. abstentions); updates as votes change                                                                                                                                                                                                                                                  |
| FR-PO-021  | Poll deletion is **soft**: the row is retained and treated as deleted (not shown in public lists / not votable)                                                                                                                                   | must     | accepted | Parallel to comment soft-delete                                                                                                                                                                                                                                                                                     |
| FR-PO-022  | **Draft** (unpublished) polls are visible only to the **creator** for now                                                                                                                                                                         | must     | accepted | Not in public lists; unique URL access for others: deny until published                                                                                                                                                                                                                                             |
| FR-PO-023  | Until publish, the creator may set whether **per-option result shares** are shown **live** while the poll is open                                                                                                                                 | must     | accepted | Setting locked after publish (FR-PO-014); if live off, show shares (and gender/age charts) only after expiry                                                                                                                                                                                                        |
| FR-PO-024  | **Total votes** remain visible regardless of the live-shares setting                                                                                                                                                                              | must     | accepted | Complements FR-PO-020                                                                                                                                                                                                                                                                                               |
| FR-PO-025  | **Gender/age charts** are available whenever live answer shares are visible (same gate as FR-PO-023)                                                                                                                                              | must     | accepted | After expiry, charts follow the same visibility as per-option shares                                                                                                                                                                                                                                                |
| FR-PO-026  | **Abstentions are included** in gender/age chart counts and denominators                                                                                                                                                                          | must     | accepted |                                                                                                                                                                                                                                                                                                                     |
| FR-PO-027  | Age charts use buckets: `<16`, `16–20`, `21–25`, `26–30`, `31–35`, `>35`                                                                                                                                                                          | must     | accepted | Non-overlapping (age 30 → `26–30`; age 31–35 → `31–35`)                                                                                                                                                                                                                                                             |
| FR-PO-028  | A poll may have a unique **alias** (slug) so its public URL can be nicer than the opaque `public_id`                                                                                                                                              | must     | accepted | Unique across polls; optional; editable only while draft — locked after publish                                                                                                                                                                                                                                     |
| FR-PO-029  | Poll **list cards** show **total comments** (current comment count) alongside other meta (e.g. total votes)                                                                                                                                       | must     | accepted | Roots + replies; exclude soft-deleted comments from the count                                                                                                                                                                                                                                                       |
| FR-PO-030  | Poll **list cards** show **remaining time** until `end_at`: whole **days left** while more than the final calendar day remains; on the **last day**, show **“Today”** plus the end **clock time**; after expiry, show that the poll has **ended** | must     | accepted | Replaces a full end datetime on the card                                                                                                                                                                                                                                                                            |
| FR-PO-031  | A user **cannot** up/down-score **their own** poll. Each poll’s score **starts at 1** (implicit creator self-upvote), stored as the creator’s `+1` score row                                                                                      | must     | accepted | Complements FR-PO-012                                                                                                                                                                                                                                                                                               |
| FR-PO-032  | Poll **detail** shows the poll’s **audience rules** when set: age (`min_age` / `max_age`), `gender`, `country_code`, `continental_code`                                                                                                           | must     | accepted | Only display fields that are set; omit the rules block entirely if none are set                                                                                                                                                                                                                                     |
| FR-PO-033  | When detailed results are visible, **Answer shares** are shown by default; **Share analytics** (By gender, By age, and any similar demographic breakdowns) are **collapsible** and **collapsed by default**                                       | must     | accepted | Complements FR-PO-016/025; expand/collapse is client UI only                                                                                                                                                                                                                                                        |
| FR-PO-034  | The **poll creator** can see a **named ballot roster**: exactly **which user** voted for **which** answer option(s) (or abstention); the roster is **downloadable as CSV**                                                                        | must     | accepted | Creator-only (not public); includes abstentions and multi-choice selections; available on the poll detail for published polls (open or expired); purpose: governance transparency; independent of live-shares (FR-PO-023); **collapsible**, **collapsed by default**; CSV columns include voter identity and answer |

### 6.3 Voting (ballot on poll options)

| ID         | Requirement                                                                                                                                                                                    | Priority | Status   | Notes                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------- |
| FR-VO-001  | Only eligible user types may cast a ballot                                                                                                                                                     | must     | accepted | §4.1 (not `association`); also requires profile presence gate FR-VO-012; age only if poll sets filters — FR-VO-011 |
| FR-VO-002  | A user may participate in a given poll at most once                                                                                                                                            | must     | accepted | One active ballot record                                                                                              |
| FR-VO-003  | A user may change their answer until the poll has expired                                                                                                                                      | must     | accepted |                                                                                       |
| FR-VO-004  | Casting / changing a ballot requires FSMeet OAuth authentication                                                                                                                               | must     | accepted | FR-AU-001                                                                             |
| FR-VO-005  | Audience filters (country/continent, age, gender) are enforced when voting using demographics from the FSMeet user object                                                                      | must     | accepted | Load via getOne / getAll — §2.2                                                       |
| FR-VO-005b | If required age/gender/country (or related) fields are **missing** for a filtered poll, block voting and show a hint to update the FSMeet profile, with a button to https://fsmeet.com/account | must     | accepted | Do not invent or skip missing demographics                                            |
| FR-VO-006  | Every poll includes an **Abstention** (`Enthaltung`) option that counts the user’s vote without choosing an answer                                                                             | must     | accepted | System option, not a custom answer                                                    |
| FR-VO-007  | If the user selects Abstention, they cannot select any other option                                                                                                                            | must     | accepted | Applies to both single and multiple choice                                            |
| FR-VO-008  | Single-choice polls: at most one answer option (or Abstention alone)                                                                                                                           | must     | accepted |                                                                                       |
| FR-VO-009  | Multiple-choice polls: one or more answer options, unless Abstention is selected (then none)                                                                                                   | must     | accepted |                                                                                       |
| FR-VO-010  | Authenticated users have a **My votes** overview listing every poll they participated in and their answer(s)                                                                                   | must     | accepted | Includes abstentions; link through to each poll                                       |
| FR-VO-011  | Age limits for casting/changing a ballot apply **only when the poll has explicit age filters** (FR-PO-005)                                                                                     | must     | accepted | No global platform age gate; if a set filter needs age and it is missing → FR-VO-005b                                     |
| FR-VO-012  | To **vote**, the user must additionally satisfy **at least one** FSMeet profile presence criterion: `wffaId`, `verificationState` = `verified`, `instagramHandle`, `tikTokHandle`, or `youTubeHandle` | must | accepted | §4.2; string fields = non-empty after trim; missing all → block + hint + link to https://fsmeet.com/account (FR-VO-005b pattern). Does not replace §4.1 user-type rules |

### 6.4 Comments

| ID         | Requirement                                                                                                                                                      | Priority | Status   | Notes                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| FR-CO-001  | Any authenticated FSMeet user type can comment under a poll                                                                                                      | must     | accepted | All types in §4.1; age/audience filters only if poll sets them — FR-CO-009; **poll creator always may comment** — FR-CO-010 |
| FR-CO-002  | Comments are either **root comments** or **replies** that reference a root comment                                                                               | must     | accepted | One-level reply tree unless extended later                                                                                  |
| FR-CO-003  | Comments can be upvoted and downvoted to show relevance                                                                                                          | must     | accepted | Scorers: §4.1 (not `association`, not `fan`); not on own comments — FR-CO-008; age only if poll sets filters — FR-CO-003b   |
| FR-CO-003b | Up/down-scoring a comment is subject to the poll’s **age filters only when those filters are set** on the poll (FR-PO-005)                                       | must     | accepted | No global platform age gate; missing-age hint when required; does **not** grant the creator a score bypass                  |
| FR-CO-004  | The **poll creator** may delete comments on their poll                                                                                                           | must     | accepted | Soft-delete (FR-CO-006); **Voice admin** may also delete any comment — FR-AD-001                             |
| FR-CO-005  | A user may delete **their own** comment                                                                                                                          | must     | accepted | Soft-delete (FR-CO-006)                                                                                                     |
| FR-CO-006  | Comment deletion is **soft**: the row is retained; content is cleared and shown as deleted in the UI                                                             | must     | accepted | Thread structure / replies remain                                                                                           |
| FR-CO-007  | A comment displays the author’s **profile picture**, **first name**, and **last name**                                                                           | must     | accepted | From FSMeet user data; soft-deleted comments still show author identity unless later specified otherwise                    |
| FR-CO-008  | A user **cannot** up/down-score **their own** comment. Each comment’s score **starts at 1** (implicit author self-upvote), stored as the author’s `+1` score row | must     | accepted | Complements FR-CO-003                                                                                                       |
| FR-CO-009  | Age limits for posting comments apply **only when the poll has explicit age filters** (FR-PO-005)                                                                | must     | accepted | No global platform age gate; missing-age hint when required (FR-VO-005b pattern); exception: FR-CO-010                       |
| FR-CO-010  | The **poll creator** may always **comment** on their own poll, **regardless of audience filters** (age, gender, country, continent, or any later filters)         | must     | accepted | Applies to posting comments only; voting/scoring still follow their own rules                                               |

### 6.4b Moderation (Voice admin)

| ID | Requirement | Priority | Status | Notes |
| -- | ----------- | -------- | ------ | ----- |
| FR-AD-001 | The FSMeet user with username **`fsmeet`** is the **Voice admin** and may **soft-delete any poll** and **soft-delete any individual comment**, regardless of creator/author | must | accepted | U-07; does not grant create/vote/score bypass beyond existing rules; UI shows delete controls when the signed-in user is `fsmeet` |

### 6.5 Content pages & chrome

| ID         | Requirement                                                                                                                                                       | Priority | Status   | Notes                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| FR-UI-001  | FAQ page explaining how Voice works                                                                                                                               | must     | accepted | Draft copy in §6.5.3 — refine later                                                                                               |
| FR-UI-002  | Imprint page with the content in §6.5.1 (**English only** for now)                                                                                                | must     | accepted | Disclaimer notes German prevails; no separate DE page in v1                                                                       |
| FR-UI-002b | Privacy policy page (provisional)                                                                                                                                 | must     | accepted | Draft copy in §6.5.4 — refine later; link from footer/menu                                                                        |
| FR-UI-003  | Footer includes attribution: “Community governance powered by FSMeet.com” linking to FSMeet                                                                       | must     | accepted | https://fsmeet.com/                                                                                                               |
| FR-UI-004  | Footer links to FSMeet Instagram (icon + URL)                                                                                                                     | must     | accepted | https://www.instagram.com/fsmeet_com                                                                                              |
| FR-UI-005  | Footer links to the Voice GitHub repository (icon + URL)                                                                                                          | must     | accepted | https://github.com/nilsfs7/voice                                                                                                  |
| FR-UI-006  | Menu or footer entry **Other tools** with FreestyleActs and FSMeet                                                                                                | must     | accepted | See §6.5.2                                                                                                                        |
| FR-UI-007  | Navigation includes **My votes** for authenticated users                                                                                                          | must     | accepted | FR-VO-010                                                                                                                         |
| FR-UI-008  | Footer (or legal menu) links to FAQ, Imprint, and Privacy                                                                                                         | must     | accepted |                                                                                                                                   |
| FR-UI-009  | Clicking a user’s **profile picture** or **name** opens a confirm popup: “View on FSMeet?” with **No** / **Yes**; **Yes** navigates to that user’s FSMeet profile | must     | accepted | Applies wherever identity is shown (poll cards, poll detail, comments, header). Profile URL: `{FSMEET_FRONTEND}/users/{username}` |
| FR-UI-010  | Poll detail has a **clearly visible Share** control that **copies the poll’s public URL to the clipboard** so others can open it and vote                         | must     | accepted | Prefer the alias URL when set (FR-PO-028); brief confirmation feedback after copy (e.g. “Copied”)                                 |
| FR-UI-011  | **Association** accounts are **visually highlighted** wherever identity is shown so they clearly stand out from other user types                                  | must     | accepted | Poll cards, poll detail, comments, header; e.g. badge + distinct avatar treatment; stay within §7 (no neon/crypto)                |

#### 6.5.1 Imprint content (canonical)

```
IMPRINT
General information requirements (§ 5 DDG)

This is a convenience translation. In case of discrepancies, the German version shall prevail.

Provider
Nils Effinghausen (sole proprietor)
Lierstraße 20
80639 Munich

Electronic contact
Email: nils.effinghausen@gmail.com
```

#### 6.5.2 Other tools

| Label         | URL                              | Blurb                        |
| ------------- | -------------------------------- | ---------------------------- |
| FreestyleActs | https://www.freestyleacts.com/en | Football Freestyler Bookings |
| FSMeet        | https://fsmeet.com/              | Event & Community Platform   |

#### 6.5.3 FAQ content (draft — refine later)

**What is Voice?**  
Voice is the official community governance tool for freestyle football within FSMeet. It lets the scene create polls, discuss them, and vote so decisions are visible and shared. Outcomes are not enforced by the software — whether the community acts on a result is up to the community.

**Who can create a poll?**  
FSMeet users with type `association`, `dj`, `freestyler`, `event_organizer`, `mc`, or `media`, **and** a WFFA ID or a verified FSMeet account (`verificationState` = `verified`). Users cannot set a WFFA ID themselves — the create-poll UI hint asks them to get a **verified** account.

**Who can vote?**  
FSMeet users with type `dj`, `freestyler`, `event_organizer`, `mc`, or `media`. You must sign in with your FSMeet account. You must also have at least one of: WFFA ID, verified account, Instagram handle, TikTok handle, or YouTube handle on your FSMeet profile. If the poll sets a minimum/maximum age, you must meet that filter.

**Who can comment?**  
Any signed-in FSMeet user type. If the poll sets age filters, you must meet them to comment — except the **poll creator**, who may always comment on their own poll regardless of audience filters.

**Who can up/down-score?**  
Signed-in users except `association` and `fan`. You cannot score your own poll or comment. If the poll sets age filters, you must meet them to score.  
Abstention (`Enthaltung`) records that you participated without choosing an answer option. You cannot combine it with other options. It counts toward total votes and appears in result charts.

**Single vs multiple choice?**  
The creator chooses when creating the poll. After publish, that setting cannot change.

**Can I change my vote?**  
Yes, until the poll’s end date. After it expires, your answer is locked.

**Why can’t I vote on a filtered poll?**  
Some polls are limited by country/region, age, or gender. Voice also requires a profile presence signal (WFFA ID, verified account, or a social handle) to vote. Voice reads those fields from your FSMeet profile. If something is missing, update your profile on FSMeet (Account), then try again.

**When do I see results and charts?**  
Total votes are always shown. Per-option shares and gender/age charts are live only if the creator enabled that before publishing; otherwise they appear after the poll ends. On the poll detail, Answer shares are shown openly; Share analytics (By gender / By age) are collapsed by default and can be expanded. Age groups: under 16, 16–20, 21–25, 26–30, 31–35, over 35.

**What is “My votes”?**  
A personal list of every poll you took part in and the answer you gave (including abstentions).

**Drafts and editing?**  
Only you see your drafts. After you publish, the poll can no longer be edited, but you can soft-delete it. Comments can be soft-deleted by you (your own), by the poll creator, or by the Voice admin (`fsmeet`). The Voice admin may also soft-delete any poll.

**Can the poll creator see who voted for what?**  
Yes. For transparency, the creator of a poll can see a roster of each participant and their answer(s) or abstention. Other users only see aggregate shares/charts per the live-results rules.

**How does Voice relate to FSMeet?**  
FSMeet holds events, users, and accounts. Voice focuses on community decisions and uses FSMeet login and profile data.

#### 6.5.4 Privacy policy (provisional draft — refine later)

English only for v1. This is a working draft derived from product context; have it reviewed before relying on it as final legal text.

```
PRIVACY POLICY (PROVISIONAL)
Voice — community governance for freestyle football (part of FSMeet)

Controller
Nils Effinghausen (sole proprietor)
Lierstraße 20
80639 Munich
Email: nils.effinghausen@gmail.com

What Voice is
Voice is a web application for community polls, discussion, and voting. It is the official governance tool within the FSMeet ecosystem. Account login and core profile data are provided by FSMeet; Voice stores governance activity (polls, ballots, comments, rankings).

Data we process
1) Account & identity (via FSMeet OAuth / FSMeet user APIs)
   - Identifiers needed to recognize your FSMeet account
   - Profile display data such as profile picture, first name, last name
   - User type (e.g. freestyler, media, …)
   - Demographics used for poll audience filters and result charts when present on your FSMeet profile (e.g. age, gender, country / region)
 - Profile fields used for create/vote eligibility when present (e.g. WFFA ID, verification state, Instagram / TikTok / YouTube handles)
2) Governance activity stored by Voice (MySQL)
   - Polls you create (question/title, description, options, schedule, filters, settings)
   - Your ballots / answers (including abstentions) and changes until a poll ends
   - Named ballot details visible to the **poll creator** (who voted for which option) for governance transparency
   - Comments and replies; soft-deleted comments keep a record with cleared content
   - Up/down scores on polls and comments
   - Soft-deleted polls retained as deleted records
3) Technical data
   - Usual server/app logs and security-related metadata as needed to run and protect the service

Purposes
- Provide authentication and show creator/commenter identity
- Enforce poll eligibility filters and show aggregate gender/age charts
- Run polls, voting, My votes, comments, and ranking
- Operate, secure, and improve the service

Legal bases (high level — to be finalized)
- Contract / requested service when you use Voice features after signing in
- Legitimate interests in operating a secure community governance tool and producing aggregate statistics
- Consent where required for optional processing (to be refined)

FSMeet and other services
Sign-in and profile data come from FSMeet (e.g. https://fsmeet.com/ and FSMeet APIs). Voice does not replace FSMeet’s own privacy information for accounts, events, or profile management. Update account details at https://fsmeet.com/account. Related products (e.g. FreestyleActs) have their own sites and policies.

Sharing
We do not sell personal data. Data may be processed by hosting/infrastructure providers strictly to run Voice. Public or community-visible content (e.g. poll questions, comments, displayed names/avatars, and—when enabled—live or final result shares and aggregate charts) is visible according to product rules. The poll creator can see named ballots (which user chose which option) on their own polls; this is not shown to other users.

Retention
Active governance data is kept while needed for the service and community record. Soft-deleted comments/polls may remain as tombstones. Exact retention periods to be defined later.

Your rights
Depending on applicable law (including GDPR where it applies), you may have rights of access, rectification, erasure, restriction, objection, and data portability, and the right to lodge a complaint with a supervisory authority. Contact the controller above. Some profile fields are managed in FSMeet rather than in Voice.

Cookies / local storage
May be used for session/authentication and essential app function. Details to be refined with the final cookie/tech stack.

Children
Voice is aimed at the freestyle football community. Age limits for voting, commenting, and up/down scoring apply only when a poll explicitly sets minimum and/or maximum age. The poll editor’s minimum-age field defaults to a configurable value (`VOICE_MIN_AGE`, default 12). Where poll age filters apply, missing age data blocks participation until the FSMeet profile is completed.

Changes
This provisional policy will be updated; material changes should be reflected on this page.

Contact
nils.effinghausen@gmail.com
```

---

## 7. Design system & UX tone

Status: `accepted` (visual direction). Refine tokens during implementation; do not drift into excluded aesthetics.

### 7.1 Positioning

| Field                       | Value                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Relative to FSMeet**      | Feel **more modern** than FSMeet, while staying clearly in the same product family (trust, clarity, community). |
| **Reference feel**          | Linear / Stripe / Vercel / modern **civic-tech** platforms                                                      |
| **Emotional job of voting** | Convey: **“My vote is taken seriously.”** Calm confidence over hype.                                            |
| **Not this**                | Crypto app, Web3 dashboard, gaming HUD, neon “ops” console                                                      |

### 7.2 Visual principles

| ID     | Principle                                                                                                                  | Status   |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| DES-01 | **Light:** white / warm off-white base, dark text, one strong accent for primary actions                                   | accepted |
| DES-02 | **Modern:** large typography, generous whitespace, clear cards, reduced navigation                                         | accepted |
| DES-03 | **Matte:** almost no glows; no glassmorphism excess; no neon gradients                                                     | accepted |
| DES-04 | **Quietly premium:** subtle shadows, high-quality type, restrained motion                                                  | accepted |
| DES-05 | Voting UI emphasizes clarity, confirmation, and weight of choice (not gamification)                                        | accepted |
| DES-06 | **Association** identity is visually distinct from other users (badge / treatment) without breaking the light matte system | accepted | FR-UI-011 |

### 7.3 Color & surface (token intent)

Define CSS variables; exact hex may be tuned in implementation.

| Token                   | Intent                                                                    |
| ----------------------- | ------------------------------------------------------------------------- |
| `--color-bg`            | Warm off-white page background (not cold gray, not cream-brochure cliché) |
| `--color-surface`       | Pure / near-white cards and panels                                        |
| `--color-border`        | Soft neutral hairline borders                                             |
| `--color-text`          | Near-black primary text                                                   |
| `--color-text-muted`    | Secondary / meta text                                                     |
| `--color-accent`        | **One** strong accent for primary CTAs, key selected states, focus        |
| `--color-accent-subtle` | Tinted background for selected / success-of-vote feedback                 |
| `--color-danger`        | Destructive actions (delete) — restrained, not alarming neon              |

**Accent guidance:** Prefer a confident civic accent (e.g. deep ink-blue or solid brand hue). Avoid purple-on-white “AI default”, neon greens/pinks, and multi-stop neon gradients.

### 7.4 Typography

| Rule          | Detail                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Hierarchy     | Large, readable headings; comfortable body; clear meta (dates, total votes, total comments)     |
| Voice of type | Editorial / product — not display-gaming, not generic system-only if a better font is available |
| Density       | Prefer airy over cramped; voting screens especially need breathing room                         |

### 7.5 Layout & components

| Rule           | Detail                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation     | Minimal: primary destinations only (polls, create where allowed, My votes, account/legal)                                                                                                            |
| Cards          | Clear, simple surfaces for poll lists and detail — useful structure, not decorative chrome                                                                                                           |
| Poll / vote UI | Question as hero title; options easy to scan; abstention visually distinct but equal dignity; confirmation that the vote was recorded; **Share** control is easy to find for inviting others to vote |
| Charts         | Clean, readable; no 3D or glow; support the seriousness of results                                                                                                                                   |
| Motion         | Subtle (e.g. fade/slide ~150–250ms, soft press states); 2–3 purposeful motions max per view — no continuous particles or flashy loaders                                                              |

### 7.6 Explicit anti-patterns (do not ship)

- Glassmorphism stacks, frosted blurs everywhere
- Neon / cyberpunk / “matrix” gradients
- Glow-heavy buttons, animated borders, holographic cards
- Dense gaming dashboards, stat-strip clutter in the first viewport
- DAO/crypto visual clichés (token chips, wallet-chrome, ledger aesthetics)
- Dark mode as default (light-first per DES-01; dark mode only if later required)

### 7.7 Design-related NFRs

| ID     | Requirement                                                                  | Priority | Status   |
| ------ | ---------------------------------------------------------------------------- | -------- | -------- |
| NFR-05 | UI follows §7 (light, modern, matte, quietly premium)                        | must     | accepted |
| NFR-06 | Primary voting flows must feel serious and trustworthy on mobile and desktop | must     | accepted |

---

## 8. Non-functional requirements

| ID     | Requirement                                                                  | Priority | Status   | Notes                                        |
| ------ | ---------------------------------------------------------------------------- | -------- | -------- | -------------------------------------------- |
| NFR-01 | Mobile-friendly UX                                                           | must     | proposed | Community often on phones                    |
| NFR-02 | Align with FSMeet environment URLs for prod / dev / local                    | must     | accepted | §2.1                                         |
| NFR-03 | Vote and ranking integrity for community-scale usage                         | must     | accepted | No double ballot; changeable until expiry    |
| NFR-04 | UI is **i18n-ready** with **English only** in v1; additional languages later | must     | accepted | Do not hard-code copy outside the i18n layer |
| NFR-05 | UI follows §7 design system                                                  | must     | accepted |                                              |
| NFR-06 | Voting UX conveys that the user’s vote is taken seriously                    | must     | accepted |                                              |

---

## 9. Constraints & principles

| ID   | Principle / constraint                                                                                                              | Status   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| P-01 | Voice is governance within FSMeet — reuse FSMeet identity; do not duplicate the user store                                          | accepted |
| P-02 | Prefer simple, explainable poll mechanics in v1                                                                                     | accepted |
| P-03 | Freestyle-football / FSMeet vocabulary over generic “DAO” jargon                                                                    | accepted |
| P-04 | MySQL identifiers in snake_case                                                                                                     | accepted |
| P-05 | Local Voice always on port 3004                                                                                                     | accepted |
| P-06 | Voice is the official community governance channel; poll outcomes are community-owned — the product does not enforce implementation | accepted |
| P-07 | Visual language: modern civic product (Linear/Stripe/Vercel-like), not crypto or gaming                                             | accepted |

---

## 10. Out of scope (for now)

| ID     | Item                                              | Reason                            | Status   |
| ------ | ------------------------------------------------- | --------------------------------- | -------- |
| OOS-01 | On-chain / crypto token voting                    | Not required                      | accepted |
| OOS-02 | Full social network / feed product                | Governance + poll discussion only | accepted |
| OOS-03 | Tournament bracket / scoring engine               | Belongs to FSMeet events          | accepted |
| OOS-04 | Owning or mutating core FSMeet user/event records | Voice consumes FSMeet APIs        | accepted |
| OOS-05 | Crypto / gaming / neon visual language            | Conflicts with §7                 | accepted |

---

## 11. Open questions

| ID    | Question                                           | Options / notes                                                                                                                                                                   | Owner | Status   |
| ----- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------- |
| Q-01  | Are poll results binding or advisory?              | Resolved: Voice is the **official** governance tool; whether outcomes are **implemented** is up to the community (not enforced by the product) — P-06 / FAQ                       | —     | resolved |
| Q-02  | Ballot type: single choice only, or multi-select?  | Resolved: set at creation (`single` \| `multiple`) — FR-PO-013, FR-VO-008/009                                                                                                     | —     | resolved |
| Q-03  | Which user types may comment?                      | Resolved: every user type (authenticated) — FR-CO-001                                                                                                                             | —     | resolved |
| Q-04  | Separate German imprint page?                      | Resolved: EN imprint only for now — FR-UI-002                                                                                                                                     | —     | resolved |
| Q-05  | Where do age/gender/country come from?             | Resolved: FSMeet user objects via [getAll](https://api.fsmeet.dffb.org/api/#/User/UserController_getAll) / [getOne](https://api.fsmeet.dffb.org/api/#/User/UserController_getOne) | —     | resolved |
| Q-05b | If age/gender/country is missing on the user?      | Resolved: block vote; show hint + button to [FSMeet account](https://fsmeet.com/account) — FR-VO-005b                                                                             | —     | resolved |
| Q-06  | Is `start_at` optional?                            | Resolved: always required; default **now** — FR-PO-007; `end_at` still always required — FR-PO-008                                                                                | —     | resolved |
| Q-07  | Edit after publish?                                | Resolved: not editable after publish; deletable by creator — FR-PO-014/015                                                                                                        | —     | resolved |
| Q-08  | Who may delete a published poll?                   | Resolved: poll creator — FR-PO-015; also Voice admin `fsmeet` — FR-AD-001; soft-delete FR-PO-021                                                                              | —     | resolved |
| Q-09  | When are **gender/age charts** visible?            | Resolved: same gate as live answer shares (FR-PO-023/025) — available whenever those shares are shown                                                                             | —     | resolved |
| Q-10  | Who may up/down-vote polls and comments?           | Resolved: all authenticated types except `association` and `fan` — §4.1                                                                                                           | —     | resolved |
| Q-11  | Live per-option result shares while open?          | Resolved: creator chooses before publish — FR-PO-023; total votes always shown — FR-PO-024                                                                                        | —     | resolved |
| Q-12  | Age bucket boundary at 30: use `31–35` or `30–35`? | Resolved: `31–35` — FR-PO-027                                                                                                                                                     | —     | resolved |
| Q-13  | Exact accent hex / typeface pairing?               | Open until brand tokens are locked in implementation; follow §7.3–7.4                                                                                                             | —     | open     |
| Q-14  | Can the poll **alias** be changed after publish?   | Resolved: not editable after publish (same as other poll fields) — FR-PO-028                                                                                                      | —     | resolved |

---

## 12. Release slices (planning aid)

| Slice | Goal                                                                               | Depends on         | Status      |
| ----- | ---------------------------------------------------------------------------------- | ------------------ | ----------- |
| S0    | Requirements lock-in (this doc)                                                    | —                  | in progress |
| S1    | Next.js + Docker (port 3004) + MySQL + CI image build                              | TECH-\*            | proposed    |
| S2    | FSMeet OAuth login                                                                 | FR-AU-001          | proposed    |
| S3    | Poll CRUD, draft/publish, unique URLs, audience filters, schedule, single/multiple | FR-PO-\*           | proposed    |
| S4    | Ballot cast/change + abstention + eligibility + My votes                           | FR-VO-\*           | proposed    |
| S5    | Poll ranking (up/down), sort/filter                                                | FR-PO-010–012      | proposed    |
| S6    | Gender & age result charts (buckets + abstentions)                                 | FR-PO-016, 025–027 | proposed    |
| S7    | Comments + comment ranking                                                         | FR-CO-\*           | proposed    |
| S8    | FAQ, imprint, privacy, footer, other tools, My votes nav                           | FR-UI-\*           | proposed    |
| S9    | Design system tokens + voting UX polish per §7                                     | DES-\*, NFR-05/06  | proposed    |

---

## 13. Change log

| Date       | Change                                                                                                                                                                | By                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 2026-09-13 | Initial structured requirements scaffold                                                                                                                              | agent + user            |
| 2026-09-13 | Accepted stack, FSMeet ecosystem/URLs, poll/vote/comment rules, FAQ/imprint/footer/other tools                                                                        | agent + user (DE input) |
| 2026-09-13 | All types may comment; draft-only edit + delete after publish; gender/age charts; abstention; single/multiple choice                                                  | agent + user (DE input) |
| 2026-09-13 | Poll description; score eligibility; creator-only poll delete; comment soft-delete by author or poll creator                                                          | agent + user (DE input) |
| 2026-09-13 | Option descriptions; show creator/commenter avatar + first/last name from FSMeet                                                                                      | agent + user (DE input) |
| 2026-09-13 | Poll shows total votes (current ballot count / participation)                                                                                                         | agent + user (DE input) |
| 2026-09-13 | Demographics from FSMeet users; EN-only i18n; soft-delete polls; drafts creator-only; clarify live option shares (Q-11)                                               | agent + user (DE input) |
| 2026-09-13 | Creator sets live option-share visibility pre-publish; missing demographics → hint + link to fsmeet.com/account                                                       | agent + user (DE input) |
| 2026-09-13 | Gender/age charts follow live answer-share visibility (Q-09)                                                                                                          | agent + user (DE input) |
| 2026-09-13 | `start_at` required (default now); CI builds/pushes Docker Hub image via `.github/workflows/ci.yml`                                                                   | agent + user (DE input) |
| 2026-09-13 | Question=title; FAQ draft; abstentions in charts; age buckets; My votes overview                                                                                      | agent + user (DE input) |
| 2026-09-13 | Q-01: official tool; implementation of outcomes left to the community (P-06)                                                                                          | agent + user (DE input) |
| 2026-09-13 | Provisional privacy policy draft (§6.5.4) + footer legal link                                                                                                         | agent + user (DE input) |
| 2026-09-13 | Q-12 confirmed: age bucket `31–35`                                                                                                                                    | agent + user (DE input) |
| 2026-09-13 | Design system: light / modern / matte / quietly premium; civic-tech tone (§7)                                                                                         | agent + user (DE input) |
| 2026-09-13 | U-06/FR-AU-002: anonymous can view all public content; login required to interact                                                                                     | agent + user (DE input) |
| 2026-09-14 | Poll optional unique URL alias for nicer links (FR-PO-028)                                                                                                            | agent + user (DE input) |
| 2026-09-14 | Q-14: alias locked after publish                                                                                                                                      | agent + user (DE input) |
| 2026-09-14 | Poll list cards show total comments (FR-PO-029)                                                                                                                       | agent + user (DE input) |
| 2026-09-14 | Profile pic/name click → confirm “View on FSMeet?” then open FSMeet profile (FR-UI-009)                                                                               | agent + user (DE input) |
| 2026-09-14 | Poll list cards: remaining time in days / “Today” + time on last day (FR-PO-030)                                                                                      | agent + user (DE input) |
| 2026-09-14 | No self up/down on own polls/comments; default score starts at 1 (FR-PO-031, FR-CO-008)                                                                               | agent + user (DE input) |
| 2026-09-14 | Configurable platform min age for vote/comment (default 12) — TECH-10, FR-VO-011, FR-CO-009                                                                           | agent + user (DE input) |
| 2026-09-14 | Poll list filter by creator user type: `association` \| `all` — FR-PO-011b                                                                                            | agent + user (DE input) |
| 2026-09-14 | Clearly visible Share button on poll detail copies public URL to clipboard (FR-UI-010)                                                                                | agent + user (DE input) |
| 2026-09-14 | Highlight association accounts in UI (FR-UI-011, DES-06)                                                                                                              | agent + user (DE input) |
| 2026-09-14 | Platform min age also for up/down score; poll editor min-age defaults to `VOICE_MIN_AGE` (FR-PO-012b, FR-CO-003b, FR-PO-005)                                          | agent + user (DE input) |
| 2026-09-14 | Age limits for vote/comment/score only when poll sets them; `VOICE_MIN_AGE` is editor default only (TECH-10, FR-PO-005, FR-VO-011, FR-CO-009, FR-PO-012b, FR-CO-003b) | agent + user (DE input) |
| 2026-09-14 | Poll detail shows set audience rules (age, gender, country, continent) — FR-PO-032                                                                                    | agent + user (DE input) |
| 2026-09-14 | Share analytics (By gender / By age) collapsible, collapsed by default; Answer shares always open — FR-PO-033                                                         | agent + user (DE input) |
| 2026-09-14 | Rename collapsed results section label to “Share analytics” (FR-PO-033)                                                                                               | agent + user (DE input) |
| 2026-09-14 | Dynamic SEO sitemap `/sitemap.xml` (public pages + published polls) — TECH-11                                                                                         | agent + user (DE input) |
| 2026-09-14 | Creator-only named ballot roster (who voted for what) for transparency — FR-PO-034                                                                                    | agent + user (DE input) |
| 2026-09-14 | Adminer container in Docker Compose for local MySQL inspection — TECH-12                                                                                              | agent + user (DE input) |
| 2026-09-14 | Creator ballot roster (“Who voted”) collapsible, collapsed by default — FR-PO-034                                                                                     | agent + user (DE input) |
| 2026-09-14 | Trim poll info and option text before DB write — TECH-13                                                                                                              | agent + user (DE input) |
| 2026-09-14 | Creator ballot roster CSV download — FR-PO-034                                                                                                                        | agent + user (DE input) |
| 2026-09-14 | Auto-run DB migrate on app server start — TECH-14                                                                                                                     | agent + user (DE input) |
| 2026-09-14 | Poll creator may always comment on own poll regardless of audience filters — FR-CO-010                                                                                | agent + user (DE input) |
| 2026-09-16 | Create-poll trust gate (wffaId or verified) + vote presence gate (wffaId / verified / social handles) — §4.2, FR-PO-009b, FR-VO-012                                   | agent + user (DE input) |
| 2026-09-16 | Voice admin username `fsmeet` may soft-delete any poll or comment — U-07, FR-AD-001                                                                                  | agent + user (DE input) |
| 2026-09-16 | Poll list sortable by highest participation (votes) — FR-PO-010                                                                                                      | agent + user (DE input) |

---

## How to extend this file (for humans & agents)

When brainstorming a new idea, place it in the right section:

1. **Ecosystem / env / API** → §2
2. **Stack / infra** → §3 (`TECH-NN`)
3. **User type or capability** → §4
4. **New noun / concept** → §5
5. **Something the product must do** → §6 (`FR-xx-NNN`)
6. **Visual / UX design** → §7 (`DES-NN`)
7. **Quality / scale / UX constraint** → §8 (`NFR-NN`)
8. **Hard rule or value** → §9 (`P-NN`)
9. **Explicitly not building** → §10 (`OOS-NN`)
10. **Unresolved choice** → §11 (`Q-NN`)
11. Then update §12 / §13 if sequencing or history matters

Priority values: `must` · `should` · `could`.
