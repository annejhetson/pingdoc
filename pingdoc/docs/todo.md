# PingDoc – Development TODO Checklist

Use this file as a running checklist. Mark each item with `[x]` as you complete it.  
Aim for small, focused commits: one micro-step per commit, with tests passing before moving on.

---

## Phase 0 – Environment & CI

- [x] **0.1 Repo Scaffold**

  - [x] Run `npx create-next-app vibesign --typescript --tailwind --eslint`
  - [x] Add `.nvmrc` (Node 20) and NPM configuration
  - [x] Verify `npm run dev` starts the development server
  - [x] Commit initial scaffold and add a CI badge to README

- [x] **0.2 Prettier & ESLint**

  - [x] Install and configure Prettier (e.g., `.prettierrc`)
  - [x] Install and configure ESLint with Next.js/TypeScript presets
  - [x] Add `lint` and `format` scripts to `package.json`
  - [x] Run `npm run lint --fix` to ensure no lint errors remain

- [x] **0.3 Firebase Project & Emulators**

  - [x] Create new Firebase project
  - [x] Initialize Firebase with Auth, Firestore, Storage, Functions
  - [x] Set up local emulators for development
  - [x] Install Java Runtime for Firebase emulators
  - [x] Add emulator connection code to app
  - [x] Configure Storage rules for secure file access

- [x] **0.4 GitHub Actions CI**
  - [x] Create `.github/workflows/ci.yml`
    - [x] Set up Node 20 environment
    - [x] Run `npm install`, `npm run lint`, `npm test`, `npm run build`
  - [x] Push a test commit and confirm CI passes
  - [ ] Ensure branch protection is configured (if desired)

---

## Phase 1 – Auth & Routing

- [x] **1.1 Google Authentication (Sender)**

  - [x] Install Firebase client SDK (`firebase`) and admin SDK (`firebase-admin`)
  - [x] Install `next-firebase-auth-edge` (or similar) for Next.js 15 support
  - [x] Add Firebase config variables to `.env.local.example` (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.)
  - [x] Create `firebaseClient.ts` (initialize Firebase in browser) and `firebaseAdmin.ts` (initialize in server)
  - [x] Build `/app/login/page.tsx` with a "Continue with Google" button
  - [x] Implement a `useAuth()` hook that returns `{ user, loading }`
  - [x] Write an RTL unit test: when not signed in, the "Continue with Google" button appears

- [ ] **1.2 Protected Routes & Dashboard Stub**
  - [ ] Create a `<ProtectedRoute>` component that:
    - [ ] Reads `useAuth()` and redirects to `/login` if `user` is `null`
    - [ ] Renders children when `user` is non-`null`
  - [ ] Create `/app/dashboard/page.tsx` as a protected route (wrap with `<ProtectedRoute>`)
  - [ ] Stub out a basic dashboard page that displays "Welcome, {user.email}" or an empty state
  - [ ] Write a Cypress test: unauthenticated access of `/dashboard` redirects to `/login`

---

## Phase 2 – Data Model & Security

- [x] **2.1 TypeScript Models & Zod Schemas**

  - [x] Install Zod (`zod`)
  - [x] Create `src/lib/schemas/user.ts` with:

    ```ts
    import { z } from 'zod';

    export const UserSchema = z.object({
      uid: z.string(),
      email: z.string().email(),
      createdAt: z.instanceof(Date),
    });
    ```

  - [x] Create `src/lib/schemas/request.ts` with:

    ```ts
    import { z } from 'zod';

    export const RequestSchema = z.object({
      id: z.string(),
      senderUid: z.string(),
      recipientEmail: z.string().email(),
      recipientName: z.string(),
      status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'DECLINED', 'EXPIRED']),
      token: z.string().length(40),
      expiresAt: z.instanceof(Date),
      originalPath: z.string(),
      signedPath: z.string().optional(),
      sentAt: z.instanceof(Date).optional(),
      signedAt: z.instanceof(Date).optional(),
    });
    ```

  - [x] Write a small unit test that `UserSchema` and `RequestSchema` successfully parse valid objects and reject invalid ones

