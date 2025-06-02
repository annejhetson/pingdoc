# PingDoc – Prompt Plan

This file contains the high‑level blueprint, iterative work chunks, micro‑step philosophy, and a ready‑to‑paste set of prompts for an AI code‑generation assistant. Follow each layer in order; never proceed to the next prompt until tests are green.

---

## 1  High‑Level Blueprint

| Phase                        | Goal                             | Core Deliverables                                                 |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| **0 Environment & CI**       | Stable local + cloud pipeline    | Repo scaffold, Prettier/ESLint, Firebase Emulator, GitHub Actions |
| **1 Auth & Routing**         | Secure sender login & page guard | Google sign‑in, `/dashboard`, `/sign`, route protection           |
| **2 Data Model & Rules**     | Persist users/requests securely  | Firestore schema, security rules, rule tests                      |
| **3 Upload**                 | PDF upload & preview             | ≤ 5 MB validator, pdf.js viewer                                   |
| **4 Field Placement**        | Drag‑and‑drop 4 fields           | Overlay coords saved to Firestore                                 |
| **5 Invitation Flow**        | Email link + 7‑day token         | SendGrid invite, Cloud Task expiry                                |
| **6 Recipient Sign**         | ESIGN consent, draw/type sign    | Client flatten, metadata embed, upload signed PDF                 |
| **7 Completion & Dashboard** | Email signed copy, resend/delete | Status updates, dashboard actions                                 |
| **8 QA & Deploy**            | End‑to‑end green, prod deploy    | Cypress suite, accessibility, perf, `firebase deploy`             |

---

## 2  Iterative Work Chunks (½‑day units)

| #   | Chunk                             | Depends on | Definition of Done                            |
| --- | --------------------------------- | ---------- | --------------------------------------------- |
| 0.1 | Repo scaffold (`create-next-app`) | —          | `npm run dev` runs; CI badge visible          |
| 0.2 | Prettier + ESLint                 | 0.1        | `npm run lint` clean                          |
| 0.3 | Firebase project + Emulators      | 0.1        | `firebase emulators:start` runs               |
| 0.4 | GitHub Actions CI                 | 0.2        | Lint + test pass on push                      |
| 1.1 | Google Auth setup                 | 0.x        | User can sign in/out                          |
| 1.2 | Route guards & dashboard stub     | 1.1        | Unauthed → `/login`; authed sees placeholder  |
| 2.1 | Firestore types (Zod)             | 1.2        | `User`, `Request` TS models compile           |
| 2.2 | Security rules draft              | 2.1        | Emulator rule tests green                     |
| 3.1 | File‑input w/ 5 MB cap            | 1.2        | Oversize rejected client‑side                 |
| 3.2 | Upload to Storage `/pending`      | 3.1        | File appears in emulator bucket               |
| 3.3 | pdf.js preview                    | 3.2        | First page renders in browser                 |
| 4.1 | Overlay drag‑drop component       | 3.3        | Boxes save coords in state                    |
| 4.2 | Persist coords to Firestore       | 4.1        | Draft `request` created                       |
| 5.1 | SendGrid invite Fn                | 4.2        | Recipient email sent (stub)                   |
| 5.2 | 7‑day token & expiry task         | 5.1        | Status auto‑EXPIRED via emulator fast‑forward |
| 6.1 | Sign page UI + consent            | 5.2        | Token link shows PDF & fields                 |
| 6.2 | Draw/typed signature pad          | 6.1        | Canvas & font fallback work                   |
| 6.3 | Client flatten + upload           | 6.2        | File in `/completed`, size < 5 MB             |
| 6.4 | `finalizeSigned` Fn + emails      | 6.3        | Both parties receive signed PDF               |
| 7.1 | Dashboard table & statuses        | 6.4        | Signed row appears                            |
| 7.2 | Resend (new token)                | 7.1        | Old link invalid, new email sent              |
| 7.3 | Delete in‑progress                | 7.1        | File & doc removed                            |
| 8.1 | Cypress happy‑path                | all        | CI green                                      |
| 8.2 | Axe‑core & k6 perf                | 8.1        | Metrics pass                                  |
| 8.3 | Deploy script                     | 8.x        | Preview channel live                          |

---

## 3  Micro‑Step Philosophy

_Slice every chunk into ≤ 30 min / ≤ 50 LOC steps with at least one test._

**Example (Chunk 3.1 – File Input)**

| Step  | Task                               | Test                       |
| ----- | ---------------------------------- | -------------------------- |
| 3.1.a | `<FileDrop />` accepts only `.pdf` | RTL: rejects `.exe`        |
| 3.1.b | Add size validator ≤ 5 MB          | Jest util tests            |
| 3.1.c | Toast on oversize                  | RTL: error shown           |
| 3.1.d | Wire into `/new`                   | Cypress: upload sample PDF |

