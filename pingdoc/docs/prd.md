# PingDoc – Product Requirements Document (PRD) – MVP

_Last updated 1 Jun 2025_

## 1. Purpose & Vision

Provide a **zero‑cost, no‑frills** web tool so one‑off senders can collect a legally valid e‑signature from a single recipient on a PDF. Setup takes < 2 minutes, recipients sign in < 30 seconds, and both sides get the signed file via email. Future upgrades (backlog) will add reminders, compression, audit certificates, etc.

## 2. Personas & Jobs‑to‑Be‑Done

| Persona                                     | Goal                                                                 | Current Pain                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Occasional sender (individual / freelancer) | Get one contract signed quickly without paying or learning DocuSign. | Existing e‑signature tools are overkill or expensive.                        |
| Recipient                                   | Sign a PDF from any device, no account required.                     | Printing/scanning is tedious; some e‑signature flows force account creation. |

## 3. Scope

**Included in MVP**

- Google sign‑in for senders
- One sender → one recipient
- PDF only, ≤ 5 MB
- Drag‑and‑drop fields: Name, Date, Signature, Comment
- Recipient signs only (sender does not sign)
- 7‑day one‑time link, manual **Resend** regenerates link
- Email with PDF attachment (< 5 MB)
- Sender dashboard: history, status, resend, delete (only in‑progress)
- Recipient can Decline (status + email)
- Metadata capture (emails, IP, timestamps) in PDF XMP
- Fully responsive

**Backlog** (post‑MVP)

- Auto‑compress > 5 MB
- Sender‑sign‑first/last
- Automatic reminders
- Certificate-of-completion page
- Admin console, analytics
- Multi‑recipient flows
- Custom branding & email templates
- PDF password protection / encryption

## 4. User Flows

1. Sender logs in with Google → Dashboard
2. Upload PDF ≤ 5 MB → drag & drop fields → enter recipient name/email → **Send**
3. Recipient opens `/sign?t=TOKEN` → agrees to e‑sign disclosure → fills fields, signs (draw or typed) → **Finish** or **Decline**
4. On Finish: client‑side flatten, metadata embed, upload signed PDF → system emails both parties → status **SIGNED**
5. Dashboard shows history; sender can Resend (new token) or Delete in‑progress.

Edge cases: Decline, Expire (7 days), Delete (in‑progress only)

## 5. Non‑Functional Requirements

- Performance: p95 upload < 4 s on 10 Mbps; sign page load < 2 s
- Availability: 99.5 %
- Security: TLS 1.3; Firebase rules isolate data
- Accessibility: WCAG 2.1 AA
- Mobile‑first responsive UI

## 6. Tech Stack

- Frontend: Next.js 15 • TypeScript • Tailwind • shadcn/ui • pdf.js • pdf‑lib
- Backend: Firebase Auth, Firestore, Storage, Cloud Functions v2, Cloud Tasks, Hosting
- Email: SendGrid

## 7. Milestones (5‑week MVP)

| Week | Deliverable                                                 |
| ---- | ----------------------------------------------------------- |
| 1    | Auth, basic dashboard scaffold                              |
| 2    | PDF upload & preview                                        |
| 3    | Field placement & invite email                              |
| 4    | Sign page, flattening, completion email                     |
| 5    | Dashboard actions, decline & expire logic, testing & deploy |