- [ ] **2.2 Firestore Security Rules**

  - [ ] Edit `firestore.rules` to enforce:

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Users collection (optional, if storing extra user info)
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        // Requests collection
        match /requests/{requestId} {
          allow create: if request.auth != null && request.resource.data.senderUid == request.auth.uid;
          allow read, update, delete: if request.auth != null && resource.data.senderUid == request.auth.uid;
        }
      }
    }
    ```

  - [ ] Configure Firestore emulator to load these rules
  - [ ] Create `tests/firestoreRules.test.ts` that uses Firebase Emulator to:
    - [ ] Assert a user can create a `request` with `senderUid == auth.uid`
    - [ ] Assert a user **cannot** read another user's `request`
    - [ ] Assert a user **can** read their own `request`
  - [ ] Run Jest against the emulator and ensure all rule tests pass

- [ ] **2.3 Seed Script for Local Dev**
  - [ ] Create `scripts/seedTestData.ts` (or `.js`) that:
    - [ ] Reads from a local JSON fixture
    - [ ] Writes sample `users/{uid}` and `requests/{requestId}` docs into Firestore emulator
  - [ ] Add `seed` script to `package.json`: `"seed": "ts-node scripts/seedTestData.ts"`
  - [ ] Verify running `npm run seed` populates emulator with test data

---

## Phase 3 – Upload & Preview

- [x] **3.1 PDF File Input Component**

  - [x] Create `components/FileDrop.tsx` that:
    - [x] Renders an `<input type="file" accept="application/pdf" />`
    - [x] Checks file size ≤ 5 MB on selection
    - [x] If file > 5 MB or wrong type, shows an error toast (using your toast library of choice)
  - [x] Write a Jest unit test for the size/type validator function:
    ```ts
    // Example: utils/isValidPdf.ts
    export function isValidPdf(file: File): boolean {
      return file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024;
    }
    ```
    - [x] Test that a 4 MB `.pdf` returns `true`
    - [x] Test that a 6 MB `.pdf` returns `false`
    - [x] Test that a `.txt` file returns `false`

- [x] **3.2 Upload to Firebase Storage**

  - [x] In `FileDrop.tsx`, upon valid selection:
    - [x] Generate a random `requestId` (e.g., `uuidv4()`)
    - [x] Call Firebase Storage's `uploadBytesResumable` to upload to `pending/{requestId}/original.pdf`
    - [x] Display an upload-progress bar (percentage)
    - [x] On success, navigate to `/editor/{requestId}`
  - [x] Write a Cypress test:
    - [x] Stub the Storage emulator
    - [x] Select a sample 1 MB PDF fixture from `cypress/fixtures/sample.pdf`
    - [x] Assert the file uploads successfully and the progress bar moves to 100%
    - [x] Assert that the route changes to `/editor/{requestId}`

- [x] **3.3 Render PDF Preview (pdf.js)**
  - [x] Install `pdfjs-dist`
  - [x] Create `components/PdfViewer.tsx` that:
    - [x] Loads `pending/{requestId}/original.pdf` via a signed URL from Storage
    - [x] Uses `pdfjsLib.getDocument()` to load the PDF and render the first page on a `<canvas>`
  - [x] Embed `<PdfViewer />` on `/editor/{requestId}`
  - [x] Write a Cypress test:
    - [x] Visit `/editor/{requestId}` with a known test PDF
    - [x] Assert that a `<canvas>` element is visible and non-empty

---

## Phase 4 – Field Placement

- [ ] **4.1 Overlay Drag-and-Drop Boxes**

  - [ ] In `components/FieldOverlay.tsx`, render:
    - [ ] Four draggable "ghost" boxes labeled: Name, Date, Signature, Comment
    - [ ] An absolutely positioned `<div>` or canvas overlay sized to match the PDF viewport
  - [ ] Implement drag-and-drop logic that:
    - [ ] Tracks the top-left coordinates (x, y) and width/height of each placed box
    - [ ] Converts pixel coordinates to percentages relative to the PDF page dimensions
    - [ ] Stores this list of `{ page: number, xPct: number, yPct: number, wPct: number, hPct: number, type: string }` in React state
  - [ ] Write a Jest unit test for the coordinate-conversion util:
    - [ ] Given a page of 1000×1000 px and a box at (100, 200) w=300, h=150, ensure `(xPct, yPct, wPct, hPct)` are `(0.1, 0.2, 0.3, 0.15)`

- [ ] **4.2 Persist Draft Request in Firestore**
  - [ ] On `/editor/{requestId}`, when the user places at least one box:
    - [ ] Create or update `requests/{requestId}` with:
      ```jsonc
      {
        "senderUid": "<auth.uid>",
        "recipientEmail": "",
        "recipientName": "",
        "status": "DRAFT",
        "token": "",
        "expiresAt": null,
        "originalPath": "pending/{requestId}/original.pdf",
        "coords": [
          /* array of field placements */
        ],
        "sentAt": null,
        "signedAt": null,
      }
      ```
    - [ ] Save `coords` as an array in Firestore (update on each placement)
  - [ ] Write an RTL test:
    - [ ] Render `<FieldOverlay />` in a mocked Firestore environment
    - [ ] Simulate dropping a "Signature" box
    - [ ] Assert that Firestore has a `requests/{requestId}` document with `status: "DRAFT"` and correct `coords`

---

## Phase 5 – Invitation Flow

- [ ] **5.1 `sendInvite` Cloud Function**

  - [ ] Create `functions/src/sendInvite.ts`:
    1. Validate caller is authenticated and owns `requests/{requestId}` with `status === "DRAFT"`
    2. Generate a secure random 40-character alphanumeric token
    3. Compute `expiresAt = now + 7 days`
    4. Update `requests/{requestId}`:
       - `recipientEmail` (from function input)
       - `recipientName`
       - `status: "SENT"`
       - `token`
       - `expiresAt`
       - `sentAt: now`
    5. Call SendGrid to send the invite email:
       - Subject: "Please sign your document"
       - Body: "Click here to sign: https://yourdomain.com/sign?t={token} (expires in 7 days)"
    6. Schedule a Cloud Task named `expire-{requestId}` at `expiresAt` that calls the `expireTask` function
  - [ ] Write a Jest unit test for `sendInvite`:
    - [ ] Mock Firestore and SendGrid client
    - [ ] Assert that `requests/{requestId}` is updated correctly (status, token length, expiry)
    - [ ] Assert that SendGrid is called with the correct recipient and link

- [ ] **5.2 `expireTask` Cloud Function**

  - [ ] Create `functions/src/expireTask.ts`:
    1. Triggered by Cloud Tasks at `expiresAt`
    2. Read `requests/{requestId}`; if `status === "SENT"`, update to `status: "EXPIRED"`
    3. (Optional) Send "expired" email to sender
  - [ ] Write a Jest unit test:
    - [ ] Fast-forward emulator clock past `expiresAt`
    - [ ] Invoke `expireTask` manually
    - [ ] Assert `requests/{requestId}.status === "EXPIRED"`

- [ ] **5.3 Cypress End-to-End Send Flow**
  - [ ] Stub both Firestore and SendGrid with local emulator or mock
  - [ ] On `/editor/{requestId}`, fill in Recipient Name/Email form and click "Send"
  - [ ] Assert that an email "send" is triggered (mocked) and that `/sign?t={token}` is now valid
  - [ ] Fast-forward emulator clock + run `expireTask` → verify status = "EXPIRED"

---

## Phase 6 – Recipient Sign

- [ ] **6.1 `/sign?t=` Route & Data Fetching**

  - [ ] Implement `/app/sign/page.tsx` that:
    - [ ] Reads `token` from query parameters
    - [ ] Calls a helper (`getRequestByToken`) to fetch the Firestore `requests/{id}` document matching that token
    - [ ] If no match or `expiresAt < now` or `status !== "SENT"`, render a "Link invalid or expired" page (404)
  - [ ] Write an RTL test:
    - [ ] Mock Firestore return for a valid `token` → expect to render PDF viewer + fields
    - [ ] Mock Firestore return for an invalid/expired token → expect to see "Link invalid or expired"

- [ ] **6.2 ESIGN Disclosure Checkbox**

  - [ ] On `/sign`, above the sign interface, render:
    ```jsx
    <label>
      <input type="checkbox" id="esigConsent" />I agree to sign this document electronically.
    </label>
    ```
    - [ ] Disable the "Finish" and "Decline" buttons until `#esigConsent` is checked
  - [ ] Write an RTL test:
    - [ ] Render `/sign?token=valid`
    - [ ] Verify "Finish" button is disabled until the checkbox is checked