Apply same rigor for every chunk.

---

## 4  Prompt Series (copy to LLM one‑by‑one)

### Prompt 0 — Repository & CI

```text
You are ChatGPT‑Dev running in "patch mode".

Objective 0: Scaffold repo with CI.

Tasks
1. Run `npx create-next-app vibesign --typescript --tailwind --eslint`.
2. Add `.nvmrc` (20), NPM workspace, Prettier config.
3. Create GitHub Actions workflow `.github/workflows/ci.yml` that:
   • sets up Node 20
   • runs `npm install`, `npm run lint`, `npm test`, `npm run build`
4. Add health-check Jest test for `/api/health` (`{uptime}`).

Return ONLY changed files in unified diff format.
```

### Prompt 1 — Google Auth

```text
Goal 1: Implement Google login.

Tasks
1. Install `firebase`, `firebase-admin`, `next-firebase-auth-edge`.
2. Add Firebase config to `.env.local.example`.
3. Create `firebaseClient.ts` & `firebaseAdmin.ts`.
4. Build `/app/login/page.tsx` with "Continue with Google".
5. Create `useAuth()` hook returning `{user, loading}`.
6. RTL test: shows Sign‑in button when logged out.

Return patches + tests.
```

### Prompt 2 — Protected Routes

```text
Goal 2: Guard `/dashboard`.

Tasks
1. Implement `<ProtectedRoute>` (redirect unauth → `/login`).
2. Wrap `/app/dashboard/page.tsx`.
3. Cypress: unauth visit `/dashboard` → redirected.

Return diff + tests.
```

### Prompt 3 — Firestore Schema & Rules

```text
Goal 3: Define Firestore schema & rules.

Tasks
1. Add Zod schemas for `User` & `Request`.
2. Write `firestore.rules` (sender‑owns doc).
3. Jest emulator test: sender cannot read others, can read own.

Return patches + rules test.
```

### Prompt 4 — PDF Upload & Preview

```text
Goal 4: File upload & preview.

Tasks
1. Build `<FileDrop>` (accept PDF ≤ 5 MB).
2. Upload to Storage `/pending/{uuid}/original.pdf`.
3. Render first page with pdf.js.
4. Cypress: upload sample PDF, preview visible.

Provide diff + tests + fixture (≤100 kB).
```

### Prompt 5 — Field Placement

```text
Goal 5: Drag‑and‑drop fields.

Tasks
1. Overlay canvas for Name, Date, Signature, Comment.
2. Persist coords in React state & Firestore (status=DRAFT).

RTL: drop Signature → coords array length === 1.
```

### Prompt 6 — Send Invite Email

```text
Goal 6: Cloud Function `sendInvite`.

Tasks
1. HTTPS callable: validate draft, generate 40‑char token, status=SENT, expiresAt=+7d.
2. SendGrid invite email (stubbed).
3. Schedule Cloud Task `expireTask`.
4. Jest: token length 40; email payload contains link.

Return patches + tests.
```

### Prompt 7 — Recipient Sign Page

```text
Goal 7: `/sign?t=` page.

Tasks
1. Fetch request by token; 404 if invalid/expired.
2. Show PDF & fields; require ESIGN checkbox.
3. Signature pad (draw) or typed fallback.
4. RTL: typed signature renders cursive font.

Return diff + tests.
```

### Prompt 8 — Flatten & Completion

```text
Goal 8: Flatten PDF & finalize.

Tasks
1. Embed signature + fields via pdf-lib; add XMP metadata.
2. Upload `/completed/{id}/signed.pdf`.
3. Storage trigger `finalizeSigned`: status=SIGNED, signedAt, send email w/ attachment.
4. Cypress: full flow sender→recipient→signed email stub.

Return patches + tests.
```

### Prompt 9 — Dashboard Actions

```text
Goal 9: Resend & Delete.

Tasks
1. Dashboard table (file, recipient, status, dates).
2. Resend → `resendInvite` Fn (new token).
3. Delete (if !SIGNED) → `deleteRequest` Fn; cascade deletion.
4. Cypress: resend invalidates old token; delete removes row.

Return diff + tests.
```

### Prompt 10 — Final QA & Deploy

```text
Goal 10: Quality gate & deploy.

Tasks
1. axe-core accessibility tests (fail on violations).
2. k6 perf script: upload p95 < 4 s.
3. `npm run deploy:preview` → `firebase deploy` preview.
4. Ensure CI green; tag `v1.0.0`.

Return patches + new test assets.
```

---

**Guidelines**

- Never exceed micro‑step size; split prompts if CI fails.
- Each prompt must leave repo compiling & tests green.
- Keep tests first—TDD style ensures safe progress.
- No orphan code: final prompt wires complete end‑to‑end flow.

Happy building!
