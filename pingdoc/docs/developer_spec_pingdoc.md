# PingDoc – Developer‑Ready Specification (MVP)

_Last updated 1 Jun 2025_

## 1. Overview

PingDoc is a Firebase‑based e‑signature MVP enabling a Google‑authenticated sender to upload a PDF, place four fields (Name, Date, Signature, Comment), send a 7‑day secure link to one recipient, and receive the signed PDF by email. Recipient signs via draw or typed signature. Dashboard shows document history with options to Resend (new link) and Delete (pre‑completion).

## 2. High‑Level Architecture

```
Next.js 15 (App Router) ──► Firebase Auth (Google)
                 │
                 ├──► Firestore   (users, requests)
                 │
                 ├──► Storage     (/pending & /completed PDFs)
                 │
                 ├──► CloudFns    (HTTPS + background)
                 │        ├─ sendInvite
                 │        ├─ finalizeSigned (Storage)
                 │        ├─ declineRequest
                 │        ├─ resendInvite
                 │        └─ expireTask (Cloud Task)
                 │
                 ├──► Cloud Tasks  (+7‑day expiry scheduler)
                 └──► SendGrid (emails)
```

## 3. Data Model (Firestore)

### Collections

| Collection | Doc ID    | Fields                                                                                                                                              |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| users      | uid       | email, createdAt                                                                                                                                    |
| requests   | requestId | senderUid, recipientEmail, recipientName, status (DRAFT/SENT/SIGNED/DECLINED/EXPIRED), token, expiresAt, originalPath, signedPath, sentAt, signedAt |

Composite index: (`senderUid`, `status`).

## 4. Security Rules

- Firestore: Sender can read/write own `users/{uid}` and `requests/{id}` where `senderUid == auth.uid`.
- Storage: Read/write `/pending/{id}` & `/completed/{id}` allowed for `request.senderUid`; read‑only for signed; deny public.

## 5. Client Features

- **Upload** component: accepts PDF ≤ 5 MB; hard reject > 5 MB.
- **Field Editor**: pdf.js canvas overlay; save coords as percentages.
- **Signature Pad**: `signature_pad` for draw; fallback typed.
- **ESIGN Consent**: checkbox gating Finish button.
- **Responsive**: Tailwind breakpoints, mobile drawer nav.

## 6. Cloud Functions

| Fn               | Trigger                                       | Logic                                                                                                                                                          | Error Handling                  |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `sendInvite`     | HTTPS (auth)                                  | Validate PDF exists & coords; generate token (40 chars); write `requests` (status=SENT); send SendGrid email; schedule Cloud Task `expireTask` at `expiresAt`. | Try/catch → log & 500           |
| `finalizeSigned` | Storage finalize `/completed/{id}/signed.pdf` | Verify request exists & status=SENT; set status=SIGNED, signedAt; send completion email with attachment.                                                       | Transaction rollback on failure |
| `declineRequest` | HTTPS (token)                                 | Set status=DECLINED, store comment; email sender.                                                                                                              | 404 if token invalid/expired    |
| `resendInvite`   | HTTPS (auth)                                  | Invalidate old token, new token & expiresAt; status=SENT; email recipient.                                                                                     | Prevent if status=SIGNED        |
| `expireTask`     | Cloud Task                                    | If status=SENT & now>expiresAt, set status=EXPIRED.                                                                                                            | Idempotent                      |

## 7. PDF Processing

- pdf‑lib loads original, draws typed/drawn signature PNG at coords.
- Date field auto‑populated with local date of signer.
- Name, Comment inserted via `drawText`.
- Metadata (emails, IP, timestamps) injected into XMP `pdfDoc.setMetadata`.
- `pdfDoc.save()` (no object streams) Blob uploaded to `/completed/{id}/signed.pdf`.

## 8. Email Templates (SendGrid)

- **Invite** – From `no‑reply@vibesign.app`, subject "Please sign {{fileName}}", link expires in 7 days.
- **Signed** – Subject "Signed copy of {{fileName}}", PDF attached.
- **Declined** – Subject "{{fileName}} was declined".

## 9. Error Handling Strategy

- Client: Axios interceptor → toast; global error boundary.
- Cloud Functions: Structured `functions.logger.error`, automatic retries disabled (except `expireTask`).
- Token misuse: return 404, never reveal status.

## 10. Testing Plan

| Layer         | Tool            | Cases                                                 |
| ------------- | --------------- | ----------------------------------------------------- |
| Unit (front)  | Jest + RTL      | Field coord calc, signature pad fallback              |
| Unit (back)   | Jest + Emulator | Firestore rules, Cloud Fn handlers                    |
| Integration   | Cypress         | End‑to‑end upload → send → sign → signed email (stub) |
| Performance   | k6              | Upload p95, CF cold start                             |
| Accessibility | axe‑core        | All pages AA                                          |

## 11. Deployment

- GitHub Actions CI: lint → test → build → deploy preview channel.
- `firebase deploy --only hosting,functions` on `main` tag `v1.X`.

## 12. Future Enhancements

Refer to PRD backlog for feature roadmap.