- [ ] **6.3 Signature Pad (Draw) & Typed Fallback**

  - [ ] Install `signature_pad` (or similar)
  - [ ] In `/sign`, detect pointer capability:
    - [ ] If `window.PointerEvent` or touch available, render `<SignaturePad />` for freehand drawing
    - [ ] Otherwise, render a `<textarea>` or `<input>` where the user types their name, styled with a cursive font (e.g., "Homemade Apple" from Google Fonts)
  - [ ] Write an RTL test:
    - [ ] Simulate a "pointerless" user agent → assert the typed input displays text in the cursive font
    - [ ] Simulate drawing on a canvas → assert a Blob/image is generated

- [ ] **6.4 Client-Side Flatten & Metadata Embed**

  - [ ] Install `pdf-lib`
  - [ ] In `/sign`, when user clicks "Finish":
    1. Load original PDF from `/pending/{requestId}/original.pdf` via signed URL
    2. For each field placement (from the Firestore `coords` array):
       - [ ] If `type === "Signature"`, embed the drawn PNG or generate a PNG from typed text using a canvas
       - [ ] If `type == "Name"`, use `pdfDoc.drawText()` at the corresponding coordinates
       - [ ] If `type == "Date"`, auto-calc `new Date()` as string and draw
       - [ ] If `type == "Comment"`, draw the typed comment text
    3. In `pdfDoc.setMetadata({ custom: { senderEmail, recipientEmail, senderIP, recipientIP, sentAt, signedAt } })`
    4. `const newPdfBytes = await pdfDoc.save({ useObjectStreams: false });`
    5. Upload `newPdfBytes` to Storage at `/completed/{requestId}/signed.pdf`
  - [ ] Write a Jest unit test for a utility function:
    - [ ] Given a minimal one-page PDF and a mock "coordinates + field data" payload, ensure that the flattened PDF bytes contain the text "SIGNED BY: ..." or embed the signature image

- [ ] **6.5 `finalizeSigned` Cloud Function**

  - [ ] Create `functions/src/finalizeSigned.ts` triggered by Storage finalize on "`completed/{requestId}/signed.pdf`"
    1. Look up `requests/{requestId}`, assert `status === "SENT"`
    2. Update Firestore:
       - `status = "SIGNED"`
       - `signedAt = now`
    3. Send SendGrid email to both `senderEmail` and `recipientEmail` with the PDF attached
  - [ ] Write a Jest unit test:
    - [ ] Mock Firestore and Storage
    - [ ] Upload a sample signed PDF to `completed/{testId}/signed.pdf` in the emulator
    - [ ] Assert the Firestore doc updates to `SIGNED` and that SendGrid's `send` call was invoked

- [ ] **6.6 Decline Flow**
  - [ ] On `/sign`, include a "Decline" button (enabled only when ESIGN consent is checked)
  - [ ] When clicked, call an HTTPS function `declineRequest(token, comment)`
  - [ ] In `functions/src/declineRequest.ts`:
    1. Find `requests/{requestId}` by `token`; assert `status === "SENT"`
    2. Update `status = "DECLINED"`
    3. Store `declineComment`
    4. Send SendGrid email to `senderEmail` notifying of decline
  - [ ] Write a Cypress test:
    - [ ] Simulate drop on `/sign?token=valid`; check the ESIGN box; click Decline
    - [ ] Assert Firestore doc's status becomes `DECLINED` and that an email was "sent"

---

## Phase 7 – Dashboard & Actions

- [ ] **7.1 Documents Table**

  - [ ] On `/app/dashboard/page.tsx`, fetch all `requests` where `senderUid === auth.uid`
  - [ ] Display a table with columns:
    - File Name (extract from `originalPath`)
    - Recipient Email
    - Status (DRAFT / SENT / SIGNED / DECLINED / EXPIRED)
    - Date Sent (`sentAt` formatted)
    - Date Completed (`signedAt` formatted)
  - [ ] Write an RTL test:
    - [ ] Mock Firestore to return two requests (one SENT, one SIGNED)
    - [ ] Assert the table rows show correct statuses and dates

- [ ] **7.2 Resend Invite (New Token)**

  - [ ] Add a "Resend" button in each row where `status === "SENT" || status === "EXPIRED" || status === "DECLINED"`
  - [ ] When clicked, call HTTPS function `resendInvite(requestId)`
  - [ ] In `functions/src/resendInvite.ts`:
    1. Verify caller is `requests/{requestId}.senderUid`
    2. Generate a new 40-char token and set `expiresAt = now + 7 days`
    3. Update `status = "SENT"`, clear any `signedAt` or `declineComment`
    4. Send a new SendGrid email to `recipientEmail` with the new link
  - [ ] Write a Cypress test:
    - [ ] On dashboard, click "Resend" for a `DECLINED` request
    - [ ] Assert the old link no longer works and the new link works

- [ ] **7.3 Delete In-Progress Requests**

  - [ ] Add a "Delete" button on rows where `status ∈ { "DRAFT", "SENT", "EXPIRED", "DECLINED" }`
  - [ ] When clicked, call HTTPS function `deleteRequest(requestId)`
  - [ ] In `functions/src/deleteRequest.ts`:
    1. Verify caller is `requests/{requestId}.senderUid`
    2. Ensure `status !== "SIGNED"`
    3. Delete `pending/{requestId}/original.pdf` and, if present, `completed/{requestId}/signed.pdf`
    4. Delete the Firestore document `requests/{requestId}`
  - [ ] Write a Cypress test:
    - [ ] Click "Delete" for a `SENT` request
    - [ ] Assert Storage files no longer exist and the table row disappears

- [ ] **7.4 Download Signed PDF**
  - [ ] For rows where `
